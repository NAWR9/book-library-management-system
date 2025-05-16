/**
 * Category Manager Component for the Book Library System
 *
 * Handles selecting and displaying categories with bilingual support
 */

// Make sure the function is globally accessible
window.initializeCategoryManager = function (
  categorySelectId,
  categoriesHiddenId,
  selectedCategoriesContainerId,
) {
  // DOM elements
  const categorySelect = document.getElementById(categorySelectId);
  const categoriesHidden = document.getElementById(categoriesHiddenId);
  const selectedCategoriesContainer = document.getElementById(
    selectedCategoriesContainerId,
  );

  // Selected categories array
  const selectedCategories = [];

  // Fetch available categories from the API
  fetchAvailableCategories();

  // Helper function to display errors
  function showError(message) {
    console.error(message);
  }

  // Fetch available categories from the API
  async function fetchAvailableCategories() {
    try {
      // Request categorized categories for better organization
      const response = await fetch(
        `${window.API_BASE_URL}/api/books/categories?categorized=true`,
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch categories: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (data.success) {
        if (data.categorized && typeof data.data === "object") {
          // Handle categorized categories
          populateCategorizedCategorySelect(data.data);
        } else if (Array.isArray(data.data)) {
          // Handle flat array of categories (backward compatibility)
          populateCategorySelect(data.data);
        } else {
          showError(
            "The server returned invalid category data. Please try again later.",
          );
        }
      } else {
        showError(
          "The server returned invalid category data. Please try again later.",
        );
      }
    } catch (error) {
      showError("Failed to load category options. Please refresh the page.");

      // Add debug information to the category select dropdown
      if (categorySelect) {
        const debugOption = document.createElement("option");
        debugOption.value = "";
        debugOption.textContent = `Error: ${error.message}`;
        debugOption.disabled = true;
        categorySelect.appendChild(debugOption);
      }
    }
  }

  // Get translated category name based on current language and category key
  function getCategoryTranslation(categoryKey) {
    // Get from i18n messages if available
    if (
      window.i18nMessages?.bookCategories &&
      window.i18nMessages.bookCategories[categoryKey]
    ) {
      return window.i18nMessages.bookCategories[categoryKey];
    }

    // Fallback: Make the key more readable
    const fallbackTranslation = categoryKey
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    return fallbackTranslation;
  }

  // Populate category select dropdown
  function populateCategorySelect(categoryKeys) {
    // Clear existing options
    categorySelect.innerHTML = "";

    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent =
      window.i18nMessages?.ui?.selectCategory || "Select a category";
    defaultOption.selected = true;
    defaultOption.disabled = true;
    categorySelect.appendChild(defaultOption);

    // Sort categories alphabetically by their translated names
    const sortedCategoryKeys = [...categoryKeys].sort((a, b) => {
      const aTranslated = getCategoryTranslation(a);
      const bTranslated = getCategoryTranslation(b);
      return aTranslated.localeCompare(bTranslated);
    });

    // Add category options
    for (const categoryKey of sortedCategoryKeys) {
      const option = document.createElement("option");
      option.value = categoryKey;
      option.textContent = getCategoryTranslation(categoryKey);

      // Check if this category is already selected
      if (selectedCategories.includes(categoryKey)) {
        option.disabled = true;
      }

      categorySelect.appendChild(option);
    }

    // Initialize any existing categories if present in the hidden field
    if (categoriesHidden.value) {
      try {
        const existingCategories = JSON.parse(categoriesHidden.value);
        if (
          Array.isArray(existingCategories) &&
          existingCategories.length > 0
        ) {
          // Add each existing category
          existingCategories.forEach((categoryKey) =>
            addCategory(categoryKey, false),
          );
        }
      } catch (error) {
        console.error("Failed to parse existing categories:", error);
      }
    }
  }

  // Populate categorized category select dropdown
  function populateCategorizedCategorySelect(categorizedData) {
    // Clear existing options
    categorySelect.innerHTML = "";

    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent =
      window.i18nMessages?.ui?.selectCategory || "Select a category";
    defaultOption.selected = true;
    defaultOption.disabled = true;
    categorySelect.appendChild(defaultOption); // Process each category group
    Object.keys(categorizedData).forEach((groupKey) => {
      const categoryKeys = categorizedData[groupKey];

      // Create an optgroup for this category group if there are categories in it
      if (Array.isArray(categoryKeys) && categoryKeys.length > 0) {
        // Get group translation - first try from the i18nMessages
        let groupLabel =
          window.i18nMessages?.categoryGroups?.[groupKey] ||
          groupKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

        // Ensure we have the translation from the server-side rendered data
        const renderedGroupLabel = document.querySelector(
          `[data-category-group="${groupKey}"]`,
        );
        if (renderedGroupLabel) {
          groupLabel = renderedGroupLabel.textContent;
        }

        const optGroup = document.createElement("optgroup");
        optGroup.label = groupLabel;

        // Sort categories within this group
        const sortedCategoryKeys = [...categoryKeys].sort((a, b) => {
          const aTranslated = getCategoryTranslation(a);
          const bTranslated = getCategoryTranslation(b);
          return aTranslated.localeCompare(bTranslated);
        });

        // Add options to this group
        for (const categoryKey of sortedCategoryKeys) {
          const option = document.createElement("option");
          option.value = categoryKey;
          option.textContent = getCategoryTranslation(categoryKey);

          // Check if this category is already selected
          if (selectedCategories.includes(categoryKey)) {
            option.disabled = true;
          }

          optGroup.appendChild(option);
        }

        categorySelect.appendChild(optGroup);
      }
    });

    // Initialize any existing categories if present in the hidden field
    if (categoriesHidden.value) {
      try {
        const existingCategories = JSON.parse(categoriesHidden.value);
        if (
          Array.isArray(existingCategories) &&
          existingCategories.length > 0
        ) {
          // Add each existing category
          existingCategories.forEach((categoryKey) =>
            addCategory(categoryKey, false),
          );
        }
      } catch (error) {
        console.error("Failed to parse existing categories:", error);
      }
    }
  }

  // Add a category to the selected categories
  function addCategory(categoryKey, updateSelect = true) {
    // Handle array input (support batch adding categories)
    if (Array.isArray(categoryKey)) {
      let addedCount = 0;
      categoryKey.forEach((key) => {
        if (addCategory(key, updateSelect)) {
          addedCount++;
        }
      });
      return addedCount > 0;
    }

    if (!categoryKey || selectedCategories.includes(categoryKey)) {
      // Prevent adding empty or duplicate categories
      return false;
    }

    // Add to our selected categories array
    selectedCategories.push(categoryKey);

    // Update the hidden field
    categoriesHidden.value = JSON.stringify(selectedCategories);

    // Create a badge for this category in the UI
    const categoryBadge = document.createElement("span");
    categoryBadge.className = "badge bg-primary me-1 mb-1 category-badge";
    categoryBadge.textContent = getCategoryTranslation(categoryKey);
    categoryBadge.dataset.value = categoryKey;

    // Add remove button
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "btn-close ms-1 btn-close-white btn-sm";
    removeButton.setAttribute("aria-label", "Remove");
    removeButton.onclick = function () {
      removeCategory(categoryKey);
      categoryBadge.remove();
    };

    categoryBadge.appendChild(removeButton);
    selectedCategoriesContainer.appendChild(categoryBadge);

    // Update category count badge
    const categoryCountBadge = document.getElementById("category_count");
    if (categoryCountBadge) {
      categoryCountBadge.textContent = selectedCategories.length.toString();
    }

    // Update the dropdown to disable this category option
    if (updateSelect) {
      // Find the option with this value and disable it
      const option = Array.from(categorySelect.querySelectorAll("option")).find(
        (opt) => opt.value === categoryKey,
      );

      if (option) {
        option.disabled = true;
      }

      // Reset the select to the default option
      categorySelect.value = "";
    }

    return true; // Indicate success
  }

  // Remove a category from the selected categories
  function removeCategory(categoryKey) {
    const index = selectedCategories.indexOf(categoryKey);
    if (index !== -1) {
      // Remove from our array
      selectedCategories.splice(index, 1);

      // Update the hidden field
      categoriesHidden.value = JSON.stringify(selectedCategories);

      // Find and enable the option in the select
      const option = Array.from(categorySelect.querySelectorAll("option")).find(
        (opt) => opt.value === categoryKey,
      );

      if (option) {
        option.disabled = false;
      }
    }
  }

  // Handle category selection from the dropdown
  categorySelect.addEventListener("change", function () {
    const selectedValue = categorySelect.value;
    if (selectedValue) {
      addCategory(selectedValue);
    }
  });

  // Helper function to check if a category is selected
  function isCategorySelected(categoryKey) {
    return selectedCategories.includes(categoryKey);
  }

  // Expose public methods for external components to interact with this one
  return {
    addCategory,
    removeCategory,
    isCategorySelected,
    getSelectedCategories: () => [...selectedCategories],
    getCategoryTranslation,

    // Method to get all available category keys
    getAvailableCategoryKeys: function () {
      // Get keys from i18n messages or from the select options
      const i18nKeys = Object.keys(window.i18nMessages?.bookCategories || {});

      if (i18nKeys.length > 0) {
        return i18nKeys;
      }

      // Fallback: extract from select options
      const options = Array.from(categorySelect.querySelectorAll("option"));
      return options
        .filter((opt) => opt.value && opt.value !== "")
        .map((opt) => opt.value);
    },

    // Add method to set selected categories (needed for API integrations)
    setSelectedCategories: function (categoryKeys) {
      if (!categoryKeys || !Array.isArray(categoryKeys)) {
        console.error(
          "Invalid categoryKeys provided to setSelectedCategories:",
          categoryKeys,
        );
        return false;
      }

      try {
        // Reset selected categories
        selectedCategories.length = 0;

        // Re-render all selections (clear the container)
        selectedCategoriesContainer.innerHTML = "";

        // Reset all options in the dropdown to be enabled
        Array.from(categorySelect.querySelectorAll("option"))
          .filter((opt) => opt.value && opt.value !== "")
          .forEach((opt) => {
            opt.disabled = false;
          });

        // Add each category
        const addedCategories = [];
        categoryKeys.forEach((categoryKey) => {
          if (categoryKey && typeof categoryKey === "string") {
            const added = addCategory(categoryKey, false);
            if (added) addedCategories.push(categoryKey);
          }
        });

        // Update the hidden input
        categoriesHidden.value = JSON.stringify(selectedCategories);

        // Update category count badge
        const categoryCountBadge = document.getElementById("category_count");
        if (categoryCountBadge) {
          categoryCountBadge.textContent = selectedCategories.length.toString();
        }

        return true; // Indicate success
      } catch (error) {
        console.error("Error in setSelectedCategories:", error);
        return false;
      }
    },

    // Add method to map Google Books categories
    mapGoogleBooksCategories: async function (categories) {
      if (!categories || !Array.isArray(categories)) return [];

      try {
        // Store the original categories for reference
        window.originalCategories = [...categories];

        // Call the category mapping API endpoint
        const queryString = categories
          .map((c) => `category=${encodeURIComponent(c)}`)
          .join("&");
        const baseUrl = window.API_BASE_URL || "";

        const response = await fetch(
          `${baseUrl}/api/books/map-categories?${queryString}`,
        );

        if (!response.ok) {
          // If API fails, try simple mapping with available categories
          const availableCategories = Object.keys(
            window.i18nMessages?.bookCategories || {},
          );
          if (!availableCategories.length) return [];

          // Simple keyword matching
          const mappedCategories = new Set();
          categories.forEach((category) => {
            const categoryLower = category.toLowerCase();
            availableCategories.forEach((catKey) => {
              const catWords = catKey.replace(/_/g, " ").split(" ");
              // Check if any category words are in the Google Books category
              if (catWords.some((word) => categoryLower.includes(word))) {
                mappedCategories.add(catKey);
              }
            });
          });

          const result = Array.from(mappedCategories);
          return result;
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          // Store mapping results for UI indicators
          window.mappedCategories = [...data.data];

          return data.data;
        }

        return [];
      } catch (error) {
        console.error("Error in mapGoogleBooksCategories:", error);
        return [];
      }
    },
  };
};
