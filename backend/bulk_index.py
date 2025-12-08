#Promjenjen je kod na opensearch koji direktno bulka indexe u bonsai/elasticsearch(cloud) i pokrece se rucno u venvu

import hashlib
import os
from pymongo import MongoClient
from opensearchpy import OpenSearch
from opensearchpy.helpers import bulk
from collections_map import collections_map
from config import MONGO_URI
from dotenv import load_dotenv
from opensearchpy.exceptions import NotFoundError

load_dotenv()

# Mongo
client = MongoClient(MONGO_URI)
db = client["news_db"]

# OpenSearch
ES_HOST = os.getenv("ELASTIC_URL")
ES_USER = os.getenv("ELASTIC_USER")
ES_PASS = os.getenv("ELASTIC_PASS")

es = OpenSearch(
    hosts=[ES_HOST],
    http_auth=(ES_USER, ES_PASS),
    use_ssl=True,
    verify_certs=True,
)

def generate_actions(articles, index_name):
    for article in articles:
        url = article.get("url", "")
        yield {
            "_index": index_name,
            "_id": hashlib.md5(url.encode()).hexdigest(),
            "_source": article
        }


def bulk_index_collection(name, collection):
    print("Indexing:", name)

    articles = list(collection.find({}, {"_id":0}))

    try:
        es.indices.get(index=name)
        es.indices.delete(index=name)
    except NotFoundError:
        pass

    mapping = {
        "mappings": {
            "properties": {
                "title": {"type":"text"},
                "description": {"type":"text"},
                "url": {"type":"keyword"},
                "subcategory":{"type":"keyword"},
                "category":{"type":"keyword"},
                "publishedAt":{"type":"date"},
                "fetched_at":{"type":"date"},
            }
        }
    }

    es.indices.create(index=name, body=mapping)

    bulk(es, generate_actions(articles, name))

    print("Done!")


def bulk_index_all():
    for name, coll in collections_map.items():
        bulk_index_collection(name, coll)


if __name__ == "__main__":
    bulk_index_all()
