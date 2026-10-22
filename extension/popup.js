const downloadBtn = document.getElementById("download-btn");
const displayTitle = document.getElementById("display-title");
const displayArtist = document.getElementById("display-artist");
const statusDiv = document.getElementById("status");

// Query current track info from background worker
chrome.runtime.sendMessage({ action: "get_status" }, (response) => {
  if (response?.hasTrack) {
    displayTitle.textContent = response.title || "Unknown Track";
    displayArtist.textContent = response.artist || "JioSaavn Stream";
    
    downloadBtn.disabled = false;
    statusDiv.textContent = "Ready to download!";
    statusDiv.style.color = "#4ade80";
  } else {
    downloadBtn.disabled = true;
    displayTitle.textContent = "No track detected";
    displayArtist.textContent = "Play music on JioSaavn";
    statusDiv.textContent = "Waiting for audio playback...";
    statusDiv.style.color = "#94a3b8";
  }
});

downloadBtn.addEventListener("click", () => {
  downloadBtn.disabled = true;
  statusDiv.textContent = "Downloading & verifying MP4...";
  statusDiv.style.color = "#38bdf8";

  chrome.runtime.sendMessage({ action: "download_now" }, (response) => {
    if (response?.success) {
      statusDiv.textContent = "Saved to Downloads/JioSaavn!";
      statusDiv.style.color = "#4ade80";
      downloadBtn.disabled = false;
    } else {
      statusDiv.textContent = "Error: " + (response?.error || "Download failed.");
      statusDiv.style.color = "#f87171";
      downloadBtn.disabled = false;
    }
  });
});