const Commands = {
    GetBook: 'GetBook',
    Download: 'Download',
    UpdateBook: 'UpdateBook'
}

function getTailAfter(str, sep) {
    return str?.substring(str?.lastIndexOf(sep) + 1)
}

// https://github.com/brianloveswords/base64url/blob/master/src/base64url.ts
function base64UrlDecode(s) {
    // Replace non-url compatible chars with base64 standard chars
    s = s.replace(/-/g, '+').replace(/_/g, '/')
    // const paddingLen = (4 - s.length % 4) % 4
    // s = s + '='.repeat(paddingLen)
    return atob(s);
}

// https://stackoverflow.com/a/31976060/404271
function makePathNameSafe(name) {
    return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
}

function dashify(s) {
    return s.replace(/[^a-zA-Z0-9]/g, '-');
}

function delayMs(ms) {
    return new Promise(res => setTimeout(res, ms))
}

async function delayMsWithRatio(ms, ratio) {
    await delayMs(ms * (1 - ratio + 2 * ratio * Math.random()))
}

async function delayRoughlyMs(ms) {
    await delayMsWithRatio(ms, 0.4)
}

export {
    Commands,
    getTailAfter, base64UrlDecode, makePathNameSafe, dashify,
    delayMs, delayMsWithRatio, delayRoughlyMs
}