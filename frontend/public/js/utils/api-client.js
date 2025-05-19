/**
 * API client utilities for making requests and checking server connectivity
 */

/**
 * Check API server connection status
 * @returns {Promise<Object>} Connection status object
 */
export async function checkApiConnection() {
  const statusEl = document.getElementById("api-status");
  if (!statusEl) return null;

  try {
    const response = await fetch(`${window.API_BASE_URL}/api/health`);

    if (response.ok) {
      statusEl.textContent = window.i18nMessages.serverOnline;
      statusEl.className = "text-success";
      const data = await response.json();
      console.log("Server status:", data);
      return { status: "online", data };
    } else {
      const message = `${window.i18nMessages.serverError} ${response.status}`;
      statusEl.textContent = message;
      statusEl.className = "text-warning";
      return { status: "error", code: response.status };
    }
  } catch (err) {
    console.error("API connection error:", err);
    statusEl.textContent = window.i18nMessages.serverOffline;
    statusEl.className = "text-danger";
    return { status: "offline", error: err };
  }
}

/**
 * Search for books with the provided criteria
 * @param {Object} criteria - Search criteria object (title, author, category)
 * @returns {Promise<Array>} - Array of books matching search criteria
 */
export async function searchBooks(criteria) {
  try {
    // Build query parameters from criteria
    const params = new URLSearchParams();
    if (criteria.title) params.append("title", criteria.title);
    if (criteria.author) params.append("author", criteria.author);
    // Filter by single category
    if (criteria.category) params.append("category", criteria.category);

    // Make API request
    const response = await fetch(`${window.API_BASE_URL}/api/search?${params}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    }

    return [];
  } catch (error) {
    console.error("Search API error:", error);
    throw error;
  }
}

export default { checkApiConnection, searchBooks };
