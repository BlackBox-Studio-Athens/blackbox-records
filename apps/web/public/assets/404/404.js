(function () {
  function getRequestedPathLabel() {
    const path = window.location.pathname || '/';
    const query = window.location.search || '';
    return path + query;
  }

  const requestedPath = document.getElementById('requested-path');
  if (requestedPath && typeof window.location === 'object') {
    requestedPath.textContent = getRequestedPathLabel();
  }

  const homeLink = document.getElementById('home-link');
  const homeUrl = homeLink ? homeLink.getAttribute('href') : '/';

  const backLink = document.getElementById('back-link');
  if (backLink) {
    backLink.addEventListener('click', function () {
      if (window.history.length > 1) {
        window.history.back();
        return;
      }

      window.location.href = homeUrl || '/';
    });
  }
})();
