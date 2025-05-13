/* global bootstrap */

document.addEventListener("DOMContentLoaded", () => {
  const bookForm = document.getElementById("bookForm");
  const searchGoogleBtn = document.getElementById("searchGoogleBtn");
  const googleSearchQuery = document.getElementById("googleSearchQuery");
  const searchResults = document.getElementById("searchResults");
  const descriptionEn = document.getElementById("description_en");
  const tagsEnHidden = document.getElementById("tags_en");
  const tagsArHidden = document.getElementById("tags_ar");
  const tagsInputEn = document.getElementById("tags_input_en");
  const tagsInputAr = document.getElementById("tags_input_ar");
  const tagChipsEn = document.getElementById("tag_chips_en");
  const tagChipsAr = document.getElementById("tag_chips_ar");

  // Tag preview elements
  const tagPreviewEn = document.getElementById("tag_preview_en");
  const tagPreviewAr = document.getElementById("tag_preview_ar");
  const tagPreviewEnInAr = document.getElementById("tag_preview_en_in_ar");
  const tagPreviewArInAr = document.getElementById("tag_preview_ar_in_ar");

  const cancelBtn = document.getElementById("cancelBtn");
  const submitBtn = document.getElementById("submitBtn");
  const confirmCancelBtn = document.getElementById("confirmCancelBtn");
  const confirmSubmitBtn = document.getElementById("confirmSubmitBtn");

  const cancelModal = new bootstrap.Modal(
    document.getElementById("cancelConfirmModal"),
  );
  const submitModal = new bootstrap.Modal(
    document.getElementById("submitConfirmModal"),
  );

  const toast = new bootstrap.Toast(document.getElementById("bookFormToast"));
  const toastTitle = document.getElementById("toast-title");
  const toastMessage = document.getElementById("toast-message");

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

    submitModal.show();
  });

  confirmSubmitBtn.addEventListener("click", () => {
    submitModal.hide();
    bookForm.dispatchEvent(new Event("submit"));
  });

  // Add event listeners for auto-translation
  descriptionEn.addEventListener("blur", () => {
    translateToArabic("description");
  });

  // No need to update UI on tab changes as we're now using translation keys in the HTML
  // The labels are now handled by EJS templates with proper internationalization

  // Translations happen automatically when tags are added
  // No buttons needed for manual translation

  // Tag storage for both languages
  const tagsEnCollection = [];
  const tagsArCollection = [];

  function updateTagPreviews() {
    updateTagPreview(tagPreviewEn, tagsEnCollection);
    updateTagPreview(tagPreviewAr, tagsArCollection);
    updateTagPreview(tagPreviewEnInAr, tagsEnCollection);
    updateTagPreview(tagPreviewArInAr, tagsArCollection);
  }

  function updateTagPreview(previewElement, tagsCollection) {
    if (!previewElement) return;

    previewElement.innerHTML = "";

    if (tagsCollection.length === 0) {
      const emptyElement = document.createElement("em");
      emptyElement.className = "text-muted";
      emptyElement.textContent =
        window.i18nMessages?.books?.noTagsAdded || "No tags added";
      previewElement.appendChild(emptyElement);
      return;
    }

    tagsCollection.forEach((tag) => {
      const tagElement = document.createElement("span");
      tagElement.className = "preview-tag";

      if (/[\u0600-\u06FF]/.test(tag)) {
        tagElement.dir = "rtl";
      }

      tagElement.textContent = tag;
      previewElement.appendChild(tagElement);
    });
  }

  setupTagInput(tagsInputEn, tagChipsEn, tagsEnHidden, tagsEnCollection);
  setupTagInput(tagsInputAr, tagChipsAr, tagsArHidden, tagsArCollection);

  // Initialize tag previews
  updateTagPreviews();

  function renderTags(chipsContainer, tagsCollection, hiddenInput) {
    if (!chipsContainer) return;

    chipsContainer.innerHTML = "";
    tagsCollection.forEach((tag, index) => {
      const tagChip = document.createElement("span");
      tagChip.className = "tag-chip";

      const isArabic = /[\u0600-\u06FF]/.test(tag);
      if (isArabic) {
        tagChip.dir = "rtl";
      }

      const tagText = document.createElement("span");
      tagText.className = "tag-chip-text";
      tagText.textContent = tag;

      const removeBtn = document.createElement("span");
      removeBtn.className = "tag-chip-remove";
      removeBtn.innerHTML = "&times;";
      removeBtn.onclick = (e) => {
        e.preventDefault();
        tagsCollection.splice(index, 1);
        renderTags(chipsContainer, tagsCollection, hiddenInput);
        if (hiddenInput) hiddenInput.value = tagsCollection.join(", ");
        updateTagPreviews();
      };

      tagChip.appendChild(tagText);
      tagChip.appendChild(removeBtn);
      chipsContainer.appendChild(tagChip);
    });
  }

  function setupTagInput(
    inputElement,
    chipsContainer,
    hiddenInput,
    tagsCollection,
  ) {
    function updateHiddenInput() {
      hiddenInput.value = tagsCollection.join(", ");
      updateTagPreviews();
    }

    // Function to add a tag
    function addTag(tagValue) {
      tagValue = tagValue.trim();
      if (tagValue && !tagsCollection.includes(tagValue)) {
        tagsCollection.push(tagValue);
        renderTags(chipsContainer, tagsCollection, hiddenInput);
        updateHiddenInput();
        updateTagPreviews();
        inputElement.value = "";
      }
    }

    // Handle keydown events on the input
    inputElement.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(inputElement.value);
      } else if (
        e.key === "Backspace" &&
        inputElement.value === "" &&
        tagsCollection.length > 0
      ) {
        // Remove the last tag when pressing backspace with empty input
        tagsCollection.pop();
        renderTags(chipsContainer, tagsCollection, hiddenInput);
        updateHiddenInput();
        updateTagPreviews();
      }
    });

    // Handle paste events
    inputElement.addEventListener("paste", (e) => {
      e.preventDefault();

      const pastedText = (e.clipboardData || window.clipboardData).getData(
        "text",
      );

      // Check if pasted text contains commas - if so, treat as multiple tags
      if (pastedText.includes(",")) {
        const pastedTags = pastedText.split(",");
        pastedTags.forEach((tag) => {
          if (tag.trim()) addTag(tag);
        });
      } else {
        addTag(inputElement.value + pastedText);
      }
    });

    inputElement.addEventListener("blur", () => {
      addTag(inputElement.value);
    });
  }

  // Handle Google Books search
  const performSearch = async () => {
    const query = googleSearchQuery.value.trim();
    if (!query) return;

    try {
      // Show loading state
      searchResults.innerHTML = `<div class="d-flex justify-content-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>`;

      // Search for books
      const apiKey = window.GOOGLE_BOOKS_API_KEY || "";
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${apiKey}`,
      );

      const data = await response.json();

      if (data.totalItems === 0) {
        searchResults.innerHTML = `<div class="alert alert-info">No books found matching "${query}"</div>`;
        return;
      }

      // Display search results
      displaySearchResults(data.items);
    } catch {
      searchResults.innerHTML = `<div class="alert alert-danger">Error searching for books. Please try again.</div>`;
    }
  };

  searchGoogleBtn.addEventListener("click", performSearch);

  googleSearchQuery.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      performSearch();
    }
  });

  // Display search results
  function displaySearchResults(books) {
    if (!books || books.length === 0) {
      searchResults.innerHTML = `<div class="alert alert-info">No books found</div>`;
      return;
    }

    // Limit to top 5 results
    const topBooks = books.slice(0, 5);

    // Create result cards
    const resultsHtml = topBooks
      .map((book) => {
        const volumeInfo = book.volumeInfo || {};
        const title = volumeInfo.title || "Unknown Title";
        const authors = volumeInfo.authors
          ? volumeInfo.authors.join(", ")
          : "Unknown Author";
        const thumbnail =
          volumeInfo.imageLinks?.thumbnail || "/img/book-cover-placeholder.svg";

        return `
        <div class="card mb-2 google-book-result" data-book-id="${book.id}">
          <div class="card-body">
            <div class="row g-0">
              <div class="col-md-2">
                <img src="${thumbnail}" alt="${title}" class="img-fluid rounded" style="max-height: 100px;">
              </div>
              <div class="col-md-10">
                <h5 class="card-title">${title}</h5>
                <p class="card-text">${authors}</p>
                <button type="button" class="btn btn-sm btn-primary select-book-btn">
                  Select
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      })
      .join("");

    searchResults.innerHTML = `
      <h6>Search Results:</h6>
      ${resultsHtml}
    `;

    document.querySelectorAll(".select-book-btn").forEach((btn, index) => {
      btn.addEventListener("click", () => {
        populateFormWithBookData(topBooks[index]);
      });
    });
  }

  async function populateFormWithBookData(book) {
    const volumeInfo = book.volumeInfo || {};

    document.getElementById("title").value = volumeInfo.title || "";
    document.getElementById("author").value = volumeInfo.authors
      ? volumeInfo.authors[0]
      : "";

    // Set language based on Google Books API data
    if (volumeInfo.language) {
      const lang = volumeInfo.language.toLowerCase();
      if (lang === "ar") {
        document.getElementById("language").value = "arabic";
      } else {
        document.getElementById("language").value = "english"; // Default to English for all other languages
      }
    }

    // Get the description and check if it's Arabic
    const description = volumeInfo.description || "";
    const isDescriptionArabic = isArabicText(description);

    // Place the text in the appropriate field based on detected language
    if (isDescriptionArabic) {
      // If Arabic text, put it directly in the Arabic field
      document.getElementById("description_ar").value = description;
      // Leave English field empty for now, it will be filled by translation
      document.getElementById("description_en").value = "";
    } else {
      // If non-Arabic text, put it in the English field
      document.getElementById("description_en").value = description;
      // The Arabic field will be filled by translation
    }

    document.getElementById("publisher").value = volumeInfo.publisher || "";
    document.getElementById("pageCount").value = volumeInfo.pageCount || "";
    document.getElementById("isbn").value =
      volumeInfo.industryIdentifiers?.find(
        (id) => id.type === "ISBN_13" || id.type === "ISBN_10",
      )?.identifier || "";
    document.getElementById("coverImage").value =
      volumeInfo.imageLinks?.thumbnail || "";

    if (volumeInfo.publishedDate) {
      const date = new Date(volumeInfo.publishedDate);
      if (!isNaN(date.getTime())) {
        document.getElementById("publicationDate").value = date
          .toISOString()
          .split("T")[0];
      }
    }

    if (volumeInfo.categories && volumeInfo.categories.length > 0) {
      // Clear existing tag collections
      tagsEnCollection.length = 0;
      tagsArCollection.length = 0;

      // Clear existing tag chips displays
      const tagChipsEn = document.getElementById("tag_chips_en");
      const tagChipsAr = document.getElementById("tag_chips_ar");
      tagChipsEn.innerHTML = "";
      tagChipsAr.innerHTML = "";

      // Process each category
      volumeInfo.categories.forEach((category) => {
        const individualCategories = category.split(/[/&]/);

        individualCategories.forEach((cat) => {
          const singleCategory = cat.trim();
          if (!singleCategory) return;

          // Check if the tag is in Arabic
          const isArabic = isArabicText(singleCategory);

          if (isArabic) {
            // Add to Arabic collection if not already there
            if (!tagsArCollection.includes(singleCategory)) {
              tagsArCollection.push(singleCategory);
            }
          } else {
            // Add to English collection if not already there
            if (!tagsEnCollection.includes(singleCategory)) {
              tagsEnCollection.push(singleCategory);
            }
          }
        });
      });

      renderTags(tagChipsEn, tagsEnCollection, tagsEnHidden);
      renderTags(tagChipsAr, tagsArCollection, tagsArHidden);

      tagsEnHidden.value = tagsEnCollection.join(", ");
      tagsArHidden.value = tagsArCollection.join(", ");

      renderTags(tagChipsEn, tagsEnCollection, tagsEnHidden);
      renderTags(tagChipsAr, tagsArCollection, tagsArHidden);

      updateTagPreviews();
    }

    showToast("Book Selected", "Book details have been loaded.");

    searchResults.innerHTML = "";
    googleSearchQuery.value = "";

    document
      .getElementById("languageTabs")
      .scrollIntoView({ behavior: "smooth" });

    // Handle specific case for Arabic description that came from Google Books
    const descriptionAr = document
      .getElementById("description_ar")
      .value.trim();
    const descriptionEn = document
      .getElementById("description_en")
      .value.trim();

    if (descriptionAr && !descriptionEn) {
      // We have Arabic content directly from Google Books API
      // Temporarily move Arabic content to English field to trigger proper translation
      document.getElementById("description_en").value = descriptionAr;
      document.getElementById("description_ar").value = "";
    }

    try {
      await translateAllContentToArabic();
    } catch {
      console.error("Translation error");
    }

    // Determine which tab to show first based on detected language
    if (isArabicText(volumeInfo.description || "")) {
      // If original content was Arabic, show Arabic tab first
      document.getElementById("arabic-tab").click();
    } else {
      // Otherwise show English tab
      document.getElementById("english-tab").click();
    }
  }

  async function translateAllContentToArabic() {
    try {
      const descriptionEn = document
        .getElementById("description_en")
        .value.trim();
      const descriptionAr = document
        .getElementById("description_ar")
        .value.trim();

      if (descriptionEn || descriptionAr) {
        if (descriptionAr && !descriptionEn) {
          // If only Arabic description is filled, translate from Arabic to English
          document.getElementById("description_en").value = descriptionAr;
          document.getElementById("description_ar").value = "";

          // Translate from Arabic to English
          await translateToArabic("description");
        } else if (descriptionEn) {
          // If the English description is filled, translate to Arabic
          await translateToArabic("description");
        }
      }

      updateTagPreviews();
    } catch {
      console.log("Translation error");
    }
  }

  // Function to detect if text is in Arabic
  function isArabicText(text) {
    if (!text) return false;

    const arabicPattern =
      /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
    const arabicChars = (text.match(arabicPattern) || []).length;

    if (text.length < 10 && arabicChars > 0) {
      return true;
    }

    return arabicChars / text.length > 0.3;
  }

  async function translateToArabic(contentType) {
    const description_en = document
      .getElementById("description_en")
      .value.trim();
    const tags_en = document.getElementById("tags_en").value.trim();

    if (
      (contentType === "description" && !description_en) ||
      (contentType === "tags" && !tags_en) ||
      (contentType === "both" && !description_en && !tags_en)
    ) {
      return;
    }

    // Keep track of translation attempts to avoid infinite loops
    if (!window.translationAttempts) {
      window.translationAttempts = {};
    }

    // Check if we've tried to translate this content too many times
    const contentKey =
      contentType +
      "_" +
      (contentType === "description"
        ? description_en.substring(0, 20)
        : tags_en.substring(0, 20));
    if (
      window.translationAttempts[contentKey] &&
      window.translationAttempts[contentKey] >= 3
    ) {
      console.log("Too many translation attempts for this content, skipping");
      return;
    }

    // Increment the attempt counter
    window.translationAttempts[contentKey] =
      (window.translationAttempts[contentKey] || 0) + 1;

    try {
      if (
        (contentType === "description" || contentType === "both") &&
        description_en
      ) {
        // Detect if the description is already in Arabic
        const isArabic = isArabicText(description_en);
        const source = isArabic ? "ar" : "en";
        const target = isArabic ? "en" : "ar";

        const descResponse = await fetch(
          `${window.API_BASE_URL}/api/translate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: description_en, source, target }),
          },
        );

        if (descResponse.ok) {
          const data = await descResponse.json();
          if (data.success) {
            // If original was Arabic, update English. Otherwise, update Arabic.
            if (isArabicText(description_en)) {
              // Original was Arabic, so we're updating the English field
              document.getElementById("description_en").value =
                data.translation;
              // Always ensure original text is in Arabic field
              document.getElementById("description_ar").value = description_en;
            } else {
              // Original was English, update Arabic field
              document.getElementById("description_ar").value =
                data.translation;
            }
          }
        } else {
          console.log("Error translating description.");
        }
      }

      if ((contentType === "tags" || contentType === "both") && tags_en) {
        // Only translate from English to Arabic for tags
        const source = "en";
        const target = "ar";

        const tagsResponse = await fetch(
          `${window.API_BASE_URL}/api/translate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: tags_en, source, target }),
          },
        );

        if (tagsResponse.ok) {
          const data = await tagsResponse.json();
          if (data.success) {
            if (isArabicText(tags_en)) {
              document.getElementById("tags_en").value = data.translation;
              document.getElementById("tags_ar").value = tags_en;

              const tagChipsEn = document.getElementById("tag_chips_en");
              tagChipsEn.innerHTML = "";

              tagsEnCollection.length = 0;

              const enTags = data.translation
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag);

              enTags.forEach((tag) => {
                if (!tagsEnCollection.includes(tag)) {
                  tagsEnCollection.push(tag);

                  const tagChip = document.createElement("span");
                  tagChip.className = "tag-chip";

                  const tagText = document.createElement("span");
                  tagText.className = "tag-chip-text";
                  tagText.textContent = tag;

                  const removeBtn = document.createElement("span");
                  removeBtn.className = "tag-chip-remove";
                  removeBtn.onclick = function () {
                    const index = tagsEnCollection.indexOf(tag);
                    if (index !== -1) {
                      tagsEnCollection.splice(index, 1);
                      tagChip.remove();
                      document.getElementById("tags_en").value =
                        tagsEnCollection.join(", ");
                      updateTagPreviews();
                    }
                  };

                  tagChip.appendChild(tagText);
                  tagChip.appendChild(removeBtn);
                  tagChipsEn.appendChild(tagChip);
                }
              });

              const tagChipsAr = document.getElementById("tag_chips_ar");
              tagChipsAr.innerHTML = "";

              tagsArCollection.length = 0;

              const arTags = tags_en
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag);

              arTags.forEach((tag) => {
                if (!tagsArCollection.includes(tag)) {
                  tagsArCollection.push(tag);

                  const tagChip = document.createElement("span");
                  tagChip.className = "tag-chip";

                  const tagText = document.createElement("span");
                  tagText.className = "tag-chip-text";
                  tagText.textContent = tag;

                  const removeBtn = document.createElement("span");
                  removeBtn.className = "tag-chip-remove";
                  removeBtn.innerHTML = "&times;";
                  removeBtn.onclick = function () {
                    const index = tagsArCollection.indexOf(tag);
                    if (index !== -1) {
                      tagsArCollection.splice(index, 1);
                      tagChip.remove();
                      document.getElementById("tags_ar").value =
                        tagsArCollection.join(", ");
                    }
                  };

                  tagChip.appendChild(tagText);
                  tagChip.appendChild(removeBtn);
                  tagChipsAr.appendChild(tagChip);
                }
              });

              updateTagPreviews();
            } else {
              document.getElementById("tags_ar").value = data.translation;

              const tagChipsAr = document.getElementById("tag_chips_ar");
              tagChipsAr.innerHTML = "";

              tagsArCollection.length = 0;

              const arTags = data.translation
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag);

              arTags.forEach((tag) => {
                if (!tagsArCollection.includes(tag)) {
                  tagsArCollection.push(tag);

                  const tagChip = document.createElement("span");
                  tagChip.className = "tag-chip";

                  const tagText = document.createElement("span");
                  tagText.className = "tag-chip-text";
                  tagText.textContent = tag;

                  const removeBtn = document.createElement("span");
                  removeBtn.className = "tag-chip-remove";
                  removeBtn.innerHTML = "&times;";
                  removeBtn.onclick = function () {
                    const index = tagsArCollection.indexOf(tag);
                    if (index !== -1) {
                      tagsArCollection.splice(index, 1);
                      tagChip.remove();
                      document.getElementById("tags_ar").value =
                        tagsArCollection.join(", ");
                    }
                  };

                  tagChip.appendChild(tagText);
                  tagChip.appendChild(removeBtn);
                  tagChipsAr.appendChild(tagChip);
                }
              });

              updateTagPreviews();
            }
          }
        }
      }
    } catch {
      console.error("Translation failed");
    }
  }

  bookForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!bookForm.checkValidity()) {
      e.stopPropagation();
      bookForm.classList.add("was-validated");
      return;
    }

    // Prepare form data
    const formData = {
      title: document.getElementById("title").value.trim(),
      author: document.getElementById("author").value.trim(),
      language: document.getElementById("language").value,
      publicationDate: document.getElementById("publicationDate").value,
      description_en:
        document.getElementById("description_en").value.trim() || null,
      description_ar:
        document.getElementById("description_ar").value.trim() || null,
      publisher: document.getElementById("publisher").value.trim() || null,
      pageCount: document.getElementById("pageCount").value
        ? parseInt(document.getElementById("pageCount").value, 10)
        : null,
      isbn: document.getElementById("isbn").value.trim() || null,
      coverImage: document.getElementById("coverImage").value.trim() || null,
      availability: document.getElementById("availability").checked,
      bookCount: Math.max(
        1,
        parseInt(document.getElementById("bookCount").value, 10) || 1,
      ),
      tags_en: document.getElementById("tags_en").value.trim()
        ? document
            .getElementById("tags_en")
            .value.trim()
            .split(",")
            .map((tag) => tag.trim())
        : [],
      tags_ar: document.getElementById("tags_ar").value.trim()
        ? document
            .getElementById("tags_ar")
            .value.trim()
            .split(",")
            .map((tag) => tag.trim())
        : [],
    };

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Success", "Book added successfully!");

        bookForm.reset();
        bookForm.classList.remove("was-validated");

        tagsEnCollection.length = 0;
        tagsArCollection.length = 0;
        tagChipsEn.innerHTML = "";
        tagChipsAr.innerHTML = "";
        updateTagPreviews();

        setTimeout(() => {
          window.location.href = "/books";
        }, 2000);
      } else {
        showToast(
          "Error",
          data.message || "Failed to add book. Please try again.",
        );
      }
    } catch {
      showToast("Error", "Failed to add book. Please try again.");
    }
  });

  // Helper function to show toast notifications
  function showToast(title, message) {
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    toast.show();
  }
});
