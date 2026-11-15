/* ==========================================
   IFSCPin — IMPROVED EDITION
   IFSC | Pincode | Area | Bank Directory
   Favorites | Recent | Copy | Share | Nearby
   Feedback | Light/Dark | Retry
========================================== */

"use strict";

let currentMode = "ifsc";
let currentLang = "en";
let lastRetryFn = null;
let searching = false;

let banksLoaded = false;
let bankRequestId = 0;
let placesRequestId = 0;

const $ = (id) => document.getElementById(id);

const TEXT = {
    en: {
        badge: "✓ Free Bank & India Post Directory",
        title: 'Find Bank <span class="cyan-text">IFSC</span> & <span class="cyan-text">Pincode</span> Instantly',
        sub: "Find bank branch details, IFSC codes, MICR information and India Post Pincodes.",
        how: "Popular Banks",
        search: "Search",
        loading: "Searching...",
        fetching: "Fetching details...",
        found: "Search completed!",
        verified: "✓ Bank details loaded!",
        error: "Something went wrong. Please retry.",
        empty: "Please enter something to search.",
        invalidIFSC: "Enter a valid 11-character IFSC code (e.g. SBIN0000691).",
        invalidPIN: "Enter a valid 6-digit Pincode (e.g. 226001).",
        shortArea: "Enter at least 3 characters.",
        noData: "No results found. Check the spelling or try another search.",
        recent: "🕒 Recent:",
        favs: "⭐ Favorites:",
        copied: "✓ Copied!",
        copyIfsc: "📋 Copy IFSC",
        copyAll: "📋 Copy All",
        retry: "🔄 Retry",
        nearby: "📡 Nearby",
        map: "📍 Map",
        share: "📤 Share",
        save: "☆ Save",
        saved: "⭐ Saved",
        loadingBanks: "Loading banks...",
        selectBank: "-- Select Bank --",
        selectState: "-- Select State --",
        selectDistrict: "-- Select District --",
        selectBranch: "-- Select Branch --",
        selectBankFirst: "Select Bank first",
        selectStateFirst: "Select State first",
        selectDistrictFirst: "Select District first",
        noStates: "No states found",
        noDistricts: "No districts found",
        noBranches: "No branches found",
        bankLoadError: "Unable to load banks. Please retry.",
        directoryError: "Unable to load bank directory. Please retry.",
        timeout: "Request timed out. Check your internet and retry.",
        serverError: "The data service is temporarily unavailable.",
        copyError: "Unable to copy. Please try again.",
        feedbackPrompt: "Please enter your feedback first.",
        locationDenied: "Location permission was not granted. Opening Maps search instead."
    },

    hi: {
        badge: "✓ फ्री बैंक और इंडिया पोस्ट डायरेक्टरी",
        title: 'बैंक <span class="cyan-text">IFSC</span> और <span class="cyan-text">पिनकोड</span> तुरंत खोजें',
        sub: "बैंक ब्रांच, IFSC कोड, MICR और इंडिया पोस्ट पिनकोड की जानकारी प्राप्त करें।",
        how: "प्रमुख बैंक",
        search: "खोजें",
        loading: "खोज रहे हैं...",
        fetching: "जानकारी प्राप्त हो रही है...",
        found: "सर्च पूरी हुई!",
        verified: "✓ बैंक की जानकारी मिल गई!",
        error: "कुछ समस्या हुई। फिर कोशिश करें।",
        empty: "कृपया कुछ लिखकर सर्च करें।",
        invalidIFSC: "सही 11 अक्षरों का IFSC कोड डालें (जैसे SBIN0000691)।",
        invalidPIN: "सही 6 अंकों का पिनकोड डालें (जैसे 226001)।",
        shortArea: "कम से कम 3 अक्षर डालें।",
        noData: "कोई जानकारी नहीं मिली। स्पेलिंग जाँचें या दूसरी सर्च करें।",
        recent: "🕒 पिछली सर्च:",
        favs: "⭐ पसंदीदा:",
        copied: "✓ कॉपी हो गया!",
        copyIfsc: "📋 IFSC कॉपी",
        copyAll: "📋 सब कॉपी",
        retry: "🔄 फिर कोशिश करें",
        nearby: "📡 आसपास",
        map: "📍 मैप",
        share: "📤 शेयर",
        save: "☆ सेव करें",
        saved: "⭐ सेव है",
        loadingBanks: "बैंकों की सूची लोड हो रही है...",
        selectBank: "-- बैंक चुनें --",
        selectState: "-- राज्य चुनें --",
        selectDistrict: "-- जिला चुनें --",
        selectBranch: "-- ब्रांच चुनें --",
        selectBankFirst: "पहले बैंक चुनें",
        selectStateFirst: "पहले राज्य चुनें",
        selectDistrictFirst: "पहले जिला चुनें",
        noStates: "राज्य नहीं मिले",
        noDistricts: "जिले नहीं मिले",
        noBranches: "ब्रांच नहीं मिलीं",
        bankLoadError: "बैंकों की सूची लोड नहीं हुई। फिर कोशिश करें।",
        directoryError: "बैंक डायरेक्टरी लोड नहीं हुई। फिर कोशिश करें।",
        timeout: "रिक्वेस्ट में समय लगा। इंटरनेट जाँचकर फिर कोशिश करें।",
        serverError: "डेटा सर्विस अभी उपलब्ध नहीं है।",
        copyError: "कॉपी नहीं हो पाया। फिर कोशिश करें।",
        feedbackPrompt: "कृपया पहले अपना फीडबैक लिखें।",
        locationDenied: "लोकेशन की अनुमति नहीं मिली। Maps में सामान्य सर्च खोली जा रही है।"
    }
};

function t(key) {
    return TEXT[currentLang]?.[key] || TEXT.en[key] || key;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

/* SAFE LOCAL STORAGE */

function storageGet(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
    } catch {
        return fallback;
    }
}

function storageSet(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

/* LANGUAGE */

function setLang(lang) {
    if (!TEXT[lang]) return;

    currentLang = lang;

    const tData = TEXT[lang];

    if ($("langEn")) $("langEn").classList.toggle("active", lang === "en");
    if ($("langHi")) $("langHi").classList.toggle("active", lang === "hi");

    if ($("trustBadge")) $("trustBadge").textContent = tData.badge;
    if ($("heroTitle")) $("heroTitle").innerHTML = tData.title;
    if ($("heroSub")) $("heroSub").textContent = tData.sub;
    if ($("howHeading")) $("howHeading").textContent = tData.how;

    if ($("searchBtn")) {
        $("searchBtn").textContent = searching ? tData.loading : tData.search;
    }

    if ($("inputLabel")) {
        const labels = {
            ifsc: lang === "hi" ? "11 अंकों का IFSC कोड डालें" : "Enter 11-Character IFSC Code",
            pincode: lang === "hi" ? "6 अंकों का पिनकोड डालें" : "Enter 6-Digit India Pincode",
            area: lang === "hi" ? "शहर या क्षेत्र का नाम डालें" : "Enter City or Area Name"
        };
        $("inputLabel").textContent = labels[currentMode];
    }

    renderRecent();
    renderFavorites();
}

/* STATUS + RETRY */

function setStatus(message, type = "info", showRetry = false, smartSuggestion = null) {
    const status = $("statusMsg");
    if (!status) return;

    status.className = "status-msg " + type;
    status.textContent = message;

    if (smartSuggestion) {
        const smartBtn = document.createElement("button");
        smartBtn.type = "button";
        smartBtn.className = "retry-btn";
        smartBtn.textContent = smartSuggestion.label;
        smartBtn.addEventListener("click", smartSuggestion.action);
        status.appendChild(smartBtn);
    }

    if (showRetry && typeof lastRetryFn === "function") {
        const retryBtn = document.createElement("button");
        retryBtn.type = "button";
        retryBtn.className = "retry-btn";
        retryBtn.textContent = t("retry");
        retryBtn.addEventListener("click", () => lastRetryFn());
        status.appendChild(retryBtn);
    }
}

/* SEARCH MODES */

function switchMode(mode) {
    if (!["ifsc", "pincode", "area"].includes(mode)) return;

    currentMode = mode;

    const input = $("searchInput");
    const label = $("inputLabel");
    const examples = $("examplesRow");

    if (!input || !label || !examples) return;

    document.querySelectorAll(".mode-tab").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.mode === mode);
    });

    input.value = "";

    if ($("resultBox")) {
        $("resultBox").innerHTML = "";
        $("resultBox").classList.add("hidden");
    }

    if ($("statusMsg")) $("statusMsg").textContent = "";

    const settings = {
        ifsc: {
            label: currentLang === "hi" ? "11 अंकों का IFSC कोड डालें" : "Enter 11-Character IFSC Code",
            placeholder: "e.g. SBIN0000691",
            examples: [
                ["SBIN0000691", "SBIN0000691"],
                ["HDFC0000001", "HDFC0000001"],
                ["ICIC0000001", "ICIC0000001"]
            ]
        },
        pincode: {
            label: currentLang === "hi" ? "6 अंकों का पिनकोड डालें" : "Enter 6-Digit India Pincode",
            placeholder: "e.g. 226001",
            examples: [
                ["226001", "226001 (Lucknow)"],
                ["110001", "110001 (Delhi)"],
                ["400001", "400001 (Mumbai)"]
            ]
        },
        area: {
            label: currentLang === "hi" ? "शहर या क्षेत्र का नाम डालें" : "Enter City or Area Name",
            placeholder: "e.g. Gomti Nagar",
            examples: [
                ["Gomti Nagar", "Gomti Nagar"],
                ["Andheri", "Andheri"],
                ["Jaipur", "Jaipur"]
            ]
        }
    };

    const config = settings[mode];

    label.textContent = config.label;
    input.placeholder = config.placeholder;
    input.style.textTransform = mode === "ifsc" ? "uppercase" : "none";

    examples.innerHTML = `<span>${currentLang === "hi" ? "उदाहरण:" : "Try:"}</span>` +
        config.examples.map(([value, display]) =>
            `<button type="button" class="ex-chip" data-value="${escapeHTML(value)}">${escapeHTML(display)}</button>`
        ).join("");

    examples.querySelectorAll(".ex-chip").forEach(btn => {
        btn.addEventListener("click", () => quickFill(btn.dataset.value));
    });
}

function quickFill(value) {
    const input = $("searchInput");
    const form = $("lookupForm");

    if (!input || !form) return;

    input.value = value;

    if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
    } else {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }
}

/* RECENT SEARCHES */

function getRecent() {
    try {
        const data = JSON.parse(storageGet("ifscpin_recent", "[]"));

        if (!Array.isArray(data)) return [];

        return data.filter(item =>
            item &&
            ["ifsc", "pincode", "area"].includes(item.mode) &&
            typeof item.query === "string"
        ).slice(0, 4);
    } catch {
        return [];
    }
}

function saveRecent(mode, query) {
    try {
        const items = getRecent().filter(item =>
            !(item.mode === mode && item.query === query)
        );

        items.unshift({ mode, query });

        storageSet("ifscpin_recent", JSON.stringify(items.slice(0, 4)));
        renderRecent();
    } catch {}
}

function renderRecent() {
    const wrap = $("recentSearches");
    if (!wrap) return;

    const items = getRecent();

    if (!items.length) {
        wrap.innerHTML = "";
        return;
    }

    wrap.innerHTML =
        `<div class="recent-wrap"><span>${t("recent")}</span>` +
        items.map(item =>
            `<button type="button" class="recent-chip"
                data-mode="${item.mode}"
                data-query="${escapeHTML(item.query)}">${escapeHTML(item.query)}</button>`
        ).join("") +
        `</div>`;

    wrap.querySelectorAll(".recent-chip").forEach(btn => {
        btn.addEventListener("click", () => {
            if ($("bankFinderBox")) $("bankFinderBox").classList.add("hidden");
            if ($("lookupForm")) $("lookupForm").classList.remove("hidden");
            if ($("examplesRow")) $("examplesRow").classList.remove("hidden");

            switchMode(btn.dataset.mode);
            quickFill(btn.dataset.query);
        });
    });
}

/* FAVORITES */

function getFavorites() {
    try {
        const data = JSON.parse(storageGet("ifscpin_favs", "[]"));

        if (!Array.isArray(data)) return [];

        return data.filter(item =>
            item &&
            typeof item.ifsc === "string" &&
            typeof item.label === "string"
        ).slice(0, 5);
    } catch {
        return [];
    }
}

function toggleFavorite(ifsc, label) {
    let favorites = getFavorites();

    const exists = favorites.some(item => item.ifsc === ifsc);

    if (exists) {
        favorites = favorites.filter(item => item.ifsc !== ifsc);
    } else {
        favorites.unshift({ ifsc, label });
    }

    storageSet("ifscpin_favs", JSON.stringify(favorites.slice(0, 5)));

    renderFavorites();

    const btn = $("favIfscBtn");

    if (btn) {
        btn.classList.toggle("saved", !exists);
        btn.textContent = !exists ? t("saved") : t("save");
    }
}

function renderFavorites() {
    const wrap = $("favoriteBranches");
    if (!wrap) return;

    const favorites = getFavorites();

    if (!favorites.length) {
        wrap.innerHTML = "";
        return;
    }

    wrap.innerHTML =
        `<div class="recent-wrap"><span>${t("favs")}</span>` +
        favorites.map(item =>
            `<button type="button" class="recent-chip"
                data-ifsc="${escapeHTML(item.ifsc)}">
                ⭐ ${escapeHTML(item.label)} (${escapeHTML(item.ifsc)})
            </button>`
        ).join("") +
        `</div>`;

    wrap.querySelectorAll(".recent-chip").forEach(btn => {
        btn.addEventListener("click", () => {
            if ($("bankFinderBox")) $("bankFinderBox").classList.add("hidden");
            if ($("lookupForm")) $("lookupForm").classList.remove("hidden");
            if ($("examplesRow")) $("examplesRow").classList.remove("hidden");

            switchMode("ifsc");
            quickFill(btn.dataset.ifsc);
        });
    });
}

/* NETWORK REQUEST WITH TIMEOUT */

async function fetchData(url, timeoutMs = 12000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) {
            throw new Error(response.status === 404 ? "NO_DATA" : "API_ERROR");
        }

        return await response.json();
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error("TIMEOUT");
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

/* COPY */

async function copyText(value, button) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(String(value));
        } else {
            const area = document.createElement("textarea");
            area.value = String(value);
            area.setAttribute("readonly", "");
            area.style.position = "fixed";
            area.style.opacity = "0";

            document.body.appendChild(area);
            area.select();

            const copied = document.execCommand("copy");
            area.remove();

            if (!copied) throw new Error("COPY_FAILED");
        }

        if (button) {
            const original = button.textContent;
            button.textContent = t("copied");

            setTimeout(() => {
                if (button.isConnected) button.textContent = original;
            }, 1600);
        }
    } catch {
        setStatus(t("copyError"), "error");
    }
}

/* SHARE */

async function shareResult(title, text) {
    const shareData = {
        title,
        text,
        url: "https://ifscpin.pages.dev/"
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            return;
        } catch (error) {
            if (error.name === "AbortError") return;
        }
    }

    const whatsappUrl =
        "https://wa.me/?text=" +
        encodeURIComponent(text + "\n\nFind more: https://ifscpin.pages.dev/");

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
}

/* MAPS + NEARBY */

function openMaps(query) {
    const url =
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(query);

    window.open(url, "_blank", "noopener,noreferrer");
}

function findNearbyBank(bankName) {
    const fallback = () => openMaps(bankName + " near me");

    if (!navigator.geolocation) {
        fallback();
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            const url =
                "https://www.google.com/maps/search/" +
                encodeURIComponent(bankName) +
                "/@" + latitude + "," + longitude + ",14z";

            window.open(url, "_blank", "noopener,noreferrer");
        },
        () => {
            setStatus(t("locationDenied"), "info");
            fallback();
        },
        {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 60000
        }
    );
}

/* FEEDBACK AND WRONG DATA REPORT
   No private WhatsApp number is embedded in public code.
*/

function openFeedbackEmail(subject, message) {
    const url =
        "mailto:rm6129306@gmail.com" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(message);

    window.location.href = url;
}

function reportWrongData(contextLabel) {
    const message =
        "IFSCPin Wrong Data Report\n" +
        "Item: " + contextLabel + "\n" +
        "Issue: Please describe the correction needed.";

    openFeedbackEmail("IFSCPin Wrong Data Report", message);
}

function sendFeedback(type) {
    const input = $("feedbackInput");
    const message = input ? input.value.trim() : "";

    if (!message) {
        setStatus(t("feedbackPrompt"), "error");
        return;
    }

    // Both feedback options use email because no public support
    // WhatsApp number is configured in this version.
    openFeedbackEmail("IFSCPin Feedback / Report", message);
}

/* IFSC SEARCH */

async function searchIFSC(query) {
    const code = String(query).trim().toUpperCase();

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(code)) {
        throw new Error("INVALID_IFSC");
    }

    const data = await fetchData(
        "https://ifsc.razorpay.com/" + encodeURIComponent(code)
    );

    if (!data || !data.IFSC || !data.BANK) {
        throw new Error("NO_DATA");
    }

    const bankName = data.BANK || "Bank";
    const branchName = data.BRANCH || "Branch";

    const addressParts = [
        bankName,
        branchName,
        data.CITY,
        data.ADDRESS
    ].filter(Boolean);

    const mapsUrl =
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(addressParts.join(" "));

    const details = [
        bankName + " - " + branchName,
        "IFSC: " + data.IFSC,
        "MICR: " + (data.MICR || "N/A"),
        "Address: " + (data.ADDRESS || "N/A"),
        "City: " + (data.CITY || "N/A"),
        "District: " + (data.DISTRICT || "N/A"),
        "State: " + (data.STATE || "N/A")
    ].join("\n");

    const services = ["UPI", "IMPS", "NEFT", "RTGS"];
    const isFavorite = getFavorites().some(item => item.ifsc === data.IFSC);

    $("resultBox").innerHTML = `
        <div class="bank-card">
            <div class="bank-title">${escapeHTML(bankName)}</div>
            <div class="branch-sub">${escapeHTML(branchName)} Branch</div>

            <div class="detail-grid">
                ${[
                    ["IFSC Code", data.IFSC],
                    ["MICR Code", data.MICR || "N/A"],
                    ["City / District", (data.CITY || "N/A") + " / " + (data.DISTRICT || "N/A")],
                    ["State", data.STATE || "N/A"]
                ].map(([label, value]) => `
                    <div class="detail-item">
                        <div class="detail-label">${escapeHTML(label)}</div>
                        <div class="detail-val">${escapeHTML(value)}</div>
                    </div>
                `).join("")}
            </div>

            <div class="detail-item" style="margin-bottom:12px">
                <div class="detail-label">Full Address</div>
                <div class="detail-val">${escapeHTML(data.ADDRESS || "N/A")}</div>
            </div>

            <div class="badges-row">
                ${services.map(service => {
                    const available = data[service] === true;
                    return `
                        <span class="svc-badge ${available ? "" : "no"}">
                            ${service}: ${available ? "Yes" : "Not confirmed"}
                        </span>
                    `;
                }).join("")}
            </div>

            <div class="action-btns">
                <button type="button" class="copy-btn" id="copyCodeOnlyBtn">
                    ${t("copyIfsc")}
                </button>

                <button type="button" class="copy-btn" id="copyIfscBtn">
                    ${t("copyAll")}
                </button>

                <button type="button" class="fav-btn ${isFavorite ? "saved" : ""}" id="favIfscBtn">
                    ${isFavorite ? t("saved") : t("save")}
                </button>

                <button type="button" class="share-btn" id="shareIfscBtn">
                    ${t("share")}
                </button>

                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="maps-btn">
                    ${t("map")}
                </a>

                <button type="button" class="nearby-btn" id="nearbyBtn">
                    ${t("nearby")}
                </button>

                <a href="https://wa.me/?text=${encodeURIComponent(details)}"
                   target="_blank" rel="noopener noreferrer" class="wa-btn">
                    📲 WhatsApp
                </a>

                <button type="button" class="report-btn" id="reportIfscBtn">
                    ⚠️ Report
                </button>
            </div>

            <div class="source-note">
                Data source: Razorpay IFSC API.
                Some information is based on RBI/NPCI datasets.
                Checked: ${new Date().toLocaleDateString("en-IN")}.
                Please verify details with your bank before making a transfer.
            </div>
        </div>
    `;

    $("resultBox").classList.remove("hidden");

    $("copyCodeOnlyBtn").addEventListener("click", function () {
        copyText(data.IFSC, this);
    });

    $("copyIfscBtn").addEventListener("click", function () {
        copyText(details, this);
    });

    $("favIfscBtn").addEventListener("click", () => {
        toggleFavorite(data.IFSC, branchName);
    });

    $("shareIfscBtn").addEventListener("click", () => {
        shareResult(bankName + " IFSC Details", details);
    });

    $("nearbyBtn").addEventListener("click", () => {
        findNearbyBank(bankName);
    });

    $("reportIfscBtn").addEventListener("click", () => {
        reportWrongData("IFSC " + data.IFSC + " (" + bankName + ")");
    });

    saveRecent("ifsc", code);
}

/* PINCODE SEARCH */

async function searchPincode(query) {
    const pin = String(query).trim();

    if (!/^\d{6}$/.test(pin)) {
        throw new Error("INVALID_PIN");
    }

    const json = await fetchData(
        "https://api.postalpincode.in/pincode/" + encodeURIComponent(pin)
    );

    if (!Array.isArray(json) ||
        !json[0] ||
        json[0].Status !== "Success" ||
        !Array.isArray(json[0].PostOffice)) {
        throw new Error("NO_DATA");
    }

    renderPostOffices(json[0].PostOffice);
    saveRecent("pincode", pin);
}

/* AREA SEARCH */

async function searchArea(query) {
    const area = String(query).trim();

    if (area.length < 3) {
        throw new Error("SHORT_AREA");
    }

    const json = await fetchData(
        "https://api.postalpincode.in/postoffice/" + encodeURIComponent(area)
    );

    if (!Array.isArray(json) ||
        !json[0] ||
        json[0].Status !== "Success" ||
        !Array.isArray(json[0].PostOffice)) {
        throw new Error("NO_DATA");
    }

    renderPostOffices(json[0].PostOffice.slice(0, 20));
    saveRecent("area", area);
}

/* POST OFFICE RESULTS */

function renderPostOffices(list) {
    if (!Array.isArray(list) || !list.length) {
        throw new Error("NO_DATA");
    }

    $("resultBox").innerHTML = `
        <div class="po-list">
            ${list.map((po, index) => {
                const details = [
                    (po.Name || "Post Office") + " (" + (po.Pincode || "N/A") + ")",
                    "Division: " + (po.Division || "N/A"),
                    "District: " + (po.District || "N/A"),
                    "State: " + (po.State || "N/A"),
                    "Status: " + (po.DeliveryStatus || "N/A")
                ].join("\n");

                return `
                    <div class="po-card">
                        <div>
                            <div class="po-name">
                                ${escapeHTML(po.Name || "Post Office")}
                                <small>(${escapeHTML(po.BranchType || "Post Office")})</small>
                            </div>

                            <div class="po-meta">
                                <strong>Division:</strong> ${escapeHTML(po.Division || "N/A")} •
                                <strong>District:</strong> ${escapeHTML(po.District || "N/A")} •
                                <strong>State:</strong> ${escapeHTML(po.State || "N/A")} •
                                ${escapeHTML(po.DeliveryStatus || "N/A")}
                            </div>
                        </div>

                        <div class="po-right">
                            <div class="po-pin">${escapeHTML(po.Pincode || "N/A")}</div>

                            <button type="button" class="share-btn po-copy-btn"
                                data-idx="${index}" title="Copy Pincode">📋</button>

                            <button type="button" class="share-btn po-share-btn"
                                data-idx="${index}" title="Share">📤</button>

                            <a href="https://wa.me/?text=${encodeURIComponent(details)}"
                               target="_blank" rel="noopener noreferrer" class="wa-btn">📲</a>
                        </div>
                    </div>
                `;
            }).join("")}
        </div>

        <div class="source-note">
            Data source: India Post public lookup service.
            Checked: ${new Date().toLocaleDateString("en-IN")}.
        </div>
    `;

    $("resultBox").querySelectorAll(".po-copy-btn").forEach(btn => {
        const po = list[Number(btn.dataset.idx)];

        btn.addEventListener("click", function () {
            copyText(po.Pincode || "", this);
        });
    });

    $("resultBox").querySelectorAll(".po-share-btn").forEach(btn => {
        const po = list[Number(btn.dataset.idx)];

        const details =
            (po.Name || "Post Office") + " (" + (po.Pincode || "N/A") + ")\n" +
            (po.District || "N/A") + ", " + (po.State || "N/A");

        btn.addEventListener("click", () => {
            shareResult("Pincode " + (po.Pincode || ""), details);
        });
    });

    $("resultBox").classList.remove("hidden");
}

/* MAIN SEARCH FORM */

function initSearchForm() {
    const form = $("lookupForm");
    const searchBtn = $("searchBtn");

    if (!form || !searchBtn) return;

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (searching) return;

        const query = $("searchInput")?.value.trim() || "";

        if (!query) {
            setStatus(t("empty"), "error");
            return;
        }

        // Automatically recognize a six-digit pincode.
        if (currentMode === "ifsc" && /^\d{6}$/.test(query)) {
            switchMode("pincode");
            quickFill(query);
            return;
        }

        lastRetryFn = () => form.requestSubmit();

        searching = true;
        searchBtn.disabled = true;
        searchBtn.textContent = t("loading");

        $("resultBox").innerHTML = "";
        $("resultBox").classList.add("hidden");

        setStatus(t("fetching"), "info");

        try {
            if (currentMode === "ifsc") {
                await searchIFSC(query);
                setStatus(t("verified"), "success");
            } else if (currentMode === "pincode") {
                await searchPincode(query);
                setStatus(t("found"), "success");
            } else {
                await searchArea(query);
                setStatus(t("found"), "success");
            }
        } catch (error) {
            const messages = {
                INVALID_IFSC: t("invalidIFSC"),
                INVALID_PIN: t("invalidPIN"),
                SHORT_AREA: t("shortArea"),
                NO_DATA: t("noData"),
                TIMEOUT: t("timeout"),
                API_ERROR: t("serverError")
            };

            const canRetry = ![
                "INVALID_IFSC",
                "INVALID_PIN",
                "SHORT_AREA",
                "NO_DATA"
            ].includes(error.message);

            const smartButton = error.message === "INVALID_IFSC"
                ? {
                    label: currentLang === "hi" ? "🏛️ बैंक से खोजें" : "🏛️ Find by Bank",
                    action: () => $("tabBank")?.click()
                }
                : null;

            setStatus(
                messages[error.message] || t("error"),
                "error",
                canRetry,
                smartButton
            );
        } finally {
            searching = false;
            searchBtn.disabled = false;
            searchBtn.textContent = t("search");
        }
    });
}

/* FAQ */

function initFAQs() {
    document.querySelectorAll(".faq-q").forEach(btn => {
        btn.addEventListener("click", () => {
            const item = btn.closest(".faq-item");
            if (!item) return;

            const isOpen = item.classList.toggle("open");
            const symbol = btn.querySelector("span");

            if (symbol) symbol.textContent = isOpen ? "−" : "+";
        });
    });
}

/* THEME */

function applySavedTheme() {
    const isDark = storageGet("ifscpin_theme", "light") === "dark";

    document.body.classList.toggle("light-mode", !isDark);

    const btn = $("themeToggle");
    if (btn) btn.textContent = isDark ? "☀️" : "🌙";
}

function toggleTheme() {
    const isLight = document.body.classList.toggle("light-mode");

    const btn = $("themeToggle");
    if (btn) btn.textContent = isLight ? "🌙" : "☀️";

    storageSet("ifscpin_theme", isLight ? "light" : "dark");
}

/* BANK FINDER — DOCUMENTED RAZORPAY API */

function openBankFinder(btn) {
    document.querySelectorAll(".mode-tab").forEach(tab => {
        tab.classList.remove("active");
    });

    if (btn) btn.classList.add("active");

    if ($("lookupForm")) $("lookupForm").classList.add("hidden");
    if ($("examplesRow")) $("examplesRow").classList.add("hidden");
    if ($("bankFinderBox")) $("bankFinderBox").classList.remove("hidden");
    if ($("resultBox")) $("resultBox").classList.add("hidden");
    if ($("statusMsg")) $("statusMsg").textContent = "";

    if (!banksLoaded) loadAllBanks();
}

function showLookupMode() {
    if ($("bankFinderBox")) $("bankFinderBox").classList.add("hidden");
    if ($("lookupForm")) $("lookupForm").classList.remove("hidden");
    if ($("examplesRow")) $("examplesRow").classList.remove("hidden");
}

function fillSelect(select, placeholder, values) {
    if (!select) return;

    select.innerHTML =
        `<option value="">${escapeHTML(placeholder)}</option>` +
        values.map(value =>
            `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`
        ).join("");

    select.disabled = false;
}

function resetSelect(select, placeholder) {
    if (!select) return;

    select.innerHTML = `<option value="">${escapeHTML(placeholder)}</option>`;
    select.disabled = true;
}

async function bankAPI(params) {
    const query = new URLSearchParams(params);

    return fetchData(
        "https://ifsc.razorpay.com/places?" + query.toString()
    );
}

async function bankSearchAPI(params) {
    const query = new URLSearchParams(params);

    return fetchData(
        "https://ifsc.razorpay.com/search?" + query.toString()
    );
}

async function loadAllBanks() {
    const select = $("bfBank");
    if (!select) return;

    select.innerHTML = `<option value="">${escapeHTML(t("loadingBanks"))}</option>`;
    select.disabled = true;

    try {
        const data = await fetchData(
            "https://ifsc.razorpay.com/banks"
        );

        let entries = [];

        if (Array.isArray(data)) {
            entries = data.map(item => [
                item.BANKCODE || item.bankcode || item.code,
                item.BANK || item.bank || item.name
            ]);
        } else if (data && typeof data === "object") {
            entries = Object.entries(data);
        }

        entries = entries
            .filter(([code, name]) => code && name)
            .sort((a, b) => String(a[1]).localeCompare(String(b[1])));

        if (!entries.length) throw new Error("NO_BANKS");

        select.innerHTML =
            `<option value="">${escapeHTML(t("selectBank"))}</option>` +
            entries.map(([code, name]) =>
                `<option value="${escapeHTML(code)}">${escapeHTML(name)} (${escapeHTML(code)})</option>`
            ).join("");

        select.disabled = false;
        banksLoaded = true;
    } catch {
        select.innerHTML =
            `<option value="">${escapeHTML(t("bankLoadError"))}</option>`;
        select.disabled = false;

        setStatus(t("bankLoadError"), "error", true);
        lastRetryFn = loadAllBanks;
    }
}

function selectQuickBank(code) {
    const select = $("bfBank");
    if (!select) return;

    if (!banksLoaded) {
        loadAllBanks().then(() => {
            select.value = code;
            select.dispatchEvent(new Event("change"));
        });
    } else {
        select.value = code;
        select.dispatchEvent(new Event("change"));
    }
}

function normalizeList(data, possibleKeys) {
    if (Array.isArray(data)) return data.filter(Boolean);

    if (data && typeof data === "object") {
        for (const key of possibleKeys) {
            if (Array.isArray(data[key])) return data[key].filter(Boolean);
        }
    }

    return [];
}

async function handleBankChange() {
    const bankCode = $("bfBank")?.value || "";

    const stateSelect = $("bfState");
    const districtSelect = $("bfDistrict");
    const branchSelect = $("bfBranch");

    const requestId = ++bankRequestId;

    resetSelect(stateSelect, t("selectBankFirst"));
    resetSelect(districtSelect, t("selectStateFirst"));
    resetSelect(branchSelect, t("selectDistrictFirst"));

    if ($("resultBox")) $("resultBox").classList.add("hidden");
    if ($("statusMsg")) $("statusMsg").textContent = "";

    if (!bankCode) return;

    stateSelect.disabled = true;
    stateSelect.innerHTML = `<option value="">${escapeHTML(t("loading"))}</option>`;

    try {
        const data = await bankAPI({ bankcode: bankCode });

        if (requestId !== bankRequestId) return;

        const states = normalizeList(data, ["STATE", "state", "states"])
            .map(value => String(value).trim())
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        if (!states.length) {
            resetSelect(stateSelect, t("noStates"));
            return;
        }

        fillSelect(stateSelect, t("selectState"), states);
    } catch {
        if (requestId !== bankRequestId) return;

        resetSelect(stateSelect, t("directoryError"));
        setStatus(t("directoryError"), "error", true);
        lastRetryFn = handleBankChange;
    }
}

async function handleStateChange() {
    const bankCode = $("bfBank")?.value || "";
    const state = $("bfState")?.value || "";

    const districtSelect = $("bfDistrict");
    const branchSelect = $("bfBranch");

    const requestId = ++placesRequestId;

    resetSelect(districtSelect, t("selectStateFirst"));
    resetSelect(branchSelect, t("selectDistrictFirst"));

    if (!bankCode || !state) return;

    districtSelect.innerHTML = `<option value="">${escapeHTML(t("loading"))}</option>`;
    districtSelect.disabled = true;

    try {
        const data = await bankAPI({
            bankcode: bankCode,
            state: state
        });

        if (requestId !== placesRequestId) return;

        const districts = normalizeList(data, [
            "DISTRICT", "district", "CITY", "city", "cities"
        ])
            .map(value => String(value).trim())
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        if (!districts.length) {
            resetSelect(districtSelect, t("noDistricts"));
            return;
        }

        fillSelect(districtSelect, t("selectDistrict"), districts);
    } catch {
        if (requestId !== placesRequestId) return;

        resetSelect(districtSelect, t("directoryError"));
        setStatus(t("directoryError"), "error", true);
        lastRetryFn = handleStateChange;
    }
}

async function handleDistrictChange() {
    const bankCode = $("bfBank")?.value || "";
    const state = $("bfState")?.value || "";
    const district = $("bfDistrict")?.value || "";

    const branchSelect = $("bfBranch");

    resetSelect(branchSelect, t("selectDistrictFirst"));

    if (!bankCode || !state || !district) return;

    branchSelect.innerHTML = `<option value="">${escapeHTML(t("loading"))}</option>`;
    branchSelect.disabled = true;

    try {
        const data = await bankSearchAPI({
            bankcode: bankCode,
            state: state,
            city: district,
            limit: "1000",
            offset: "0"
        });

        const branches = normalizeList(data, [
            "branches", "results", "data"
        ]);

        if (!branches.length) {
            resetSelect(branchSelect, t("noBranches"));
            return;
        }

        const validBranches = branches
            .filter(item => item && item.IFSC)
            .sort((a, b) =>
                String(a.BRANCH || "").localeCompare(String(b.BRANCH || ""))
            );

        if (!validBranches.length) {
            resetSelect(branchSelect, t("noBranches"));
            return;
        }

        branchSelect.innerHTML =
            `<option value="">${escapeHTML(t("selectBranch"))}</option>` +
            validBranches.map(branch => `
                <option value="${escapeHTML(branch.IFSC)}">
                    ${escapeHTML(branch.BRANCH || "Branch")} (${escapeHTML(branch.IFSC)})
                </option>
            `).join("");

        branchSelect.disabled = false;
    } catch {
        resetSelect(branchSelect, t("directoryError"));
        setStatus(t("directoryError"), "error", true);
        lastRetryFn = handleDistrictChange;
    }
}

async function handleBranchChange() {
    const ifsc = $("bfBranch")?.value || "";
    if (!ifsc) return;

    lastRetryFn = handleBranchChange;

    if ($("resultBox")) $("resultBox").classList.add("hidden");

    setStatus(t("fetching"), "info");

    try {
        await searchIFSC(ifsc);
        setStatus(t("verified"), "success");
    } catch (error) {
        const message = error.message === "NO_DATA"
            ? t("noData")
            : t("error");

        setStatus(message, "error", true);
    }
}

/* INITIALIZATION */

function initBankFinder() {
    const bank = $("bfBank");
    const state = $("bfState");
    const district = $("bfDistrict");
    const branch = $("bfBranch");

    if (bank) bank.addEventListener("change", handleBankChange);
    if (state) state.addEventListener("change", handleStateChange);
    if (district) district.addEventListener("change", handleDistrictChange);
    if (branch) branch.addEventListener("change", handleBranchChange);

    ["tabIfsc", "tabPin", "tabArea"].forEach(id => {
        const tab = $(id);
        if (!tab) return;

        tab.addEventListener("click", showLookupMode);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderFavorites();
    renderRecent();

    switchMode("ifsc");

    initSearchForm();
    initFAQs();
    initBankFinder();
    applySavedTheme();

    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("/sw.js").catch(() => {});
        });
    }
});
