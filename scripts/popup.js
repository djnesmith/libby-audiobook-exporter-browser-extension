import { Commands, getTailAfter, dashify } from "./common.js"

// globals
let book

// const
const LAE_EXPLANATION_BANNER = "lae-explanation-banner"
const LAE_MAIN_ID = "lae-main"
const EXPORT_BUTTON_ID = "lae-export-button"
const DOWNLOAD_LIST_ID = "lae-download-list"
const STATUS_ID = "lae-status"

const laeExplanationBanner = document.getElementById(LAE_EXPLANATION_BANNER);
const laeMain = document.getElementById(LAE_MAIN_ID);
const laeDownloadList = document.getElementById(DOWNLOAD_LIST_ID);
const laeExportButton = document.getElementById(EXPORT_BUTTON_ID);
const laeStatusDiv = document.getElementById(STATUS_ID)

function renderDownloadList() {
    laeExportButton.disabled = book.downloading
    const allFiles = { ...book.metaFiles, ...book.audios }
    Object.keys(allFiles).forEach(
        filename => upsertDownloadListItem(filename, allFiles[filename])
    )
    laeExplanationBanner.style.display = 'none'
    laeMain.style.display = 'block';
    const total = Object.keys(allFiles).length
    const downloadedCount = Object.keys(allFiles).filter(filename => allFiles[filename].downloaded).length
    updateStatus(downloadedCount === 0 ? '' : `Downloading: ${downloadedCount}/${total}`)
}

async function exportAudio() {
    await chrome.runtime.sendMessage({
        command: Commands.Download,
        titleId: book.titleId
    })
}

function upsertDownloadListItem(filename, urlInfo) {
    const liId = getLiId(filename)
    let li = laeDownloadList.querySelector(`li[id="${liId}"`)
    if (!li) {
        li = document.createElement('li')
        li.id = liId
        const a = document.createElement('a')
        li.appendChild(a)
        laeDownloadList.appendChild(li)
    }
    li.style.backgroundColor = urlInfo.downloaded ? 'lightgreen' : ''
    const a = li.querySelector('a')
    a.textContent = filename
    a.href = urlInfo.url
}

function getLiId(text) {
    // return `li-${dashify(text)}`
    return `li-${text}`
}

function updateStatus(text) {
    laeStatusDiv.innerText = text
}

async function main() {
    chrome.runtime.onMessage.addListener(
        async (message, sender, sendResponse) => {
            switch (message?.command) {
                case Commands.UpdateBook:
                    book = message.book
                    renderDownloadList()
                    break;
            }
        }
    )

    document.addEventListener('DOMContentLoaded', function () {
        laeExportButton.addEventListener('click', exportAudio);
    });

    const activeTab = await chrome.tabs.query({ active: true, currentWindow: true })
    const titleId = getTailAfter(activeTab[0].url, '/')
    book = await chrome.runtime.sendMessage({ command: Commands.GetBook, titleId: titleId });
    if (book?.openbookUrl) {
        renderDownloadList();
    }
}

main()