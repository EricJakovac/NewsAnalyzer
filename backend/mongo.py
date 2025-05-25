from config import MONGO_URI
from pymongo import MongoClient

client = MongoClient(MONGO_URI)
db = client["news_db"]
articles_collection = db["articles"]
clusters_collection = db["clusters"]


def test_mongo_connection():
    try:
        client.server_info()  # Will throw exception if can't connect
        print("MongoDB connection successful")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
