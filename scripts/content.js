const ENDING_DATE = new Date(2023, 9, 10) // 2030-Oct-10
const LAE_UPDATE_NOTICE_ID = 'lae-update-notice'

async function main() {
    chrome.storage.local.get(console.log)
    const notified = await chrome.storage.local.get('lae_update_notified')
    if (Date.now() < ENDING_DATE.getTime() && !notified?.lae_update_notified) {
        const noticeHtml = `Libby Audio Extporter now uses popup (just click the extension icon) instead of inserting elements to the page. (Click to permanently dismiss this notice)`
        const noticeDiv = document.createElement("div");
        noticeDiv.id = LAE_UPDATE_NOTICE_ID
        noticeDiv.innerHTML = noticeHtml
        noticeDiv.style.textAlign = 'center'
        noticeDiv.style.fontStyle = 'italic'
        noticeDiv.style.border = '1px solid yellow'
        noticeDiv.onclick = async () => {
            document.getElementById(LAE_UPDATE_NOTICE_ID).remove()
            await chrome.storage.local.set({ lae_update_notified: true })
        }
        document.body.insertBefore(noticeDiv, document.body.firstChild);
    }

    if (Date.now() >= ENDING_DATE.getTime()) {
        await chrome.storage.local.remove('lae_update_notified')
    }
}

main()