from flask import Blueprint, redirect, request, session, url_for, jsonify
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
import os

auth_bp = Blueprint("auth", __name__)

if os.getenv("FLASK_ENV") == "development":
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

def get_flow():
    # DINAMIČKI REDIRECT URI: 
    # Ako si na Renderu, koristi HTTPS adresu tvog backenda.
    # Ako si lokalno, koristi url_for.
    if os.getenv("FLASK_ENV") == "production":
        # Zamijeni ovo URL-om svog backenda na Renderu
        redirect_uri = "https://news-analyzer-yfcp.onrender.com/auth/callback"
    else:
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

@auth_bp.route("/auth/login")
def login():
    flow = get_flow()
    # prompt="consent" osigurava da se prozor UVIJEK pojavi tijekom testiranja
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent" 
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

from flask import redirect, session, url_for

@app.route('/auth/callback')
def callback():
    # 1. Google šalje autorizacijski kod
    flow.fetch_token(authorization_response=request.url)

    # 2. Dohvaćamo podatke o korisniku
    credentials = flow.credentials
    request_session = requests.session()
    cached_session = cachecontrol.CacheControl(request_session)
    token_request = google.auth.transport.requests.Request(session=cached_session)

    id_info = id_token.verify_oauth2_token(
        id_token=credentials._id_token,
        request=token_request,
        audience=os.getenv("GOOGLE_CLIENT_ID")
    )

    # 3. Spremamo korisnika u Flask session (kolačić)
    session["google_id"] = id_info.get("sub")
    session["name"] = id_info.get("name")
    session["email"] = id_info.get("email")

    # 4. KLJUČNI KORAK: Preusmjeravanje natrag na Vercel frontend
    frontend_url = os.getenv("FRONTEND_URL", "https://news-analyzer-pi.vercel.app")
    return redirect(frontend_url)