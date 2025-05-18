/* global bootstrap */

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

  // Confirmation modal helper
  const confirmModalEl = document.getElementById("confirmModal");
  const bsConfirmModal = confirmModalEl
    ? new bootstrap.Modal(confirmModalEl)
    : null;
  function showConfirmModal(message) {
    return new Promise((resolve) => {
      if (!bsConfirmModal) {
        resolve(window.confirm(message));
        return;
      }
      document.getElementById("confirmModalBody").textContent = message;
      const confirmBtn = document.getElementById("confirmModalConfirmButton");
      function onConfirm() {
        confirmBtn.removeEventListener("click", onConfirm);
        resolve(true);
        bsConfirmModal.hide();
      }
      confirmBtn.addEventListener("click", onConfirm);
      bsConfirmModal.show();
    });
  }

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
      .then((res) => res.json())
      .then((result) => {
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
        const msg =
          action === "approve"
            ? window.i18nMessages.dashboard.confirmApprove
            : window.i18nMessages.dashboard.confirmDecline;
        showConfirmModal(msg).then((confirmed) => {
          if (!confirmed) return;
          fetch(`/api/admin/requests/${id}/${action}`, {
            method: "PATCH",
            credentials: "include",
          })
            .then((res) => res.json())
            .then((resp) => {
              if (resp.success) {
                btn.closest("tr").remove();
              } else {
                console.warn("Action failed");
              }
            })
            .catch((err) => console.error("Error updating request:", err));
        });
      }
    });
  }

  // After handling pending borrow requests, add active loans fetch
  const loansBody = document.getElementById("active-loans-body");
  if (loansBody) {
    fetch(`${window.API_BASE_URL}/api/admin/loans/active`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          loansBody.innerHTML = "";
          const loans = result.data.filter(
            (loan) => !["lost", "damaged"].includes(loan.status),
          );
          if (loans.length === 0) {
            loansBody.innerHTML = `
              <tr><td colspan="7" class="text-center">${window.i18nMessages.dashboard.noActiveLoans}</td></tr>
            `;
          } else {
            loans.forEach((loan) => {
              const tr = document.createElement("tr");
              tr.innerHTML = `
                <td>${loan.user.name}</td>
                <td>${loan.user.email || loan.user.phoneNumber}</td>
                <td>${loan.book.title}</td>
                <td>${loan.book.author}</td>
                <td>${new Date(loan.dueDate).toLocaleDateString()}</td>
                <td>${loan.daysRemaining}</td>
                <td>
                  <div class="dropdown" data-bs-boundary="viewport">
                    <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                      ${window.i18nMessages.dashboard.actions}
                    </button>
                    <ul class="dropdown-menu">
                      <li><button class="dropdown-item btn-return" data-id="${loan.id}">${window.i18nMessages.dashboard.returnLoan}</button></li>
                      <li><button class="dropdown-item btn-reminder" data-id="${loan.id}">${window.i18nMessages.dashboard.sendReminder}</button></li>
                      <li><button class="dropdown-item btn-renew" data-id="${loan.id}">${window.i18nMessages.dashboard.renewLoan}</button></li>
                      <li><button class="dropdown-item btn-lost" data-id="${loan.id}">${window.i18nMessages.dashboard.flagLost}</button></li>
                      <li><button class="dropdown-item btn-damaged" data-id="${loan.id}">${window.i18nMessages.dashboard.flagDamaged}</button></li>
                    </ul>
                  </div>
                </td>
              `;
              loansBody.appendChild(tr);
            });
          }
        } else {
          console.error("Error fetching active loans:", result.message);
        }
      })
      .catch((err) => console.error("Error fetching active loans:", err));

    loansBody.addEventListener("click", (e) => {
      const btn = e.target;
      const id = btn.getAttribute("data-id");
      // Return
      if (btn.classList.contains("btn-return")) {
        showConfirmModal(window.i18nMessages.dashboard.confirmReturnLoan).then(
          (confirmed) => {
            if (!confirmed) return;
            fetch(`${window.API_BASE_URL}/api/admin/loans/${id}/return`, {
              method: "PATCH",
              credentials: "include",
            })
              .then((res) => res.json())
              .then((resp) => {
                if (resp.success) btn.closest("tr").remove();
              })
              .catch((err) => console.error(err));
          },
        );
      }
      // Reminder
      if (btn.classList.contains("btn-reminder")) {
        showConfirmModal(
          window.i18nMessages.dashboard.confirmSendReminder,
        ).then((confirmed) => {
          if (!confirmed) return;
          fetch(`${window.API_BASE_URL}/api/admin/loans/${id}/reminder`, {
            method: "POST",
            credentials: "include",
          })
            .then((res) => res.json())
            .then((resp) => {
              if (resp.success) {
                location.reload();
              }
            })
            .catch((err) => console.error(err));
        });
      }
      // Renew
      if (btn.classList.contains("btn-renew")) {
        showConfirmModal(window.i18nMessages.dashboard.confirmRenewLoan).then(
          (confirmed) => {
            if (!confirmed) return;
            fetch(`${window.API_BASE_URL}/api/admin/loans/${id}/renew`, {
              method: "PATCH",
              credentials: "include",
            })
              .then((res) => res.json())
              .then((resp) => {
                if (resp.success) {
                  location.reload();
                }
              })
              .catch((err) => console.error(err));
          },
        );
      }
      // Lost
      if (btn.classList.contains("btn-lost")) {
        showConfirmModal(window.i18nMessages.dashboard.confirmFlagLost).then(
          (confirmed) => {
            if (!confirmed) return;
            fetch(`${window.API_BASE_URL}/api/admin/loans/${id}/lost`, {
              method: "PATCH",
              credentials: "include",
            })
              .then((res) => res.json())
              .then((resp) => {
                if (resp.success) btn.closest("tr").remove();
              })
              .catch((err) => console.error(err));
          },
        );
      }
      // Damaged
      if (btn.classList.contains("btn-damaged")) {
        showConfirmModal(window.i18nMessages.dashboard.confirmFlagDamaged).then(
          (confirmed) => {
            if (!confirmed) return;
            fetch(`${window.API_BASE_URL}/api/admin/loans/${id}/damaged`, {
              method: "PATCH",
              credentials: "include",
            })
              .then((res) => res.json())
              .then((resp) => {
                if (resp.success) btn.closest("tr").remove();
              })
              .catch((err) => console.error(err));
          },
        );
      }
    });
  }

  // Fetch and render flagged loans for admin
  const flaggedBody = document.getElementById("flagged-loans-body");
  if (flaggedBody) {
    fetch(`${window.API_BASE_URL}/api/admin/loans/flagged`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((result) => {
        flaggedBody.innerHTML = "";
        if (!result.success) {
          const errMsg =
            result.message ||
            window.i18nMessages.dashboard.errorFetchingRequests;
          flaggedBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${errMsg}</td></tr>`;
          return;
        }
        const loans = result.data;
        if (loans.length === 0) {
          flaggedBody.innerHTML = `<tr><td colspan="7" class="text-center">${window.i18nMessages.dashboard.noFlaggedLoans}</td></tr>`;
        } else {
          loans.forEach((loan) => {
            const tr = document.createElement("tr");
            const statusLabel =
              loan.status === "lost"
                ? window.i18nMessages.dashboard.statusLost
                : window.i18nMessages.dashboard.statusDamaged;
            const badgeClass =
              loan.status === "lost" ? "bg-danger" : "bg-warning text-dark";
            tr.innerHTML = `
              <td>${loan.user.name}</td>
              <td>${loan.user.email || loan.user.phoneNumber}</td>
              <td>${loan.book.title}</td>
              <td>${loan.book.author}</td>
              <td>${new Date(loan.requestDate).toLocaleDateString()}</td>
              <td>${loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : "-"}</td>
              <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
            `;
            flaggedBody.appendChild(tr);
          });
        }
      })
      .catch((err) => console.error("Error fetching flagged loans:", err));
  }
});
