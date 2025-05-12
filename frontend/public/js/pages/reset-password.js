/**
 * Reset Password page functionality
 */
import Auth from "../auth.js";
import { checkApiConnection } from "../utils/api-client.js";

class ResetPasswordPage {
  constructor() {
    this.auth = new Auth();
    this.form = document.getElementById("resetPasswordForm");
    this.newPasswordInput = document.getElementById("newPassword");
    this.confirmPasswordInput = document.getElementById("confirmPassword");
    this.tokenInput = document.getElementById("resetToken");

    this.initListeners();
    checkApiConnection();
  }

  initListeners() {
    this.form.addEventListener("submit", this.handleSubmit.bind(this));

    // Validate password length on blur
    this.newPasswordInput.addEventListener("blur", () => {
      if (
        this.newPasswordInput.value &&
        this.newPasswordInput.value.length < 6
      ) {
        this.auth.setInvalid(this.newPasswordInput);
      } else {
        this.auth.setValid(this.newPasswordInput);
      }
    });

    // Check if passwords match on blur
    this.confirmPasswordInput.addEventListener("blur", () => {
      if (
        this.confirmPasswordInput.value &&
        this.confirmPasswordInput.value !== this.newPasswordInput.value
      ) {
        this.auth.setInvalid(this.confirmPasswordInput);
      } else {
        this.auth.setValid(this.confirmPasswordInput);
      }
    });
  }

  handleSubmit(e) {
    e.preventDefault();

    const token = this.tokenInput.value.trim();
    const newPassword = this.newPasswordInput.value;
    const confirmPassword = this.confirmPasswordInput.value;

    // Validate token
    if (!token) {
      this.auth.showMessage("error", "Invalid reset token");
      return;
    }

    // Validate password
    if (newPassword.length < 6) {
      this.auth.setInvalid(this.newPasswordInput);
      this.auth.showMessage("error", window.i18nMessages.passwordMinLength);
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      this.auth.setInvalid(this.confirmPasswordInput);
      this.auth.showMessage("error", window.i18nMessages.passwordsDoNotMatch);
      return;
    }

    // All validations passed
    this.auth.resetPassword(token, newPassword);
  }
}

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  new ResetPasswordPage();
});
