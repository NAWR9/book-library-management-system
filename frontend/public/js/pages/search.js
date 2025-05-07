document.addEventListener("DOMContentLoaded", function () {
  const searchForm = document.getElementById("searchForm");
  const searchResults = document.getElementById("searchResults");

  searchForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const author = document.getElementById("author").value.trim();
    const genre = document.getElementById("genre").value;
    const category = document.getElementById("category").value;

    // Build query parameters
    const params = new URLSearchParams();
    if (title) params.append("title", title);
    if (author) params.append("author", author);
    if (genre) params.append("genre", genre);
    if (category) params.append("category", category);

    // Debug log
    console.log("Search params:", Object.fromEntries(params));

    try {
      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      // Debug log
      console.log("Search response:", data);

      if (data.success) {
        displayResults(data.data);
      } else {
        searchResults.innerHTML = '<p class="text-center">No results found</p>';
      }
    } catch (error) {
      console.error("Search error:", error);
      searchResults.innerHTML =
        '<p class="text-center text-danger">Error performing search</p>';
    }
  });

  function displayResults(books) {
    if (!books.length) {
      searchResults.innerHTML =
        '<p class="text-center">No books found matching your search criteria</p>';
      return;
    }

    searchResults.innerHTML = books
      .map(
        (book) => `
            <div class="col">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${book.title}</h5>
                        <p class="card-text">
                            <small class="text-muted">By ${book.author}</small>
                        </p>
                        <p class="card-text">
                            <span class="badge bg-primary">${book.genre}</span>
                            <span class="badge bg-secondary">${book.category}</span>
                        </p>
                        <p class="card-text">${book.description || "No description available"}</p>
                        <p class="card-text">
                            <small class="text-${book.availability ? "success" : "danger"}">
                                ${book.availability ? "Available" : "Not Available"}
                            </small>
                        </p>
                    </div>
                </div>
            </div>
        `,
      )
      .join("");
  }
});
