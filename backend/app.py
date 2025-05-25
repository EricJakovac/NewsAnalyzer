import json

from flask import Flask, jsonify, request
from flask_cors import CORS
from mongo import articles_collection, clusters_collection
from news_fetcher import fetch_tech_articles
from tech_classifier import predict_tech_type, train_classifier
from theme_clusterer import cluster_themes

app = Flask(__name__)
CORS(app)


@app.route("/fetch-articles", methods=["POST"])
def fetch_articles_route():
    articles = fetch_tech_articles()
    if not articles:
        return jsonify({"error": "No articles fetched"}), 400
    return jsonify({"message": f"Fetched and stored {len(articles)} articles"}), 200


@app.route("/classify", methods=["POST"])
def classify():
    text = request.json.get("text", "")
    return jsonify({"tech_type": predict_tech_type(text)})


@app.route("/clusters")
def get_clusters():
    clusters = list(clusters_collection.find({}, {"_id": 0}))
    return jsonify(clusters)


@app.route("/train-classifier", methods=["POST"])
def train():
    try:
        train_classifier()
        return jsonify({"message": "Model trained successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/process-and-save", methods=["POST"])
def process_and_save():
    # Step 1: Fetch tech articles
    articles = fetch_tech_articles()
    if not articles:
        return jsonify({"error": "No articles found"}), 404

    # Optionally save new articles to MongoDB
    articles_collection.insert_many(articles)

    # Step 2: Classify each article
    for article in articles:
        text = article.get("title", "") + " " + article.get("description", "")
        article["tech_type"] = predict_tech_type(text)

    # Step 3: Cluster the articles
    clustered = cluster_themes(articles)  # returns list of cluster dicts

    # Step 4: Save clusters to MongoDB (clear old clusters first)
    clusters_collection.delete_many({})
    clusters_collection.insert_many(clustered)

    return jsonify({"message": "Articles processed and saved to MongoDB", "clusters": clustered}), 201


if __name__ == "__main__":
    app.run(debug=True)
