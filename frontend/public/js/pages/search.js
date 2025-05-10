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
        `
      )
      .join("");

    // Add floating smart search button if not already present
    if (!document.querySelector('.smart-search-float')) {
      addSmartSearchButton();
    }
  }

  function addSmartSearchButton() {
    const floatingButton = document.createElement('div');
    floatingButton.className = 'smart-search-float';
    floatingButton.innerHTML = '<i class="fas fa-brain"></i>';
    floatingButton.onclick = showSmartSearchModal;
    document.body.appendChild(floatingButton);

    const modal = document.createElement('div');
    modal.className = 'smart-search-modal';
    modal.innerHTML = `
      <h5>Smart Search</h5>
      <div class="d-grid gap-2">
        <button class="btn btn-outline-primary btn-sm" onclick="askQuestion('about')">
          What's this book about?
        </button>
        <button class="btn btn-outline-info btn-sm" onclick="askQuestion('author')">
          Who's the author?
        </button>
        <button class="btn btn-outline-secondary btn-sm" onclick="askQuestion('similar')">
          Similar books?
        </button>
      </div>
      <div id="smart-answer" class="mt-3 typing-effect"></div>
    `;
    document.body.appendChild(modal);
  }

  window.showSmartSearchModal = function() {
    const modal = document.querySelector('.smart-search-modal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
  }

  window.askQuestion = async function(questionType) {
    const answerDiv = document.getElementById('smart-answer');
    answerDiv.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';

    try {
      // Assume you have a way to get the current book title (e.g., from selection or context)
      const bookTitle = "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow";
      const response = await fetch(`/api/smart-search?question=${encodeURIComponent(questionType)}&title=${encodeURIComponent(bookTitle)}`);
      const data = await response.json();

      if (data.success) {
        answerDiv.innerHTML = '';
        displayWordsSequentially(data.answer, answerDiv);
      } else {
        throw new Error(data.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Smart search error:', error);
      answerDiv.innerHTML = `
        <div class="alert alert-danger">
          <strong>Error:</strong> ${error.message}
        </div>`;
    }
  }

  function displayWordsSequentially(words, container) {
    container.innerHTML = '';
    words.forEach((word, index) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.textContent = word + ' ';
      container.appendChild(span);
      
      setTimeout(() => {
        span.classList.add('visible');
      }, index * 100);
    });
  }
});