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

  // Add click event listeners to all book cards
  bookCards.forEach((card) => {
    const viewDetailsBtn = card.querySelector(".view-details-btn");

    viewDetailsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const title = card.getAttribute("data-book-title");
      const author = card.getAttribute("data-book-author");
      fetchAndDisplayBookDetails(title, author);
    });

    card.addEventListener("click", () => {
      const title = card.getAttribute("data-book-title");
      const author = card.getAttribute("data-book-author");
      fetchAndDisplayBookDetails(title, author);
    });
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

      // Fetch book details from our API
      const response = await fetch(
        `${window.API_BASE_URL}/api/book-details?${params}`,
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch book details");
      }

      // Display the book details
      displayBookDetails(data.data);
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
      publisherElement.textContent = bookData.publisher;
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
      categoriesElement.textContent = bookData.categories.join(", ");
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

    hideLoading();
    bookDetailsContent.classList.remove("d-none");
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
