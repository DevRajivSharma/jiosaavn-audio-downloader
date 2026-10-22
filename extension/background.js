chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1001],
    addRules: [
      {
        id: 1001,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            {
              header: "Referer",
              operation: "set",
              value: "https://www.jiosaavn.com/"
            }
          ]
        },
        condition: {
          urlFilter: "saavncdn.com",
          resourceTypes: ["xmlhttprequest", "other", "media"]
        }
      }
    ]
  });
});

let currentTrack = {
  url: null,
  title: null,
  artist: null
};

// Catch stream requests and fetch track details from the JioSaavn tab
chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    const url = details.url;
    if (url.includes(".mp4") && url.includes("saavncdn.com")) {
      currentTrack.url = url;

      // Query open JioSaavn tabs to get active song info
      try {
        const tabs = await chrome.tabs.query({ url: "*://www.jiosaavn.com/*" });
        if (tabs.length > 0) {
          const tabId = details.tabId > 0 ? details.tabId : tabs[0].id;
          chrome.tabs.sendMessage(tabId, { action: "get_track_meta" }, (res) => {
            if (!chrome.runtime.lastError && res) {
              currentTrack.title = res.title;
              currentTrack.artist = res.artist;
            }
          });
        }
      } catch (e) {
        console.warn("Could not query tab metadata:", e);
      }
    }
  },
  {
    urls: ["*://*.saavncdn.com/*.mp4*"]
  }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "get_status") {
    sendResponse({
      hasTrack: Boolean(currentTrack.url),
      title: currentTrack.title || "Track Captured",
      artist: currentTrack.artist || ""
    });
    return false;
  }

  if (message.action === "download_now") {
    if (!currentTrack.url) {
      sendResponse({ success: false, error: "No track stream detected." });
      return false;
    }

    fetchAndSaveMP4(currentTrack)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));

    return true;
  }
});

async function fetchAndSaveMP4(track) {
  const response = await fetch(track.url, {
    method: "GET",
    headers: {
      Referer: "https://www.jiosaavn.com/"
    },
    signal: AbortSignal.timeout(60000)
  });

  const contentType = response.headers.get("content-type") ?? "";
  const contentRange = response.headers.get("content-range");

  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`HTTP ${response.status}`);
  }

  if (!contentType.toLowerCase().startsWith("audio/mp4")) {
    await response.body?.cancel();
    throw new Error(`Unexpected type: ${contentType}`);
  }

  if (response.status === 206 || contentRange) {
    throw new Error("Received partial chunk stream. Replay audio or try again.");
  }

  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const ftyp = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
  if (bytes.length < 12 || ftyp !== "ftyp") {
    throw new Error("Invalid MP4 file header ('ftyp' missing).");
  }

  const base64Data = uint8ArrayToBase64(bytes);
  const dataUrl = `data:audio/mp4;base64,${base64Data}`;

  // Build clean filename: "Artist - Title.mp4" or "Title.mp4"
  let fileName = "";
  if (track.artist && track.title) {
    fileName = `${track.artist} - ${track.title}`;
  } else if (track.title) {
    fileName = track.title;
  } else {
    fileName = "JioSaavn_Track";
  }

  // Strip forbidden filename characters
  fileName = fileName.replace(/[\\/:*?"<>|]/g, "").trim() + ".mp4";

  return new Promise((resolve, reject) => {
    chrome.downloads.download({
      url: dataUrl,
      filename: `JioSaavn/${fileName}`,
      saveAs: false,
      conflictAction: "uniquify"
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(downloadId);
      }
    });
  });
}

function uint8ArrayToBase64(uint8) {
  let binary = "";
  const len = uint8.byteLength;
  const chunkSize = 0x8000;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = uint8.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}