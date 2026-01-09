from flask import Blueprint, redirect, request, session, url_for, jsonify
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
import os

auth_bp = Blueprint("auth", __name__)

if os.getenv("FLASK_ENV") == "development":
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

def get_flow():
    # Koristimo okruženje za određivanje redirect URI-ja
    if os.getenv("FLASK_ENV") == "production":
        redirect_uri = "https://news-analyzer-yfcp.onrender.com/auth/callback"
    else:
        # Lokalno koristimo url_for, ali pazimo na Blueprint prefiks
        redirect_uri = url_for("auth.callback", _external=True)

    return Flow.from_client_config(
        {
            "web": {
                "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=[
            "https://www.googleapis.com/auth/analytics.readonly",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
            "openid"
        ],
        redirect_uri=redirect_uri
    )

@auth_bp.route("/login")
def login():
    flow = get_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent" 
    )
    session["state"] = state
    return redirect(auth_url)

@auth_bp.route("/callback")
def callback():
    flow = get_flow()
    # Dohvaćanje tokena pomoću koda koji je Google poslao
    flow.fetch_token(authorization_response=request.url)
    
    credentials = flow.credentials
    
    # Dohvaćanje profilnih podataka (ime, slika, email)
    service = build('oauth2', 'v2', credentials=credentials)
    user_info = service.userinfo().get().execute()
    
    # Spremamo korisnika u sesiju (ovo React čita preko /me)
    session["user"] = {
        "name": user_info.get("name"),
        "picture": user_info.get("picture"),
        "email": user_info.get("email")
    }
    
    # Uzimamo frontend URL iz env varijabli ili default na vercel
    frontend_url = os.getenv("FRONTEND_URL", "https://news-analyzer-pi.vercel.app")
    return redirect(frontend_url)

@auth_bp.route("/me")
def get_me():
    user = session.get("user")
    if user:
        return jsonify(user), 200
    return jsonify({"error": "Not logged in"}), 401

@auth_bp.route("/logout")
def logout():
    session.clear()
    frontend_url = os.getenv("FRONTEND_URL", "https://news-analyzer-pi.vercel.app")
    return redirect(frontend_url)