import { Commands, getTailAfter } from "./common.js"

// globals
let book
let downloadMap

// const
const LAE_EXPLANATION_BANNER = "lae-explanation-banner"
const LAE_MAIN_ID = "lae-main"
const EXPORT_BUTTON_ID = "lae-export-button"
const DOWNLOAD_LIST_ID = "lae-download-list"
const STATUS_ID = "lae-status"

const delayMs = ms => new Promise(res => setTimeout(res, ms));
const delayMsWithRatio = async (ms, ratio) => await delayMs(ms * (1 - ratio + 2 * ratio * Math.random()));
const delayRoughlyMs = async (ms) => await delayMsWithRatio(ms, 0.4)

const laeExplanationBanner = document.getElementById(LAE_EXPLANATION_BANNER);
const laeMain = document.getElementById(LAE_MAIN_ID);
const laeDownloadList = laeMain.querySelector(`#${DOWNLOAD_LIST_ID}`)
const laeExportButton = document.getElementById(EXPORT_BUTTON_ID);
const laeStatusDiv = document.getElementById(STATUS_ID)

function attachDownloadList() {
    refreshDownloadList();
    const listDiv = regenerateDownloadDiv();
    laeDownloadList.replaceWith(listDiv);
    laeMain.style.display = 'block';
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

async function exportAudio() {
    const total = Object.keys(downloadMap).length
    let downloaded = 0
    for await (const filename of Object.keys(downloadMap)) {
        const url = downloadMap[filename];
        console.log(`[lae] downloading ${url} as ${filename}`)
        await chrome.runtime.sendMessage({
            command: Commands.Download,
            url: url,
            filename: `${book.downloadDir}/${filename}`,
        })
        document.getElementById(getLiId(filename)).style.backgroundColor = 'lightgreen'
        downloaded++
        updateStatus(`Downloaded: ${downloaded} / ${total}`)
        await delayRoughlyMs(5000);
    }
    console.log(`[lae] all files are downloaded.`)
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

function updateStatus(text) {
    laeStatusDiv.innerText = text
}

async function main() {
    document.addEventListener('DOMContentLoaded', function () {
        laeExportButton.addEventListener('click', exportAudio);
    });

    const activeTab = await chrome.tabs.query({ active: true, currentWindow: true })
    const titleId = getTailAfter(activeTab[0].url, '/')
    book = await chrome.runtime.sendMessage({ command: Commands.GetMap, titleId: titleId });
    if (book?.openbookUrl) {
        laeExplanationBanner.style.display = 'none'
        attachDownloadList();
    }
}

main()