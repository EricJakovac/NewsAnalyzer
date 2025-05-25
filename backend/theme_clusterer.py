import numpy as np
from mongo import articles_collection, clusters_collection
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer


def cluster_themes(articles):
    """Group articles into 5 thematic clusters using K-means"""
    texts = [a["title"] + " " + a.get("description", "") for a in articles]

    tfidf = TfidfVectorizer(max_features=1000, stop_words="english")
    X = tfidf.fit_transform(texts)

    kmeans = KMeans(n_clusters=5, random_state=42).fit(X)

    clusters = []
    for i in range(5):
        top_words = tfidf.get_feature_names_out()[np.argsort(kmeans.cluster_centers_[i])[-5:]]
        clusters.append(
            {"cluster_id": i, "keywords": list(top_words), "articles": [a["url"] for a, label in zip(articles, kmeans.labels_) if label == i]}
        )

    return clusters
