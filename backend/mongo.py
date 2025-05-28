from config import MONGO_URI
from pymongo import MongoClient

client = MongoClient(MONGO_URI)
db = client["news_db"]
business_collection = db["business"]
sports_collection = db["sports"]
entertainment_collection = db["entertainment"]
technology_collection = db["technology"]
general_collection = db["general"]
health_collection = db["health"]
science_collection = db["science"]
clusters_collection = db["clusters"]


def test_mongo_connection():
    try:
        client.server_info()  # Will throw exception if can't connect
        print("MongoDB connection successful")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
