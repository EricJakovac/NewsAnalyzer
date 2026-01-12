import os
from flask import Blueprint, session, jsonify
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric
from google.oauth2.credentials import Credentials

analytics = Blueprint("analytics", __name__)

def get_ga_client():
    # Provjeravamo jesu li se credentials spremili u sesiju tijekom login-a
    creds_data = session.get("credentials")
    
    if not creds_data:
        return None

    # Rekonstruiramo credentials objekt iz sesije
    credentials = Credentials(
        token=creds_data.get("token"),
        refresh_token=creds_data.get("refresh_token"),
        token_uri=creds_data.get("token_uri"),
        client_id=creds_data.get("client_id"),
        client_secret=creds_data.get("client_secret"),
        scopes=creds_data.get("scopes")
    )

    # Vraćamo klijenta koji je spreman za upite prema GA4
    return BetaAnalyticsDataClient(credentials=credentials)

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