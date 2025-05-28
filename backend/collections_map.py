from mongo import (
    business_collection,
    entertainment_collection,
    general_collection,
    health_collection,
    science_collection,
    sports_collection,
    technology_collection,
)

collections_map = {
    "business": business_collection,
    "sports": sports_collection,
    "entertainment": entertainment_collection,
    "technology": technology_collection,
    "health": health_collection,
    "science": science_collection,
    "general": general_collection,
}
