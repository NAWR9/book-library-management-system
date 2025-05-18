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

  // Fetch and render admin stats if on admin dashboard
  if (document.getElementById("stat-total-books")) {
    fetch(`${window.API_BASE_URL}/api/admin/stats`, { credentials: "include" })
      .then((response) => response.json())
      .then((stats) => {
        document.getElementById("stat-total-books").textContent =
          stats.totalBooks;
        document.getElementById("stat-available-books").textContent =
          stats.availableBooks;
        document.getElementById("stat-borrowed-books").textContent =
          stats.borrowedBooks;
        document.getElementById("stat-total-users").textContent =
          stats.totalUsers;
        // Borrow request counts
        document.getElementById("req-pending").textContent =
          stats.borrowRequestStatus.pending;
        document.getElementById("req-approved").textContent =
          stats.borrowRequestStatus.approved;
        document.getElementById("req-declined").textContent =
          stats.borrowRequestStatus.declined;
        document.getElementById("req-returned").textContent =
          stats.borrowRequestStatus.returned;
        // Categories breakdown
        const catList = document.getElementById("stat-categories");
        catList.innerHTML = "";
        stats.categories.forEach(({ category, count }) => {
          const li = document.createElement("li");
          li.className = "list-group-item d-flex justify-content-between";
          const label =
            window.i18nMessages.bookCategories[category] || category;
          li.textContent = label;
          const span = document.createElement("span");
          span.textContent = count;
          li.appendChild(span);
          catList.appendChild(li);
        });
      })
      .catch((error) => console.error("Error fetching admin stats:", error));
  }

  // Fetch and render pending borrow requests for admin
  const pendingBody = document.getElementById("pending-requests-body");
  if (pendingBody) {
    fetch(`${window.API_BASE_URL}/api/admin/requests/pending`, {
      credentials: "include",
    })
      .then((res) => {
        console.log("Pending requests HTTP status:", res.status);
        return res.json();
      })
      .then((result) => {
        console.log("Pending requests API returned:", result);
        pendingBody.innerHTML = "";
        // Prepare action button labels
        const approveLabel =
          (window.i18nMessages &&
            window.i18nMessages.dashboard &&
            window.i18nMessages.dashboard.approve) ||
          "Approve";
        const declineLabel =
          (window.i18nMessages &&
            window.i18nMessages.dashboard &&
            window.i18nMessages.dashboard.decline) ||
          "Decline";
        if (!result.success) {
          const errRow = document.createElement("tr");
          const errMsg =
            result.message ||
            window.i18nMessages.dashboard.errorFetchingRequests;
          errRow.innerHTML = `<td colspan="6" class="text-center text-danger">${errMsg}</td>`;
          pendingBody.appendChild(errRow);
          return;
        }
        const items = result.data;
        if (items.length === 0) {
          const noRow = document.createElement("tr");
          noRow.innerHTML = `<td colspan="6" class="text-center">${window.i18nMessages.dashboard.noPendingRequests}</td>`;
          pendingBody.appendChild(noRow);
        } else {
          items.forEach((reqItem) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${reqItem.user.name}</td>
              <td>${reqItem.user.email || reqItem.user.phoneNumber}</td>
              <td>${reqItem.book.title}</td>
              <td>${reqItem.book.author}</td>
              <td>${new Date(reqItem.requestDate).toLocaleDateString()}</td>
              <td>
                <button class="btn btn-sm btn-success me-2 btn-approve" data-id="${reqItem.id}">${approveLabel}</button>
                <button class="btn btn-sm btn-danger btn-decline" data-id="${reqItem.id}">${declineLabel}</button>
              </td>
            `;
            pendingBody.appendChild(tr);
          });
        }
      })
      .catch((err) => console.error("Error fetching pending requests:", err));

    // Delegate approve/decline actions
    pendingBody.addEventListener("click", (e) => {
      const btn = e.target;
      if (
        btn.classList.contains("btn-approve") ||
        btn.classList.contains("btn-decline")
      ) {
        const id = btn.getAttribute("data-id");
        const action = btn.classList.contains("btn-approve")
          ? "approve"
          : "decline";
        fetch(`/api/admin/requests/${id}/${action}`, { method: "PATCH" })
          .then((res) => res.json())
          .then((resp) => {
            if (resp.success) {
              // Remove the row from table
              btn.closest("tr").remove();
            } else {
              console.warn("Action failed");
            }
          })
          .catch((err) => console.error("Error updating request:", err));
      }
    });
  }
});
