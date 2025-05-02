/**
 * Register page functionality
 */
import Auth from "../auth.js";

import { checkApiConnection } from "../utils/api-client.js";

document.addEventListener("DOMContentLoaded", function () {
  // Initialize the Auth class
  const auth = new Auth();

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
