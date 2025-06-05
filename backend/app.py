from collections_map import collections_map, top_headlines_collection
from elastic_search import es
from flask import Flask, jsonify, request
from flask_cors import CORS
from mongo import clusters_collection
from news_classifier import train_classifier_for_topic, train_top_headlines_classifier
from news_fetcher import fetch_articles_by_topic, fetch_top_headlines
from theme_clusterer import cluster_themes

app = Flask(__name__)
CORS(app)


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
    headlines = list(top_headlines_collection.find({}, {"_id": 0}))
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

    articles = list(collection.find({}, {"_id": 0}).sort("publishedAt", -1).limit(20))

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
    index = request.args.get("index")

    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400

    if not index:
        return jsonify({"error": "Query parameter 'index' is required"}), 400

    body = {"query": {"multi_match": {"query": query, "fields": ["title^3", "description", "subcategory", "category"]}}}

    try:
        res = es.search(index=index, body=body)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    hits = res["hits"]["hits"]
    results = [hit["_source"] for hit in hits]

    return jsonify({"results": results})


@app.route("/clusters")
def get_clusters():
    clusters = list(clusters_collection.find({}, {"_id": 0}))
    return jsonify(clusters)


if __name__ == "__main__":
    app.run(debug=True)
