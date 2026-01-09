""" from flask import Blueprint, session, jsonify
import os
from analytics_service import get_ga_client
from google.analytics.data_v1beta.types import RunReportRequest

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/analytics/data", methods=["GET"])
def get_data():
    client = get_ga_client()
    if not client:
        return jsonify({"error": "Nisi ulogiran na Google"}), 401

    try:
        request_data = RunReportRequest(
            property=f"properties/{os.getenv('GA_PROPERTY_ID')}",
            metrics=[{"name": "activeUsers"}],
            date_ranges=[{"start_date": "7daysAgo", "end_date": "today"}],
        )
        response = client.run_report(request=request_data)
        
        active_users = response.rows[0].metric_values[0].value if response.rows else 0
        return jsonify({"active_users": active_users})
    except Exception as e:
        return jsonify({"error": str(e)}), 500 """