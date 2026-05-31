# GlucoScan 🩸

A privacy-first blood glucose tracker that lives entirely in your browser. **No server, no cloud, no data leaves your device.**

Your readings are stored in your browser's `localStorage` — they survive restarts, shutdowns, and will be there every time you visit. Data never touches a server.

## Features

- 📷 **Camera OCR** — point at your glucose meter display, auto-detect the reading
- ⌨️ **Manual entry** — tap in a value with optional meal tags
- 🏠 **Home dashboard** — latest reading, 7/30 day averages, in-range percentage
- 📊 **Trend chart** — 7d, 14d, 30d, 90d views with smart insights
- 📋 **History** — grouped by day, delete individual readings
- 📤 **Export CSV** — download all your data anytime
- 🌙 **Dark theme** — mobile-first, touch-friendly, feels native
- ✅ **Success feedback** — haptic vibration + visual confirmation on save

## Hosting

GlucoScan is a single HTML file. Deploy it anywhere static files are served:

### GitHub Pages
```bash
git clone <your-repo>
cp index.html docs/index.html
# Enable GitHub Pages on the docs/ folder
```

### Any Static Host
- Netlify — drag `index.html` onto the deploy
- Vercel — `vercel --prod`
- Any web server — just serve the file

### Local Testing
```bash
# Python 3
python3 -m http.server 8080
# Then open http://localhost:8080
```

## Why No Backend?

GlucoScan is designed to be **fully private by default**. There's no database, no API, no sign-up. Every reading stays in the user's browser storage (`localStorage`). The trade-off: data is tied to the device/browser they use. For most personal tracking needs, this is ideal.

## Browser Support

All modern browsers — Chrome, Safari, Firefox, Edge. iOS Safari and Android Chrome work great. Camera requires HTTPS (or localhost) due to browser security restrictions.

## Tech Stack

| Feature | Library |
|---|---|
| OCR | Tesseract.js (in-browser) |
| Charts | Chart.js |
| Storage | localStorage |
| Runtime | Zero — static HTML |

## Privacy Promise

- ✅ No data sent to any server
- ✅ No cookies
- ✅ No analytics
- ✅ No sign-up required
- ✅ No network requests after the page loads (except CDNs for Tesseract.js and Chart.js on first visit)

---

Built with ❤️ for privacy-first health tracking.
