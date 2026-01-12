import os
from flask import Blueprint, session, jsonify, request
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric
from google.oauth2.credentials import Credentials
from mongo import clusters_collection
from datetime import datetime, timedelta

analytics = Blueprint("analytics", __name__)

def get_ga_client():
    try:
        creds_data = session.get("credentials")
        if not creds_data:
            return None

        credentials = Credentials(
            token=creds_data.get("token"),
            refresh_token=creds_data.get("refresh_token"),
            token_uri=creds_data.get("token_uri"),
            client_id=creds_data.get("client_id"),
            client_secret=creds_data.get("client_secret"),
            scopes=creds_data.get("scopes")
        )
        return BetaAnalyticsDataClient(credentials=credentials)
    except Exception:
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
    events_collection = clusters_collection["user_events"]
    
    # Primjer: Tražimo korisnike koji su bili aktivni prije 2 dana i jučer
    # Day 0 (Prvi posjet), Day 1 (Povratak)
    day_0_users = set(events_collection.distinct("user_id", {
        "timestamp": {"$gte": datetime.now() - timedelta(days=2), 
                      "$lt": datetime.now() - timedelta(days=1)}
    }))
    
    day_1_users = set(events_collection.distinct("user_id", {
        "timestamp": {"$gte": datetime.now() - timedelta(days=1)}
    }))
    
    # Izračun postotka (Točka 8.2)
    returning = day_0_users.intersection(day_1_users)
    retention_rate = (len(returning) / len(day_0_users) * 100) if day_0_users else 0
    
    return jsonify({
        "day_1_retention": f"{round(retention_rate, 2)}%",
        "interpretation": "Nizak Day 1 retention ukazuje na potrebu za boljim onboardingom."
    })

@analytics.route("/analytics/combined-dashboard", methods=["GET"])
def get_combined_dashboard():
    client = get_ga_client()
    data = []

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
        except Exception:
            data = []

    # FALLBACK: Ako nema Googlea, koristi MongoDB podatke koje smo vidjeli na slici
    if not data:
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
                    # Ovdje backend odlučuje: ako je 'home', šalje 'Početna', inače povećava prvo slovo
                    "page": {
                        "$cond": {
                            "if": {"$eq": ["$_id", "home"]},
                            "then": "Početna",
                            "else": "$_id" 
                        }
                    },
                    "users": 1,
                    "avg_duration": {"$literal": 45}, 
                    "_id": 0
                }
            },
            {"$sort": {"users": -1}}
        ]
        data = list(events_collection.aggregate(pipeline))

    return jsonify(data)

@analytics.route("/analytics/funnel")
def get_funnel():
    try:
        events_collection = clusters_collection["user_events"]
        
        steps = [
            {"name": "Home", "page": "home"},
            {"name": "General", "page": "general"},
            {"name": "Business", "page": "business"},
            {"name": "Entertainment", "page": "entertainment"},
            {"name": "Health", "page": "health"},
            {"name": "Science", "page": "science"},
            {"name": "Sports", "page": "sports"},
            {"name": "Technology", "page": "technology"},
            {"name": "Analytics", "page": "analytics"}, 
            {"name": "Auth", "page": "auth"}
        ]
        
        funnel_results = []
        
        for step in steps:
            count = events_collection.count_documents({"page": step["page"]})
            funnel_results.append({
                "step": step["name"],
                "value": count
            })

        if all(item['value'] == 0 for item in funnel_results):
            return jsonify([
                {"step": "Home", "value": 0},
                {"step": "General", "value": 0},
                {"step": "Auth", "value": 0}
            ])

        return jsonify(funnel_results)
        
    except Exception as e:
        print(f"Greška u funnelu: {e}")
        return jsonify([])

@analytics.route("/analytics/track", methods=["POST"])
def track_event():
    data = request.json
    clusters_collection["user_events"].insert_one({
        "page": data.get("page"),
        "device": data.get("device"),
        "timestamp": datetime.now(),
        "user_id": session.get("user_id", "anonymous") 
    })
    return jsonify({"status": "ok"}), 201