from elasticsearch import Elasticsearch

es = Elasticsearch("http://localhost:9200")


def index_article_es(article):
    doc = {
        "title": article.get("title", ""),
        "description": article.get("description", ""),
        "url": article.get("url", ""),
        "publishedAt": article.get("publishedAt", ""),
        "subcategory": article.get("subcategory", ""),
        "category": article.get("category", ""),
    }
    # Koristi url kao jedinstveni ID
    es.index(index="articles", id=article["url"], document=doc)
