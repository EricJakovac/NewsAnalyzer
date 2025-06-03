from collections_map import collections_map
from flask import Flask, jsonify, request
from flask_cors import CORS
from mongo import clusters_collection
from news_classifier import (
    detect_topic,
    predict_article_label,
    train_classifier_for_topic,
)
from news_fetcher import fetch_articles_by_topic
from theme_clusterer import cluster_themes

app = Flask(__name__)
CORS(app)

# Dohvacanje articla po topicu iz mongodb


@app.route("/articles/<topic>", methods=["GET"])
def get_articles_by_topic(topic):
    topic = topic.lower()

    if topic not in collections_map:
        return jsonify({"error": f"Topic '{topic}' not supported."}), 400

    collection = collections_map[topic]

    articles = list(collection.find({}, {"_id": 0}).sort("publishedAt", -1).limit(20))

    return jsonify({"topic": topic, "articles": articles}), 200


# Dohvacanje articla po topicu sa API-a
@app.route("/fetch-articles", methods=["POST"])
def fetch_articles_route():
    data = request.get_json()
    topic = data.get("topic")

    if not topic:
        return jsonify({"error": "No topic provided"}), 400

    articles = fetch_articles_by_topic(topic)

    if not articles:
        return jsonify({"error": f"No articles fetched for topic '{topic}'"}), 400

    return jsonify({"message": f"Fetched and stored {len(articles)} '{topic}' articles"}), 200


# Klasifikacija artickla po topicu
@app.route("/classify", methods=["POST"])
def classify():
    text = request.json.get("text", "")
    if not text:
        return jsonify({"error": "Field 'text' is required"}), 400

    topic = detect_topic(text)

    try:
        label = predict_article_label(text, topic)
        return jsonify({"topic": topic, "tech_type": label})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Treniranje modela klasifikatora po topicu
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


@app.route("/clusters")
def get_clusters():
    clusters = list(clusters_collection.find({}, {"_id": 0}))
    return jsonify(clusters)


if __name__ == "__main__":
    app.run(debug=True)
