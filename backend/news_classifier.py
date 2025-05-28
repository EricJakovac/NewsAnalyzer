import joblib
from collections_map import collections_map
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from topic_labels import topic_labels


def label_by_keywords(text, label_keywords):
    text_lower = text.lower()
    for label, keywords in label_keywords.items():
        for kw in keywords:
            if kw.lower() in text_lower:
                return label
    return "General"


def train_classifier_for_topic(topic):
    topic = topic.lower()
    if topic not in collections_map:
        raise ValueError(f"No collection found for topic '{topic}'")

    collection = collections_map[topic]
    articles = list(collection.find())

    if not articles:
        raise ValueError(f"No articles found for topic '{topic}'. Run fetch first.")

    if topic not in topic_labels:
        raise ValueError(f"No labels defined for topic '{topic}'")

    # Pripremi podatke
    X = [a["title"] + " " + a.get("description", "") for a in articles]
    y = [label_by_keywords(text, topic_labels[topic]) for text in X]

    # Treniraj model
    vectorizer = TfidfVectorizer(stop_words="english", max_features=1000)
    X_vec = vectorizer.fit_transform(X)
    clf = MultinomialNB().fit(X_vec, y)

    # Spremi model
    model_filename = f"{topic}_classifier.joblib"
    joblib.dump((vectorizer, clf), model_filename)
    print(f"Model for topic '{topic}' trained and saved as '{model_filename}'")


def predict_article_label(text, topic):
    model_filename = f"{topic}_classifier.joblib"
    try:
        vectorizer, clf = joblib.load(model_filename)
    except FileNotFoundError:
        raise ValueError(f"Model for topic '{topic}' not found. Train it first.")
    return clf.predict(vectorizer.transform([text]))[0]


def detect_topic(text):
    text_lower = text.lower()
    for topic, labels in topic_labels.items():
        for label, keywords in labels.items():
            for kw in keywords:
                if kw.lower() in text_lower:
                    return topic
    return "general"
