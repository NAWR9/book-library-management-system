/* global bootstrap */

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

    viewDetailsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const title = card.getAttribute("data-book-title");
      const author = card.getAttribute("data-book-author");
      fetchAndDisplayBookDetails(title, author);
    });

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

      // Display the book details
      displayBookDetails(result.data);
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
