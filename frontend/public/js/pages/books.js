/* global bootstrap */
import { searchBooks } from "../utils/api-client.js";

document.addEventListener("DOMContentLoaded", () => {
  const bookCards = document.querySelectorAll(".book-card");
  const bookDetailsModal = new bootstrap.Modal(
    document.getElementById("bookDetailsModal"),
  );
  const bookDetailsLoading = document.getElementById("bookDetailsLoading");
  const bookDetailsContent = document.getElementById("bookDetailsContent");
  const bookDetailsError = document.getElementById("bookDetailsError");

  const currentLanguage = document.documentElement.lang || "en";

  let currentBookId = null;
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const deleteConfirmModal = new bootstrap.Modal(
    document.getElementById("deleteConfirmModal"),
  );

  // Global delete handler uses currentBookId set by card or modal
  confirmDeleteBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/books/${currentBookId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        deleteConfirmModal.hide();
        window.location.reload();
      } else {
        alert(result.message || window.i18nMessages.books.failedToAdd);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.message || window.i18nMessages.common.tryAgain);
    }
  });

  // Add click event listeners to all book cards (only on the View Details button)
  bookCards.forEach((card) => {
    const viewDetailsBtn = card.querySelector(".view-details-btn");
    const fullDetailsLink = card.querySelector(".full-details-link");

    if (viewDetailsBtn) {
      viewDetailsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const title = card.getAttribute("data-book-title");
        const author = card.getAttribute("data-book-author");
        fetchAndDisplayBookDetails(title, author);
      });
    }

    // Ensure full details link doesn't trigger the modal
    if (fullDetailsLink) {
      fullDetailsLink.addEventListener("click", (e) => {
        e.stopPropagation();
        // The link will handle the navigation naturally
      });
    }

    // Clicking on card anywhere else opens details
    card.addEventListener("click", () => {
      const title = card.getAttribute("data-book-title");
      const author = card.getAttribute("data-book-author");
      fetchAndDisplayBookDetails(title, author);
    });

    // Admin edit book card button
    const editCardBtn = card.querySelector(".edit-book-card-btn");
    if (editCardBtn) {
      editCardBtn.addEventListener("click", (e) => {
        // Prevent card click; let anchor href handle navigation
        e.stopPropagation();
      });
    }
    // Admin delete book card button
    const deleteCardBtn = card.querySelector(".delete-book-card-btn");
    if (deleteCardBtn) {
      deleteCardBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        currentBookId = deleteCardBtn.getAttribute("data-id");
        deleteConfirmModal.show();
      });
    }
  });

  // Inline search in books page
  const booksSearchForm = document.getElementById("booksSearchForm");
  const booksGrid = document.getElementById("booksGrid");
  const booksNoResults = document.getElementById("booksNoResults");
  if (booksSearchForm && booksGrid && booksNoResults) {
    booksSearchForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("booksSearchTitle").value.trim();
      const author = document.getElementById("booksSearchAuthor").value.trim();
      const category = document.getElementById("booksSearchCategory").value;
      try {
        const books = await searchBooks({ title, author, category });
        booksGrid.innerHTML = "";
        if (books.length === 0) {
          booksNoResults.classList.remove("d-none");
        } else {
          booksNoResults.classList.add("d-none");
          books.forEach((book) => {
            const imgSrc =
              book.cover ||
              book.coverImage ||
              "/img/book-cover-placeholder.svg";
            const badges = (book.categories || [])
              .map(
                (cat) =>
                  `<span class="badge bg-secondary me-1">${window.i18nMessages.bookCategories?.[cat] || cat}</span>`,
              )
              .join("");
            const col = document.createElement("div");
            col.className = "col";
            col.innerHTML = `
              <div class="card book-card h-100 shadow-sm" data-book-title="${book.title}" data-book-author="${book.author}">
                <img src="${imgSrc}" class="card-img-top" alt="Book Cover" onerror="this.src='/img/book-cover-placeholder.svg'">
                <div class="card-body position-relative">
                  <h5 class="card-title">${book.title}</h5>
                  <p class="card-text text-muted">${window.i18nMessages.books.by} ${book.author}</p>
                  ${badges ? `<div class="mb-2">${badges}</div>` : ""}
                  <div class="d-flex justify-content-between">
                    <button class="btn btn-sm btn-outline-primary mt-2 view-details-btn">${window.i18nMessages.books.viewDetails}</button>
                    <a href="/books/${book.id || book._id}" class="btn btn-sm btn-primary mt-2 full-details-link" onclick="event.stopPropagation();">${window.i18nMessages.books.fullDetails}</a>
                  </div>
                </div>
              </div>`;
            booksGrid.appendChild(col);
          });
          // Attach event listeners for new cards
          booksGrid.querySelectorAll(".book-card").forEach((card) => {
            const title = card.getAttribute("data-book-title");
            const author = card.getAttribute("data-book-author");
            card.addEventListener("click", () =>
              fetchAndDisplayBookDetails(title, author),
            );
            const btn = card.querySelector(".view-details-btn");
            if (btn)
              btn.addEventListener("click", (ev) => {
                ev.stopPropagation();
                fetchAndDisplayBookDetails(title, author);
              });
          });
        }
      } catch (err) {
        console.error("Books inline search error:", err);
      }
    });
  }

  // Function to fetch and display book details
  const fetchAndDisplayBookDetails = async (title, author) => {
    showLoading();
    bookDetailsModal.show();

    try {
      // Build the query parameters
      const params = new URLSearchParams({
        title,
        author,
        lang: currentLanguage,
      });

      // Fetch book details
      const response = await fetch(
        `${window.API_BASE_URL}/api/book-details?${params}`,
      );
      const result = await response.json();

      if (result.success) {
        displayBookDetails(result.data);
      } else {
        showError(result.message || "Failed to fetch book details");
      }
    } catch (error) {
      console.error("Error fetching book details:", error);
      showError(error.message);
    }
  };

  // Function to display book details in the modal
  const displayBookDetails = (bookData) => {
    // Set the book cover if available
    const coverImg = document.getElementById("bookCover");

    // Initially hide the cover image until we confirm it's valid
    coverImg.classList.add("d-none");

    // Preload the image to check if it exists and is valid
    const img = new Image();

    // Handle book cover - check if coverImage exists first, then fallback to imageLinks
    if (bookData.coverImage) {
      img.src = bookData.coverImage;
    } else if (bookData.imageLinks && bookData.imageLinks.thumbnail) {
      img.src = bookData.imageLinks.thumbnail;
    } else {
      // No image available, use placeholder immediately
      coverImg.src = "/img/book-cover-placeholder.svg";
      coverImg.classList.remove("d-none");
    }

    // Add load and error handlers for the preloaded image
    img.onload = () => {
      coverImg.src = img.src;
      coverImg.classList.remove("d-none");
    };

    img.onerror = () => {
      coverImg.src = "/img/book-cover-placeholder.svg";
      coverImg.classList.remove("d-none");
    };

    document.getElementById("bookTitle").textContent = bookData.title;

    // Set authors - handle both string and array formats
    const authorsElement = document.getElementById("bookAuthors");
    if (Array.isArray(bookData.authors) && bookData.authors.length > 0) {
      authorsElement.textContent = bookData.authors.join(", ");
    } else if (bookData.author) {
      authorsElement.textContent = bookData.author;
    } else {
      authorsElement.textContent = "";
    }

    // Set publisher info
    const publisherElement = document.getElementById("bookPublisher");
    if (bookData.publisher) {
      // Get translations from DOM
      const publisherLabel =
        document.querySelector('strong[data-i18n="books.publisher"]')
          ?.textContent || "Publisher";
      publisherElement.textContent = `${publisherLabel}: ${bookData.publisher}`;
      publisherElement.classList.remove("d-none");
    } else {
      publisherElement.classList.add("d-none");
    }

    // Set description based on language
    const descriptionElement = document.getElementById("bookDescription");

    // Get appropriate description based on current language
    const description = bookData.description;

    if (description) {
      descriptionElement.innerHTML = description;
    } else {
      descriptionElement.textContent =
        document.documentElement.lang === "ar"
          ? "لا يوجد وصف متاح."
          : "No description available.";
    }

    const publishedDate = bookData.publishedDate || bookData.publicationDate;
    const publishedDateElement = document.getElementById("bookPublishedDate");

    if (publishedDate) {
      try {
        const date = new Date(publishedDate);
        publishedDateElement.textContent = date.toLocaleDateString();
      } catch {
        publishedDateElement.textContent = publishedDate;
      }
    } else {
      publishedDateElement.textContent = "-";
    }

    document.getElementById("bookPageCount").textContent =
      bookData.pageCount || "-";

    const categoriesElement = document.getElementById("bookCategories");
    if (bookData.categories && bookData.categories.length > 0) {
      // Map keys to translations
      const translated = bookData.categories.map((key) => {
        return (
          window.i18nMessages?.bookCategories?.[key] ||
          key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
        );
      });
      categoriesElement.textContent = translated.join(", ");
    } else if (bookData.genre || bookData.category) {
      categoriesElement.textContent = bookData.genre || bookData.category;
    } else {
      categoriesElement.textContent = "-";
    }

    const isbnElement = document.getElementById("bookIsbn");
    if (bookData.isbn) {
      isbnElement.textContent = bookData.isbn;
    } else if (
      bookData.industryIdentifiers &&
      bookData.industryIdentifiers.length > 0
    ) {
      const isbn = bookData.industryIdentifiers.find(
        (id) => id.type === "ISBN_13" || id.type === "ISBN_10",
      );
      isbnElement.textContent = isbn ? isbn.identifier : "-";
    } else {
      isbnElement.textContent = "-";
    }

    // Track current book id for deletion
    currentBookId = bookData._id;

    hideLoading();
    bookDetailsContent.classList.remove("d-none");

    // Admin Edit button handler
    const editBtn = document.getElementById("editBookBtn");
    if (editBtn) {
      editBtn.onclick = () => {
        // Redirect to edit page for this book
        window.location.href = `/books/${bookData._id}/edit?lang=${currentLanguage}`;
      };
    }
  };

  // Helper function to show loading state
  const showLoading = () => {
    bookDetailsLoading.classList.remove("d-none");
    bookDetailsContent.classList.add("d-none");
    bookDetailsError.classList.add("d-none");
  };

  // Helper function to hide loading state
  const hideLoading = () => {
    bookDetailsLoading.classList.add("d-none");
  };

  // Helper function to show error message
  const showError = (message) => {
    hideLoading();
    bookDetailsContent.classList.add("d-none");
    bookDetailsError.classList.remove("d-none");
    bookDetailsError.textContent = message;
  };

  // Reset modal content when hidden
  document
    .getElementById("bookDetailsModal")
    .addEventListener("hidden.bs.modal", () => {
      bookDetailsContent.classList.add("d-none");
      bookDetailsError.classList.add("d-none");
    });
});

// Toggle Smart Search box
// window.toggleSmartSearchBox = function () {
//   const box = document.getElementById("smartSearchBox");
//   box.style.display =
//     box.style.display === "none" || !box.style.display ? "block" : "none";
// };

window.hideSmartSearchBox = function () {
  document.getElementById("smartSearchBox").style.display = "none";
  document.getElementById("smartSearchFloatBtn").style.display = "none";
};

window.toggleSmartSearchBoxInFooter = function () {
  const box = document.getElementById("smartSearchFooterBox");
  box.style.display =
    box.style.display === "none" || !box.style.display ? "block" : "none";
};

window.hideSmartSearchFooterBox = function () {
  document.getElementById("smartSearchFooterBox").style.display = "none";
};

// Smart Search question handler
function typeChatResponse(container, words, delay = 60) {
  container.innerHTML = ""; // Clear previous content
  let i = 0;
  function typeNext() {
    if (i < words.length) {
      const span = document.createElement("span");
      span.textContent = (i === 0 ? "" : " ") + words[i];
      span.style.opacity = 0;
      span.style.transition = "opacity 0.3s";
      container.appendChild(span);
      setTimeout(() => {
        span.style.opacity = 1;
      }, 10);
      i++;
      setTimeout(typeNext, delay);
    }
  }
  typeNext();
}

window.askSmartQuestion = async function (type) {
  const { title } = window.smartSearchSelectedBook;
  const responseDiv = document.getElementById("smartSearchResponse");
  if (!title) {
    responseDiv.innerHTML = `<div class="chat-bubble bg-danger text-white">Please select a book first.</div>`;
    return;
  }

  responseDiv.innerHTML = `<div class="chat-bubble bg-light text-muted">Loading...</div>`;

  try {
    const res = await fetch(
      `/api/smart-search?question=${encodeURIComponent(type)}&title=${encodeURIComponent(title)}`,
    );
    const data = await res.json();
    if (data.success) {
      responseDiv.innerHTML = `<div class="chat-bubble"></div>`;
      const bubble = responseDiv.querySelector(".chat-bubble");
      typeChatResponse(bubble, data.answer, 60); // 60ms per word
    } else {
      responseDiv.innerHTML = `<div class="chat-bubble bg-warning text-dark">${data.answer.join(" ")}</div>`;
    }
  } catch {
    responseDiv.innerHTML = `<div class="chat-bubble bg-danger text-white">Error fetching answer.</div>`;
  }
};

window.askSmartQuestion = async function (
  type,
  responseContainerId = "smartSearchFooterResponse",
) {
  const { title, author } = window.smartSearchSelectedBook;
  const responseDiv = document.getElementById(responseContainerId);
  if (!title) {
    responseDiv.innerHTML = `<div class="chat-bubble bg-danger text-white">Please select a book first.</div>`;
    return;
  }

  responseDiv.innerHTML = `<div class="chat-bubble bg-light text-muted">Loading...</div>`;

  try {
    const res = await fetch(
      `/api/smart-search?question=${encodeURIComponent(type)}&title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`,
    );
    const data = await res.json();
    if (data.success) {
      responseDiv.innerHTML = `<div class="chat-bubble"></div>`;
      const bubble = responseDiv.querySelector(".chat-bubble");
      typeChatResponse(bubble, data.answer, 60); // 60ms per word
    } else {
      responseDiv.innerHTML = `<div class="chat-bubble bg-warning text-dark">${Array.isArray(data.answer) ? data.answer.join(" ") : data.answer}</div>`;
    }
  } catch {
    responseDiv.innerHTML = `<div class="chat-bubble bg-danger text-white">Error fetching answer.</div>`;
  }
};

document.addEventListener("DOMContentLoaded", function () {
  // Track the currently selected book for Smart Search
  window.smartSearchSelectedBook = { title: "", author: "" };

  // Delegate click event for dynamically rendered cards (search page)
  document.body.addEventListener("click", function (e) {
    const card = e.target.closest(".book-card");
    if (card) {
      window.smartSearchSelectedBook.title =
        card.getAttribute("data-book-title");
      window.smartSearchSelectedBook.author =
        card.getAttribute("data-book-author");
      // document.getElementById("smartSearchFloatBtn").style.display = "block";
      // document.getElementById("smartSearchBox").style.display = "none";
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  // Select all book cards
  document.querySelectorAll(".book-card").forEach(function (card) {
    card.addEventListener("click", function () {
      // Get book info from data attributes
      const title = card.getAttribute("data-book-title");
      const author = card.getAttribute("data-book-author");
      // Save selected book globally
      window.smartSearchSelectedBook = { title, author };
      // Show the Smart Search floating button
      // document.getElementById("smartSearchFloatBtn").style.display = "block";
      // // Hide the Smart Search box if open
      // document.getElementById("smartSearchBox").style.display = "none";
    });
  });
});

document.querySelectorAll(".view-details-btn").forEach(function (btn) {
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    const card = btn.closest(".book-card");
    const title = card.getAttribute("data-book-title");
    const author = card.getAttribute("data-book-author");
    window.smartSearchSelectedBook = { title, author };
    // document.getElementById("smartSearchFloatBtn").style.display = "block";
    // document.getElementById("smartSearchBox").style.display = "none";
  });
});

document
  .getElementById("bookDetailsModal")
  .addEventListener("hidden.bs.modal", () => {
    document.getElementById("smartSearchFloatBtn").style.display = "none";
    document.getElementById("smartSearchBox").style.display = "none";
  });

document
  .getElementById("bookDetailsModal")
  .addEventListener("hidden.bs.modal", () => {
    // Move focus to a safe element outside the modal
    document.body.focus();
    // Optionally, also hide Smart Search box if open
    document.getElementById("smartSearchBox").style.display = "none";
  });

window.openSmartSearchModal = function (title, author) {
  window.smartSearchSelectedBook = { title, author };
  document.getElementById("smartSearchBox").style.display = "block";
};

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".book-card").forEach(function (card) {
    card.addEventListener("click", function () {
      // Remove 'active' from all cards
      document
        .querySelectorAll(".book-card")
        .forEach((c) => c.classList.remove("active"));
      // Add 'active' to this card
      card.classList.add("active");
      // Set the selected book for Smart Search
      const title = card.getAttribute("data-book-title");
      const author = card.getAttribute("data-book-author");
      window.smartSearchSelectedBook = { title, author };
    });
  });

  // Hide Smart Search icon when clicking outside any card
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".book-card")) {
      document
        .querySelectorAll(".book-card")
        .forEach((c) => c.classList.remove("active"));
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".book-card").forEach(function (card) {
    card.addEventListener("click", function () {
      document
        .querySelectorAll(".book-card")
        .forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      const title = card.getAttribute("data-book-title");
      const author = card.getAttribute("data-book-author");
      window.smartSearchSelectedBook = { title, author };
    });
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".book-card")) {
      document
        .querySelectorAll(".book-card")
        .forEach((c) => c.classList.remove("active"));
    }
  });
});

document
  .getElementById("bookDetailsModal")
  .addEventListener("hidden.bs.modal", () => {
    document.getElementById("smartSearchFooterBox").style.display = "none";
  });

document
  .getElementById("bookDetailsModal")
  .addEventListener("hidden.bs.modal", () => {
    const smartBox = document.getElementById("smartSearchFooterBox");
    if (smartBox) smartBox.style.display = "none";
  });
