document.addEventListener("DOMContentLoaded", () => {
  const bookForm = document.getElementById("bookForm");
  const submitBtn = document.getElementById("submitBtn");

  // Initialize category manager with preselected categories
  const categoryManager = window.initializeCategoryManager(
    "category_select",
    "categories",
    "selected_categories_container",
  );
  // Use manager to apply preselected categories
  categoryManager.getSelectedCategories();

  // Submit handler
  submitBtn.addEventListener("click", async () => {
    if (!bookForm.checkValidity()) {
      bookForm.classList.add("was-validated");
      return;
    }

    // Prepare data
    const formData = new FormData(bookForm);
    // Extract book ID separately
    const data = Object.fromEntries(formData.entries());
    const bookId = data.id;
    delete data.id;
    // Parse categories array from hidden input
    const categoriesValue = document.getElementById("categories").value || "[]";
    data.categories = JSON.parse(categoriesValue);
    // Convert numbers and boolean
    data.bookCount = parseInt(data.bookCount, 10);
    data.pageCount = data.pageCount ? parseInt(data.pageCount, 10) : null;
    data.availability = bookForm.availability.checked;

    // Call API
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${window.API_BASE_URL}/api/books/${bookId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        },
      );
      const result = await response.json();
      if (result.success) {
        window.location.href = "/books";
      } else {
        alert(result.message || "Failed to update book");
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Error updating book");
    }
  });
});
