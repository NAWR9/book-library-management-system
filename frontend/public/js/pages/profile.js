/**
 * Profile page functionality
 */
import i18n from "../i18n.js";
import Auth from "../auth.js";

document.addEventListener("DOMContentLoaded", async function () {
  const auth = new Auth();

  // Redirect to login if not logged in
  if (!auth.isLoggedIn()) {
    window.location.href = "./login";
    return;
  }

  // Populate profile form with user data
  const user = auth.getUser();
  document.getElementById("name").value = user.name;
  document.getElementById("email").value = user.email;
  document.getElementById("phoneNumber").value = user.phoneNumber || "";
  document.getElementById("department").value = user.department || "";

  // Handle profile form submission
  document
    .getElementById("profileForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      // Validate form inputs
      const name = document.getElementById("name").value.trim();
      const password = document.getElementById("password").value.trim();
      const phoneNumber = document.getElementById("phoneNumber").value.trim();
      const department = document.getElementById("department").value;

      // Validation checks
      if (!name) {
        alert("Full name is required.");
        return;
      }

      if (password && password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
      }

      // Update profile
      await auth.updateProfile({
        name,
        password,
        phoneNumber,
        department,
      });
    });

  // Initialize translations
  await i18n.init();
});
