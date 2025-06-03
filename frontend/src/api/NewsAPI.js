import axios from "axios";

const BASE_URL = "http://localhost:5000"; // prilagodi ako koristiš drugi port

export const fetchArticles = async (topic) => {
  try {
    const response = await axios.get(`${BASE_URL}/articles/${topic}`);
    return response.data.articles; 
  } catch (error) {
    console.error("Error fetching articles:", error);
    throw error;
  }
};
