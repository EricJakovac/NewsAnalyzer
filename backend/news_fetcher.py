from datetime import datetime, timedelta

from collections_map import (
    collections_map,
    general_collection,
    top_headlines_collection,
)
from config import NEWS_API_KEY
from elastic_search import index_article_es
from news_classifier import (
    classify_article_topic,
    predict_article_label,
    train_classifier_for_topic,
    train_top_headlines_classifier,
)
from newsapi import NewsApiClient

newsapi = NewsApiClient(api_key=NEWS_API_KEY)

date_7_days_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")


def fetch_articles_by_topic(topic):
    try:
        articles = newsapi.get_everything(q=topic, language="en", from_param=date_7_days_ago, sort_by="publishedAt", page_size=100)["articles"]
    except Exception as e:
        print(f"Error fetching articles: {e}")
        return []

    inserted_articles = []

    collection = collections_map.get(topic.lower(), general_collection)

    for raw_article in articles:
        article = preprocess_article(raw_article)
        article["fetched_at"] = datetime.utcnow()
        article["topic"] = topic.lower()

        if topic.lower() != "general":
            # Predikcija subkategorije pomoću istreniranog modela samo ako nije 'general'
            text = (article.get("title") or "") + " " + (article.get("description") or "")
            try:
                article["subcategory"] = predict_article_label(text, topic.lower())
            except Exception as e:
                print(f"Error predicting subcategory for article '{article.get('title', '')}': {e}")

        # Spremi u bazu s upsertom po URL-u
        result = collection.update_one({"url": article["url"]}, {"$setOnInsert": article}, upsert=True)
        if result.upserted_id:
            inserted_articles.append(article)
            index_article_es(article)

    print(f"Stored {len(inserted_articles)} new '{topic}' articles in collection '{collection.name}'")

    # Trenira model samo ako topic nije 'general'
    if topic.lower() != "general":
        train_classifier_for_topic(topic)

    return inserted_articles


def fetch_top_headlines():
    try:
        articles = newsapi.get_top_headlines(language="en", page_size=100)["articles"]
    except Exception as e:
        print(f"Error fetching top headlines: {e}")
        return []

    inserted_articles = []

    for raw_article in articles:
        article = preprocess_article(raw_article)
        article["fetched_at"] = datetime.utcnow()
        article["category"] = classify_article_topic(article)
        result = top_headlines_collection.update_one({"url": article["url"]}, {"$setOnInsert": article}, upsert=True)
        if result.upserted_id:
            inserted_articles.append(article)
            index_article_es(article)

    print(f"Stored {len(inserted_articles)} new top headlines in collection '{top_headlines_collection.name}'")
    train_top_headlines_classifier()
    return inserted_articles


def preprocess_article(article):
    def clean_field(value):
        if value in [None, "", "null", "N/A", "n/a"]:
            return "Unknown"
        return value

    article["author"] = clean_field(article.get("author"))
    article["source"] = article.get("source") or {}
    article["source"]["name"] = clean_field(article["source"].get("name") if article.get("source") else None)

    return article
