/**
 * Home page functionality
 */
import i18n from "../i18n.js";
import Auth from "../auth.js";

document.addEventListener("DOMContentLoaded", async function () {
  // Initialize the Auth class
  const auth = new Auth();

  // Update navbar based on authentication status
  auth.updateNavbar(auth.isLoggedIn());

  // Initialize translations
  await i18n.init();
});
