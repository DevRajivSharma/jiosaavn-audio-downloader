const downloadBtn = document.getElementById("download-btn");
const statusDiv = document.getElementById("status");

// Check if a song stream is currently available
chrome.runtime.sendMessage({ action: "get_status" }, (response) => {
  if (response?.hasTrack) {
    downloadBtn.disabled = false;
    statusDiv.textContent = "Track captured and ready to download.";
    statusDiv.style.color = "#4ade80";
  } else {
    downloadBtn.disabled = true;
    statusDiv.textContent = "No audio detected. Start playing a song on JioSaavn.";
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