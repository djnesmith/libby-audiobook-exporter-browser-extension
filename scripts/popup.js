// globals
let book
let downloadMap

// const
const LAE_CONTAINER_ID = "lae-container"
const DOWNLOAD_LIST_ID = "lae-download-list"
const EXPORT_BUTTON_ID = "lae-export-button"
const STATUS_ID = "lae-status"

const delayMs = ms => new Promise(res => setTimeout(res, ms));
const delayMsWithRatio = async (ms, ratio) => await delayMs(ms * (1 - ratio + 2 * ratio * Math.random()));
const delayRoughlyMs = async (ms) => await delayMsWithRatio(ms, 0.4)

function getTailAfter(str, sep) {
    return str.substring(str.lastIndexOf(sep) + 1)
}

function refreshDownloadList() {
    const meta = {}
    if (book?.openbookUrl) {
        meta["openbook.json"] = book.openbookUrl
    }
    if (book?.coverUrl) {
        const coverFilename = `cover.${getTailAfter(book.coverUrl, '.')?.toLowerCase() ?? "jpg"}`
        meta[coverFilename] = book.coverUrl
    }
    downloadMap = {
        ...meta,
        ...book?.audios,
    }
}

function regenerateDownloadDiv() {
    const theDiv = document.createElement("div")
    theDiv.id = DOWNLOAD_LIST_ID
    const ul = document.createElement("ul")
    theDiv.appendChild(ul)
    Object.keys(downloadMap).forEach(
        key => {
            createListItem(ul, key, downloadMap[key])
        }
    )
    return theDiv;
}

function createListItem(ul, text, href) {
    const li = document.createElement("li")
    li.id = getLiId(text)
    const a = document.createElement("a")
    a.textContent = text
    a.href = href
    li.appendChild(a)
    ul.appendChild(li)
}

function getLiId(text) {
    return `li-${text}`
}

async function exportAudio() {
    const total = Object.keys(downloadMap).length
    let downloaded = 0
    showSatus();
    for await (const filename of Object.keys(downloadMap)) {
        const url = downloadMap[filename];
        console.log(`[lae] downloading ${url} as ${filename}`)
        await chrome.runtime.sendMessage({
            command: 'Download',
            url: url,
            filename: `${book.downloadDir}/${filename}`,
        })
        document.getElementById(getLiId(filename)).style.backgroundColor = 'lightgreen'
        downloaded++
        updateStatus(`${downloaded} / ${total}`)
        await delayRoughlyMs(5000);
    }
    console.log(`[lae] all files are downloaded.`)
}

function showSatus() {
    const statusDiv = document.getElementById(STATUS_ID)
    statusDiv.style.display = 'block'
}

function updateStatus(text) {
    const statusDiv = document.getElementById(STATUS_ID)
    statusDiv.innerText = text
}

function attachDownloadList() {
    refreshDownloadList();
    const listDiv = regenerateDownloadDiv();
    const laeDiv = document.getElementById(LAE_CONTAINER_ID);
    // the download list above is regenerated, so we replace dom to update also
    laeDiv.querySelector(`#${DOWNLOAD_LIST_ID}`).replaceWith(listDiv);
}

document.addEventListener('DOMContentLoaded', function () {
    const link = document.getElementById(EXPORT_BUTTON_ID);
    link.addEventListener('click', exportAudio);
});

(async () => {
    const activeTab = await chrome.tabs.query({ active: true, currentWindow: true })
    const titleId = getTailAfter(activeTab[0].url, '/')
    book = await chrome.runtime.sendMessage({ command: "GetMap", titleId: titleId });
    if (book?.openbookUrl) {
        attachDownloadList();
    }
})();
