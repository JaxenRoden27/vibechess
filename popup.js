
document.addEventListener("DOMContentLoaded", () => {
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", () => {
      // Open the chess game in fullscreen mode
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      }
      // Optionally, show/hide chess game UI here
    });
  }
});
