import os
import json
import base64
from flask import Blueprint, redirect, request, session, url_for, jsonify
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

auth = Blueprint("auth", __name__)

if os.getenv("FLASK_ENV") != "production":
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
        scopes=[
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/analytics.readonly",
        ],
        redirect_uri=f"{os.getenv('BACKEND_URL')}/auth/callback"
    )

@auth.route("/auth/login")
def login():
    flow = get_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent" 
    )
    session["state"] = state
    return redirect(auth_url)

@auth.route("/auth/callback")
def callback():
    # 1. Dohvati state koji smo spremili u /auth/login
    state = session.get("state")

    # 2. Ponovno kreiraj flow
    flow = get_flow()

    # 3. Dohvati token + VALIDIRAJ state (CSRF zaštita)
    try:
        flow.fetch_token(authorization_response=request.url, state=state)
    except Exception as e:
        print(f"ERROR during fetch_token: {e}")
        return jsonify({"error": str(e)}), 400
    
    credentials = flow.credentials

    # 4. Dohvati Google user info
    service = build('oauth2', 'v2', credentials=credentials)
    user_info = service.userinfo().get().execute()

    print(f"User info from Google: {user_info.get('email')}")

    session.permanent = True
    session.cookie_secure = True
    session.cookie_httponly = True
    session.cookie_samesite = 'None'
    
    # 5. Spremi usera u session
    user_data = {
        "name": user_info.get("name"),
        "picture": user_info.get("picture"),
        "email": user_info.get("email")
    }
    
    session["user"] = user_data

    # Spremamo credentials za Analytics API 
    session["credentials"] = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": credentials.scopes
    }

    session.modified = True

    print(f"Session user set: {session.get('user')}")

    # 6. Redirect natrag na frontend s auth=success parametrom
    # Šalji user podatke kao base64 encoded query parametar (fallback ako session cookie ne radi)
    user_data_b64 = base64.b64encode(json.dumps(user_data).encode()).decode()
    frontend_url = os.getenv("FRONTEND_URL","https://news-analyzer-pi.vercel.app")
    response = redirect(f"{frontend_url}?auth=success&user={user_data_b64}")
    
    # Eksplicitno postavi Set-Cookie header za bolju cross-domain kompatibilnost
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    
    return response


@auth.route("/auth/me")
def get_me():
    user = session.get("user")
    print(f"GET /auth/me - Session user: {user}")
    print(f"Session cookies: {request.cookies}")
    print(f"Session data: {dict(session)}")
    
    if user:
        return jsonify(user), 200
    return jsonify({"error": "Not logged in"}), 401

@auth.route("/auth/logout")
def logout():
    session.clear()
    frontend_url = os.getenv("FRONTEND_URL", "https://news-analyzer-pi.vercel.app")
    return redirect(frontend_url)

@auth.route("/auth/debug-session", methods=["GET"])
def debug_session():
    """DEBUG endpoint - prikaži što je u sesiji"""
    return jsonify({
        "session_user": session.get("user"),
        "session_has_credentials": "credentials" in session,
        "cookies_sent": dict(request.cookies),
        "headers": dict(request.headers),
        "is_secure": request.is_secure,
        "remote_addr": request.remote_addr,
    }), 200