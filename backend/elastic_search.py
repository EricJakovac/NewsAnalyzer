import hashlib
import requests
import urllib3
from config import ES_URL, ES_USER, ES_PASS

# Disable warnings
urllib3.disable_warnings()

def search_es(index, query):
    """Pretraži u Bonsai - JEDNOSTAVNO"""
    url = f"{ES_URL}/{index}/_search"
    
    body = {
        "query": {
            "multi_match": {
                "query": query,
                "fields": ["title", "description"]
            }
        },
        "size": 20
    }
    
    try:
        r = requests.get(
            url,
            json=body,
            auth=(ES_USER, ES_PASS),
            verify=False,
            timeout=10
        )
        return r.json()
    except Exception as e:
        print(f"Search error: {e}")
        return {"hits": {"hits": []}}

def index_article_es(article):
    """Indexiraj članak u Bonsai - JEDNOSTAVNO"""
    index = article.get("topic", "general").lower()
    
    doc = {
        "title": article.get("title", ""),
        "description": article.get("description", ""),
        "url": article.get("url", ""),
        "publishedAt": article.get("publishedAt", ""),
        "subcategory": article.get("subcategory", ""),
        "category": article.get("category", ""),
    }
    
    doc_id = hashlib.md5(doc["url"].encode()).hexdigest()
    url = f"{ES_URL}/{index}/_doc/{doc_id}"
    
    try:
        r = requests.put(
            url,
            json=doc,
            auth=(ES_USER, ES_PASS),
            verify=False,
            timeout=10
        )
        return r.json()
    except Exception as e:
        print(f"ES error: {e}")
        return None