# JioSaavn Audio Downloader (Chrome Extension)

A lightweight Manifest V3 Chrome Extension that intercepts active JioSaavn audio streams, handles the required referer headers, validates file integrity (`ftyp` MP4 atom), and downloads full-length audio files on demand.

---

## Features

* **On-Demand Downloading**: Download tracks only when clicking the popup button—no accidental automatic downloads.
* **Referer Header Management**: Uses Chrome's `declarativeNetRequest` API to route stream requests with `[https://www.jiosaavn.com/](https://www.jiosaavn.com/)` headers to bypass CDN blocking.
* **Integrity Verification**: Checks HTTP response headers, content types, byte lengths, and validates the MP4 container structure (`ftyp` signature) before writing to disk.
* **Zero External Dependencies**: Pure browser JavaScript (Manifest V3 Service Worker + Popup UI).

---

## File Structure

```text
jiosaavn-downloader/
├── manifest.json      # Extension configuration and permissions
├── background.js     # Background service worker & network sniffer
├── popup.html        # Clean extension popup interface
├── popup.js          # UI controller & background messaging
└── README.md

```

---

## Installation & Setup

1. **Clone or Download the Project**:
```bash
git clone https://github.com/DevRajivSharma/jiosaavn-downloader.git
cd jiosaavn-downloader

```


2. **Load into Google Chrome**:
* Open Chrome and navigate to `chrome://extensions/`.
* Enable **Developer mode** using the toggle switch in the top-right corner.
* Click the **Load unpacked** button.
* Select the `jiosaavn-downloader` directory containing `manifest.json`.



---

## How It Works

1. Open [JioSaavn](https://www.jiosaavn.com/) and play any track.
2. The background worker detects the media CDN URL (`*[.saavncdn.com/*.mp4](https://.saavncdn.com/*.mp4)*`) and stores the active stream endpoint.
3. Click the extension icon in your Chrome toolbar.
4. Click **Download Song**.
5. The extension retrieves the complete stream buffer, verifies the MP4 binary signature, converts it into a downloadable data stream, and saves it to your system under `Downloads/JioSaavn/`.

---

## Technical Details

* **Manifest Version**: 3
* **Network Rule Injection**: `declarativeNetRequest` attaches `Referer: [https://www.jiosaavn.com/](https://www.jiosaavn.com/)` dynamically to `saavncdn.com` media and XMLHttpRequests.
* **Header & File Signature Check**:
* Confirms `Content-Type: audio/mp4`.
* Rejects partial fragment responses (`status 206` or `content-range` headers) to avoid incomplete files.
* Inspects byte offsets `4` through `7` for ASCII value `ftyp`.



---

## Permissions Used

| Permission | Purpose |
| --- | --- |
| `webRequest` | Detects media CDN stream URLs while listening to tracks |
| `declarativeNetRequest` | Sets origin and referer headers for CloudFront CDN acceptance |
| `downloads` | Saves completed MP4 files directly to the local filesystem |
| `host_permissions` | Grants network access to `*[.saavncdn.com/](https://.saavncdn.com/)*` and `*[.jiosaavn.com/](https://.jiosaavn.com/)*` |

---

## License

This project is licensed under the [MIT License](https://www.google.com/search?q=LICENSE).

---

## Disclaimer

This repository is for educational and research purposes only. All media content and trademarks belong to their respective copyright holders (JioSaavn / Reliance Industries). Ensure compliance with the platform's Terms of Service before using.