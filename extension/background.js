// Rule: Ensure all outbound fetch calls to saavncdn have Referer: https://www.jiosaavn.com/
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

const activeDownloads = new Set();

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;

    // Filter Saavn media CDN mp4 stream requests
    if (url.includes(".mp4") && url.includes("saavncdn.com")) {
      const baseUrl = url.split("?")[0];

      // Avoid downloading the same song multiple times across chunk requests
      if (activeDownloads.has(baseUrl)) {
        return;
      }
      activeDownloads.add(baseUrl);

      // Clean cache after 30 seconds so next replay can download if needed
      setTimeout(() => activeDownloads.delete(baseUrl), 30000);

      console.log("[JioSaavn Downloader] Intercepted stream URL:", url);
      fetchAndSaveMP4(url);
    }
  },
  {
    urls: ["*://*.saavncdn.com/*.mp4*"]
  }
);

async function fetchAndSaveMP4(url) {
  try {
    console.log("[JioSaavn Downloader] Fetching stream with referer...");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Referer: "https://www.jiosaavn.com/"
      },
      signal: AbortSignal.timeout(60000)
    });

    const contentType = response.headers.get("content-type") ?? "";
    const contentRange = response.headers.get("content-range");
    const contentLength = response.headers.get("content-length");

    console.log("Status:", response.status);
    console.log("Content-Type:", contentType);
    console.log("Content-Length:", contentLength);
    console.log("Content-Range:", contentRange);

    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Request failed: HTTP ${response.status}`);
    }

    if (!contentType.toLowerCase().startsWith("audio/mp4")) {
      await response.body?.cancel();
      throw new Error(`Unexpected response type: ${contentType}`);
    }

    if (response.status === 206 || contentRange) {
      console.warn("Partial response detected. Skipping fragment.");
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    console.log("Downloaded bytes:", bytes.length);

    // Validate MP4 'ftyp' box signature at byte offset 4-8
    const ftyp = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    if (bytes.length < 12 || ftyp !== "ftyp") {
      console.error("The response does not have the standard MP4 file signature ('ftyp').");
      return;
    }

    // Convert to Base64 Data URL to pass straight to chrome.downloads
    const base64Data = uint8ArrayToBase64(bytes);
    const dataUrl = `data:audio/mp4;base64,${base64Data}`;

    // Extract default file name from path
    const pathname = new URL(url).pathname;
    const fileName = pathname.substring(pathname.lastIndexOf("/") + 1) || "song.mp4";

    chrome.downloads.download({
      url: dataUrl,
      filename: `JioSaavn/${fileName}`,
      saveAs: false,
      conflictAction: "uniquify"
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Download manager failed:", chrome.runtime.lastError.message);
      } else {
        console.log(`Successfully saved MP4 as ${fileName} (Download ID: ${downloadId})`);
      }
    });

  } catch (err) {
    console.error("[JioSaavn Downloader] Error:", err.message);
  }
}

// Helper to encode Uint8Array without blowing the call stack on large files
function uint8ArrayToBase64(uint8) {
  let binary = "";
  const len = uint8.byteLength;
  const chunkSize = 0x8000; // 32KB chunks
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = uint8.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}