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

export const searchArticles = async (query, index) => {
  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: { q: query, index: index }
    });
    return response.data.results;
  } catch (error) {
    console.error("Error searching articles:", error);
    throw error;
  }
};


  // Get top headlines from database (for HOME tab)
export const getTopHeadlines = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/top-headlines`);
    return response.data; // Backend vraća direktno array, ne { articles: [...] }
  } catch (error) {
    console.error("Error getting top headlines:", error);
    throw error;
  }
};
