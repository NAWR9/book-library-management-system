/* global bootstrap */
/* global initializeCategoryManager */

document.addEventListener("DOMContentLoaded", () => {
  const bookForm = document.getElementById("bookForm");
  const searchGoogleBtn = document.getElementById("searchGoogleBtn");
  const googleSearchQuery = document.getElementById("googleSearchQuery");
  const searchResults = document.getElementById("searchResults");
  const descriptionEn = document.getElementById("description_en");
  const descriptionAr = document.getElementById("description_ar");

  // For backward compatibility
  const categoriesEnHidden = document.createElement("input");
  categoriesEnHidden.type = "hidden";
  categoriesEnHidden.id = "categories_en";
  categoriesEnHidden.name = "categories_en";
  bookForm.appendChild(categoriesEnHidden);

  const categoriesArHidden = document.createElement("input");
  categoriesArHidden.type = "hidden";
  categoriesArHidden.id = "categories_ar";
  categoriesArHidden.name = "categories_ar";
  bookForm.appendChild(categoriesArHidden);

  // Initialize a single category manager - we use the same categories for both languages
  let categoryManager;
  try {
    categoryManager = initializeCategoryManager(
      "category_select",
      "categories",
      "selected_categories_container",
    );

    // Verify that the category manager was initialized correctly
    if (!categoryManager) {
      console.error(
        "Category manager initialization failed - returned undefined",
      );
    } else if (typeof categoryManager.getSelectedCategories !== "function") {
      console.error(
        "Category manager is missing expected methods:",
        categoryManager,
      );
    }
  } catch (error) {
    console.error("Error initializing category manager:", error);
  }

  // Sync the selected categories to hidden fields when categories change
  function syncCategoriesToHiddenFields() {
    try {
      if (
        !categoryManager ||
        typeof categoryManager.getSelectedCategories !== "function"
      ) {
        console.error(
          "Category manager is not properly initialized for syncing",
        );
        return;
      }

      const selectedCategories = categoryManager.getSelectedCategories();
      if (!Array.isArray(selectedCategories)) {
        console.error(
          "Selected categories is not an array:",
          selectedCategories,
        );
        return;
      }

      const categoriesJson = JSON.stringify(selectedCategories);
      console.log("Syncing categories to hidden fields:", selectedCategories);

      // Update both English and Arabic hidden fields with the same categories
      categoriesEnHidden.value = categoriesJson;
      categoriesArHidden.value = categoriesJson;

      // Update the main categories hidden field
      const mainCategoriesField = document.getElementById("categories");
      if (mainCategoriesField) {
        mainCategoriesField.value = categoriesJson;
      } else {
        console.error("Main categories field not found");
      }
    } catch (error) {
      console.error("Error syncing categories to hidden fields:", error);
    }
  }

  const cancelBtn = document.getElementById("cancelBtn");
  const submitBtn = document.getElementById("submitBtn");
  const confirmCancelBtn = document.getElementById("confirmCancelBtn");
  const confirmSubmitBtn = document.getElementById("confirmSubmitBtn");

  // Setup Bootstrap modals
  const cancelModal = new bootstrap.Modal(
    document.getElementById("cancelConfirmModal"),
  );

  let submitModal;
  if (document.getElementById("submitConfirmModal")) {
    submitModal = new bootstrap.Modal(
      document.getElementById("submitConfirmModal"),
    );
  }

  const bookFormToast = document.getElementById("bookFormToast");
  let toast;
  if (bookFormToast) {
    toast = new bootstrap.Toast(bookFormToast);
  }
  const toastTitle = document.getElementById("toast-title");
  const toastMessage = document.getElementById("toast-message");

  // Form validation and submission
  bookForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!bookForm.checkValidity()) {
      bookForm.classList.add("was-validated");
      return;
    }

    try {
      const formData = new FormData(bookForm);
      const formDataObj = Object.fromEntries(formData.entries());

      // Parse categories as array
      const categoriesValue = document.getElementById("categories").value;
      formDataObj.categories = categoriesValue
        ? JSON.parse(categoriesValue)
        : [];

      // Convert bookCount and pageCount to numbers
      if (formDataObj.bookCount)
        formDataObj.bookCount = parseInt(formDataObj.bookCount, 10);
      if (formDataObj.pageCount)
        formDataObj.pageCount = parseInt(formDataObj.pageCount, 10);

      // Convert availability to boolean
      formDataObj.availability =
        document.getElementById("availability").checked;

      // Remove unnecessary fields
      delete formDataObj.categories_en;
      delete formDataObj.categories_ar;

      const token = localStorage.getItem("token");

      // Make the API request with proper Authorization header
      const response = await fetch(`${window.API_BASE_URL}/api/books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formDataObj),
      });

      const result = await response.json();

      if (result.success) {
        window.location.href = "/books";
      } else {
        showToast("Error", result.message || "Failed to add book");
      }
    } catch (error) {
      console.error("Error adding book:", error);
      showToast(
        "Error",
        error.message || "Failed to add book. Please try again.",
      );
    }
  });

  // Cancel button functionality
  cancelBtn.addEventListener("click", () => {
    const hasData =
      document.getElementById("title").value ||
      document.getElementById("author").value ||
      document.getElementById("description_en").value;

    if (hasData) {
      cancelModal.show();
    } else {
      window.location.href = "/books";
    }
  });

  confirmCancelBtn.addEventListener("click", () => {
    window.location.href = "/books";
  });

  submitBtn.addEventListener("click", () => {
    if (!bookForm.checkValidity()) {
      bookForm.classList.add("was-validated");
      return;
    }

    if (submitModal) {
      submitModal.show();
    } else {
      bookForm.dispatchEvent(new Event("submit"));
    }
  });

  if (confirmSubmitBtn) {
    confirmSubmitBtn.addEventListener("click", () => {
      if (submitModal) submitModal.hide();
      bookForm.dispatchEvent(new Event("submit"));
    });
  }

  // Google Books API Integration
  searchGoogleBtn.addEventListener("click", async () => {
    const query = googleSearchQuery.value.trim();
    if (!query) {
      showToast("Error", "Please enter search text");
      return;
    }

    searchResults.innerHTML =
      '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`,
      );
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        searchResults.innerHTML =
          '<div class="alert alert-warning">No books found</div>';
        return;
      }

      displaySearchResults(data.items);
    } catch (error) {
      console.error("Error fetching books:", error);
      searchResults.innerHTML =
        '<div class="alert alert-danger">Error fetching books</div>';
    }
  });

  function displaySearchResults(books) {
    searchResults.innerHTML = "";

    const resultsList = document.createElement("div");
    resultsList.className = "list-group";

    books.forEach((book) => {
      const bookInfo = book.volumeInfo;
      const resultItem = document.createElement("button");
      resultItem.type = "button";
      resultItem.className = "list-group-item list-group-item-action";

      // Use fallback image if no cover is available
      const coverImg = bookInfo.imageLinks?.thumbnail
        ? `<img src="${bookInfo.imageLinks.thumbnail}" alt="Book Cover" class="img-thumbnail me-4" style="width:80px; margin-right:12px;" onerror="this.src='/img/book-cover-placeholder.svg'">`
        : `<img src="/img/book-cover-placeholder.svg" alt="Book Cover" class="img-thumbnail me-4" style="width:80px; margin-right:12px;">`;

      // Render mapped categories (if any) - show only those that can be mapped to our system
      let categoryBadges = "";
      if (
        Array.isArray(bookInfo.categories) &&
        bookInfo.categories.length > 0
      ) {
        try {
          // Get available category keys
          // First check if categoryManager has the method
          let availableCategoryKeys = [];
          if (
            categoryManager &&
            typeof categoryManager.getSelectedCategories === "function"
          ) {
            // We need to get all available categories from window.i18nMessages
            availableCategoryKeys = Object.keys(
              window.i18nMessages?.bookCategories || {},
            );
          }

          // Map Google categories to our system
          const mappedCategories = availableCategoryKeys.filter(
            (categoryKey) => {
              // Check if any Google category matches this category key
              return bookInfo.categories.some((googleCat) => {
                if (!googleCat) return false;
                const lowerGoogleCat = googleCat.toLowerCase();
                // Get the variations for this category key
                const variations = categoryKey
                  .toLowerCase()
                  .split("_")
                  .join(" ");
                return (
                  lowerGoogleCat.includes(variations) ||
                  variations.includes(lowerGoogleCat)
                );
              });
            },
          );

          // Display mapped categories with proper translations
          if (mappedCategories.length > 0) {
            categoryBadges = mappedCategories
              .map((catKey) => {
                // Get proper translation for the category
                let label = "";
                if (
                  categoryManager &&
                  typeof categoryManager.getCategoryTranslation === "function"
                ) {
                  label = categoryManager.getCategoryTranslation(catKey);
                } else {
                  // Fallback translation
                  label =
                    window.i18nMessages?.bookCategories?.[catKey] ||
                    catKey
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (char) => char.toUpperCase());
                }
                return `<span class="badge bg-info text-dark me-1">${label}</span>`;
              })
              .join("");
          }
        } catch (error) {
          console.error("Error mapping categories:", error);
        }
      }

      resultItem.innerHTML = `
        <div class="d-flex align-items-start">
          <div class="me-3">
            ${coverImg}
          </div>
          <div class="flex-grow-1">
            <h6>${bookInfo.title || window.i18nMessages?.books?.unknownTitle || "Unknown Title"}</h6>
            <p class="mb-1">${bookInfo.authors ? bookInfo.authors.join(", ") : window.i18nMessages?.books?.unknownAuthor || "Unknown Author"}</p>
            <small class="text-muted">${bookInfo.publishedDate || window.i18nMessages?.books?.unknownDate || "Unknown Date"}</small>
            ${bookInfo.publisher ? `<p class="mb-1 small text-muted mt-1">${window.i18nMessages?.books?.publisher || "Publisher"}: ${bookInfo.publisher}</p>` : ""}
            ${
              categoryBadges
                ? `<div class="mt-2">${categoryBadges}</div>`
                : bookInfo.categories && bookInfo.categories.length > 0
                  ? `<div class="mt-2"><small class="text-muted">${window.i18nMessages?.books?.category || "Categories"}: ${bookInfo.categories.join(", ")}</small></div>`
                  : ""
            }
          </div>
        </div>`;

      resultItem.addEventListener("click", () => populateForm(bookInfo));
      resultsList.appendChild(resultItem);
    });

    searchResults.appendChild(resultsList);
  }

  function populateForm(bookData) {
    // Set basic fields
    document.getElementById("title").value = bookData.title || "";
    document.getElementById("author").value = bookData.authors
      ? bookData.authors.join(", ")
      : "";
    document.getElementById("publisher").value = bookData.publisher || "";
    document.getElementById("pageCount").value = bookData.pageCount || "";
    document.getElementById("isbn").value = bookData.industryIdentifiers
      ? bookData.industryIdentifiers[0].identifier
      : "";
    document.getElementById("coverImage").value =
      bookData.imageLinks?.thumbnail || "";

    // Set the publication date
    if (bookData.publishedDate) {
      let dateValue = bookData.publishedDate;
      if (dateValue.length === 4) {
        dateValue += "-01-01"; // Format YYYY to YYYY-01-01
      } else if (dateValue.length === 7) {
        dateValue += "-01"; // Format YYYY-MM to YYYY-MM-01
      }
      document.getElementById("publicationDate").value = dateValue;
    }

    // Set descriptions
    const description = bookData.description || "";

    // Check if the description is in Arabic
    if (description && isArabicText(description)) {
      // If description is in Arabic, put it in Arabic field and translate to English
      descriptionAr.value = description;
      descriptionEn.value = ""; // Clear English field
      translateToEnglish(description).then((translatedText) => {
        descriptionEn.value = translatedText || description;
      });
    } else {
      // If description is in English or unknown, put it in English field
      descriptionEn.value = description;

      // Try to translate the description to Arabic if we have one
      if (description) {
        translateToArabic("description");
      }
    }

    // Set language
    const bookLanguage = bookData.language || "en";
    if (bookLanguage === "ar" || bookLanguage === "arabic") {
      document.getElementById("language").value = "arabic";
    } else {
      document.getElementById("language").value = "english";
    }

    // Handle categories mapping and selection
    if (
      bookData.categories &&
      Array.isArray(bookData.categories) &&
      bookData.categories.length > 0
    ) {
      // First, clear any existing selected categories
      const selectedCategoriesContainer = document.getElementById(
        "selected_categories_container",
      );
      if (selectedCategoriesContainer) {
        selectedCategoriesContainer.innerHTML = "";
      }

      // Get all available category keys from i18n messages
      const availableCategoryKeys = Object.keys(
        window.i18nMessages?.bookCategories || {},
      );
      const mappedCategories = new Set(); // Using a Set to avoid duplicates

      // Map each Google category to our system using multiple matching strategies
      bookData.categories.forEach((googleCat) => {
        if (!googleCat) return;

        const lowerGoogleCat = googleCat.toLowerCase().trim();

        availableCategoryKeys.forEach((categoryKey) => {
          // Enhanced matching logic
          const categoryWords = categoryKey.toLowerCase().split("_");
          const categoryPhrase = categoryWords.join(" ");

          // Various matching approaches
          if (
            lowerGoogleCat === categoryPhrase ||
            lowerGoogleCat.includes(categoryPhrase) ||
            categoryPhrase.includes(lowerGoogleCat) ||
            categoryWords.some(
              (word) => lowerGoogleCat.includes(word) && word.length > 3,
            )
          ) {
            mappedCategories.add(categoryKey);
          }
        });
      });

      // Convert Set to Array
      const mappedCategoryArray = Array.from(mappedCategories);

      // Add the mapped categories to the UI
      if (mappedCategoryArray.length > 0 && categoryManager) {
        mappedCategoryArray.forEach((categoryKey) => {
          if (categoryManager.addCategory) {
            categoryManager.addCategory(categoryKey, true);
          }
        });

        // Update the hidden field
        const categoriesField = document.getElementById("categories");
        if (categoriesField) {
          categoriesField.value = JSON.stringify(mappedCategoryArray);
        }

        // Update all hidden fields to ensure consistency
        syncCategoriesToHiddenFields();
      }
    }
  }

  // Helper to detect if text is primarily in Arabic
  function isArabicText(text) {
    if (!text) return false;
    const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    return arabicChars / text.length > 0.3; // If more than 30% is Arabic, consider it Arabic text
  }

  // Add this helper for English translation
  async function translateToEnglish(text) {
    if (!text) return "";

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text, source: "ar", target: "en" }),
      });

      const data = await response.json();
      if (data.success && !data.translationFailed) {
        return data.translation;
      } else {
        console.warn("Translation failed, using original text");
        return text;
      }
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  }

  // Translation functionality for descriptions
  async function translateToArabic(fieldName) {
    const englishText = document.getElementById(`${fieldName}_en`).value.trim();
    const arabicField = document.getElementById(`${fieldName}_ar`);

    if (!englishText || !arabicField) return;

    // If you have a translation API endpoint, call it here
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: englishText, source: "en", target: "ar" }),
      });

      const data = await response.json();
      if (data.success && !data.translationFailed) {
        arabicField.value = data.translation;
      } else if (data.warning) {
        arabicField.placeholder = data.warning;
      } else {
        arabicField.placeholder = "Manual translation needed";
      }
    } catch (error) {
      console.error("Translation error:", error);
      arabicField.placeholder = "Translation service unavailable";
    }
  }

  // Helper function to display toast messages
  function showToast(title, message) {
    if (toast && toastTitle && toastMessage) {
      // Use translations if available
      const translatedTitle =
        title === "Error" && window.i18nMessages?.common?.error
          ? window.i18nMessages.common.error
          : title;

      // For known error messages, use translations if available
      let translatedMessage = message;
      if (
        message === "Please enter search text" &&
        window.i18nMessages?.books?.searchTextRequired
      ) {
        translatedMessage = window.i18nMessages.books.searchTextRequired;
      } else if (
        message === "Failed to add book" &&
        window.i18nMessages?.books?.failedToAdd
      ) {
        translatedMessage = window.i18nMessages.books.failedToAdd;
      } else if (
        message === "Failed to add book. Please try again." &&
        window.i18nMessages?.books?.failedToAdd &&
        window.i18nMessages?.common?.tryAgain
      ) {
        translatedMessage = `${window.i18nMessages.books.failedToAdd}. ${window.i18nMessages.common.tryAgain}`;
      }

      toastTitle.textContent = translatedTitle;
      toastMessage.textContent = translatedMessage;
      toast.show();
    } else {
      alert(`${title}: ${message}`);
    }
  }
});
