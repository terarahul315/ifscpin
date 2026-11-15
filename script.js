/* BANK FINDER — ZERO-ERROR BUILT-IN + 4-MIRROR CDN */

let currentBankBranches = [];

const MAJOR_BANKS = [
    ["AIRP", "Airtel Payments Bank"],
    ["AUBL", "AU Small Finance Bank"],
    ["UTIB", "Axis Bank"],
    ["BDBL", "Bandhan Bank"],
    ["BARB", "Bank of Baroda"],
    ["BKID", "Bank of India"],
    ["MAHB", "Bank of Maharashtra"],
    ["CNRB", "Canara Bank"],
    ["CBIN", "Central Bank of India"],
    ["CIUB", "City Union Bank"],
    ["CSBK", "CSB Bank"],
    ["DCBL", "DCB Bank"],
    ["DLXB", "Dhanlaxmi Bank"],
    ["ESFB", "Equitas Small Finance Bank"],
    ["FDRL", "Federal Bank"],
    ["HDFC", "HDFC Bank"],
    ["ICIC", "ICICI Bank"],
    ["IBKL", "IDBI Bank"],
    ["IDFB", "IDFC FIRST Bank"],
    ["IDIB", "Indian Bank"],
    ["IOBA", "Indian Overseas Bank"],
    ["IPOS", "India Post Payments Bank"],
    ["INDB", "IndusInd Bank"],
    ["JAKA", "Jammu & Kashmir Bank"],
    ["JSFB", "Jana Small Finance Bank"],
    ["JIOP", "Jio Payments Bank"],
    ["KARB", "Karnataka Bank"],
    ["KVBL", "Karur Vysya Bank"],
    ["KKBK", "Kotak Mahindra Bank"],
    ["NTBL", "Nainital Bank"],
    ["PYTM", "Paytm Payments Bank"],
    ["PSIB", "Punjab & Sind Bank"],
    ["PUNB", "Punjab National Bank"],
    ["RATN", "RBL Bank"],
    ["SRCB", "Saraswat Co-operative Bank"],
    ["SIBL", "South Indian Bank"],
    ["SCBL", "Standard Chartered Bank"],
    ["SBIN", "State Bank of India"],
    ["SURY", "Suryoday Small Finance Bank"],
    ["TMBL", "Tamilnad Mercantile Bank"],
    ["UCBA", "UCO Bank"],
    ["UJVN", "Ujjivan Small Finance Bank"],
    ["UBIN", "Union Bank of India"],
    ["UTKS", "Utkarsh Small Finance Bank"],
    ["YESB", "Yes Bank"]
];

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
        values.map(value => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join("");
    select.disabled = false;
}

function resetSelect(select, placeholder) {
    if (!select) return;
    select.innerHTML = `<option value="">${escapeHTML(placeholder)}</option>`;
    select.disabled = true;
}

function populateBankSelect(entries) {
    const select = $("bfBank");
    if (!select) return;
    select.innerHTML =
        `<option value="">${escapeHTML(t("selectBank"))}</option>` +
        entries.map(([code, name]) =>
            `<option value="${escapeHTML(code)}">${escapeHTML(name)} (${escapeHTML(code)})</option>`
        ).join("");
    select.disabled = false;
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
                const entries = Object.entries(data)
                    .filter(([code, name]) => code && name)
                    .sort((a, b) => String(a[1]).localeCompare(String(b[1])));
                if (entries.length > 0 && !$("bfBank")?.value) {
                    populateBankSelect(entries);
                }
                break;
            }
        } catch {}
    }
}

function selectQuickBank(code) {
    const select = $("bfBank");
    if (!select) return;
    if (!banksLoaded) populateBankSelect(MAJOR_BANKS);
    select.value = code;
    select.dispatchEvent(new Event("change"));
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
            return Array.isArray(raw)
                ? raw
                : Object.entries(raw).map(([ifsc, obj]) => ({ IFSC: ifsc, ...obj }));
        } catch {}
    }
    return null;
}

async function handleBankChange() {
    const bankCode = $("bfBank")?.value || "";
    const stateSelect = $("bfState");
    const districtSelect = $("bfDistrict");
    const branchSelect = $("bfBranch");
    const requestId = ++bankRequestId;

    currentBankBranches = [];
    resetSelect(stateSelect, t("selectBankFirst"));
    resetSelect(districtSelect, t("selectStateFirst"));
    resetSelect(branchSelect, t("selectDistrictFirst"));

    if ($("resultBox")) $("resultBox").classList.add("hidden");
    if ($("statusMsg")) $("statusMsg").textContent = "";

    if (!bankCode) return;

    stateSelect.disabled = true;
    stateSelect.innerHTML = `<option value="">${escapeHTML(t("loading"))}</option>`;

    const list = await fetchBankJson(bankCode);
    if (requestId !== bankRequestId) return;

    if (!list || !list.length) {
        resetSelect(stateSelect, t("noStates"));
        setStatus(t("directoryError"), "error", true);
        lastRetryFn = handleBankChange;
        return;
    }

    currentBankBranches = list;
    const states = [...new Set(
        list.map(b => String(b.STATE || "OTHER").trim().toUpperCase()).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    fillSelect(stateSelect, t("selectState"), states);
}

function handleStateChange() {
    const state = $("bfState")?.value || "";
    const districtSelect = $("bfDistrict");
    const branchSelect = $("bfBranch");

    resetSelect(districtSelect, t("selectStateFirst"));
    resetSelect(branchSelect, t("selectDistrictFirst"));

    if (!state || !currentBankBranches.length) return;

    const districts = [...new Set(
        currentBankBranches
            .filter(b => String(b.STATE || "OTHER").trim().toUpperCase() === state)
            .map(b => String(b.DISTRICT || b.CITY || "OTHER").trim().toUpperCase())
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    if (!districts.length) {
        resetSelect(districtSelect, t("noDistricts"));
        return;
    }

    fillSelect(districtSelect, t("selectDistrict"), districts);
}

function handleDistrictChange() {
    const state = $("bfState")?.value || "";
    const district = $("bfDistrict")?.value || "";
    const branchSelect = $("bfBranch");

    resetSelect(branchSelect, t("selectDistrictFirst"));

    if (!state || !district || !currentBankBranches.length) return;

    const validBranches = currentBankBranches
        .filter(b =>
            b && b.IFSC &&
            String(b.STATE || "OTHER").trim().toUpperCase() === state &&
            String(b.DISTRICT || b.CITY || "OTHER").trim().toUpperCase() === district
        )
        .sort((a, b) => String(a.BRANCH || "").localeCompare(String(b.BRANCH || "")));

    if (!validBranches.length) {
        resetSelect(branchSelect, t("noBranches"));
        return;
    }

    branchSelect.innerHTML =
        `<option value="">${escapeHTML(t("selectBranch"))}</option>` +
        validBranches.map(branch =>
            `<option value="${escapeHTML(branch.IFSC)}">${escapeHTML(branch.BRANCH || "Branch")} (${escapeHTML(branch.IFSC)})</option>`
        ).join("");
    branchSelect.disabled = false;
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
        setStatus(error.message === "NO_DATA" ? t("noData") : t("error"), "error", true);
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
        if (tab) tab.addEventListener("click", showLookupMode);
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
