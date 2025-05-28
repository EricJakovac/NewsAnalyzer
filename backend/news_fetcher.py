from datetime import datetime, timedelta

from collections_map import collections_map, general_collection
from config import NEWS_API_KEY
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

    # Odaberi kolekciju prema topicu
    collection = collections_map.get(topic.lower(), general_collection)

    for article in articles:
        article["fetched_at"] = datetime.utcnow()
        article["topic"] = topic
        result = collection.update_one({"url": article["url"]}, {"$setOnInsert": article}, upsert=True)
        if result.upserted_id:
            inserted_articles.append(article)

    print(f"Stored {len(inserted_articles)} new '{topic}' articles in collection '{collection.name}'")
    return inserted_articles
