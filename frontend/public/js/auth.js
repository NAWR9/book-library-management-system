/**
 * Authentication class for handling user registration, login, and session management
 */
class Auth {
  constructor() {
    this.baseUrl = `${window.API_BASE_URL}/api/auth`;
    this.token = localStorage.getItem("token");
    this.user = JSON.parse(localStorage.getItem("user"));
  }
  /**
   * Register a new user
   * @param {string} name - User's full name
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} phoneNumber - User's phone number (optional)
   * @param {string} department - User's department (optional)
   */
  async register(name, email, password, phoneNumber, department) {
    try {
      this.showLoader();

      const response = await fetch(`${this.baseUrl}/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phoneNumber,
          department,
        }),
      });

      const { success, message, token, user } = await response.json();
      if (!success) {
        throw new Error(message || "Registration failed");
      }

      // Store token and user data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      this.token = token;
      this.user = user;

      // Show success message
      this.showMessage("success", message);
      window.location.href = "./dashboard";
    } catch (error) {
      console.error("Registration error:", error);
      this.showMessage(
        "error",
        error.message || "Unable to connect to server. Please try again later.",
      );
    } finally {
      this.hideLoader();
    }
  }

  /**
   * Login an existing user
   * @param {string} email - User's email
   * @param {string} password - User's password
   */
  async login(email, password) {
    try {
      this.showLoader();

      const response = await fetch(`${this.baseUrl}/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const { success, message, token, user } = await response.json();
      if (!success) {
        throw new Error(message || "Login failed");
      }

      // Store token and user data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      this.token = token;
      this.user = user;

      // Show success message
      this.showMessage("success", message);
      window.location.href = "./dashboard";
    } catch (error) {
      console.error("Login error:", error);
      this.showMessage(
        "error",
        error.message || "Unable to connect to server. Please try again later.",
      );
    } finally {
      this.hideLoader();
    }
  }

  /**
   * Send a password reset email
   * @param {string} email - User's email
   */
  async forgotPassword(email) {
    try {
      this.showLoader();

      const response = await fetch(`${this.baseUrl}/forgot-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const { success, message } = await response.json();
      if (!success) {
        throw new Error(message || "Failed to send password reset link");
      }

      // Show success message
      this.showMessage("success", message);
    } catch (error) {
      console.error("Forgot password error:", error);
      this.showMessage(
        "error",
        error.message || "Unable to connect to server. Please try again later.",
      );
    } finally {
      this.hideLoader();
    }
  }

  /**
   * Logout the user
   */
  logout() {
    // Remove token and user from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    this.token = null;
    this.user = null;

    // Redirect to login page
    window.location.href = "./login";
  }

  /**
   * Check if the current token is expired
   * @returns {boolean} - Whether token is expired or invalid
   */
  isTokenExpired() {
    if (!this.token) return true;

    try {
      const payload = JSON.parse(atob(this.token.split(".")[1]));
      return payload.exp < Date.now() / 1000;
    } catch (e) {
      console.error("Error checking token expiration:", e);
      return true; // If token can't be parsed, consider it expired
    }
  }

  /**
   * Check if user is logged in and token is valid
   * @returns {boolean} - Whether user is logged in with valid token
   */
  isLoggedIn() {
    return !!this.token && !this.isTokenExpired();
  }
  /**
   * Get current user info
   * @returns {object|null} - User object or null if not logged in
   */
  getUser() {
    return this.user;
  }

  /**
   * Validate registration form
   * @returns {boolean} - Whether form is valid
   */
  validateRegistrationForm() {
    let isValid = true;

    // Name validation
    const nameInput = document.getElementById("name");
    if (!nameInput.value.trim()) {
      this.setInvalid(nameInput);
      isValid = false;
    } else {
      this.setValid(nameInput);
    }

    // Email validation
    const emailInput = document.getElementById("email");
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(emailInput.value)) {
      this.setInvalid(emailInput);
      isValid = false;
    } else {
      this.setValid(emailInput);
    }

    // Password validation
    const passwordInput = document.getElementById("password");
    if (passwordInput.value.length < 6) {
      this.setInvalid(passwordInput);
      isValid = false;
    } else {
      this.setValid(passwordInput);
    }

    return isValid;
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - Whether email is valid
   */
  validateEmail(email) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  }

  /**
   * Set input as invalid
   * @param {HTMLElement} input - Input element
   */
  setInvalid(input) {
    input.classList.add("is-invalid");
  }

  /**
   * Set input as valid
   * @param {HTMLElement} input - Input element
   */
  setValid(input) {
    input.classList.remove("is-invalid");
  }

  /**
   * Show message to user
   * @param {string} type - Message type (error or success)
   * @param {string} message - Message to show
   */
  showMessage(type, message) {
    const errorMessage = document.getElementById("errorMessage");
    const successMessage = document.getElementById("successMessage");

    if (type === "error" && errorMessage) {
      errorMessage.textContent = message;
      errorMessage.style.display = "block";

      // Hide success message if visible
      if (successMessage) {
        successMessage.style.display = "none";
      }

      // Auto hide after 5 seconds
      setTimeout(() => {
        errorMessage.style.display = "none";
      }, 5000);
    } else if (type === "success" && successMessage) {
      successMessage.textContent = message;
      successMessage.style.display = "block";

      // Hide error message if visible
      if (errorMessage) {
        errorMessage.style.display = "none";
      }

      // Auto hide after 5 seconds
      setTimeout(() => {
        successMessage.style.display = "none";
      }, 5000);
    }
  }

  /**
   * Show loader while API calls are in progress
   */
  showLoader() {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ' +
        window.i18nMessages.loading;
      submitBtn.disabled = true;
    }
  }

  /**
   * Hide loader after API calls complete
   */
  hideLoader() {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
      // Restore default state and label
      if (submitBtn.closest("#loginForm")) {
        submitBtn.innerHTML = window.i18nMessages.loginButton;
      } else if (submitBtn.closest("#registerForm")) {
        submitBtn.innerHTML = window.i18nMessages.createAccount;
      } else if (submitBtn.closest("#forgotPasswordForm")) {
        submitBtn.innerHTML = window.i18nMessages.sendResetLink;
      } else {
        submitBtn.innerHTML = window.i18nMessages.updateProfile;
      }
      submitBtn.disabled = false;
    }
  }
  async updateProfile(profileData) {
    try {
      this.showLoader();
      const response = await fetch(`${this.baseUrl}/profile`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(profileData),
      });
      const { success, message, user: updatedUser } = await response.json();
      if (!success) throw new Error(message || "Failed to update profile");
      localStorage.setItem("user", JSON.stringify(updatedUser));
      this.user = updatedUser;
      this.showMessage("success", message);
      window.location.href = "./dashboard";
    } catch (error) {
      console.error("Profile update error:", error);
      this.showMessage(
        "error",
        error.message ||
          "An unexpected error occurred. Please try again later.",
      );
    } finally {
      this.hideLoader();
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset password token
   * @param {string} newPassword - New password
   */
  async resetPassword(token, newPassword) {
    try {
      this.showLoader();

      const response = await fetch(`${this.baseUrl}/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const { success, message } = await response.json();
      if (!success) {
        throw new Error(message || "Failed to reset password");
      }

      // Show success message
      this.showMessage("success", message);

      // After 3 seconds, redirect to login page
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (error) {
      console.error("Reset password error:", error);
      this.showMessage(
        "error",
        error.message || "Unable to connect to server. Please try again later.",
      );
    } finally {
      this.hideLoader();
    }
  }
}

export default Auth;
