import hashlib

from collections_map import collections_map
from config import MONGO_URI
from elasticsearch import Elasticsearch, helpers
from pymongo import MongoClient

# Povezivanje na MongoDB
client = MongoClient(MONGO_URI)
db = client["news_db"]

es = Elasticsearch("http://localhost:9200")


def generate_actions(articles, index_name):
    for article in articles:
        url = article.get("url", "")
        # Hashiraj URL u MD5 da dobiješ fiksnu dužinu ID-ja
        url_hash = hashlib.md5(url.encode("utf-8")).hexdigest()
        yield {
            "_index": index_name,
            "_id": url_hash,
            "_source": {
                "title": article.get("title", ""),
                "description": article.get("description", ""),
                "url": url,
                "publishedAt": article.get("publishedAt", ""),
                "subcategory": article.get("subcategory", ""),
                "category": article.get("category", ""),
                "fetched_at": article.get("fetched_at", ""),
            },
        }


def bulk_index_collection(collection_name, collection):
    print(f"Dohvaćam članke iz kolekcije '{collection_name}'...")
    articles = list(collection.find({}, {"_id": 0}))
    print(f"Pronađeno {len(articles)} članaka u '{collection_name}'.")

    index_name = collection_name.lower()

    if es.indices.exists(index=index_name):
        print(f"Brišem postojeći Elasticsearch indeks '{index_name}'...")
        es.indices.delete(index=index_name)

    print(f"Kreiram novi indeks '{index_name}'...")
    es.indices.create(index=index_name)

    print(f"Pokrećem bulk indeksiranje za '{collection_name}'...")
    helpers.bulk(es, generate_actions(articles, index_name))
    print(f"Bulk indeksiranje za '{collection_name}' završeno.\n")


def bulk_index_all_collections():
    for name, coll in collections_map.items():
        bulk_index_collection(name, coll)


if __name__ == "__main__":
    bulk_index_all_collections()
