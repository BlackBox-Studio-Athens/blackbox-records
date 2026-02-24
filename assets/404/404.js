(function () {
  function getRequestedPathLabel() {
    var path = window.location.pathname || "/";
    var query = window.location.search || "";
    return path + query;
  }

  var requestedPath = document.getElementById("requested-path");
  if (requestedPath && typeof window.location === "object") {
    requestedPath.textContent = getRequestedPathLabel();
  }

  var homeLink = document.getElementById("home-link");
  var homeUrl = homeLink ? homeLink.getAttribute("href") : "/";

  var backLink = document.getElementById("back-link");
  if (backLink) {
    backLink.addEventListener("click", function () {
      if (window.history.length > 1) {
        window.history.back();
        return;
      }

      window.location.href = homeUrl || "/";
    });
  }
})();
