/* ==========================================
   IFSCPin — COMPLETE 10-IN-1 EDITION (BUG-FREE)
========================================== */

"use strict";

let currentMode = "ifsc";
let currentLang = "en";
let lastRetryFn = null;
let searching = false;
let banksLoaded = false;
let bankRequestId = 0;
let currentBankBranches = [];

const $ = (id) => document.getElementById(id);

const TEXT = {
    en: {
        badge: "✓ Free Bank & India Post Directory",
        title: 'Find Bank <span class="cyan-text">IFSC</span> & <span class="cyan-text">Pincode</span> Instantly',
        sub: "Search bank branch details, IFSC codes and Indian postal PIN codes.",
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
        noData: "No results found. Check the spelling or try 'Find by Bank'.",
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
        directoryError: "Unable to load bank branches. Please retry.",
        timeout: "Request timed out. Check internet & retry.",
        serverError: "Service temporarily busy. Please retry.",
        copyError: "Unable to copy. Please try again.",
        feedbackPrompt: "Please write your feedback first.",
        locationDenied: "Location not allowed. Opening normal Maps search."
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
        noData: "कोई जानकारी नहीं मिली। 'Find by Bank' आज़माएँ।",
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
        directoryError: "बैंक की जानकारी लोड नहीं हुई। फिर कोशिश करें।",
        timeout: "इंटरनेट धीमा है। फिर कोशिश करें।",
        serverError: "सर्वर अभी व्यस्त है। फिर कोशिश करें।",
        copyError: "कॉपी नहीं हो पाया।",
        feedbackPrompt: "कृपया पहले अपना फीडबैक लिखें।",
        locationDenied: "लोकेशन अनुमति नहीं मिली। Maps सर्च खोल रहे हैं।"
    }
};

function t(key) { return TEXT[currentLang]?.[key] || TEXT.en[key] || key; }

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function storageGet(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch { return fallback; }
}
function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch {}
}

function setLang(lang) {
    if (!TEXT[lang]) return;
    currentLang = lang;
    if ($("langEn")) $("langEn").classList.toggle("active", lang === "en");
    if ($("langHi")) $("langHi").classList.toggle("active", lang === "hi");
    if ($("trustBadge")) $("trustBadge").textContent = t("badge");
    if ($("heroTitle")) $("heroTitle").innerHTML = t("title");
    if ($("heroSub")) $("heroSub").textContent = t("sub");
    if ($("howHeading")) $("howHeading").textContent = t("how");
    if ($("searchBtn")) $("searchBtn").textContent = searching ? t("loading") : t("search");
    renderRecent();
    renderFavorites();
}

function setStatus(message, type = "info", showRetry = false, smartSuggestion = null) {
    const status = $("statusMsg");
    if (!status) return;
    status.className = "status-msg " + type;
    status.textContent = message;

    if (smartSuggestion) {
        const sBtn = document.createElement("button");
        sBtn.type = "button";
        sBtn.className = "retry-btn";
        sBtn.textContent = smartSuggestion.label;
        sBtn.addEventListener("click", smartSuggestion.action);
        status.appendChild(sBtn);
    }
    if (showRetry && typeof lastRetryFn === "function") {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "retry-btn";
        btn.textContent = t("retry");
        btn.addEventListener("click", () => lastRetryFn());
        status.appendChild(btn);
    }
}

function switchMode(mode) {
    if (!["ifsc", "pincode", "area"].includes(mode)) return;
    currentMode = mode;
    const input = $("searchInput"), label = $("inputLabel"), examples = $("examplesRow");
    if (!input || !label || !examples) return;

    document.querySelectorAll(".mode-tab").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
    input.value = "";
    if ($("resultBox")) { $("resultBox").innerHTML = ""; $("resultBox").classList.add("hidden"); }
    if ($("statusMsg")) $("statusMsg").textContent = "";

    const cfg = {
        ifsc: { label: "Enter 11-Character IFSC Code", ph: "e.g. SBIN0000691", ex: [["SBIN0000691", "SBIN0000691"], ["HDFC0000001", "HDFC0000001"], ["ICIC0000001", "ICIC0000001"]] },
        pincode: { label: "Enter 6-Digit India Pincode", ph: "e.g. 226001", ex: [["226001", "226001 (Lucknow)"], ["110001", "110001 (Delhi)"], ["400001", "400001 (Mumbai)"]] },
        area: { label: "Enter City or Area Name", ph: "e.g. Gomti Nagar, Jaipur", ex: [["Gomti Nagar", "Gomti Nagar"], ["Andheri", "Andheri"], ["Jaipur", "Jaipur"]] }
    }[mode];

    label.textContent = cfg.label;
    input.placeholder = cfg.ph;
    input.style.textTransform = mode === "ifsc" ? "uppercase" : "none";
    examples.innerHTML = `<span>Try:</span>` + cfg.ex.map(([v, d]) => `<button type="button" class="ex-chip" data-value="${escapeHTML(v)}">${escapeHTML(d)}</button>`).join("");
    examples.querySelectorAll(".ex-chip").forEach(b => b.addEventListener("click", () => quickFill(b.dataset.value)));
}

function quickFill(value) {
    const input = $("searchInput"), form = $("lookupForm");
    if (!input || !form) return;
    input.value = value;
    if (typeof form.requestSubmit === "function") form.requestSubmit();
    else form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

function getRecent() {
    try {
        const d = JSON.parse(storageGet("ifscpin_recent", "[]"));
        return Array.isArray(d) ? d.filter(i => i && ["ifsc", "pincode", "area"].includes(i.mode) && typeof i.query === "string").slice(0, 4) : [];
    } catch { return []; }
}
function saveRecent(mode, query) {
    const items = getRecent().filter(i => !(i.mode === mode && i.query === query));
    items.unshift({ mode, query });
    storageSet("ifscpin_recent", JSON.stringify(items.slice(0, 4)));
    renderRecent();
}
function renderRecent() {
    const wrap = $("recentSearches");
    if (!wrap) return;
    const items = getRecent();
    if (!items.length) { wrap.innerHTML = ""; return; }
    wrap.innerHTML = `<div class="recent-wrap"><span>${t("recent")}</span>` +
        items.map(i => `<button type="button" class="recent-chip" data-mode="${i.mode}" data-query="${escapeHTML(i.query)}">${escapeHTML(i.query)}</button>`).join("") + `</div>`;
    wrap.querySelectorAll(".recent-chip").forEach(b => b.addEventListener("click", () => {
        showLookupMode();
        switchMode(b.dataset.mode);
        quickFill(b.dataset.query);
    }));
}

function getFavorites() {
    try {
        const d = JSON.parse(storageGet("ifscpin_favs", "[]"));
        return Array.isArray(d) ? d.filter(i => i && typeof i.ifsc === "string").slice(0, 5) : [];
    } catch { return []; }
}
function toggleFavorite(ifsc, label) {
    let favs = getFavorites();
    const exists = favs.some(f => f.ifsc === ifsc);
    favs = exists ? favs.filter(f => f.ifsc !== ifsc) : [{ ifsc, label }, ...favs];
    storageSet("ifscpin_favs", JSON.stringify(favs.slice(0, 5)));
    renderFavorites();
    const btn = $("favIfscBtn");
    if (btn) { btn.classList.toggle("saved", !exists); btn.textContent = !exists ? t("saved") : t("save"); }
}
function renderFavorites() {
    const wrap = $("favoriteBranches");
    if (!wrap) return;
    const favs = getFavorites();
    if (!favs.length) { wrap.innerHTML = ""; return; }
    wrap.innerHTML = `<div class="recent-wrap"><span>${t("favs")}</span>` +
        favs.map(f => `<button type="button" class="recent-chip" data-ifsc="${escapeHTML(f.ifsc)}">⭐ ${escapeHTML(f.label)} (${escapeHTML(f.ifsc)})</button>`).join("") + `</div>`;
    wrap.querySelectorAll(".recent-chip").forEach(b => b.addEventListener("click", () => {
        showLookupMode();
        switchMode("ifsc");
        quickFill(b.dataset.ifsc);
    }));
}

async function fetchData(url, timeoutMs = 12000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(res.status === 404 ? "NO_DATA" : "API_ERROR");
        return await res.json();
    } catch (e) {
        if (e.name === "AbortError") throw new Error("TIMEOUT");
        throw e;
    } finally { clearTimeout(timer); }
}

async function copyText(val, btn) {
    try {
        if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(String(val));
        else {
            const ta = document.createElement("textarea");
            ta.value = String(val); ta.style.position = "fixed"; ta.style.opacity = "0";
            document.body.appendChild(ta); ta.select();
            const ok = document.execCommand("copy"); ta.remove();
            if (!ok) throw new Error();
        }
        if (btn) { const orig = btn.textContent; btn.textContent = t("copied"); setTimeout(() => { if (btn.isConnected) btn.textContent = orig; }, 1600); }
    } catch { setStatus(t("copyError"), "error"); }
}

async function shareResult(title, text) {
    if (navigator.share) {
        try { await navigator.share({ title, text, url: "https://ifscpin.pages.dev/" }); return; }
        catch (e) { if (e.name === "AbortError") return; }
    }
    window.open("https://wa.me/?text=" + encodeURIComponent(text + "\n\nFind more: https://ifscpin.pages.dev/"), "_blank", "noopener,noreferrer");
}

function findNearbyBank(bankName) {
    const fallback = () => window.open("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(bankName + " near me"), "_blank", "noopener,noreferrer");
    if (!navigator.geolocation) { fallback(); return; }
    navigator.geolocation.getCurrentPosition(
        pos => window.open(`https://www.google.com/maps/search/${encodeURIComponent(bankName)}/@${pos.coords.latitude},${pos.coords.longitude},14z`, "_blank", "noopener,noreferrer"),
        () => { setStatus(t("locationDenied"), "info"); fallback(); },
        { timeout: 7000 }
    );
}

function reportWrongData(contextLabel) {
    const msg = `IFSCPin Wrong Data Report:\nItem: ${contextLabel}\nIssue: `;
    window.open("https://wa.me/918934023097?text=" + encodeURIComponent(msg), "_blank", "noopener,noreferrer");
}

function sendFeedback(type) {
    const msg = $("feedbackInput")?.value.trim() || "";
    if (!msg) { setStatus(t("feedbackPrompt"), "error"); return; }
    if (type === "wa") {
        window.open("https://wa.me/918934023097?text=" + encodeURIComponent("IFSCPin Feedback:\n" + msg), "_blank", "noopener,noreferrer");
    } else {
        window.location.href = "mailto:rm6129306@gmail.com?subject=" + encodeURIComponent("IFSCPin Feedback / Report") + "&body=" + encodeURIComponent(msg);
    }
}

async function searchIFSC(query) {
    const code = String(query).trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(code)) throw new Error("INVALID_IFSC");
    const data = await fetchData(`https://ifsc.razorpay.com/${encodeURIComponent(code)}`);
    if (!data || !data.IFSC || !data.BANK) throw new Error("NO_DATA");

    const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${data.BANK} ${data.BRANCH} ${data.CITY || ""} ${data.ADDRESS || ""}`);
    const details = [`${data.BANK} - ${data.BRANCH}`, `IFSC: ${data.IFSC}`, `MICR: ${data.MICR || "N/A"}`, `Address: ${data.ADDRESS || "N/A"}`, `City: ${data.CITY || "N/A"}, State: ${data.STATE || "N/A"}`].join("\n");
    const isFav = getFavorites().some(f => f.ifsc === data.IFSC);

    $("resultBox").innerHTML = `
        <div class="bank-card">
            <div class="bank-title">${escapeHTML(data.BANK)}</div>
            <div class="branch-sub">${escapeHTML(data.BRANCH)} Branch</div>
            <div class="detail-grid">
                ${[["IFSC Code", data.IFSC], ["MICR Code", data.MICR || "N/A"], ["City / District", `${data.CITY || "N/A"} / ${data.DISTRICT || "N/A"}`], ["State", data.STATE || "N/A"]].map(([l, v]) =>
                    `<div class="detail-item"><div class="detail-label">${l}</div><div class="detail-val">${escapeHTML(v)}</div></div>`).join("")}
            </div>
            <div class="detail-item" style="margin-bottom:12px"><div class="detail-label">Full Address</div><div class="detail-val">${escapeHTML(data.ADDRESS || "N/A")}</div></div>
            <div class="badges-row">
                ${["UPI", "IMPS", "NEFT", "RTGS"].map(s => `<span class="svc-badge ${data[s] === true ? "" : "no"}">${s}: ${data[s] === true ? "Yes" : "Not confirmed"}</span>`).join("")}
            </div>
            <div class="action-btns">
                <button type="button" class="copy-btn" id="copyCodeOnlyBtn">${t("copyIfsc")}</button>
                <button type="button" class="copy-btn" id="copyIfscBtn">${t("copyAll")}</button>
                <button type="button" class="fav-btn ${isFav ? "saved" : ""}" id="favIfscBtn">${isFav ? t("saved") : t("save")}</button>
                <button type="button" class="share-btn" id="shareIfscBtn">${t("share")}</button>
                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="maps-btn">${t("map")}</a>
                <button type="button" class="nearby-btn" id="nearbyBtn">${t("nearby")}</button>
                <a href="https://wa.me/?text=${encodeURIComponent(details)}" target="_blank" rel="noopener noreferrer" class="wa-btn">📲 WhatsApp</a>
                <button type="button" class="report-btn" id="reportIfscBtn">⚠️ Report</button>
            </div>
            <div class="source-note">Source: Razorpay IFSC Public API (RBI / NPCI) • Checked: ${new Date().toLocaleDateString("en-IN")}. Confirm with your bank before transfers.</div>
        </div>`;

    $("resultBox").classList.remove("hidden");
    $("copyCodeOnlyBtn").addEventListener("click", function () { copyText(data.IFSC, this); });
    $("copyIfscBtn").addEventListener("click", function () { copyText(details, this); });
    $("favIfscBtn").addEventListener("click", () => toggleFavorite(data.IFSC, data.BRANCH));
    $("shareIfscBtn").addEventListener("click", () => shareResult(`${data.BANK} IFSC`, details));
    $("nearbyBtn").addEventListener("click", () => findNearbyBank(data.BANK));
    $("reportIfscBtn").addEventListener("click", () => reportWrongData(`IFSC ${data.IFSC} (${data.BANK})`));
    saveRecent("ifsc", code);
}

async function searchPincode(query) {
    const pin = String(query).trim();
    if (!/^\d{6}$/.test(pin)) throw new Error("INVALID_PIN");
    const json = await fetchData(`https://api.postalpincode.in/pincode/${encodeURIComponent(pin)}`);
    if (!json[0] || json[0].Status !== "Success" || !Array.isArray(json[0].PostOffice)) throw new Error("NO_DATA");
    renderPostOffices(json[0].PostOffice);
    saveRecent("pincode", pin);
}

async function searchArea(query) {
    const area = String(query).trim();
    if (area.length < 3) throw new Error("SHORT_AREA");
    const json = await fetchData(`https://api.postalpincode.in/postoffice/${encodeURIComponent(area)}`);
    if (!json[0] || json[0].Status !== "Success" || !Array.isArray(json[0].PostOffice)) throw new Error("NO_DATA");
    renderPostOffices(json[0].PostOffice.slice(0, 20));
    saveRecent("area", area);
}

function renderPostOffices(list) {
    $("resultBox").innerHTML = `<div class="po-list">` + list.map((po, i) => {
        const details = `${po.Name} (${po.Pincode})\nDivision: ${po.Division || "N/A"}\n${po.District}, ${po.State}`;
        return `<div class="po-card">
            <div>
                <div class="po-name">${escapeHTML(po.Name)} <small>(${escapeHTML(po.BranchType || "Post Office")})</small></div>
                <div class="po-meta"><strong>Division:</strong> ${escapeHTML(po.Division || "N/A")} • <strong>District:</strong> ${escapeHTML(po.District)}, <strong>State:</strong> ${escapeHTML(po.State)} • ${escapeHTML(po.DeliveryStatus)}</div>
            </div>
            <div class="po-right">
                <div class="po-pin">${escapeHTML(po.Pincode)}</div>
                <button type="button" class="share-btn po-copy-btn" data-idx="${i}">📋</button>
                <button type="button" class="share-btn po-share-btn" data-idx="${i}">📤</button>
                <a href="https://wa.me/?text=${encodeURIComponent(details)}" target="_blank" rel="noopener noreferrer" class="wa-btn">📲</a>
            </div>
        </div>`;
    }).join("") + `</div><div class="source-note">Source: India Post Public API • Checked: ${new Date().toLocaleDateString("en-IN")}.</div>`;

    $("resultBox").querySelectorAll(".po-copy-btn").forEach(b => b.addEventListener("click", function () { copyText(list[Number(b.dataset.idx)].Pincode || "", this); }));
    $("resultBox").querySelectorAll(".po-share-btn").forEach(b => {
        const po = list[Number(b.dataset.idx)];
        b.addEventListener("click", () => shareResult(`Pincode ${po.Pincode}`, `${po.Name} (${po.Pincode})\n${po.District}, ${po.State}`));
    });
    $("resultBox").classList.remove("hidden");
}

function applySavedTheme() {
    const isDark = storageGet("ifscpin_theme", "light") === "dark";
    document.body.classList.toggle("light-mode", !isDark);
    if ($("themeToggle")) $("themeToggle").textContent = isDark ? "☀️" : "🌙";
}
function toggleTheme() {
    const isLight = document.body.classList.toggle("light-mode");
    if ($("themeToggle")) $("themeToggle").textContent = isLight ? "🌙" : "☀️";
    storageSet("ifscpin_theme", isLight ? "light" : "dark");
}

/* BANK FINDER — ZERO-ERROR BUILT-IN + 4-MIRROR CDN */
const MAJOR_BANKS = [
    ["AIRP", "Airtel Payments Bank"], ["AUBL", "AU Small Finance Bank"], ["UTIB", "Axis Bank"],
    ["BDBL", "Bandhan Bank"], ["BARB", "Bank of Baroda"], ["BKID", "Bank of India"],
    ["MAHB", "Bank of Maharashtra"], ["CNRB", "Canara Bank"], ["CBIN", "Central Bank of India"],
    ["CIUB", "City Union Bank"], ["CSBK", "CSB Bank"], ["DCBL", "DCB Bank"],
    ["DLXB", "Dhanlaxmi Bank"], ["ESFB", "Equitas Small Finance Bank"], ["FDRL", "Federal Bank"],
    ["HDFC", "HDFC Bank"], ["ICIC", "ICICI Bank"], ["IBKL", "IDBI Bank"],
    ["IDFB", "IDFC FIRST Bank"], ["IDIB", "Indian Bank"], ["IOBA", "Indian Overseas Bank"],
    ["IPOS", "India Post Payments Bank"], ["INDB", "IndusInd Bank"], ["JAKA", "Jammu & Kashmir Bank"],
    ["JSFB", "Jana Small Finance Bank"], ["JIOP", "Jio Payments Bank"], ["KARB", "Karnataka Bank"],
    ["KVBL", "Karur Vysya Bank"], ["KKBK", "Kotak Mahindra Bank"], ["NTBL", "Nainital Bank"],
    ["PYTM", "Paytm Payments Bank"], ["PSIB", "Punjab & Sind Bank"], ["PUNB", "Punjab National Bank"],
    ["RATN", "RBL Bank"], ["SRCB", "Saraswat Co-operative Bank"], ["SIBL", "South Indian Bank"],
    ["SCBL", "Standard Chartered Bank"], ["SBIN", "State Bank of India"], ["SURY", "Suryoday Small Finance Bank"],
    ["TMBL", "Tamilnad Mercantile Bank"], ["UCBA", "UCO Bank"], ["UJVN", "Ujjivan Small Finance Bank"],
    ["UBIN", "Union Bank of India"], ["UTKS", "Utkarsh Small Finance Bank"], ["YESB", "Yes Bank"]
];

function openBankFinder(btn) {
    document.querySelectorAll(".mode-tab").forEach(tab => tab.classList.remove("active"));
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

function populateBankSelect(entries) {
    const sel = $("bfBank");
    if (!sel) return;
    sel.innerHTML = `<option value="">${escapeHTML(t("selectBank"))}</option>` +
        entries.map(([code, name]) => `<option value="${escapeHTML(code)}">${escapeHTML(name)} (${escapeHTML(code)})</option>`).join("");
    sel.disabled = false;
    banksLoaded = true;
}

async function loadAllBanks() {
    populateBankSelect(MAJOR_BANKS);
    const urls = [
        "https://fastly.jsdelivr.net/gh/razorpay/ifsc@master/src/banknames.json",
        "https://gcore.jsdelivr.net/gh/razorpay/ifsc@master/src/banknames.json",
        "https://raw.githubusercontent.com/razorpay/ifsc/master/src/banknames.json"
    ];
    for (const url of urls) {
        try {
            const data = await fetchData(url, 8000);
            if (data && typeof data === "object" && !Array.isArray(data)) {
                const entries = Object.entries(data).filter(([c, n]) => c && n).sort((a, b) => String(a[1]).localeCompare(String(b[1])));
                if (entries.length > 0 && !$("bfBank")?.value) populateBankSelect(entries);
                break;
            }
        } catch {}
    }
}

function selectQuickBank(code) {
    const sel = $("bfBank");
    if (!sel) return;
    if (!banksLoaded) populateBankSelect(MAJOR_BANKS);
    sel.value = code;
    sel.dispatchEvent(new Event("change"));
}

async function fetchBankJson(bankcode) {
    const c = encodeURIComponent(bankcode);
    const urls = [
        `https://fastly.jsdelivr.net/gh/razorpay/ifsc-api@master/data/${c}.json`,
        `https://gcore.jsdelivr.net/gh/razorpay/ifsc-api@master/data/${c}.json`,
        `https://raw.githubusercontent.com/razorpay/ifsc-api/master/data/${c}.json`,
        `https://cdn.jsdelivr.net/gh/razorpay/ifsc-api@master/data/${c}.json`
    ];
    for (const url of urls) {
        try {
            const raw = await fetchData(url, 15000);
            if (!raw) continue;
            return Array.isArray(raw) ? raw : Object.entries(raw).map(([ifsc, obj]) => ({ IFSC: ifsc, ...obj }));
        } catch {}
    }
    return null;
}

function resetSelect(sel, ph) { if (sel) { sel.innerHTML = `<option value="">${escapeHTML(ph)}</option>`; sel.disabled = true; } }
function fillSelect(sel, ph, vals) {
    if (!sel) return;
    sel.innerHTML = `<option value="">${escapeHTML(ph)}</option>` + vals.map(v => `<option value="${escapeHTML(v)}">${escapeHTML(v)}</option>`).join("");
    sel.disabled = false;
}

async function handleBankChange() {
    const bankCode = $("bfBank")?.value || "";
    const stateSel = $("bfState"), distSel = $("bfDistrict"), brSel = $("bfBranch");
    const reqId = ++bankRequestId;
    currentBankBranches = [];
    resetSelect(stateSel, t("selectBankFirst"));
    resetSelect(distSel, t("selectStateFirst"));
    resetSelect(brSel, t("selectDistrictFirst"));
    if ($("resultBox")) $("resultBox").classList.add("hidden");
    if ($("statusMsg")) $("statusMsg").textContent = "";
    if (!bankCode) return;

    stateSel.innerHTML = `<option value="">${escapeHTML(t("loading"))}</option>`;
    stateSel.disabled = true;
    const list = await fetchBankJson(bankCode);
    if (reqId !== bankRequestId) return;
    if (!list || !list.length) {
        resetSelect(stateSel, t("noStates"));
        setStatus(t("directoryError"), "error", true);
        lastRetryFn = handleBankChange;
        return;
    }
    currentBankBranches = list;
    const states = [...new Set(list.map(b => String(b.STATE || "OTHER").trim().toUpperCase()).filter(Boolean))].sort();
    fillSelect(stateSel, t("selectState"), states);
}

function handleStateChange() {
    const state = $("bfState")?.value || "", distSel = $("bfDistrict"), brSel = $("bfBranch");
    resetSelect(distSel, t("selectStateFirst"));
    resetSelect(brSel, t("selectDistrictFirst"));
    if (!state || !currentBankBranches.length) return;
    const dists = [...new Set(currentBankBranches.filter(b => String(b.STATE || "OTHER").trim().toUpperCase() === state).map(b => String(b.DISTRICT || b.CITY || "OTHER").trim().toUpperCase()).filter(Boolean))].sort();
    fillSelect(distSel, t("selectDistrict"), dists);
}

function handleDistrictChange() {
    const state = $("bfState")?.value || "", dist = $("bfDistrict")?.value || "", brSel = $("bfBranch");
    resetSelect(brSel, t("selectDistrictFirst"));
    if (!state || !dist || !currentBankBranches.length) return;
    const branches = currentBankBranches.filter(b => b && b.IFSC && String(b.STATE || "OTHER").trim().toUpperCase() === state && String(b.DISTRICT || b.CITY || "OTHER").trim().toUpperCase() === dist).sort((a, b) => String(a.BRANCH || "").localeCompare(String(b.BRANCH || "")));
    brSel.innerHTML = `<option value="">${escapeHTML(t("selectBranch"))}</option>` + branches.map(b => `<option value="${escapeHTML(b.IFSC)}">${escapeHTML(b.BRANCH || "Branch")} (${escapeHTML(b.IFSC)})</option>`).join("");
    brSel.disabled = false;
}

async function handleBranchChange() {
    const ifsc = $("bfBranch")?.value || "";
    if (!ifsc) return;
    lastRetryFn = handleBranchChange;
    if ($("resultBox")) $("resultBox").classList.add("hidden");
    setStatus(t("fetching"), "info");
    try { await searchIFSC(ifsc); setStatus(t("verified"), "success"); }
    catch (e) { setStatus(e.message === "NO_DATA" ? t("noData") : t("error"), "error", true); }
}

document.addEventListener("DOMContentLoaded", () => {
    renderFavorites();
    renderRecent();
    switchMode("ifsc");
    applySavedTheme();

    const form = $("lookupForm"), searchBtn = $("searchBtn");
    if (form && searchBtn) {
        form.addEventListener("submit", async event => {
            event.preventDefault();
            if (searching) return;
            const query = $("searchInput")?.value.trim() || "";
            if (!query) { setStatus(t("empty"), "error"); return; }
            if (currentMode === "ifsc" && /^\d{6}$/.test(query)) { switchMode("pincode"); quickFill(query); return; }

            lastRetryFn = () => form.requestSubmit();
            searching = true; searchBtn.disabled = true; searchBtn.textContent = t("loading");
            $("resultBox").innerHTML = ""; $("resultBox").classList.add("hidden");
            setStatus(t("fetching"), "info");
            try {
                if (currentMode === "ifsc") { await searchIFSC(query); setStatus(t("verified"), "success"); }
                else if (currentMode === "pincode") { await searchPincode(query); setStatus(t("found"), "success"); }
                else { await searchArea(query); setStatus(t("found"), "success"); }
            } catch (error) {
                const msgs = { INVALID_IFSC: t("invalidIFSC"), INVALID_PIN: t("invalidPIN"), SHORT_AREA: t("shortArea"), NO_DATA: t("noData"), TIMEOUT: t("timeout"), API_ERROR: t("serverError") };
                const canRetry = !["INVALID_IFSC", "INVALID_PIN", "SHORT_AREA", "NO_DATA"].includes(error.message);
                const smartBtn = error.message === "INVALID_IFSC" ? { label: "🏛️ Find by Bank", action: () => $("tabBank")?.click() } : null;
                setStatus(msgs[error.message] || t("error"), "error", canRetry, smartBtn);
            } finally { searching = false; searchBtn.disabled = false; searchBtn.textContent = t("search"); }
        });
    }

    document.querySelectorAll(".faq-q").forEach(btn => btn.addEventListener("click", () => {
        const item = btn.closest(".faq-item");
        if (!item) return;
        const open = item.classList.toggle("open");
        const sym = btn.querySelector("span");
        if (sym) sym.textContent = open ? "−" : "+";
    }));

    if ($("bfBank")) $("bfBank").addEventListener("change", handleBankChange);
    if ($("bfState")) $("bfState").addEventListener("change", handleStateChange);
    if ($("bfDistrict")) $("bfDistrict").addEventListener("change", handleDistrictChange);
    if ($("bfBranch")) $("bfBranch").addEventListener("change", handleBranchChange);
    ["tabIfsc", "tabPin", "tabArea"].forEach(id => $(id)?.addEventListener("click", showLookupMode));

    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
    }
});
