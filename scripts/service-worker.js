// globals
const downloadMap = {} // url -> download file name mapping

// after libby makes this "possession" call, all things should be easily retrievable
const possessionFilter = { urls: ["*://*.listen.libbyapp.com/_d/possession"] }
async function possessionCallback(details) {
    const baseUrl = new URL(details.url).origin
    const openbookUrl = details.url.replace(/possession$/, "openbook.json")
    downloadMap[openbookUrl] = 'openbook.json'
    const openbookResponse = await fetch(openbookUrl)
    const openbook = await openbookResponse.json()
    if (openbook?.spine) {
        const title = openbook?.title?.main ?? "audiobook"
        const mp3Urls = openbook.spine.map(
            x => `${baseUrl}/${x.path}`
        )
        mp3Urls.forEach(
            (url, i) => {
                const match = url.match(/\-[P|p]art\d*\..*?\?/)
                const suffix = match?.[0]?.slice(0, -1) ?? ("-Part" + (i > 9 ? i : "0" + i) + ".mp3")
                downloadMap[url] = title + suffix
            }
        )
    }
}

const coverFilter = { urls: ["*://libbyapp.com/covers/resize?*"] }
async function coverCallback(details) {
    const coverUrl = details.url
    downloadMap[coverUrl] = 'cover.' + (coverUrl?.split('.')?.pop()?.toLowerCase() ?? "jpg")
}

chrome.webRequest.onCompleted.addListener(possessionCallback, possessionFilter);
chrome.webRequest.onCompleted.addListener(coverCallback, coverFilter);

chrome.runtime.onMessage.addListener(
    async (message, sender, sendResponse) => {
        switch (message?.command) {
            case 'GetMap':
                sendResponse({
                    downloadMap: downloadMap,
                });
                break;
            case 'Download':
                const downloadId = await chrome.downloads.download({
                    url: message?.url,
                    filename: message?.filename,
                })
                sendResponse({
                    downloadId: downloadId,
                })
                break;
            default:
                const error = `Unknown command: ${message}`;
                sendResponse({
                    error: error,
                })
        }
    }
);
