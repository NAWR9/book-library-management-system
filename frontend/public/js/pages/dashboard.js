/**
 * Dashboard page functionality
 */
import Auth from "../auth.js";

document.addEventListener("DOMContentLoaded", function () {
  // Initialize the Auth class
  const auth = new Auth();

  // Check if user is logged in
  if (!auth.isLoggedIn()) {
    window.location.href = "./login";
    return;
  }

  const user = auth.getUser();
  // Append user name to welcome message
  const welcomeEl = document.getElementById("welcome-message");
  if (welcomeEl && user) {
    welcomeEl.textContent = `${welcomeEl.textContent}, ${user.name}!`;
  }

  // Update navbar
  auth.updateNavbar(true);
});
