import { base64UrlDecode, makePathNameSafe } from "./common.js"

// globals
// { titleId: {
//    "titleId": titleId,
//    "tile": title,
//    "downloadDir": downloadDir,
//    "openbookUrl": openbook_json_url,
//    "coverUrl": cover_url,
//    ...
//    "audios": {
//       mp3SaveFileName: mp3Url
//     }
//   }
// }
const books = {}

async function iframeCallback(details) {
    const url = new URL(details.url)
    const baseUrl = url.origin
    const encodedM = url?.searchParams?.get('m')
    const m = base64UrlDecode(encodedM)
    const mObj = JSON.parse(m)
    const titleId = mObj?.tdata?.codex?.title?.titleId
    const openbookUrl = `${baseUrl}/_d/openbook.json`
    const openbookResponse = await fetch(openbookUrl)
    const openbook = await openbookResponse.json()

    const info = {}
    books[titleId] = info
    info.titleId = titleId
    info.title = openbook?.title?.main
    info.subtitle = openbook?.title?.subtitle
    info.downloadDir = makePathNameSafe(info.title)
    info.authors = openbook?.creator
    info.openbookUrl = openbookUrl
    info.coverUrl = mObj?.tdata?.codex?.title?.cover?.imageURL
    const mp3Urls = openbook?.spine.map(
        x => `${baseUrl}/${x.path}`
    )
    info.audios = {}
    mp3Urls.forEach(
        (mp3Url, i) => {
            const match = mp3Url.match(/-[P|p]art\d*\..*?\?/)
            const suffix = match?.[0]?.slice(0, -1) ?? ("-Part" + (i > 9 ? i : "0" + i) + ".mp3")
            const filename = `${info.downloadDir}${suffix}`
            info.audios[filename] = mp3Url
        }
    )
}

async function main() {
    const iframeFilter = { urls: ["*://*.libbyapp.com/?m=eyJ*"] }
    chrome.webRequest.onCompleted.addListener(iframeCallback, iframeFilter);

    chrome.runtime.onMessage.addListener(
        async (message, sender, sendResponse) => {
            switch (message?.command) {
                case 'GetMap':
                    sendResponse(books[message?.titleId]);
                    break;
                case 'Download': {
                    const downloadId = await chrome.downloads.download({
                        url: message?.url,
                        filename: message?.filename,
                    })
                    sendResponse({
                        downloadId: downloadId,
                    })
                    break;
                }
                default: {
                    const error = `Message not understood: ${message}`;
                    sendResponse({
                        error: error,
                    })
                }
            }
        }
    );

    chrome.runtime.onInstalled.addListener(function (details) {
        if (details.reason == "install") {
            console.log("This is a first install!");
        } else if (details.reason == "update") {
            var thisVersion = chrome.runtime.getManifest().version;
            console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
        }
    });
}

main()