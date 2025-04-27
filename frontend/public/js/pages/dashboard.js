/**
 * Dashboard page functionality
 */
import i18n from "../i18n.js";
import Auth from "../auth.js";

document.addEventListener("DOMContentLoaded", async function () {
  // Initialize translations
  await i18n.init();

  // Initialize the Auth class
  const auth = new Auth();

  // Check if user is logged in
  if (!auth.isLoggedIn()) {
    window.location.href = "./login";
    return;
  }

  const user = auth.getUser();

  // Update welcome message initially
  if (user) {
    updateWelcomeMessage(user);
  }

  // Listen for language changes
  document.addEventListener("languageChanged", () => {
    if (user) {
      updateWelcomeMessage(user);
    }
  });

  // Update navbar
  auth.updateNavbar(true);

  /**
   * Updates welcome message with user name and current language
   * @param {Object} user - User object with name property
   */
  function updateWelcomeMessage(user) {
    const welcomeElement = document.getElementById("welcome-message");
    if (welcomeElement) {
      welcomeElement.textContent = `${i18n.translate("welcome")}, ${user.name}!`;
    }
  }
});
