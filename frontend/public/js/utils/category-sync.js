/**
 * Utility functions for synchronizing categories between frontend and backend
 */

// Function to fetch all available categories from the API
async function fetchAllCategories() {
  try {
    const response = await fetch("/api/categories");
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Function to synchronize category translations
async function syncCategoryTranslations() {
  try {
    const response = await fetch("/api/categories/translations");
    if (!response.ok) {
      throw new Error(
        `Failed to sync category translations: ${response.status}`,
      );
    }
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error syncing category translations:", error);
    return false;
  }
}

// Export functions for global use
window.categorySync = {
  fetchAllCategories,
  syncCategoryTranslations,
};
