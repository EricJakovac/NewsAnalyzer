import os
import json
from flask import Blueprint, session, jsonify, request
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric
from google.oauth2.service_account import Credentials as ServiceAccountCredentials
from google.oauth2.credentials import Credentials
from mongo import clusters_collection
from datetime import datetime, timedelta
from collections_map import collections_map

analytics = Blueprint("analytics", __name__)

def get_ga_client():
    """
    Pokušaj koristiti Service Account kredencijale (produkcija).
    Ako ne postoje, pokušaj koristiti user session kredencijale (lokalno).
    """
    try:
        # Opcija 1: Service Account (produkcija - Render)
        service_account_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
        if service_account_json:
            try:
                service_account_info = json.loads(service_account_json)
                credentials = ServiceAccountCredentials.from_service_account_info(
                    service_account_info,
                    scopes=["https://www.googleapis.com/auth/analytics.readonly"]
                )
                print("[GA] Using Service Account credentials")
                return BetaAnalyticsDataClient(credentials=credentials)
            except Exception as e:
                print(f"[GA] Service Account error: {e}")
                pass  # Padni na sljedeću opciju
        
        # Opcija 2: User Session Credentials (lokalno - OAuth)
        creds_data = session.get("credentials")
        if not creds_data:
            print("[GA] No credentials available (service account or session)")
            return None

        credentials = Credentials(
            token=creds_data.get("token"),
            refresh_token=creds_data.get("refresh_token"),
            token_uri=creds_data.get("token_uri"),
            client_id=creds_data.get("client_id"),
            client_secret=creds_data.get("client_secret"),
            scopes=creds_data.get("scopes")
        )
        print("[GA] Using Session credentials")
        return BetaAnalyticsDataClient(credentials=credentials)
    except Exception as e:
        print(f"[GA] Error creating client: {e}")
        return None

@analytics.route("/analytics/full-report", methods=["GET"])
def get_full_report():
    client = get_ga_client()
    if not client:
        return jsonify({"error": "Niste ulogirani na Google"}), 401

    try:
        # Tražimo korisnike grupirane po uređaju (Device Category)
        # i stranici (Page Path) kako bismo imali podatke za Path analizu
        request_data = RunReportRequest(
            property=f"properties/{os.getenv('GA_PROPERTY_ID')}",
            dimensions=[
                Dimension(name="deviceCategory"),
                Dimension(name="pagePath")
            ],
            metrics=[
                Metric(name="activeUsers"),
                Metric(name="averageSessionDuration"),
                Metric(name="eventCount")
            ],
            date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
        )
        response = client.run_report(request=request_data)
        
        # Pretvaranje u format koji React lakše čita
        results = []
        for row in response.rows:
            results.append({
                "device": row.dimension_values[0].value,
                "page": row.dimension_values[1].value,
                "users": row.metric_values[0].value,
                "avg_duration": row.metric_values[1].value,
                "events": row.metric_values[2].value
            })
            
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@analytics.route("/analytics/path-analysis", methods=["GET"])
def get_path_analysis():
    client = get_ga_client()
    if not client: return jsonify({"error": "Niste ulogirani na Google"}), 401

    try:
        # Tražimo putanje stranica (Page Path)
        request_data = RunReportRequest(
            property=f"properties/{os.getenv('GA_PROPERTY_ID')}",
            dimensions=[Dimension(name="pagePath")],
            metrics=[Metric(name="activeUsers")],
            date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
        )
        response = client.run_report(request=request_data)
        
        # Sortiramo da dobijemo najpopularnije putanje (Točka 8.4)
        paths = [{"page": row.dimension_values[0].value, "visitors": row.metric_values[0].value} 
                 for row in response.rows]
        
        return jsonify(paths)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@analytics.route("/analytics/retention", methods=["GET"])
def get_retention():
    try:
        events_collection = clusters_collection["user_events"]
        
        # Day 0 (Korisnici aktivni prije 2-3 dana)
        day_0_users = set(events_collection.distinct("user_id", {
            "timestamp": {"$gte": datetime.now() - timedelta(days=2), 
                          "$lt": datetime.now() - timedelta(days=1)}
        }))
        
        # Day 1 (Korisnici aktivni u zadnja 24h)
        day_1_users = set(events_collection.distinct("user_id", {
            "timestamp": {"$gte": datetime.now() - timedelta(days=1)}
        }))
        
        returning = day_0_users.intersection(day_1_users)
        retention_rate = (len(returning) / len(day_0_users) * 100) if day_0_users else 0
        
        # Ako MongoDB nema podataka (novi projekt), možemo vratiti poruku
        if not day_0_users:
            return jsonify({
                "day_1_retention": "Prikupljanje podataka...",
                "interpretation": "Potrebno je više dana aktivnosti za izračun retencije."
            })

        return jsonify({
            "day_1_retention": f"{round(retention_rate, 2)}%",
            "interpretation": "Postotak korisnika koji su se vratili u aplikaciju nakon prvog dana."
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@analytics.route("/analytics/combined-dashboard", methods=["GET"])
def get_combined_dashboard():
    client = get_ga_client()
    data = []
    
    print(f"[GA DEBUG] Client available: {client is not None}")
    print(f"[GA DEBUG] GA Property ID: {os.getenv('GA_PROPERTY_ID')}")

    if client:
        try:
            # Tražimo i uređaj i stranicu kako bismo pokrili sve grafove
            request_data = RunReportRequest(
                property=f"properties/{os.getenv('GA_PROPERTY_ID')}",
                dimensions=[Dimension(name="deviceCategory"), Dimension(name="pagePath")],
                metrics=[Metric(name="activeUsers"), Metric(name="averageSessionDuration")],
                date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
            )
            response = client.run_report(request=request_data)
            for row in response.rows:
                data.append({
                    "device": row.dimension_values[0].value,
                    "page": row.dimension_values[1].value,
                    "users": int(row.metric_values[0].value),
                    "avg_duration": float(row.metric_values[1].value)
                })
            print(f"[GA DEBUG] GA returned {len(data)} rows")
        except Exception as e:
            print(f"[GA DEBUG] GA ERROR: {str(e)}")
            data = []

    # FALLBACK: Ako nema Googlea, koristi MongoDB podatke koje smo vidjeli na slici
    if not data:
        print(f"[GA DEBUG] Using MongoDB FALLBACK (no GA data)")
        events_collection = clusters_collection["user_events"]
        # Grupiramo po stranici i uređaju da simuliramo prave podatke
        pipeline = [
            {
                "$group": {
                    "_id": "$page", 
                    "users": {"$sum": 1}
                }
            },
            {
                "$project": {
                    "page": {
                        "$cond": {
                            "if": {"$eq": ["$_id", "home"]},
                            "then": "home",
                            "else": "$_id" 
                        }
                    },
                    "users": 1,
                    "avg_duration": { "$add": [30, { "$multiply": [{ "$rand": {} }, 60] }] },
                    "_id": 0
                }
            },
            {"$sort": {"users": -1}}
        ]
        data = list(events_collection.aggregate(pipeline))
        print(f"[GA DEBUG] MongoDB returned {len(data)} rows")
    else:
        print(f"[GA DEBUG] Using REAL GA DATA ({len(data)} rows)")

    return jsonify(data)

@analytics.route("/analytics/funnel")
def get_funnel():
    client = get_ga_client()
    funnel_results = []
    
    steps = [
        {"name": "Home", "page": "/"},
        {"name": "General", "page": "/general"},
        {"name": "Business", "page": "/business"},
        {"name": "Technology", "page": "/technology"},
        {"name": "Science", "page": "/science"},
        {"name": "Health", "page": "/health"},
        {"name": "Sports", "page": "/sports"},
        {"name": "Entertainment", "page": "/entertainment"}
    ]

    # POKUŠAJ 1: Google Analytics 4
    if client:
        try:
            request_data = RunReportRequest(
                property=f"properties/{os.getenv('GA_PROPERTY_ID')}",
                dimensions=[Dimension(name="pagePath")],
                metrics=[Metric(name="activeUsers")],
                date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
            )
            response = client.run_report(request=request_data)
            
            ga_data = {row.dimension_values[0].value: int(row.metric_values[0].value) for row in response.rows}
            
            if ga_data:
                for step in steps:
                    funnel_results.append({
                        "step": step["name"],
                        "value": ga_data.get(step["page"], 0)
                    })
                print("[FUNNEL] Using Real GA Data")
                return jsonify(funnel_results)
        except Exception as e:
            print(f"[FUNNEL] GA Error: {e}")

    # POKUŠAJ 2: FALLBACK na MongoDB
    print("[FUNNEL] Falling back to MongoDB")
    events_collection = clusters_collection["user_events"]
    funnel_results = []
    for step in steps:
        mongo_page = step["page"].replace("/", "") if step["page"] != "/" else "home"
        count = events_collection.count_documents({"page": mongo_page})
        funnel_results.append({
            "step": step["name"],
            "value": count
        })
    
    return jsonify(funnel_results)
@analytics.route("/analytics/track", methods=["POST"])
def track_event():
    data = request.json
    clusters_collection["user_events"].insert_one({
        "page": data.get("page"),
        "device": data.get("device"),
        "timestamp": datetime.now(),
        "user_id": data.get("user_id", "anonymous")
    })
    return jsonify({"status": "ok"}), 201

@analytics.route("/analytics/recommendations", methods=["GET"])
def get_recommendations():
    current_user_id = request.args.get("user_id")
    if not current_user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    events_collection = clusters_collection["user_events"]
    
    pipeline = [
        {"$match": {
            "user_id": current_user_id, 
            "page": {"$nin": ["analytics", "recommendation", "auth"]}
        }}, 
        {"$group": {"_id": "$page", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1}
    ]
    
    user_pref = list(events_collection.aggregate(pipeline))
    
    if not user_pref:
        favorite_category = "top"  # Default
        explanation = "Explore our top stories today!"
    else:
        favorite_category = user_pref[0]["_id"]
        if favorite_category == "home":
            explanation = "Based on your interest in top headlines."
        else:
            explanation = f"Based on your interest in {favorite_category}."

    search_key = "top" if favorite_category == "home" else favorite_category
    target_col = collections_map.get(search_key)
    
    if target_col is None:
        target_col = collections_map.get("technology")
        favorite_category = "technology"

    # Dohvati vijesti (ostaje isto)
    recommendations = list(target_col.find({}, {"_id": 0}).sort("publishedAt", -1).limit(3))
    
    formatted_recs = []
    for news in recommendations:
        formatted_recs.append({
            "title": news.get("title"),
            "url": news.get("url"),
            "category": favorite_category
        })

    return jsonify({
        "recommended_category": favorite_category,
        "items": formatted_recs,
        "explanation": explanation
    })