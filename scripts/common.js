const Commands = {
    GetMap: 'GetMap',
    Download: 'Download',
}

function getTailAfter(str, sep) {
    return str.substring(str.lastIndexOf(sep) + 1)
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
    // return name.replace(/[/<>:"/\\|?*\x00-\x1f]/g, '_');
    return name.replace(/[<>:"/\\|?*]/g, '_');
}

export { Commands, getTailAfter, base64UrlDecode, makePathNameSafe }