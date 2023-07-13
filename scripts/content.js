// globals
let downloadMap = {}

// const
const LAE_CONTAINER_ID = "lae-container"
const EXPORT_BUTTON_ID = "lae-export-button"
const TOGGLE_LIST_BUTTON_ID = "lae-toggle-list-button"
const DOWNLOAD_LIST_ID = "lae-download-list"
const PROGRESS_BAR_ID = "lae-progress-bar"
const PROGRESS_ID = "lae-progress"

const INITIAL_BANNER = "Initializing download list...";
const READY_BANNER = "\u2190 download | toggle list \u2192";
const FAILED_BANNER = "Failed to retrieve the list, please refresh your tab (Ctrl + R)"

const SkyBlue = "#87ceeb";
const SpringGreen = "#00ff7f";
const Crimson = "#dc143c";

const delayMs = ms => new Promise(res => setTimeout(res, ms));
const delayMsWithRatio = async (ms, ratio) => await delayMs(ms * (1 - ratio + 2 * ratio * Math.random()));
const delayRoughlyMs = async (ms) => await delayMs(ms, 0.5)

function createDownloadList() {
    const theDiv = document.createElement("div")
    theDiv.id = DOWNLOAD_LIST_ID
    const ul = document.createElement("ul")
    theDiv.appendChild(ul)
    Object.keys(downloadMap).forEach(
        key => {
            const li = document.createElement("li")
            const a = document.createElement("a")
            a.textContent = downloadMap[key]
            a.href = key
            li.appendChild(a)
            ul.appendChild(li)
        }
    )
    theDiv.style.display = "none"
    return theDiv;
}

async function exportAudio() {
    const total = Object.keys(downloadMap).length;
    let current = 0;
    const progress = document.getElementById(PROGRESS_ID);
    progress.style.backgroundColor = SpringGreen;
    for await (const url of Object.keys(downloadMap)) {
        const filename = downloadMap[url];
        console.log(`[lae] downloading ${url} as ${filename}`)
        await chrome.runtime.sendMessage({
            command: 'Download',
            url: url,
            filename: filename,
        })
        current++;
        progress.style.width = `${current * 100 / total}%`;
        progress.textContent = `${current} / ${total}`;
        await delayRoughlyMs(5000);
    }

    // restore the progress bar
    progress.width = "100%";
    progress.style.backgroundColor = SkyBlue;
    progress.textContent = "All done!";
    await delayRoughlyMs(5000);
    setReadyBanner();
    console.log(`[lae] all files are downloaded.`)
}

function toggleDownloadList() {
    const listDiv = document.getElementById(DOWNLOAD_LIST_ID);
    if (listDiv.style.display === "none") {
        listDiv.style.display = "block";
    } else {
        listDiv.style.display = "none"
    }
}

function attachElements() {
    const html = `
    <div id="lae-button-container" class="nav-action-bar">
        <button id="${EXPORT_BUTTON_ID}"
            class="nav-action-item"
        >Export</button>
        <div id="${PROGRESS_BAR_ID}">
            <div id="${PROGRESS_ID}">${INITIAL_BANNER}</div>
        </div>
        <button id="${TOGGLE_LIST_BUTTON_ID}"
            class="nav-action-item"
        >List</button>
    </div>
    <div id="${DOWNLOAD_LIST_ID}"></div>
    `

    let laeDiv = document.getElementById(LAE_CONTAINER_ID);
    if (!laeDiv) {
        laeDiv = document.createElement("div");
        laeDiv.innerHTML = html;
        laeDiv.id = LAE_CONTAINER_ID;
        laeDiv.className = "navigation";
        document.body.insertBefore(laeDiv, document.body.firstChild);
    }

    laeDiv.querySelector(`#${EXPORT_BUTTON_ID}`).onclick = exportAudio
    laeDiv.querySelector(`#${TOGGLE_LIST_BUTTON_ID}`).onclick = toggleDownloadList
}

function attachDownloadList() {
    const downloadList = createDownloadList();
    const laeDiv = document.getElementById(LAE_CONTAINER_ID);
    // the download list above is regenerated, so we replace dom to update also
    laeDiv.querySelector(`#${DOWNLOAD_LIST_ID}`).replaceWith(downloadList);
}

function getProgressElement() {
    return document.getElementById(PROGRESS_ID);
}

function setInitialBanner() {
    const progress = getProgressElement();
    progress.textContent = INITIAL_BANNER;
    progress.style.backgroundColor = SkyBlue;
}

function setReadyBanner() {
    const progress = getProgressElement();
    progress.textContent = READY_BANNER;
    progress.style.backgroundColor = "";
}

function setFailedBanner() {
    const progress = getProgressElement();
    progress.textContent = FAILED_BANNER;
    progress.style.backgroundColor = Crimson
}

attachElements();
setInitialBanner();
attachDownloadList();

(async () => {
    const startMs = Date.now();
    let timeOuted = false;
    while (Object.keys(downloadMap).length <= 2) { // cover and openbook.json
        if ((Date.now() - startMs) > 30 * 1000) {
            timeOuted = true;
            break;
        }
        await delayRoughlyMs(5000);
        const response = await chrome.runtime.sendMessage({ command: "GetMap" });
        downloadMap = response?.downloadMap
    }
    attachDownloadList();
    timeOuted ? setFailedBanner() : setReadyBanner();
})();
