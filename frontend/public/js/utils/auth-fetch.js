/**
 * Utility functions for making authenticated API requests
 */

/**
 * Make an authenticated GET request
 * @param {string} url - The URL to make the request to
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} - The parsed JSON response
 */
export async function authGet(url, options = {}) {
  return authFetch(url, { method: "GET", ...options });
}

/**
 * Make an authenticated POST request
 * @param {string} url - The URL to make the request to
 * @param {Object} data - The data to send in the request body
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} - The parsed JSON response
 */
export async function authPost(url, data, options = {}) {
  console.log("Making authenticated POST request to:", url, "with data:", data);
  return authFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * Base function for making authenticated requests
 * @param {string} url - The URL to make the request to
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - The parsed JSON response
 */
async function authFetch(url, options = {}) {
  try {
    console.log("Fetch options:", {
      ...options,
      body: options.body ? "..." : undefined,
    });

    const response = await fetch(url, {
      ...options,
      credentials: "include", // Include cookies for auth
    });

    const data = await response.json();
    console.log("Response status:", response.status, "Response data:", data);

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error) {
    console.error("Auth fetch error:", error);
    throw error;
  }
}
