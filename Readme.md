
# JioSaavn Audio Downloader (Chrome Extension)

A lightweight Manifest V3 Chrome Extension that intercepts active JioSaavn audio streams, extracts clean track and artist metadata, injects required referer headers, validates container integrity (`ftyp` MP4 atom), and downloads full-length audio tracks directly to your device.

---

## Features

- **On-Demand Single-Click Download**: Download tracks only when you click the popup button—no background clutter or accidental automatic downloads.
- **Smart Metadata & Clean Naming**: Automatically extracts track title and primary artist name from JioSaavn player controls and discards long comma-separated credits (e.g., saves cleanly as `Artist - Song.mp4`).
- **CDN Referer Bypass**: Uses Chrome's `declarativeNetRequest` API to transparently attach `Referer: https://www.jiosaavn.com/` headers to stream requests, preventing 403 Forbidden CloudFront blocks.
- **Integrity & MP4 Verification**: Validates HTTP status, rejects incomplete chunk ranges, and inspects byte offsets for the `ftyp` box before committing writes to disk.
- **Zero External Dependencies**: Pure vanilla JavaScript (Manifest V3 Service Worker, Content Script, and Popup UI).

---

## File Structure

```text
jiosaavn-downloader/
├── manifest.json      # Extension permissions and component registration
├── background.js     # Background service worker & network sniffer
├── content.js        # DOM metadata scraper for JioSaavn player
├── popup.html        # Extension UI layout
├── popup.js          # UI controller & messaging logic
└── README.md



---

## How to Install the Extension in Google Chrome

Follow these steps to load the extension as an unpacked developer package:

### Step 1: Get the Code

* **Option A (Git Clone):**
```bash
git clone [https://github.com/DevRajivSharma/jiosaavn-downloader.git](https://github.com/DevRajivSharma/jiosaavn-downloader.git)

```


* **Option B (ZIP Download):**
Click **Code** > **Download ZIP** on GitHub, then extract the `.zip` archive to a folder on your computer.

### Step 2: Open Chrome Extensions

1. Launch Google Chrome.
2. Enter `chrome://extensions/` in the URL address bar and press **Enter**.
*(Alternatively, click the **three dots menu (⋮)** in the top-right corner > **Extensions** > **Manage Extensions**).*

### Step 3: Enable Developer Mode

* In the top-right corner of the Extensions page, toggle the **Developer mode** switch to **ON**.

### Step 4: Load Unpacked Folder

1. Click the **Load unpacked** button in the top-left toolbar.
2. In the file picker, select the `jiosaavn-downloader` folder (the directory containing `manifest.json`).
3. Click **Select Folder**. The extension will now appear in your installed extensions list.

### Step 5: Pin the Extension (Recommended)

1. Click the **Puzzle piece icon (Extensions)** in Chrome's top-right toolbar.
2. Find **JioSaavn Downloader** and click the **Pin icon (📌)** next to it for quick access.

> **Note on Code Changes:** Whenever you update or edit files (`background.js`, `content.js`, etc.), return to `chrome://extensions/` and click the **Reload (↻)** icon on the extension card, then refresh your JioSaavn tab.

---

## How to Use

1. Navigate to [JioSaavn](https://www.jiosaavn.com/) and refresh the page if it was already open.
2. Play any song.
3. Click the **JioSaavn Downloader** icon in your browser toolbar.
4. The popup will display the detected song title and primary artist.
5. Click **Download Track**. The file will be verified and saved to `Downloads/JioSaavn/`.

---

## Technical Details

* **Manifest Version**: 3
* **Network Rule Injection**: `declarativeNetRequest` modifies request headers on matching `saavncdn.com` media endpoints.
* **Byte Verification**:
* Rejects `status 206` partial chunks to guarantee complete audio files.
* Verifies ASCII string `ftyp` starting at byte offset `4`.
* Encodes the audio buffer into a Data URL for safe handover to `chrome.downloads.download()`.



---

## Permissions Used

| Permission | Purpose |
| --- | --- |
| `webRequest` | Detects media CDN stream URLs when audio starts playing |
| `declarativeNetRequest` | Automatically applies required origin and referer headers |
| `downloads` | Writes completed MP4 audio files to the local file system |
| `tabs` | Communicates with active tabs to query track title and artist |
| `host_permissions` | Grants network access to `*://*.saavncdn.com/*` and `*://www.jiosaavn.com/*` |

---

## License

This project is licensed under the [MIT License](https://www.google.com/search?q=LICENSE).

---

## Disclaimer

This project is strictly for personal educational and research purposes. All media content and trademarks belong to their respective copyright holders (JioSaavn / Reliance Industries). Always respect copyright laws and the platform's Terms of Service.

```

```