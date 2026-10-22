// Rule: Ensure all fetch requests carry Referer: https://www.jiosaavn.com/
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

let latestAudioUrl = null;

// Intercept Saavn media CDN stream URLs without auto-downloading
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;
    if (url.includes(".mp4") && url.includes("saavncdn.com")) {
      latestAudioUrl = url;
      console.log("[JioSaavn Downloader] Track URL ready:", latestAudioUrl);
    }
  },
  {
    urls: ["*://*.saavncdn.com/*.mp4*"]
  }
);

// Handle download requests initiated from the popup button
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "get_status") {
    sendResponse({ hasTrack: Boolean(latestAudioUrl), url: latestAudioUrl });
    return false;
  }

  if (message.action === "download_now") {
    if (!latestAudioUrl) {
      sendResponse({ success: false, error: "No song stream detected yet. Play a song first!" });
      return false;
    }

    fetchAndSaveMP4(latestAudioUrl)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));

    return true; // Keeps channel open for async response
  }
});

async function fetchAndSaveMP4(url) {
  const response = await fetch(url, {
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

  const pathname = new URL(url).pathname;
  const fileName = pathname.substring(pathname.lastIndexOf("/") + 1) || "song.mp4";

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