// Function to extract track metadata from JioSaavn DOM or MediaSession
function getPlayingTrackInfo() {
  // Method 1: Check browser native MediaSession metadata
  if (navigator.mediaSession?.metadata?.title) {
    return {
      title: navigator.mediaSession.metadata.title,
      artist: navigator.mediaSession.metadata.artist || "Unknown Artist"
    };
  }

  // Method 2: Fallback to common JioSaavn bottom player DOM selectors
  const titleEl = document.querySelector(
    "figure.o-snippet figure img ~ figcaption .o-snippet__title a, " +
    ".c-player__title a, " +
    "[class*='c-player'] [class*='title'] a, " +
    "[class*='player'] [class*='title']"
  );

  const artistEl = document.querySelector(
    "figure.o-snippet figure img ~ figcaption .o-snippet__subtitle a, " +
    ".c-player__subtitle a, " +
    "[class*='c-player'] [class*='subtitle'] a, " +
    "[class*='player'] [class*='artist']"
  );

  const title = titleEl?.textContent?.trim() || "Track";
  const artist = artistEl?.textContent?.trim() || "";

  return { title, artist };
}

// Listen for metadata requests from background/popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get_track_meta") {
    sendResponse(getPlayingTrackInfo());
  }
  return true;
});