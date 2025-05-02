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
    const response = await fetch("http://localhost:3000/api/health");

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

export default { checkApiConnection };
