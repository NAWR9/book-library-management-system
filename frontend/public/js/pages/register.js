/**
 * Register page functionality
 */
import i18n from "../i18n.js";
import Auth from "../auth.js";

import { checkApiConnection } from "../utils/api-client.js";

document.addEventListener("DOMContentLoaded", async function () {
  // Initialize translations
  await i18n.init();

  // Initialize the Auth class
  const auth = new Auth();

  // Check if user is already logged in
  if (auth.isLoggedIn()) {
    window.location.href = "./dashboard";
    return;
  }

  // Check API server connection
  checkApiConnection();

  // Handle registration form submission
  document
    .getElementById("registerForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      // Form validation
      if (!auth.validateRegistrationForm()) {
        return;
      }

      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const phoneNumber = document.getElementById("phoneNumber").value;
      const department = document.getElementById("department").value;

      auth.register(name, email, password, phoneNumber, department);
    });
});
