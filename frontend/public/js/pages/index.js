/**
 * Home page functionality
 */

// Add event listener for when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Ensure icons have proper alignment in RTL mode
  if (document.documentElement.dir === "rtl") {
    document.querySelectorAll(".me-2").forEach((el) => {
      el.classList.replace("me-2", "ms-2");
    });
  }
});
