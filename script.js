/* ==========================================
   IFSCPin — COMPLETE 10-IN-1 EDITION
   Smart Search | Bank Directory | Nearby GPS
   Copy IFSC/All | Favorites | Division | Share
   Feedback/Report | Source | Light/Dark + Retry
========================================== */

"use strict";

let currentMode = "ifsc";
let currentLang = "en";
let lastRetryFn = null;

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
        error: "Something went wrong. Please retry.",
        empty: "Please enter something to search.",
        invalidIFSC: "Not a valid 11-character IFSC (e.g. SBIN0000691). Don't know IFSC? Use 'Find by Bank'!",
        invalidPIN: "Enter a valid 6-digit Pincode (e.g. 226001).",
        shortArea: "Enter at least 3 characters.",
        noData: "No results found. Check spelling or try 'Find by Bank'.",
        recent: "🕒 Recent:",
        favs: "⭐ Favorites:",
        copied: "✓ Copied!",
        copyIfsc: "📋 Copy IFSC",
        copyAll: "📋 Copy All",
        verified: "✓ Bank details loaded!"
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
        error: "कुछ समस्या हुई। फिर कोशिश करें।",
        empty: "कृपया कुछ लिखकर सर्च करें।",
        invalidIFSC: "सही 11 अक्षरों का IFSC डालें। IFSC नहीं पता तो 'Find by Bank' चुनें!",
        invalidPIN: "सही 6 अंकों का पिनकोड डालें (जैसे 226001)।",
        shortArea: "कम से कम 3 अक्षर डालें।",
        noData: "कोई जानकारी नहीं मिली। स्पेलिंग जाँचें या 'Find by Bank' आज़माएँ।",
        recent: "🕒 पिछली सर्च:",
        favs: "⭐ पसंदीदा:",
        copied: "✓ कॉपी हो गया!",
        copyIfsc: "📋 IFSC कॉपी",
        copyAll: "📋 सब कॉपी",
        verified: "✓ बैंक की जानकारी मिल गई!"
    }
};

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
}

function setLang(lang) {
    if (!TEXT[lang]) return;
    currentLang = lang;
    const t = TEXT[lang];
    $("langEn").classList.toggle("active", lang === "en");
    $("langHi").classList.toggle("active", lang === "hi");
    $("trustBadge").textContent = t.badge;
    $("heroTitle").innerHTML = t.title;
    $("heroSub").textContent = t.sub;
    $("howHeading").textContent = t.how;
    $("searchBtn").textContent = t.search;
    renderRecent();
    renderFavorites();
}

function setStatus(message, type = "info", showRetry = false, smartSuggestion = null) {
    const status = $("statusMsg");
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
        btn.textContent = currentLang === "hi" ? "🔄 फिर कोशिश करें" : "🔄 Retry";
        btn.addEventListener("click", () => lastRetryFn());
        status.appendChild(btn);
    }
}

function switchMode(mode) {
    if (!["ifsc", "pincode", "area"].includes(mode)) return;
    currentMode = mode;
    const input = $("searchInput");
    const label = $("inputLabel");
    const examples = $("examplesRow");

    document.querySelectorAll(".mode-tab").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.mode === mode);
    });

    input.value = "";
    $("resultBox").innerHTML = "";
    $("resultBox").classList.add("hidden");
    $("statusMsg").textContent = "";

    const settings = {
        ifsc: {
            label: "Enter 11-Character IFSC Code",
            placeholder: "e.g. SBIN0000691",
            examples: [["SBIN0000691", "SBIN0000691"], ["HDFC0000001", "HDFC0000001"], ["ICIC0000001", "ICIC0000001"]]
        },
        pincode: {
            label: "Enter 6-Digit India Pincode",
            placeholder: "e.g. 226001",
            examples: [["226001", "226001 (Lucknow)"], ["110001", "110001 (Delhi)"], ["400001", "400001 (Mumbai)"]]
        },
        area: {
            label: "Enter City or Area Name",
            placeholder: "e.g. Gomti Nagar, Jaipur",
            examples: [["Gomti Nagar", "Gomti Nagar"], ["Andheri", "Andheri"], ["Jaipur", "Jaipur"]]
        }
    };

    const config = settings[mode];
    label.textContent = config.label;
    input.placeholder = config.placeholder;
    input.style.textTransform = mode === "ifsc" ? "uppercase" : "none";

    examples.innerHTML = `<span>Try:</span>` + config.examples.map(([v, d]) =>
        `<button type="button" class="ex-chip" data-value="${escapeHTML(v)}">${escapeHTML(d)}</button>`
    ).join("");

    examples.querySelectorAll(".ex-chip").forEach(btn => {
        btn.addEventListener("click", () => quickFill(btn.dataset.value));
    });
}

function quickFill(value) {
    $("searchInput").value = value;
    $("lookupForm").requestSubmit();
}

/* RECENT & FAVORITES */
function getRecent() {
    try {
        const data = JSON.parse(localStorage.getItem("ifscpin_recent") || "[]");
        return Array.isArray(data) ? data.filter(i => i && ["ifsc", "pincode", "area"].includes(i.mode) && typeof i.query === "string").slice(0, 4) : [];
    } catch { return []; }
}

function saveRecent(mode, query) {
    try {
        let items = getRecent().filter(i => !(i.mode === mode && i.query === query));
        items.unshift({ mode, query });
        localStorage.setItem("ifscpin_recent", JSON.stringify(items.slice(0, 4)));
        renderRecent();
    } catch {}
}

function renderRecent() {
    const items = getRecent();
    const wrap = $("recentSearches");
    if (!items.length) { wrap.innerHTML = ""; return; }

    wrap.innerHTML = `<div class="recent-wrap"><span>${TEXT[currentLang].recent}</span>` +
        items.map(i => `<button type="button" class="recent-chip" data-mode="${i.mode}" data-query="${escapeHTML(i.query)}">${escapeHTML(i.query)}</button>`).join("") +
        `</div>`;

    wrap.querySelectorAll(".recent-chip").forEach(btn => {
        btn.addEventListener("click", () => {
            $("bankFinderBox").classList.add("hidden");
            $("lookupForm").classList.remove("hidden");
            $("examplesRow").classList.remove("hidden");
            switchMode(btn.dataset.mode);
            quickFill(btn.dataset.query);
        });
    });
}

function getFavorites() {
    try {
        const data = JSON.parse(localStorage.getItem("ifscpin_favs") || "[]");
        return Array.isArray(data) ? data.slice(0, 5) : [];
    } catch { return []; }
}

function toggleFavorite(ifsc, label) {
    let favs = getFavorites();
    const exists = favs.some(f => f.ifsc === ifsc);
    if (exists) {
        favs = favs.filter(f => f.ifsc !== ifsc);
    } else {
        favs.unshift({ ifsc, label });
    }
    localStorage.setItem("ifscpin_favs", JSON.stringify(favs.slice(0, 5)));
    renderFavorites();
    const btn = $("favIfscBtn");
    if (btn) {
        const saved = !exists;
        btn.classList.toggle("saved", saved);
        btn.textContent = saved ? "⭐ Saved" : "☆ Save";
    }
}

function renderFavorites() {
    const favs = getFavorites();
    const wrap = $("favoriteBranches");
    if (!wrap) return;
    if (!favs.length) { wrap.innerHTML = ""; return; }

    wrap.innerHTML = `<div class="recent-wrap"><span>${TEXT[currentLang].favs}</span>` +
        favs.map(f => `<button type="button" class="recent-chip" data-ifsc="${escapeHTML(f.ifsc)}">⭐ ${escapeHTML(f.label)} (${escapeHTML(f.ifsc)})</button>`).join("") +
        `</div>`;

    wrap.querySelectorAll(".recent-chip").forEach(btn => {
        btn.addEventListener("click", () => {
            $("bankFinderBox").classList.add("hidden");
            $("lookupForm").classList.remove("hidden");
            $("examplesRow").classList.remove("hidden");
            switchMode("ifsc");
            quickFill(btn.dataset.ifsc);
        });
    });
}

/* API, COPY, SHARE, NEARBY GPS, REPORT */
async function fetchData(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error("API_ERROR");
        return await response.json();
    } catch (error) {
        if (error.name === "AbortError") throw new Error("TIMEOUT");
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function copyText(text, button) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            const area = document.createElement("textarea");
            area.value = text;
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.select();
            const copied = document.execCommand("copy");
            area.remove();
            if (!copied) throw new Error("COPY_FAILED");
        }
        const original = button.textContent;
        button.textContent = TEXT[currentLang].copied;
        setTimeout(() => { button.textContent = original; }, 1600);
    } catch {
        setStatus("Unable to copy. Please try again.", "error");
    }
}

async function shareResult(title, text) {
    if (navigator.share) {
        try {
            await navigator.share({ title, text, url: "https://ifscpin.pages.dev/" });
            return;
        } catch {}
    }
    window.open("https://wa.me/?text=" + encodeURIComponent(text + "\n\nFind more: https://ifscpin.pages.dev/"), "_blank", "noopener,noreferrer");
}

function findNearbyBank(bankName) {
    if (!navigator.geolocation) {
        window.open("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(bankName + " near me"), "_blank", "noopener,noreferrer");
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            window.open(`https://www.google.com/maps/search/${encodeURIComponent(bankName)}/@${latitude},${longitude},14z`, "_blank", "noopener,noreferrer");
        },
        () => {
            window.open("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(bankName + " near me"), "_blank", "noopener,noreferrer");
        },
        { timeout: 6000 }
    );
}

function reportWrongData(contextLabel) {
    const msg = `IFSCPin Wrong Data Report:\nItem: ${contextLabel}\nIssue: `;
    window.open("https://wa.me/918934023097?text=" + encodeURIComponent(msg), "_blank", "noopener,noreferrer");
}

function sendFeedback(type) {
    const input = $("feedbackInput");
    const msg = (input ? input.value.trim() : "") || "Hi Rahul, feedback for IFSCPin:";
    if (type === "wa") {
        window.open("https://wa.me/918934023097?text=" + encodeURIComponent("IFSCPin Feedback:\n" + msg), "_blank", "noopener,noreferrer");
    } else {
        window.location.href = "mailto:rm6129306@gmail.com?subject=" + encodeURIComponent("IFSCPin Feedback / Report") + "&body=" + encodeURIComponent(msg);
    }
}

/* SEARCH FUNCTIONS */
async function searchIFSC(query) {
    const code = query.toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(code)) throw new Error("INVALID_IFSC");

    const data = await fetchData(`https://ifsc.razorpay.com/${encodeURIComponent(code)}`);
    if (!data || !data.IFSC || !data.BANK) throw new Error("NO_DATA");

    const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(`${data.BANK} ${data.BRANCH} ${data.CITY} ${data.ADDRESS}`);

    const details = [
        `${data.BANK} - ${data.BRANCH}`,
        `IFSC: ${data.IFSC}`,
        `MICR: ${data.MICR || "N/A"}`,
        `Address: ${data.ADDRESS || "N/A"}`,
        `City: ${data.CITY || "N/A"}, State: ${data.STATE || "N/A"}`
    ].join("\n");

    const services = ["UPI", "IMPS", "NEFT", "RTGS"];
    const isFav = getFavorites().some(f => f.ifsc === data.IFSC);

    $("resultBox").innerHTML = `
        <div class="bank-card">
            <div class="bank-title">${escapeHTML(data.BANK)}</div>
            <div class="branch-sub">${escapeHTML(data.BRANCH)} Branch</div>

            <div class="detail-grid">
                ${[
                    ["IFSC Code", data.IFSC],
                    ["MICR Code", data.MICR || "N/A"],
                    ["City / District", `${data.CITY || "N/A"}, ${data.DISTRICT || "N/A"}`],
                    ["State", data.STATE || "N/A"]
                ].map(([label, value]) => `
                    <div class="detail-item">
                        <div class="detail-label">${label}</div>
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
                    return `<span class="svc-badge ${available ? "" : "no"}">${service}: ${available ? "Yes" : "Not confirmed"}</span>`;
                }).join("")}
            </div>

            <div class="action-btns">
                <button type="button" class="copy-btn" id="copyCodeOnlyBtn">${TEXT[currentLang].copyIfsc}</button>
                <button type="button" class="copy-btn" id="copyIfscBtn">${TEXT[currentLang].copyAll}</button>
                <button type="button" class="fav-btn ${isFav ? "saved" : ""}" id="favIfscBtn">${isFav ? "⭐ Saved" : "☆ Save"}</button>
                <button type="button" class="share-btn" id="shareIfscBtn">📤 Share</button>
                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="maps-btn">📍 Map</a>
                <button type="button" class="nearby-btn" id="nearbyBtn">📡 Nearby</button>
                <a href="https://wa.me/?text=${encodeURIComponent(details)}" target="_blank" rel="noopener noreferrer" class="wa-btn">📲 WhatsApp</a>
                <button type="button" class="report-btn" id="reportIfscBtn">⚠️ Report</button>
            </div>

            <div class="source-note">
                Source: Razorpay IFSC Public API (RBI / NPCI records) • Checked: ${new Date().toLocaleDateString("en-IN")}. Please confirm with your bank before large transfers.
            </div>
        </div>
    `;

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
    if (!/^\d{6}$/.test(query)) throw new Error("INVALID_PIN");
    const json = await fetchData(`https://api.postalpincode.in/pincode/${encodeURIComponent(query)}`);
    if (!json[0] || json[0].Status !== "Success" || !json[0].PostOffice) throw new Error("NO_DATA");
    renderPostOffices(json[0].PostOffice);
    saveRecent("pincode", query);
}

async function searchArea(query) {
    if (query.length < 3) throw new Error("SHORT_AREA");
    const json = await fetchData(`https://api.postalpincode.in/postoffice/${encodeURIComponent(query)}`);
    if (!json[0] || json[0].Status !== "Success" || !json[0].PostOffice) throw new Error("NO_DATA");
    renderPostOffices(json[0].PostOffice.slice(0, 20));
    saveRecent("area", query);
}

function renderPostOffices(list) {
    $("resultBox").innerHTML = `
        <div class="po-list">
            ${list.map((po, idx) => {
                const details = `${po.Name} (${po.Pincode})\nDivision: ${po.Division || "N/A"}\nDistrict: ${po.District}, State: ${po.State}\nStatus: ${po.DeliveryStatus}`;
                return `
                    <div class="po-card">
                        <div>
                            <div class="po-name">${escapeHTML(po.Name)} <small>(${escapeHTML(po.BranchType || "Post Office")})</small></div>
                            <div class="po-meta">
                                <strong>Division:</strong> ${escapeHTML(po.Division || "N/A")} •
                                <strong>District:</strong> ${escapeHTML(po.District)},
                                <strong>State:</strong> ${escapeHTML(po.State)} •
                                ${escapeHTML(po.DeliveryStatus)}
                            </div>
                        </div>
                        <div class="po-right">
                            <div class="po-pin">${escapeHTML(po.Pincode)}</div>
                            <button type="button" class="share-btn po-copy-btn" data-idx="${idx}" title="Copy Pincode">📋</button>
                            <button type="button" class="share-btn po-share-btn" data-idx="${idx}" title="Share">📤</button>
                            <a href="https://wa.me/?text=${encodeURIComponent(details)}" target="_blank" rel="noopener noreferrer" class="wa-btn">📲</a>
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
        <div class="source-note">
            Source: India Post Public API (api.postalpincode.in) • Checked: ${new Date().toLocaleDateString("en-IN")}.
        </div>
    `;

    $("resultBox").querySelectorAll(".po-copy-btn").forEach(btn => {
        const po = list[Number(btn.dataset.idx)];
        btn.addEventListener("click", function () { copyText(po.Pincode, this); });
    });

    $("resultBox").querySelectorAll(".po-share-btn").forEach(btn => {
        const po = list[Number(btn.dataset.idx)];
        const details = `${po.Name} (${po.Pincode})\nDivision: ${po.Division || "N/A"}\n${po.District}, ${po.State}`;
        btn.addEventListener("click", () => shareResult(`Pincode ${po.Pincode}`, details));
    });

    $("resultBox").classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
    const form = $("lookupForm");
    const searchBtn = $("searchBtn");
    let searching = false;

    renderFavorites();
    renderRecent();
    switchMode("ifsc");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (searching) return;

        const query = $("searchInput").value.trim();
        if (!query) { setStatus(TEXT[currentLang].empty, "error"); return; }

        /* SMART AUTO-DETECT SUGGESTION */
        if (currentMode === "ifsc" && /^\d{6}$/.test(query)) {
            switchMode("pincode");
            quickFill(query);
            return;
        }

        lastRetryFn = () => form.requestSubmit();
        searching = true;
        searchBtn.disabled = true;
        searchBtn.textContent = TEXT[currentLang].loading;
        $("resultBox").innerHTML = "";
        $("resultBox").classList.add("hidden");
        setStatus(TEXT[currentLang].fetching, "info");

        try {
            if (currentMode === "ifsc") {
                await searchIFSC(query);
                setStatus(TEXT[currentLang].verified, "success");
            } else if (currentMode === "pincode") {
                await searchPincode(query);
                setStatus(TEXT[currentLang].found, "success");
            } else {
                await searchArea(query);
                setStatus(TEXT[currentLang].found, "success");
            }
        } catch (error) {
            const messages = {
                INVALID_IFSC: TEXT[currentLang].invalidIFSC,
                INVALID_PIN: TEXT[currentLang].invalidPIN,
                SHORT_AREA: TEXT[currentLang].shortArea,
                NO_DATA: TEXT[currentLang].noData,
                TIMEOUT: "Request timed out. Check internet & retry.",
                API_ERROR: "Server busy. Please retry."
            };
            const canRetry = !["INVALID_IFSC", "INVALID_PIN", "SHORT_AREA"].includes(error.message);
            const smartBtn = error.message === "INVALID_IFSC"
                ? { label: "🏛️ Open Find by Bank", action: () => $("tabBank").click() }
                : null;
            setStatus(messages[error.message] || TEXT[currentLang].error, "error", canRetry, smartBtn);
        } finally {
            searching = false;
            searchBtn.disabled = false;
            searchBtn.textContent = TEXT[currentLang].search;
        }
    });

    document.querySelectorAll(".faq-q").forEach(btn => {
        btn.addEventListener("click", () => {
            const item = btn.closest(".faq-item");
            const isOpen = item.classList.toggle("open");
            const symbol = btn.querySelector("span");
            if (symbol) symbol.textContent = isOpen ? "−" : "+";
        });
    });
});

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
}

/* ==========================================
   DEFAULT LIGHT MODE + FIXED BANK FINDER
========================================== */
function toggleTheme() {
    const isLight = document.body.classList.toggle("light-mode");
    const btn = $("themeToggle");
    if (btn) btn.textContent = isLight ? "🌙" : "☀️";
    localStorage.setItem("ifscpin_theme", isLight ? "light" : "dark");
}

if (localStorage.getItem("ifscpin_theme") === "dark") {
    document.body.classList.remove("light-mode");
    const btn = $("themeToggle");
    if (btn) btn.textContent = "☀️";
} else {
    document.body.classList.add("light-mode");
    const btn = $("themeToggle");
    if (btn) btn.textContent = "🌙";
}

let banksLoaded = false;
let currentBankBranches = [];

function openBankFinder(btn) {
    document.querySelectorAll(".mode-tab").forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");
    $("lookupForm").classList.add("hidden");
    $("examplesRow").classList.add("hidden");
    $("bankFinderBox").classList.remove("hidden");
    $("resultBox").classList.add("hidden");
    $("statusMsg").textContent = "";
    if (!banksLoaded) loadAllBanks();
}

["tabIfsc", "tabPin", "tabArea"].forEach((id) => {
    const el = $(id);
    if (el) {
        el.addEventListener("click", () => {
            $("bankFinderBox").classList.add("hidden");
            $("lookupForm").classList.remove("hidden");
            $("examplesRow").classList.remove("hidden");
        });
    }
});

async function loadAllBanks() {
    const sel = $("bfBank");
    try {
        const res = await fetch("https://cdn.jsdelivr.net/gh/razorpay/ifsc@master/src/banknames.json");
        const data = await res.json();
        const entries = Object.entries(data).sort((a, b) => a[1].localeCompare(b[1]));
        sel.innerHTML = '<option value="">-- Select Bank --</option>' +
            entries.map(([code, name]) => `<option value="${escapeHTML(code)}">${escapeHTML(name)} (${escapeHTML(code)})</option>`).join("");
        banksLoaded = true;
    } catch {
        sel.innerHTML = '<option value="">Failed to load banks. Refresh page.</option>';
    }
}

function selectQuickBank(code) {
    const sel = $("bfBank");
    if (!banksLoaded) {
        loadAllBanks().then(() => { sel.value = code; sel.dispatchEvent(new Event("change")); });
    } else {
        sel.value = code;
        sel.dispatchEvent(new Event("change"));
    }
}

async function fetchBankJson(bankcode) {
    const urls = [
        `https://cdn.jsdelivr.net/gh/razorpay/ifsc-api@master/data/${encodeURIComponent(bankcode)}.json`,
        `https://raw.githubusercontent.com/razorpay/ifsc-api/master/data/${encodeURIComponent(bankcode)}.json`
    ];
    for (const url of urls) {
        try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const raw = await res.json();
            return Array.isArray(raw) ? raw : Object.entries(raw).map(([ifsc, obj]) => ({ IFSC: ifsc, ...obj }));
        } catch {}
    }
    return null;
}

$("bfBank").addEventListener("change", async function () {
    const bankcode = this.value;
    const stateSel = $("bfState");
    const distSel = $("bfDistrict");
    const brSel = $("bfBranch");
    $("resultBox").classList.add("hidden");
    $("statusMsg").textContent = "";
    currentBankBranches = [];
    distSel.innerHTML = '<option value="">Select State first</option>';
    distSel.disabled = true;
    brSel.innerHTML = '<option value="">Select District first</option>';
    brSel.disabled = true;

    if (!bankcode) {
        stateSel.innerHTML = '<option value="">Select Bank first</option>';
        stateSel.disabled = true;
        return;
    }

    stateSel.innerHTML = '<option value="">Loading states (wait 2 sec)...</option>';
    stateSel.disabled = true;

    const list = await fetchBankJson(bankcode);
    if (!list || list.length === 0) {
        stateSel.innerHTML = '<option value="">No data found for this bank</option>';
        return;
    }

    currentBankBranches = list;
    const states = [...new Set(list.map((b) => (b.STATE || "OTHER").toUpperCase()))].sort();
    stateSel.innerHTML = '<option value="">-- Select State --</option>' +
        states.map((s) => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join("");
    stateSel.disabled = false;
});

$("bfState").addEventListener("change", function () {
    const state = this.value;
    const distSel = $("bfDistrict");
    const brSel = $("bfBranch");
    $("resultBox").classList.add("hidden");
    brSel.innerHTML = '<option value="">Select District first</option>';
    brSel.disabled = true;

    if (!state) {
        distSel.innerHTML = '<option value="">Select State first</option>';
        distSel.disabled = true;
        return;
    }

    const districts = [...new Set(
        currentBankBranches
            .filter((b) => (b.STATE || "OTHER").toUpperCase() === state)
            .map((b) => (b.DISTRICT || b.CITY || "OTHER").toUpperCase())
    )].sort();

    distSel.innerHTML = '<option value="">-- Select District --</option>' +
        districts.map((d) => `<option value="${escapeHTML(d)}">${escapeHTML(d)}</option>`).join("");
    distSel.disabled = false;
});

$("bfDistrict").addEventListener("change", function () {
    const state = $("bfState").value;
    const district = this.value;
    const brSel = $("bfBranch");
    $("resultBox").classList.add("hidden");

    if (!district) {
        brSel.innerHTML = '<option value="">Select District first</option>';
        brSel.disabled = true;
        return;
    }

    const branches = currentBankBranches
        .filter((b) => (b.STATE || "OTHER").toUpperCase() === state && (b.DISTRICT || b.CITY || "OTHER").toUpperCase() === district)
        .sort((a, b) => (a.BRANCH || "").localeCompare(b.BRANCH || ""));

    brSel.innerHTML = '<option value="">-- Select Branch --</option>' +
        branches.map((b) => `<option value="${escapeHTML(b.IFSC)}">${escapeHTML(b.BRANCH)} (${escapeHTML(b.IFSC)})</option>`).join("");
    brSel.disabled = false;
});

$("bfBranch").addEventListener("change", async function () {
    const ifsc = this.value;
    if (!ifsc) return;
    lastRetryFn = () => this.dispatchEvent(new Event("change"));
    $("resultBox").classList.add("hidden");
    setStatus(TEXT[currentLang].fetching, "info");
    try {
        await searchIFSC(ifsc);
        setStatus(TEXT[currentLang].verified, "success");
    } catch {
        setStatus(TEXT[currentLang].error, "error", true);
    }
});
