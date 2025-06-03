const API_BASE_URL = 'http://localhost:5000'; // Make sure this matches your Flask URL

export const fetchArticles = async (category = 'general', limit = 20) => {
  try {
    const response = await fetch(`${API_BASE_URL}/articles?category=${category}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error('Error fetching articles:', error);
    
    // More specific error handling
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Make sure your Flask backend is running on http://localhost:5000');
    }
    
    throw error;
  }
};
