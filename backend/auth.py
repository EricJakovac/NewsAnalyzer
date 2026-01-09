from flask import Blueprint, redirect, request, session, url_for, jsonify
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build # Dodaj ovo za dohvaćanje profila
import os

auth_bp = Blueprint("auth", __name__)

if os.getenv("FLASK_ENV") == "development":
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

def get_flow():
    return Flow.from_client_config(
        {
            "web": {
                "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        # DODANO: userinfo.profile i userinfo.email da dobijemo ime i sliku
        scopes=[
            "https://www.googleapis.com/auth/analytics.readonly",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
            "openid"
        ],
        redirect_uri=url_for("auth.callback", _external=True)
    )

@auth_bp.route("/auth/login")
def login():
    flow = get_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true"
    )
    session["state"] = state
    return redirect(auth_url)

@auth_bp.route("/auth/callback")
def callback():
    flow = get_flow()
    flow.fetch_token(authorization_response=request.url)
    
    credentials = flow.credentials
    
    # DOHVAĆANJE PODATAKA O KORISNIKU
    service = build('oauth2', 'v2', credentials=credentials)
    user_info = service.userinfo().get().execute()
    
    # Spremanje svega u sesiju
    session["credentials"] = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": credentials.scopes,
    }
    
    # Spremamo i profilne podatke za React
    session["user"] = {
        "name": user_info.get("name"),
        "picture": user_info.get("picture"),
        "email": user_info.get("email")
    }
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return redirect(frontend_url)

@auth_bp.route("/auth/me")
def get_me():
    """Vraća podatke o ulogiranom korisniku Reactu."""
    user = session.get("user")
    if user:
        return jsonify(user), 200
    return jsonify({"error": "Not logged in"}), 401

@auth_bp.route("/auth/logout")
def logout():
    """Briše sesiju i odjavljuje korisnika."""
    session.clear()
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return redirect(frontend_url)