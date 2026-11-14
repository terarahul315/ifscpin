<p align="center">
  <img src="favicon.png" alt="IFSCPin Logo" width="90" />
</p>

<h1 align="center">IFSCPin — Indian Bank IFSC & Pincode Finder</h1>

<p align="center">
  Fast, free, and mobile-first Progressive Web App (PWA) to find Indian bank branch IFSC codes, Google Maps branch locations, MICR details, and India Post PIN codes.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/PWA-Ready-00e5ff?style=for-the-badge" alt="PWA Ready" />
  <img src="https://img.shields.io/badge/HTML5-CSS3-087bff?style=for-the-badge" alt="HTML5 CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-Vanilla-10d99a?style=for-the-badge" alt="Vanilla JS" />
  <img src="https://img.shields.io/badge/Languages-EN%20%7C%20%E0%A4%B9%E0%A4%BF%E0%A4%82%E0%A4%A6%E0%A5%80-38bdf8?style=for-the-badge" alt="Bilingual" />
</p>

---

## ✨ Features

- **Instant IFSC Lookup:** Get bank name, branch, address, city, state, MICR, contact number, and NEFT / RTGS / IMPS / UPI support status.
- **India Post Pincode & Area Search:** Search by 6-digit PIN code or partial city/area/post office name.
- **Google Maps Integration:** One-tap button to open the bank branch location directly on Google Maps.
- **Bilingual UI (EN | हिंदी):** Switch seamlessly between English and Hindi.
- **WhatsApp Share & Copy:** Copy full branch/pincode details or share directly on WhatsApp.
- **PWA Installable:** Installable on Android, iOS, and Desktop with a Network-First Service Worker (`sw.js`).
- **Privacy-First:** No login required; recent search history stays strictly on your device (`localStorage`).

---

## 🛠️ Tech Stack & APIs

- **Frontend:** Semantic HTML5, Neon Dark-Navy CSS3, Vanilla JavaScript (`"use strict"`, `AbortController` timeout, XSS-safe `escapeHTML`)
- **Bank IFSC Data:** Razorpay IFSC Public API
- **Postal Pincode Data:** India Post Public Pincode API
- **Hosting:** Cloudflare Pages

---

## 📁 Project Structure

```text
ifscpin/
├── index.html       # Main app UI & SEO meta tags
├── style.css        # Responsive neon blue/cyan theme
├── script.js        # IFSC, Pincode, Area search & EN/HI logic
├── manifest.json    # PWA manifest configuration
├── sw.js            # Network-first Service Worker
├── favicon.png      # App icon & brand logo
├── privacy.html     # Privacy Policy
├── terms.html       # Terms of Service
└── README.md        # Project documentation

# ifscpin
Free Indian Bank IFSC Code, Google Maps &amp; India Post Pincode Finder.
