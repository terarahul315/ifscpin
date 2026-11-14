
/* ==========================================
   IFSCPin — PROFESSIONAL EDITION
   IFSC | PINCODE | AREA | HI/EN
========================================== */

"use strict";

let currentMode = "ifsc";
let currentLang = "en";

const $ = (id) => document.getElementById(id);

const TEXT = {
    en: {
        badge: "✓ Free Bank & India Post Directory",
        title: 'Find Bank <span class="cyan-text">IFSC</span> & <span class="cyan-text">Pincode</span> Instantly',
        sub: "Find bank branch details, IFSC codes, MICR information and India Post Pincodes.",
        how: "Built for Speed, Accuracy & Everyday Help",
        search: "Search",
        loading: "Searching...",
        fetching: "Fetching details...",
        found: "Search completed successfully!",
        error: "Something went wrong. Please try again.",
        empty: "Please enter something to search.",
        invalidIFSC: "Enter a valid 11-character IFSC code.",
        invalidPIN: "Enter a valid 6-digit Pincode.",
        shortArea: "Enter at least 3 characters.",
        noData: "No results found. Please check your search.",
        recent: "🕒 Recent Searches:",
        copied: "✓ Copied!",
        copy: "📋 Copy Details",
        verified: "✓ Bank details retrieved successfully!"
    },

    hi: {
        badge: "✓ फ्री बैंक और इंडिया पोस्ट डायरेक्टरी",
        title: 'बैंक <span class="cyan-text">IFSC</span> और <span class="cyan-text">पिनकोड</span> तुरंत खोजें',
        sub: "बैंक ब्रांच, IFSC कोड, MICR और इंडिया पोस्ट पिनकोड की जानकारी प्राप्त करें।",
        how: "तेज़ और आसान सर्च के लिए बनाया गया",
        search: "खोजें",
        loading: "खोज रहे हैं...",
        fetching: "जानकारी प्राप्त हो रही है...",
        found: "सर्च सफलतापूर्वक पूरी हुई!",
        error: "कुछ समस्या हुई। दोबारा कोशिश करें।",
        empty: "कृपया कुछ लिखकर सर्च करें।",
        invalidIFSC: "सही 11 अक्षरों का IFSC कोड डालें।",
        invalidPIN: "सही 6 अंकों का पिनकोड डालें।",
        shortArea: "कम से कम 3 अक्षर डालें।",
        noData: "कोई जानकारी नहीं मिली। दोबारा जाँचें।",
        recent: "🕒 पिछली सर्च:",
        copied: "✓ कॉपी हो गया!",
        copy: "📋 जानकारी कॉपी करें",
        verified: "✓ बैंक की जानकारी प्राप्त हुई!"
    }
};

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
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
}

function setStatus(message, type = "info") {
    const status = $("statusMsg");
    status.textContent = message;
    status.className = "status-msg " + type;
}

function switchMode(mode) {
    if (!["ifsc", "pincode", "area"].includes(mode)) return;

    currentMode = mode;

    const input = $("searchInput");
    const label = $("inputLabel");
    const examples = $("examplesRow");
    const t = TEXT[currentLang];

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
            examples: [
                ["SBIN0000691", "SBIN0000691"],
                ["HDFC0000001", "HDFC0000001"],
                ["ICIC0000001", "ICIC0000001"]
            ]
        },
        pincode: {
            label: "Enter 6-Digit India Pincode",
            placeholder: "e.g. 226001",
            examples: [
                ["226001", "226001 (Lucknow)"],
                ["110001", "110001 (Delhi)"],
                ["400001", "400001 (Mumbai)"]
            ]
        },
        area: {
            label: "Enter City or Area Name",
            placeholder: "e.g. Gomti Nagar, Jaipur",
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

    examples.innerHTML = `
        <span>Try:</span>
        ${config.examples.map(([value, display]) => `
            <button type="button" class="ex-chip"
                data-value="${escapeHTML(value)}">
                ${escapeHTML(display)}
            </button>
        `).join("")}
    `;

    examples.querySelectorAll(".ex-chip").forEach(btn => {
        btn.addEventListener("click", () => quickFill(btn.dataset.value));
    });
}

function quickFill(value) {
    $("searchInput").value = value;
    $("lookupForm").requestSubmit();
}

/* ==========================================
   RECENT SEARCHES
========================================== */

function getRecent() {
    try {
        const data = JSON.parse(
            localStorage.getItem("ifscpin_recent") || "[]"
        );

        return Array.isArray(data)
            ? data.filter(item =>
                item &&
                ["ifsc", "pincode", "area"].includes(item.mode) &&
                typeof item.query === "string"
            ).slice(0, 4)
            : [];

    } catch {
        return [];
    }
}

function saveRecent(mode, query) {
    try {
        let items = getRecent();

        items = items.filter(item =>
            !(item.mode === mode && item.query === query)
        );

        items.unshift({ mode, query });

        localStorage.setItem(
            "ifscpin_recent",
            JSON.stringify(items.slice(0, 4))
        );

        renderRecent();
    } catch {}
}

function renderRecent() {
    const items = getRecent();
    const wrap = $("recentSearches");

    if (!items.length) {
        wrap.innerHTML = "";
        return;
    }

    wrap.innerHTML = `
        <div class="recent-wrap">
            <span>${TEXT[currentLang].recent}</span>
            ${items.map(item => `
                <button type="button"
                    class="recent-chip"
                    data-mode="${item.mode}"
                    data-query="${escapeHTML(item.query)}">
                    ${escapeHTML(item.query)}
                </button>
            `).join("")}
        </div>
    `;

    wrap.querySelectorAll(".recent-chip").forEach(btn => {
        btn.addEventListener("click", () => {
            switchMode(btn.dataset.mode);
            quickFill(btn.dataset.query);
        });
    });
}

/* ==========================================
   API HELPER
========================================== */

async function fetchData(url) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 12000);

    try {
        const response = await fetch(url, {
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error("API_ERROR");
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

/* ==========================================
   COPY HELPER
========================================== */

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

        setTimeout(() => {
            button.textContent = original;
        }, 1600);

    } catch {
        setStatus("Unable to copy. Please try again.", "error");
    }
}

/* ==========================================
   IFSC SEARCH
========================================== */

async function searchIFSC(query) {
    const code = query.toUpperCase();

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(code)) {
        throw new Error("INVALID_IFSC");
    }

    const data = await fetchData(
        `https://ifsc.razorpay.com/${encodeURIComponent(code)}`
    );

    if (!data || !data.IFSC || !data.BANK) {
        throw new Error("NO_DATA");
    }

    const mapsUrl =
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(`${data.BANK} ${data.BRANCH} ${data.CITY} ${data.ADDRESS}`);

    const details = [
        `${data.BANK} - ${data.BRANCH}`,
        `IFSC: ${data.IFSC}`,
        `MICR: ${data.MICR || "N/A"}`,
        `Address: ${data.ADDRESS || "N/A"}`,
        `City: ${data.CITY || "N/A"}`,
        `State: ${data.STATE || "N/A"}`
    ].join("\n");

    const services = ["UPI", "IMPS", "NEFT", "RTGS"];

    $("resultBox").innerHTML = `
        <div class="bank-card">
            <div class="bank-title">${escapeHTML(data.BANK)}</div>

            <div class="branch-sub">
                ${escapeHTML(data.BRANCH)} Branch
            </div>

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
                    return `
                        <span class="svc-badge ${available ? "" : "no"}">
                            ${service}: ${available ? "Yes" : "Not confirmed"}
                        </span>
                    `;
                }).join("")}
            </div>

            <div class="action-btns">
                <button type="button" class="copy-btn" id="copyIfscBtn">
                    ${TEXT[currentLang].copy}
                </button>

                <a href="${mapsUrl}" target="_blank"
                    rel="noopener noreferrer" class="maps-btn">
                    📍 Google Maps
                </a>

                <a href="https://wa.me/?text=${encodeURIComponent(details)}"
                    target="_blank" rel="noopener noreferrer" class="wa-btn">
                    📲 WhatsApp
                </a>
            </div>
        </div>
    `;

    $("resultBox").classList.remove("hidden");

    $("copyIfscBtn").addEventListener("click", function() {
        copyText(details, this);
    });

    saveRecent("ifsc", code);
}

/* ==========================================
   PINCODE SEARCH
========================================== */

async function searchPincode(query) {
    if (!/^\d{6}$/.test(query)) {
        throw new Error("INVALID_PIN");
    }

    const json = await fetchData(
        `https://api.postalpincode.in/pincode/${encodeURIComponent(query)}`
    );

    if (!json[0] || json[0].Status !== "Success" || !json[0].PostOffice) {
        throw new Error("NO_DATA");
    }

    renderPostOffices(json[0].PostOffice);

    saveRecent("pincode", query);
}

/* ==========================================
   CITY / AREA SEARCH
========================================== */

async function searchArea(query) {
    if (query.length < 3) {
        throw new Error("SHORT_AREA");
    }

    const json = await fetchData(
        `https://api.postalpincode.in/postoffice/${encodeURIComponent(query)}`
    );

    if (!json[0] || json[0].Status !== "Success" || !json[0].PostOffice) {
        throw new Error("NO_DATA");
    }

    const list = json[0].PostOffice.slice(0, 20);

    renderPostOffices(list);

    saveRecent("area", query);
}

/* ==========================================
   RENDER POST OFFICES
========================================== */

function renderPostOffices(list) {
    $("resultBox").innerHTML = `
        <div class="po-list">
            ${list.map(po => {
                const details =
                    `${po.Name} (${po.Pincode})\n${po.District}, ${po.State}`;

                return `
                    <div class="po-card">
                        <div>
                            <div class="po-name">
                                ${escapeHTML(po.Name)}
                            </div>

                            <div class="po-meta">
                                ${escapeHTML(po.Block || po.Taluk || "")},
                                ${escapeHTML(po.District)},
                                ${escapeHTML(po.State)}
                                • ${escapeHTML(po.DeliveryStatus)}
                            </div>
                        </div>

                        <div class="po-right">
                            <div class="po-pin">
                                ${escapeHTML(po.Pincode)}
                            </div>

                            <a href="https://wa.me/?text=${encodeURIComponent(details)}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="wa-btn">
                                📲
                            </a>
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `;

    $("resultBox").classList.remove("hidden");
}

/* ==========================================
   MAIN SEARCH SYSTEM
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const form = $("lookupForm");
    const searchBtn = $("searchBtn");

    let searching = false;

    renderRecent();
    switchMode("ifsc");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (searching) return;

        const query = $("searchInput").value.trim();

        if (!query) {
            setStatus(TEXT[currentLang].empty, "error");
            return;
        }

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
                TIMEOUT: "Request timed out. Please try again.",
                API_ERROR: "Server unavailable. Please try later."
            };

            setStatus(
                messages[error.message] || TEXT[currentLang].error,
                "error"
            );

        } finally {
            searching = false;
            searchBtn.disabled = false;
            searchBtn.textContent = TEXT[currentLang].search;
        }
    });

    /* FAQ ACCORDION */

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
