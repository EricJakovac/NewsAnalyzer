from datetime import datetime, timedelta

from config import NEWS_API_KEY
from mongo import articles_collection
from newsapi import NewsApiClient

newsapi = NewsApiClient(api_key=NEWS_API_KEY)


def fetch_tech_articles():
    """Fetch and return newly stored tech articles from the last 7 days"""
    date_7_days_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

    try:
        articles = newsapi.get_everything(q="technology", language="en", from_param=date_7_days_ago, sort_by="publishedAt", page_size=50)["articles"]
    except Exception as e:
        print(f"Error fetching articles: {e}")
        return []

    inserted_articles = []

    for article in articles:
        article["fetched_at"] = datetime.utcnow()
        result = articles_collection.update_one({"url": article["url"]}, {"$setOnInsert": article}, upsert=True)
        if result.upserted_id:  # Only keep new ones
            inserted_articles.append(article)

    print(f"Stored {len(inserted_articles)} new tech articles")
    return inserted_articles
