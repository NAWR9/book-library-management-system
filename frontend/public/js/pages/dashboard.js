/**
 * Dashboard page functionality
 */

// Dashboard JavaScript - Adds interactivity to the dashboard page

document.addEventListener("DOMContentLoaded", () => {
  // This is a simple class for dashboard functionality
  class Dashboard {
    constructor() {
      this.init();
      // Check for theme changes
      this.listenForThemeChanges();
    }

    init() {
      // Add any dashboard initialization code here
      // Only add borrow history interactivity if the user is not an admin
      if (document.querySelector(".table")) {
        this.addBorrowHistoryInteractivity();
      }
    }

    listenForThemeChanges() {
      // Get the theme switch button
      const themeSwitch = document.getElementById("theme-switch");
      if (themeSwitch) {
        themeSwitch.addEventListener("click", () => {
          // Re-apply borrow history styling after theme change
          setTimeout(() => {
            this.addBorrowHistoryInteractivity();
          }, 100);
        });
      }
    }

    addBorrowHistoryInteractivity() {
      // Highlight overdue items
      document.querySelectorAll(".table tr").forEach((row) => {
        const statusBadge = row.querySelector(".badge");
        if (statusBadge && statusBadge.textContent.includes("Approved")) {
          const dueDate = row.querySelector("td:nth-child(5)").textContent;
          if (dueDate && dueDate !== "-") {
            // Check if due date is in the past
            const dueDateObj = new Date(dueDate);
            const now = new Date();
            if (dueDateObj < now) {
              // Apply appropriate styling based on theme
              const isDarkMode = document.body.classList.contains("darkmode");

              // Add the danger class
              row.classList.add(isDarkMode ? "table-danger" : "table-danger");

              // Add an overdue indicator if not already present
              if (!statusBadge.parentNode.querySelector(".badge.bg-danger")) {
                const overdueSpan = document.createElement("span");
                overdueSpan.className = "ms-2 badge bg-danger";

                // Try to get translated "overdue" text, or default to "Overdue"
                const overdueText =
                  window.i18nMessages &&
                  window.i18nMessages.books &&
                  window.i18nMessages.books.overdue
                    ? window.i18nMessages.books.overdue
                    : "Overdue";
                overdueSpan.textContent = overdueText;

                statusBadge.parentNode.appendChild(overdueSpan);
              }
            }
          }
        }
      });
    }
  }

  // Initialize dashboard
  new Dashboard();
});
