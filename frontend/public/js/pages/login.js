/**
 * Login page functionality
 */
import Auth from "../auth.js";

import { checkApiConnection } from "../utils/api-client.js";

document.addEventListener("DOMContentLoaded", function () {
  // Initialize the Auth class
  const auth = new Auth();

  // Check API server connection
  checkApiConnection();

  // Handle login form submission
  document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    auth.login(email, password);
  });
});
