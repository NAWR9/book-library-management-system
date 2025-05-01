/**
 * Home page functionality
 */
import Auth from "../auth.js";

document.addEventListener("DOMContentLoaded", function () {
  // Initialize the Auth class
  const auth = new Auth();

  // Update navbar based on authentication status
  auth.updateNavbar(auth.isLoggedIn());
});
