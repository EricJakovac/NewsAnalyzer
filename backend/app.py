from collections_map import collections_map, top_headlines_collection
from flask import Flask, jsonify, request
from flask_cors import CORS
from mongo import clusters_collection
from news_classifier import train_classifier_for_topic, train_top_headlines_classifier
from news_fetcher import fetch_articles_by_topic, fetch_top_headlines
from elastic_search import search_es
from auth import auth_bp
import os
from dotenv import load_dotenv
#from analytics import analytics_bp

load_dotenv()

app = Flask(__name__)

# 1. PROXY FIX: Govori Flasku da je iza Rendera (HTTPS)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

app.secret_key = os.getenv("FLASK_SECRET_KEY")

# 2. KONFIGURACIJA SESIJE ZA PRODUKCIJU
# Ovo omogućuje da kolačić "preživi" put s Rendera na Vercel
app.config.update(
    SESSION_COOKIE_SECURE=True,     # Samo preko HTTPS
    SESSION_COOKIE_HTTPONLY=True,   # Štiti od JS napada
    SESSION_COOKIE_SAMESITE='None', # Dozvoljava cross-site (Vercel -> Render)
)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip('/')

# 3. CORS POSTAVKE
CORS(app, 
     supports_credentials=True, 
     origins=[frontend_url, "http://localhost:3000"]
)

app.register_blueprint(auth_bp)
#app.register_blueprint(analytics_bp)

# Dohvacanje top headlinesa s API
@app.route("/fetch-top-headlines", methods=["POST"])
def fetch_and_store_top_headlines():
    articles = fetch_top_headlines()

    if not articles:
        return jsonify({"message": f"No top-headline articles fetched"}), 200

    return jsonify({"message": f"Fetched and stored {len(articles)} top-headline articles"}), 200


# Dohvacanje articla po topicu sa API-a
@app.route("/fetch-articles", methods=["POST"])
def fetch_articles_route():
    data = request.get_json()
    topic = data.get("topic")

    if not topic:
        return jsonify({"error": "No topic provided"}), 400

    articles = fetch_articles_by_topic(topic)

    if not articles:
        return jsonify({"message": f"No articles fetched for topic '{topic}'"}), 200

    return jsonify({"message": f"Fetched and stored {len(articles)} '{topic}' articles"}), 200


# Dohvacanje top headlinesa iz mongodb
@app.route("/top-headlines", methods=["GET"])
def get_top_headlines():
    # Vraća sve headline članke, uključujući category polje
    headlines = list(top_headlines_collection.find({"category": {"$exists": True}}, {"_id": 0}).sort("publishedAt", -1))
    if not headlines:
        return jsonify({"message": "No top headlines found"}), 404

    return jsonify(headlines)


# Dohvacanje articla po topicu iz mongodb
@app.route("/articles/<topic>", methods=["GET"])
def get_articles_by_topic(topic):
    topic = topic.lower()

    if topic not in collections_map:
        return jsonify({"error": f"Topic '{topic}' not supported."}), 400

    collection = collections_map[topic]

    if topic == "general":
        query_filter = {}
    else:
        query_filter = {"subcategory": {"$exists": True}}

    articles = list(collection.find(query_filter, {"_id": 0}).sort("publishedAt", -1).limit(500))

    return jsonify({"topic": topic, "articles": articles}), 200


# Treniranje modela za klasifikaciju članka po topicu
@app.route("/train-classifier", methods=["POST"])
def train():
    data = request.json
    topic = data.get("topic", "").lower()
    if not topic:
        return jsonify({"error": "Field 'topic' is required"}), 400

    if topic not in collections_map:
        return jsonify({"error": f"Topic '{topic}' is not supported"}), 400

    try:
        train_classifier_for_topic(topic)
        return jsonify({"message": f"Model for topic '{topic}' trained successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Treniranje modela za klasifikaciju top headlines
@app.route("/train-top-headlines-classifier", methods=["POST"])
def train_top_headlines():
    try:
        train_top_headlines_classifier()
        return jsonify({"message": "Top-headlines classifier trained successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ElasticSearch indeksiranje articla
@app.route("/search", methods=["GET"])
def search_articles():
    query = request.args.get("q", "")
    index = request.args.get("index", "").lower()
    
    if not query or not index:
        return jsonify({"error": "Treba q i index"}), 400
    
    try:
        result = search_es(index, query)
        hits = result.get("hits", {}).get("hits", [])
        
        results = []
        for hit in hits:
            data = hit["_source"]
            data["_score"] = hit.get("_score", 0)
            results.append(data)
        
        return jsonify({
            "results": results,
            "total": len(results)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Dohvacanje articla s subcategory za vizualizaciju
@app.route("/subcategory-stats")
def subcategory_stats():
    topic = request.args.get("topic")
    print("TOPIC:", topic)

    if not topic:
        return jsonify({"error": "Query parameter 'topic' is required"}), 400

    collection = collections_map.get(topic.lower())
    print("COLLECTION:", collection)

    if collection is None:
        return jsonify({"error": f"No collection found for topic '{topic}'"}), 404

    pipeline = [
        {"$match": {"subcategory": {"$exists": True, "$ne": None, "$ne": ""}}},
        {"$group": {"_id": "$subcategory", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]

    try:
        agg_result = list(collection.aggregate(pipeline))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    data = [{"subcategory": doc["_id"], "count": doc["count"]} for doc in agg_result]
    return jsonify(data)


# Dohvacanje articla po subcategory za filtriranje u tablici
@app.route("/articles-by-subcategory")
def articles_by_subcategory():
    subcategory = request.args.get("subcategory")

    if not subcategory:
        return jsonify({"error": "Query parameter 'subcategory' is required"}), 400

    all_articles = []
    try:
        for collection in collections_map.values():
            articles = list(collection.find({"subcategory": subcategory}, {"_id": 0}).sort("publishedAt", -1).limit(50))
            all_articles.extend(articles)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # Opcionalno: sortiraj sve zajedno po datumu i ograniči broj rezultata
    all_articles.sort(key=lambda x: x.get("publishedAt", "-1"), reverse=True)
    all_articles = all_articles[:100]

    return jsonify(all_articles)


# Dohvacanje articla s category za vizualizaciju
@app.route("/category-stats")
def category_stats():
    try:
        pipeline = [
            {"$match": {"category": {"$exists": True, "$ne": None, "$ne": ""}}},
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
        ]
        agg_result = list(top_headlines_collection.aggregate(pipeline))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    data = [{"category": doc["_id"], "count": doc["count"]} for doc in agg_result]

    return jsonify(data)


# Dohvacanje articla po category za filtriranje u tablici
@app.route("/articles-by-category")
def articles_by_category():
    category = request.args.get("category")  # Get the specific category from request

    if not category:
        return jsonify({"error": "Query parameter 'category' is required"}), 400

    all_articles = []
    try:
        for collection in collections_map.values():
            # Filter by the specific category that was clicked
            articles = list(collection.find({"category": category}, {"_id": 0}).sort("publishedAt", -1).limit(50))
            all_articles.extend(articles)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # Sort all articles together by date and limit results
    all_articles.sort(key=lambda x: x.get("publishedAt", "-1"), reverse=True)
    all_articles = all_articles[:100]

    return jsonify(all_articles)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))