function includeHTML(id, file) {
    fetch(file)
      .then(response => {
        if (!response.ok) throw new Error("Network error");
        return response.text();
      })
      .then(data => {
        document.getElementById(id).innerHTML = data;
      })
      .catch(error => {
        console.error("Error loading include:", file, error);
      });
  }
  
  // Call this after DOM loads
  document.addEventListener("DOMContentLoaded", () => {
    // Navbar
    if (document.getElementById("navbar")) {
      includeHTML("navbar", "../partials/navbar.html");
    }
    // Footer
    if (document.getElementById("footer")) {
      includeHTML("footer", "../partials/footer.html");
    }
  });
  