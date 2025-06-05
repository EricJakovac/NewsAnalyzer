import axios from "axios";

const BASE_URL = "http://localhost:5000";

export const fetchArticles = async (topic) => {
  try {
    const response = await axios.get(`${BASE_URL}/articles/${topic}`);
    return response.data.articles; 
  } catch (error) {
    console.error("Error fetching articles:", error);
    throw error;
  }
};

// Fetch fresh top headlines from API and store in DB
export const fetchTopHeadlines = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/fetch-top-headlines`);
    return response.data;
  } catch (error) {
    console.error("Error fetching top headlines:", error);
    throw error;
  }
};

// Fetch fresh articles by topic from API and store in DB
export const fetchArticlesByTopic = async (topic) => {
  try {
    const response = await axios.post(`${BASE_URL}/fetch-articles`, {
      topic: topic
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching articles by topic:", error);
    throw error;
  }
};

