const Commands = {
    GetBook: 'GetBook',
    Download: 'Download',
    UpdateBook: 'UpdateBook'
}

function getTailAfter(str, sep) {
    return str?.substring(str?.lastIndexOf(sep) + 1)
}

// https://stackoverflow.com/a/51838635/404271
function base64UrlDecode(s) {
    // Replace non-url compatible chars with base64 standard chars
    s = s.replace(/-/g, '+').replace(/_/g, '/');

    // Pad out with standard base64 required padding characters
    var pad = s.length % 4;
    if (pad) {
        if (pad === 1) {
            throw new Error('InvalidLengthError: Input base64url string is the wrong length to determine padding');
        }
        s += new Array(5 - pad).join('=');
    }

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