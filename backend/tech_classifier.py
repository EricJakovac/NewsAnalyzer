import joblib
from mongo import articles_collection
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB


def train_classifier():
    """Classify articles as Hard Tech or Soft Tech"""
    articles = list(articles_collection.find())
    if not articles:
        raise ValueError("No articles found in DB. Run news_fetcher.py first.")

    # Rule-based labeling
    def label_tech_type(article):
        hard_tech = [
            "AI",
            "quantum",
            "semiconductor",
            "missile",
            "chip",
            "hardware",
            "processor",
            "robotics",
            "automation",
            "nanotechnology",
            "5G",
            "drone",
            "biotech",
            "IoT",
            "data center",
            "cloud computing",
            "GPU",
            "CPU",
            "sensor",
            "satellite",
            "electric vehicle",
            "battery",
            "solar",
            "chipset",
            "telecommunications",
            "telecom",
            "networking",
            "infrastructure",
            "cable",
            "fiber optics",
            "cars",
            "automotive",
            "transportation",
            "logistics",
            "manufacturing",
            "industry",
        ]
        soft_tech = [
            "software",
            "application",
            "app",
            "platform",
            "web",
            "cloud",
            "internet",
            "digital",
            "online",
            "mobile",
            "deal",
            "sale",
            "amazon",
            "AWS",
            "Google",
            "Microsoft",
            "Apple",
            "Facebook",
            "Amazon Web Services",
            "Google Cloud",
            "Microsoft Azure",
            "smartphone",
            "app",
            "software",
            "subscription",
            "social media",
            "platform",
            "marketing",
            "e-commerce",
            "streaming",
            "startup",
            "investment",
            "funding",
            "content",
            "gaming",
            "online",
            "mobile",
            "advertising",
            "website",
            "service",
            "cloud service",
            "user experience",
            "UX",
            "UI",
            "SaaS",
            "cybersecurity",
            "blockchain",
            "VR",
            "AR",
            "machine learning",
            "deep learning",
            "algorithm",
        ]
        text = article["title"] + " " + article.get("description", "")
        text_lower = text.lower()

        hard_hits = sum(kw.lower() in text_lower for kw in hard_tech)
        soft_hits = sum(kw.lower() in text_lower for kw in soft_tech)

        if hard_hits > soft_hits and hard_hits > 0:
            return "Hardware tehnology"
        elif soft_hits > hard_hits and soft_hits > 0:
            return "Software technology"
        elif hard_hits > 0 and soft_hits > 0:
            return "Mixed tehnology"
        else:
            return "Other topic"

    # Prepare data
    X = [a["title"] + " " + a.get("description", "") for a in articles]
    y = [label_tech_type(a) for a in articles]

    # Train and save model
    vectorizer = TfidfVectorizer(stop_words="english", max_features=1000)
    X_vec = vectorizer.fit_transform(X)
    clf = MultinomialNB().fit(X_vec, y)

    joblib.dump((vectorizer, clf), "tech_classifier.joblib")
    print("Classifier trained and saved")


def predict_tech_type(text):
    """Predict tech type for new text"""
    vectorizer, clf = joblib.load("tech_classifier.joblib")
    return clf.predict(vectorizer.transform([text]))[0]
