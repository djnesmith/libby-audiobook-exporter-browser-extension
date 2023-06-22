// globals
let downloadMap = {}

// const
const LAE_CONTAINER_ID = "lae-container"
const EXPORT_BUTTON_ID = "lae-export-button"
const TOGGLE_LIST_BUTTON_ID = "lae-toggle-list-button"
const DOWNLOAD_LIST_ID = "lae-download-list"

const delayMs = ms => new Promise(res => setTimeout(res, ms));

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
    for await (const url of Object.keys(downloadMap)) {
        const filename = downloadMap[url];
        console.log(`[lae] downloading ${url} as ${filename}`)
        await chrome.runtime.sendMessage({
            command: 'Download',
            url: url,
            filename: filename,
        })
        await delayMs(5000);
    }
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
        >Export Audio</button>
        <div class="lae-banner">Export</div>
        <button id="${TOGGLE_LIST_BUTTON_ID}"
            class="nav-action-item"
        >Show Download List</button>
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

    const downloadList = createDownloadList();
    // the download list above is regenerated, so we replace dom to update also
    laeDiv.querySelector(`#${DOWNLOAD_LIST_ID}`).replaceWith(downloadList);
    laeDiv.querySelector(`#${EXPORT_BUTTON_ID}`).onclick = exportAudio
    laeDiv.querySelector(`#${TOGGLE_LIST_BUTTON_ID}`).onclick = toggleDownloadList
}

(async () => {
    while (Object.keys(downloadMap).length <= 2) { // cover and openbook.json
        await delayMs(5000);
        const response = await chrome.runtime.sendMessage({ command: "GetMap" });
        downloadMap = response?.downloadMap
    }
    attachElements();
})();

// chrome.runtime.onMessage.addListener(
//     (message, sender, sendResponse) => {
//         downloadMap = message?.downloadMap;
//         attachElements();
//     }
// );

