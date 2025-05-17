import { searchBooks } from "../utils/api-client.js";

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
      document.getElementById("smartSearchFloatBtn").style.display = "block";
      document.getElementById("smartSearchBox").style.display = "none";
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
};

// Smart Search question handler
function typeChatResponse(container, words, delay = 60) {
  container.innerHTML = ""; // Clear previous content
  let i = 0;
  function typeNext() {
    if (i < words.length) {
      container.innerHTML += (i === 0 ? "" : " ") + words[i];
      i++;
      setTimeout(typeNext, delay);
    }
  }
  typeNext();
}

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
