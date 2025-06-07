import hashlib

from elasticsearch import Elasticsearch

es = Elasticsearch("http://localhost:9200")


def index_article_es(article):
    index_name = article.get("topic", "general").lower()
    doc = {
        "title": article.get("title", ""),
        "description": article.get("description", ""),
        "url": article.get("url", ""),
        "publishedAt": article.get("publishedAt", ""),
        "subcategory": article.get("subcategory", ""),
        "category": article.get("category", ""),
        "fetched_at": article.get("fetched_at", None),
    }
    es.index(index=index_name, id=hashlib.md5(doc["url"].encode("utf-8")).hexdigest(), document=doc)
