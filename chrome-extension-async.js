/** Wrap an API that uses callbacks with Promises
 * This expects the pattern function withCallback(arg1, arg2, ... argN, callback) */
class AsyncCallbackWrapper {

    /** Create a promise API from a callback one.
     * @param callbackApi {object} The callback API to 'promisify'
     * @param callbackFunctions {string[]} The names of functions with the pattern: withCallback(arg1, arg2, ... argN, callback) */
    constructor(callbackApi, ...callbackFunctions) {
        this.promisifyKnownCallbacks(callbackApi, new Set(callbackFunctions));
    }

    /** Set all the own-properties to this, wrap any known to be callbacks in a Promise.
     * @param o {object} The instance to copy members from.
     * @param known {Set} The names of any member functions that should be wrapped in promises. */
    promisifyKnownCallbacks(o, known) {
        for (let p in o) {
            if (!o.hasOwnProperty(p))
                continue; // Don't bother with .toString() etc

            const m = o[p];
            if (typeof m === 'function' &&
                known.has(p)) {
                // Wrap the source callback function in a promise so that we can call it with await
                this[p] = this.promisify(m);
            }
            else {
                // Not a known callback, just reference direct
                this[p] = m;
            }
        }
    }

    /** Wrap a function with a callback with a Promise.
     * @param f The function to wrap, should be pattern: withCallback(arg1, arg2, ... argN, callback).
     * @returns Promise that resolves when the callback fires. */
    promisify(f) {
        return (...args) =>
            new Promise((resolve, reject) => {
                try {
                    f(...args, (...cbArgs) => {
                        if(chrome.runtime.lastError) // Error may be in chrome.runtime
                            reject(chrome.runtime.lastError);
                        else
                            resolve(...cbArgs); 
                    });
                }
                catch (err) {
                    reject(err);
                }
            });
    }
}

/** Same API as chrome.tabs {@link https://developer.chrome.com/extensions/tabs}, but with promises instead of callbacks. */
chrome.tabsAsync = new AsyncCallbackWrapper(chrome.tabs, 
    'get', 'getCurrent',  'sendMessage', 'create', 'duplicate', 
    'query', 'highlight', 'update', 'move', 'reload', 'remove', 
    'detectLanguage', 'captureVisibleTab', 'executeScript', 
    'insertCSS', 'setZoom', 'getZoom', 'setZoomSettings', 
    'getZoomSettings', 'discard');

/** Same API as chrome.runtime {@link https://developer.chrome.com/extensions/runtime}, but with promises instead of callbacks. */
chrome.runtimeAsync = new AsyncCallbackWrapper(chrome.runtime, 
    'getBackgroundPage', 'openOptionsPage', 'setUninstallURL', 
    'requestUpdateCheck', 'restartAfterDelay', 'sendMessage', 
    'sendNativeMessage', 'getPlatformInfo', 'getPackageDirectoryEntry');