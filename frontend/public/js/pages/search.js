import { searchBooks } from "../utils/api-client.js";

// Only define typeChatResponse once at the top level
function typeChatResponse(container, words, delay = 60) {
  container.innerHTML = "";
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

document.addEventListener("DOMContentLoaded", function () {
  const searchForm = document.getElementById("searchForm");
  const searchResults = document.getElementById("searchResults");

  searchForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const author = document.getElementById("author").value.trim();
    const genre = document.getElementById("genre").value;
    const category = document.getElementById("category").value;

    // Create search criteria object
    const searchCriteria = {
      title,
      author,
      genre,
      category,
    };

    // Debug log
    console.log("Search criteria:", searchCriteria);

    try {
      const books = await searchBooks(searchCriteria);

      // Debug log
      console.log("Search results:", books);

      displayResults(books);
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
          <div class="card book-card h-100 shadow-sm"
               data-book-title="${book.title}"
               data-book-author="${book.author}">
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

    document.querySelectorAll(".book-card").forEach(function(card) {
      card.addEventListener("click", function () {
        document.querySelectorAll(".book-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        const title = card.getAttribute("data-book-title");
        const author = card.getAttribute("data-book-author");
        window.smartSearchSelectedBook = { title, author };
        fetchAndDisplayBookDetails(title, author);
      });
    });

    document.addEventListener("click", function(e) {
      if (!e.target.closest(".book-card")) {
        document.querySelectorAll(".book-card").forEach(c => c.classList.remove("active"));
      }
    });
  }

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

  // Delegate click event for dynamically rendered cards
  document.body.addEventListener("click", function (e) {
    const card = e.target.closest(".book-card");
    if (card && card.parentElement.parentElement.id === "searchResults") {
      // Remove 'active' from all cards
      document.querySelectorAll("#searchResults .book-card").forEach(c => c.classList.remove("active"));
      // Add 'active' to this card
      card.classList.add("active");
      // Set the selected book for Smart Search
      const title = card.getAttribute("data-book-title");
      const author = card.getAttribute("data-book-author");
      window.smartSearchSelectedBook = { title, author };
    }
  });

  // Hide Smart Search icon when clicking outside any card
  document.addEventListener("click", function(e) {
    if (!e.target.closest(".book-card")) {
      document.querySelectorAll("#searchResults .book-card").forEach(c => c.classList.remove("active"));
    }
  });

  // View Details button logic (open modal)
  document.body.addEventListener("click", function (e) {
    if (e.target.classList.contains("view-details-btn")) {
      e.stopPropagation();
      const card = e.target.closest(".book-card");
      const title = card.getAttribute("data-book-title");
      const author = card.getAttribute("data-book-author");
      fetchAndDisplayBookDetails(title, author); // You should implement this function as in books.js
    }
  });

  document.querySelectorAll(".book-card").forEach(function(card) {
    card.addEventListener("click", function () {
      document.querySelectorAll(".book-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      const title = card.getAttribute("data-book-title");
      const author = card.getAttribute("data-book-author");
      window.smartSearchSelectedBook = { title, author };
    });
  });

  document.addEventListener("click", function(e) {
    if (!e.target.closest(".book-card")) {
      document.querySelectorAll(".book-card").forEach(c => c.classList.remove("active"));
    }
  });

  // Delegate click event for dynamically rendered cards
  document.getElementById("searchResults").addEventListener("click", function (e) {
    const card = e.target.closest(".book-card");
    if (card) {
      document.querySelectorAll("#searchResults .book-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      const title = card.getAttribute("data-book-title");
      const author = card.getAttribute("data-book-author");
      window.smartSearchSelectedBook = { title, author };
    }
  });

  // Hide Smart Search icon when clicking outside any card
  document.addEventListener("click", function(e) {
    if (!e.target.closest(".book-card")) {
      document.querySelectorAll("#searchResults .book-card").forEach(c => c.classList.remove("active"));
    }
  });

  document.querySelectorAll(".book-card").forEach(function(card) {
    card.addEventListener("click", function () {
      // Remove 'active' from all cards
      document.querySelectorAll(".book-card").forEach(c => c.classList.remove("active"));
      // Add 'active' to this card
      card.classList.add("active");
      // Set the selected book for Smart Search
      const title = card.getAttribute("data-book-title");
      const author = card.getAttribute("data-book-author");
      window.smartSearchSelectedBook = { title, author };
    });
  });

  // Hide Smart Search icon when clicking outside any card
  document.addEventListener("click", function(e) {
    if (!e.target.closest(".book-card")) {
      document.querySelectorAll(".book-card").forEach(c => c.classList.remove("active"));
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".book-card").forEach(function(card) {
    card.addEventListener("click", function () {
      document.querySelectorAll(".book-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      const title = card.getAttribute("data-book-title");
      const author = card.getAttribute("data-book-author");
      window.smartSearchSelectedBook = { title, author };
    });
  });

  // Hide Smart Search icon when clicking outside any card
  document.addEventListener("click", function(e) {
    if (!e.target.closest(".book-card")) {
      document.querySelectorAll(".book-card").forEach(c => c.classList.remove("active"));
    }
  });
});

// Toggle Smart Search box
window.toggleSmartSearchBox = function () {
  const box = document.getElementById("smartSearchBox");
  box.style.display =
    box.style.display === "none" || !box.style.display ? "block" : "none";
};

window.hideSmartSearchBox = function () {
  document.getElementById("smartSearchBox").style.display = "none";
  document.getElementById("smartSearchFloatBtn").style.display = "none";
};

// Smart Search question handler
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

window.openSmartSearchModal = function(title, author) {
  window.smartSearchSelectedBook = { title, author };
  document.getElementById("smartSearchBox").style.display = "block";
  // Optionally, position the box near the card or keep it floating
};

// Fetch and display book details in modal (reuse from books.js)
async function fetchAndDisplayBookDetails(title, author) {
  const bookDetailsModal = new bootstrap.Modal(document.getElementById("bookDetailsModal"));
  const bookDetailsLoading = document.getElementById("bookDetailsLoading");
  const bookDetailsContent = document.getElementById("bookDetailsContent");
  const bookDetailsError = document.getElementById("bookDetailsError");

  bookDetailsLoading.classList.remove("d-none");
  bookDetailsContent.classList.add("d-none");
  bookDetailsError.classList.add("d-none");
  bookDetailsModal.show();

  try {
    const params = new URLSearchParams({ title, author, lang: document.documentElement.lang || "en" });
    const response = await fetch(`/api/book-details?${params}`);
    const result = await response.json();

    if (result.success) {
      // You need to implement displayBookDetails to fill modal content
      displayBookDetails(result.data);
      bookDetailsLoading.classList.add("d-none");
      bookDetailsContent.classList.remove("d-none");
    } else {
      bookDetailsLoading.classList.add("d-none");
      bookDetailsError.classList.remove("d-none");
      bookDetailsError.textContent = result.message || "Failed to fetch book details";
    }
  } catch (error) {
    bookDetailsLoading.classList.add("d-none");
    bookDetailsError.classList.remove("d-none");
    bookDetailsError.textContent = error.message;
  }
}

function displayBookDetails(bookData) {
  // Set the book cover if available
  const coverImg = document.getElementById("bookCover");
  coverImg.classList.add("d-none");
  if (bookData.cover || bookData.coverImage) {
    coverImg.src = bookData.cover || bookData.coverImage;
    coverImg.classList.remove("d-none");
  } else {
    coverImg.src = "/img/book-cover-placeholder.svg";
    coverImg.classList.remove("d-none");
  }

  // Set title
  document.getElementById("bookTitle").textContent = bookData.title || "-";

  // Set authors
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
    publisherElement.textContent = `Publisher: ${bookData.publisher}`;
    publisherElement.classList.remove("d-none");
  } else {
    publisherElement.classList.add("d-none");
  }

  // Set description
  const descriptionElement = document.getElementById("bookDescription");
  const description = bookData.description;
  if (description) {
    descriptionElement.innerHTML = description;
  } else {
    descriptionElement.textContent =
      document.documentElement.lang === "ar"
        ? "لا يوجد وصف متاح."
        : "No description available.";
  }

  // Set publication date
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

  // Set page count
  document.getElementById("bookPageCount").textContent =
    bookData.pageCount || "-";

  // Set categories/genre
  const categoriesElement = document.getElementById("bookCategories");
  if (bookData.categories && bookData.categories.length > 0) {
    categoriesElement.textContent = bookData.categories.join(", ");
  } else if (bookData.genre || bookData.category) {
    categoriesElement.textContent = bookData.genre || bookData.category;
  } else {
    categoriesElement.textContent = "-";
  }

  // Set ISBN
  const isbnElement = document.getElementById("bookIsbn");
  if (bookData.isbn) {
    isbnElement.textContent = bookData.isbn;
  } else if (
    bookData.industryIdentifiers &&
    bookData.industryIdentifiers.length > 0
  ) {
    const isbn = bookData.industryIdentifiers.find(
      (id) => id.type === "ISBN_13" || id.type === "ISBN_10"
    );
    isbnElement.textContent = isbn ? isbn.identifier : "-";
  } else {
    isbnElement.textContent = "-";
  }

  // Hide loading, show content
  document.getElementById("bookDetailsLoading").classList.add("d-none");
  document.getElementById("bookDetailsContent").classList.remove("d-none");
}

document.querySelectorAll(".book-card").forEach(function(card) {
  card.addEventListener("click", function () {
    document.querySelectorAll(".book-card").forEach(c => c.classList.remove("active"));
    card.classList.add("active");
    // ...set smartSearchSelectedBook, etc...
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".book-card").forEach(function(card) {
    card.addEventListener("click", function () {
      // Remove 'active' from all cards
      document.querySelectorAll(".book-card").forEach(c => c.classList.remove("active"));
      // Add 'active' to this card
      card.classList.add("active");
      // Set the selected book for Smart Search
      const title = card.getAttribute("data-book-title");
      const author = card.getAttribute("data-book-author");
      window.smartSearchSelectedBook = { title, author };
    });
  });

  // Hide Smart Search icon when clicking outside any card
  document.addEventListener("click", function(e) {
    if (!e.target.closest(".book-card")) {
      document.querySelectorAll(".book-card").forEach(c => c.classList.remove("active"));
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  // Card click handler
  document.querySelector("#searchResults").addEventListener("click", function(e) {
    const card = e.target.closest(".book-card");
    if (card) {
      // Remove active class from all cards
      document.querySelectorAll(".book-card").forEach(c => {
        c.classList.remove("active");
        // Hide all smart search boxes
        const searchBox = c.querySelector(".smart-search-box");
        if (searchBox) searchBox.style.display = "none";
      });
      
      // Add active class to clicked card
      card.classList.add("active");
      
      const title = card.getAttribute("data-book-title");
      const author = card.getAttribute("data-book-author");
      window.smartSearchSelectedBook = { title, author };
    }
  });

  // Hide smart search when clicking outside
  document.addEventListener("click", function(e) {
    if (!e.target.closest(".book-card")) {
      document.querySelectorAll(".book-card").forEach(c => {
        c.classList.remove("active");
        const searchBox = c.querySelector(".smart-search-box");
        if (searchBox) searchBox.style.display = "none";
      });
    }
  });
});

// Add this function to handle closing the Smart Search box
window.hideSmartSearchFooterBox = function() {
    const box = document.getElementById("smartSearchFooterBox");
    if (box) {
        box.style.display = "none";
    }
};

// Toggle Smart Search box
window.toggleSmartSearchBoxInFooter = function() {
  const box = document.getElementById("smartSearchFooterBox");
  box.style.display = box.style.display === "none" || !box.style.display ? "block" : "none";
};

// Hide Smart Search box
window.hideSmartSearchBox = function(closeBtn) {
  const searchBox = closeBtn.closest(".smart-search-box");
  searchBox.style.display = "none";
};

// Ask Smart Search question
window.askSmartQuestion = async function(type, responseContainerId = "smartSearchFooterResponse") {
  const { title} = window.smartSearchSelectedBook;
  const responseDiv = document.getElementById(responseContainerId);
  if (!title) {
    responseDiv.innerHTML = `<div class="chat-bubble bg-danger text-white">Please select a book first.</div>`;
    return;
  }

  responseDiv.innerHTML = `<div class="chat-bubble bg-light text-muted">Loading...</div>`;

  try {
    const res = await fetch(
      `/api/smart-search?question=${encodeURIComponent(type)}&title=${encodeURIComponent(title)}`
    );
    const data = await res.json();
    
    if (data.success) {
      responseDiv.innerHTML = `<div class="chat-bubble"></div>`;
      const bubble = responseDiv.querySelector(".chat-bubble");
      typeChatResponse(bubble, data.answer, 60);
    } else {
      responseDiv.innerHTML = `<div class="chat-bubble bg-warning text-dark">${data.answer.join(" ")}</div>`;
    }
  } catch {
    responseDiv.innerHTML = `<div class="chat-bubble bg-danger text-white">Error fetching answer.</div>`;
  }
};
