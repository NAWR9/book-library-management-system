/**
 * Forgot Password page functionality
 */
import Auth from "../auth.js";
import { checkApiConnection } from "../utils/api-client.js";

class ForgotPasswordPage {
  constructor() {
    this.auth = new Auth();
    this.form = document.getElementById("forgotPasswordForm");
    this.emailInput = document.getElementById("email");

    this.initListeners();
    checkApiConnection();
  }

  initListeners() {
    this.form.addEventListener("submit", this.handleSubmit.bind(this));

    // Add input validation on blur
    this.emailInput.addEventListener("blur", () => {
      if (
        this.emailInput.value &&
        !this.auth.validateEmail(this.emailInput.value)
      ) {
        this.auth.setInvalid(this.emailInput);
      } else {
        this.auth.setValid(this.emailInput);
      }
    });
  }

  handleSubmit(e) {
    e.preventDefault();

    const email = this.emailInput.value.trim();

    // Validate email
    if (!email) {
      this.auth.setInvalid(this.emailInput);
      this.auth.showMessage("error", window.i18nMessages.emailError);
      return;
    }

    if (!this.auth.validateEmail(email)) {
      this.auth.setInvalid(this.emailInput);
      this.auth.showMessage("error", window.i18nMessages.emailError);
      return;
    }

    // All validations passed, send request
    this.auth.forgotPassword(email);
  }
}

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  new ForgotPasswordPage();
});
