import i18n from "./i18n.js";
/**
 * Authentication class for handling user registration, login, and session management
 */
class Auth {
  constructor() {
    this.baseUrl = "http://localhost:3000/api/auth";
    this.token = localStorage.getItem("token");
    this.user = JSON.parse(localStorage.getItem("user"));

    // Update UI based on authentication status when class is initialized
    if (this.isLoggedIn()) {
      this.updateNavbar(true);
    }
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          phoneNumber,
          department,
        }),
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;

        try {
          // Try to parse as JSON
          const errorData = JSON.parse(errorText);
          errorMessage =
            errorData.message ||
            `Error: ${response.status} ${response.statusText}`;
        } catch {
          // If not JSON, use text or status
          errorMessage =
            errorText || `Error: ${response.status} ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      // Check if response is empty
      const responseText = await response.text();
      if (!responseText) {
        throw new Error("Server returned an empty response");
      }

      // Parse JSON only if we have content
      const data = responseText ? JSON.parse(responseText) : {};

      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      this.token = data.token;
      this.user = data.user;

      // Show success message
      this.showMessage(
        "success",
        i18n.translate("registerSuccess") ||
          "Registration successful! Redirecting to dashboard...",
      );

      // Update navbar and redirect
      this.updateNavbar(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = "./dashboard";
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      this.showMessage(
        "error",
        error.message ||
          i18n.translate("serverConnectError") ||
          "Unable to connect to server. Please try again later.",
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;

        try {
          // Try to parse as JSON
          const errorData = JSON.parse(errorText);
          errorMessage =
            errorData.message ||
            `Error: ${response.status} ${response.statusText}`;
        } catch {
          // If not JSON, use text or status
          errorMessage =
            errorText || `Error: ${response.status} ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      // Check if response is empty
      const responseText = await response.text();
      if (!responseText) {
        throw new Error("Server returned an empty response");
      }

      // Parse JSON only if we have content
      const data = responseText ? JSON.parse(responseText) : {};

      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      this.token = data.token;
      this.user = data.user;

      // Show success message
      this.showMessage(
        "success",
        i18n.translate("loginSuccess") ||
          "Login successful! Redirecting to dashboard...",
      );

      // Update navbar and redirect
      this.updateNavbar(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = "./dashboard";
      }, 2000);
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
   * Logout the user
   */
  logout() {
    // Remove token and user from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    this.token = null;
    this.user = null;

    // Update navbar
    this.updateNavbar(false);

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
   * Update navbar based on authentication status
   * @param {boolean} isLoggedIn - Whether user is logged in
   */
  updateNavbar(isLoggedIn) {
    if (document.getElementById("loginNavItem")) {
      document
        .getElementById("loginNavItem")
        .classList.toggle("d-none", isLoggedIn);
      document
        .getElementById("registerNavItem")
        .classList.toggle("d-none", isLoggedIn);
      document
        .getElementById("dashboardNavItem")
        .classList.toggle("d-none", !isLoggedIn);
      document
        .getElementById("logoutNavItem")
        .classList.toggle("d-none", !isLoggedIn);
    }

    // Add event listener to logout button
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.logout();
      });
    }
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
        (i18n.translate("loading") || "Loading...");
      submitBtn.disabled = true;
    }
  }

  /**
   * Hide loader after API calls complete
   */
  hideLoader() {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
      if (submitBtn.closest("#loginForm")) {
        submitBtn.innerHTML = i18n.translate("loginButton") || "Login";
        submitBtn.setAttribute("data-i18n", "loginButton");
      } else if (submitBtn.closest("#registerForm")) {
        submitBtn.innerHTML =
          i18n.translate("createAccount") || "Create Account";
        submitBtn.setAttribute("data-i18n", "createAccount");
      } else {
        submitBtn.innerHTML =
          i18n.translate("updateAccount") || "Update Profile";
        submitBtn.setAttribute("data-i18n", "updateAccount");
      }
      submitBtn.disabled = false;
    }
  }
  async updateProfile(profileData) {
    try {
      this.showLoader();

      const response = await fetch(`${this.baseUrl}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const updatedUser = await response.json();

      // Update local storage with new user data
      localStorage.setItem("user", JSON.stringify(updatedUser));
      this.user = updatedUser;

      this.showMessage("success", "Profile updated successfully!");

      // Redirect to the dashboard after a short delay
      setTimeout(() => {
        window.location.href = "./dashboard";
      }, 2000);
    } catch (error) {
      console.error("Profile update error:", error);
      this.showMessage("error", error.message || "Failed to update profile");
    } finally {
      this.hideLoader();
    }
  }
}

export default Auth;
