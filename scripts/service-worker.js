import { Commands, getTailAfter, base64UrlDecode, makePathNameSafe, delayRoughlyMs } from './common.js'

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
let books
let commPort = null

async function iframeCallback(details) {
    const url = new URL(details.url)
    const baseUrl = url.origin
    const encodedM = url?.searchParams?.get('m')
    const m = base64UrlDecode(encodedM)
    const mObj = JSON.parse(m)
    const titleId = mObj?.tdata?.codex?.title?.titleId
    // the `parseInt()` is superfluous, but just to be safe
    const expires = parseInt(mObj.expires)
    const openbookUrl = `${baseUrl}/_d/openbook.json`
    const openbookResponse = await fetch(openbookUrl)
    const openbook = await openbookResponse.json()

    const book = {}
    books[titleId] = book
    book.titleId = titleId
    book.expires = expires
    book.openbook = openbook
    book.title = openbook?.title?.main
    book.subtitle = openbook?.title?.subtitle
    book.downloadDir = makePathNameSafe(book.title)
    book.authors = openbook?.creator
    book.openbookUrl = openbookUrl
    book.coverUrl = mObj?.tdata?.codex?.title?.cover?.imageURL
    book.metaFiles = {}
    book.metaFiles['openbook.json'] = { url: openbookUrl, downloaded: false }
    const coverFilename = `cover.${getTailAfter(book.coverUrl, '.')?.toLowerCase() ?? 'jpg'}`
    book.metaFiles[coverFilename] = { url: book.coverUrl, downloaded: false }
    const mp3Urls = openbook?.spine.map(
        x => `${baseUrl}/${x.path}`
    )
    book.audios = {}
    mp3Urls.forEach(
        (mp3Url, i) => {
            const match = mp3Url.match(/-[P|p]art\d*\..*?\?/)
            const suffix = match?.[0]?.slice(0, -1) ?? ("-Part" + (i > 9 ? i : "0" + i) + ".mp3")
            const filename = `${book.downloadDir}${suffix}`
            book.audios[filename] = { url: mp3Url, downloaded: false }
        }
    )
    book.downloading = false
    chrome.storage.local.set({ books: books })
}

async function download(titleId) {
    if (!books?.[titleId]) {
        return null
    }

    const book = books[titleId]
    if (book.downloading) {
        return book
    }

    book.downloading = true
    console.log(`[lae] start downloading "${book?.title}".`)
    await downloadFiles(book.metaFiles, book)
    await downloadFiles(book.audios, book)
    console.log(`[lae] finish downloading "${book?.title}".`)
    book.downloading = false
    Object.keys(book.metaFiles).forEach(filename => book.metaFiles[filename].downloaded = false)
    Object.keys(book.audios).forEach(filename => book.audios[filename].downloaded = false)
    return book
}

async function downloadFiles(files, book) {
    for await (const filename of Object.keys(files)) {
        const fileInfo = files[filename];
        console.log(`[lae] downloading ${fileInfo.url} as ${filename}`)
        await chrome.downloads.download({
            url: fileInfo.url,
            filename: `${book.downloadDir}/${filename}`,
        })
        await delayRoughlyMs(5000)
        fileInfo.downloaded = true
        if (commPort) {
            commPort.postMessage({ command: Commands.UpdateBook, book: book })
        }
    }
}

async function main() {
    books = await chrome.storage.local.get('books')
    if (!books) {
        books = {}
    }

    Object.keys(books).forEach(
        titleId => {
            // `expires` is in seconds, but `Date.now()` in milliseconds
            if (books[titleId]?.expires * 1000 < Date.now()) {
                delete books[titleId]
            }
        }
    )

    const iframeFilter = { urls: ["*://*.libbyapp.com/?m=eyJ*"] }
    chrome.webRequest.onCompleted.addListener(iframeCallback, iframeFilter);

    chrome.runtime.onConnect.addListener(
        port => {
            commPort = port

            port.onMessage.addListener(
                message => {
                    switch (message?.command) {
                        case Commands.GetBook:
                            port.postMessage({
                                command: Commands.UpdateBook,
                                book: books[message.titleId]
                            })
                            break;
                        case Commands.Download:
                            download(message.titleId)
                            break;
                        default:
                            console.error(`Message not understood: ${message}`)
                    }
                }
            )

            port.onDisconnect.addListener(() => commPort = null)
        }
    )

    chrome.runtime.onInstalled.addListener(
        details => {
            if (details.reason == "install") {
                console.log("This is a first install!");
            } else if (details.reason == "update") {
                const thisVersion = chrome.runtime.getManifest().version;
                console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
            }
        }
    )
}

main()