// /* global bootstrap */
import { authPost } from "../utils/auth-fetch.js";

/**
 * Class to handle book borrow requests
 */
class BorrowRequestHandler {
  constructor() {
    this.borrowBtn = document.getElementById("borrowBtn");
    this.borrowMsg = document.getElementById("borrowMsg");
    this.durationSelect = document.getElementById("borrowDuration");
    this.apiBaseUrl = window.API_BASE_URL || "";
    this.lang = document.documentElement.lang || "en";

    // Initialize if elements exist
    if (this.borrowBtn) {
      this.init();
    }

    // Listen for theme changes
    this.setupThemeChangeListener();
  }

  /**
   * Initialize event listeners
   */
  init() {
    this.borrowBtn.addEventListener(
      "click",
      this.handleBorrowRequest.bind(this),
    );
  }

  /**
   * Set up listener for theme changes
   */
  setupThemeChangeListener() {
    const themeSwitch = document.getElementById("theme-switch");
    if (themeSwitch) {
      themeSwitch.addEventListener("click", () => {
        // Update UI elements based on the new theme
        setTimeout(() => {
          this.updateThemeSpecificElements();
        }, 100);
      });
    }

    // Initial update
    this.updateThemeSpecificElements();
  }

  /**
   * Update any elements that need theme-specific styling
   */
  updateThemeSpecificElements() {
    const isDarkMode = document.body.classList.contains("darkmode");

    // Update any theme-specific styling here
    // For example, we could adjust the appearance of the borrow status section
    const borrowStatus = document.querySelector(".borrow-status");
    if (borrowStatus) {
      if (isDarkMode) {
        borrowStatus.classList.add("dark-theme");
      } else {
        borrowStatus.classList.remove("dark-theme");
      }
    }
  }

  /**
   * Handle borrow button click event
   * @param {Event} event - The click event
   */
  async handleBorrowRequest(event) {
    event.preventDefault();

    // Get book ID from data attribute
    const bookId = this.borrowBtn.getAttribute("data-book-id");

    // Get selected duration
    const requestedDuration = parseInt(this.durationSelect.value, 10);

    if (!bookId) {
      this.showMessage("error", "Missing book information");
      return;
    }

    // Set button to loading state
    this.setBtnLoading(true);

    try {
      // Send request to borrow endpoint with selected duration
      const response = await authPost(`${this.apiBaseUrl}/api/borrow/request`, {
        bookId: bookId,
        requestedDuration: requestedDuration,
      });

      // Show success message - use translated message or fallback to response message
      const successMsg =
        this.getTranslation("books.borrowSuccess") ||
        response.message ||
        "Book borrow request submitted successfully";
      this.showMessage("success", successMsg);

      // Disable button permanently after successful request
      this.borrowBtn.disabled = true;
      this.borrowBtn.classList.remove("btn-primary");
      this.borrowBtn.classList.add("btn-success");
      this.borrowBtn.textContent =
        this.getTranslation("books.requestSubmitted") || "Request Submitted";

      // Also disable the duration select
      if (this.durationSelect) {
        this.durationSelect.disabled = true;
      }
    } catch (error) {
      // Try to get translated error message based on common error types
      let errorMsg = error.message || "Failed to submit borrow request";

      // Map common error messages to translations
      if (errorMsg.includes("already have an active request")) {
        errorMsg = this.getTranslation("books.alreadyRequested") || errorMsg;
      } else if (errorMsg.includes("not available for borrowing")) {
        errorMsg = this.getTranslation("books.notAvailable") || errorMsg;
      } else if (errorMsg.includes("not found")) {
        errorMsg = this.getTranslation("books.bookNotFound") || errorMsg;
      }

      // Show error message
      this.showMessage("error", errorMsg);
    } finally {
      // Reset button state
      this.setBtnLoading(false);
    }
  }

  /**
   * Set button loading state
   * @param {boolean} isLoading - Whether button is in loading state
   */
  setBtnLoading(isLoading) {
    if (isLoading) {
      this.borrowBtn.disabled = true;
      this.borrowBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        ${this.getTranslation("auth.loading") || "Loading..."}
      `;
    } else {
      this.borrowBtn.disabled = false;
      this.borrowBtn.textContent =
        this.getTranslation("books.borrowBook") || "Borrow this Book";
    }
  }

  /**
   * Get translation from the page
   * @param {string} key - Translation key
   * @returns {string|null} - Translated text or null if not found
   */
  getTranslation(key) {
    // Try to find a hidden element with the translation
    const elem = document.querySelector(`[data-i18n="${key}"]`);
    return elem ? elem.textContent : null;
  }

  /**
   * Show message in alert box
   * @param {string} type - Message type: 'success', 'error', 'warning'
   * @param {string} message - Message to display
   */
  showMessage(type, message) {
    // Reset previous classes
    this.borrowMsg.classList.remove(
      "d-none",
      "alert-success",
      "alert-danger",
      "alert-warning",
    );

    // Set message type
    switch (type) {
      case "success":
        this.borrowMsg.classList.add("alert-success");
        break;
      case "error":
        this.borrowMsg.classList.add("alert-danger");
        break;
      case "warning":
        this.borrowMsg.classList.add("alert-warning");
        break;
      default:
        this.borrowMsg.classList.add("alert-info");
    }

    // Set message content and show
    this.borrowMsg.textContent = message;
    this.borrowMsg.classList.remove("d-none");

    // Scroll to message
    this.borrowMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new BorrowRequestHandler();
});
