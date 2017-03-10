/** Wrap an API that uses callbacks with Promises
 * This expects the pattern function withCallback(arg1, arg2, ... argN, callback) */
(function () {
    'use strict';

    /** Wrap a function with a callback with a Promise.
     * @param f The function to wrap, should be pattern: withCallback(arg1, arg2, ... argN, callback).
     * @returns Promise that resolves when the callback fires. */
    function promisify(f) {
        return (...args) =>
            new Promise((resolve, reject) => {
                try {
                    f(...args, (...cbArgs) => {
                        if (chrome.runtime.lastError)
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

    /** Set all the own-properties to this, wrap any known to be callbacks in a Promise.
     * @param o {object} The instance to copy members from.
     * @param known {Set} The names of any member functions that should be wrapped in promises. */
    function promisifyKnownCallbacks(o, known) {
        for (let p in o) {
            if (!o.hasOwnProperty(p))
                continue; // Don't bother with .toString() etc

            const m = o[p];
            if (typeof m === 'function' &&
                known.has(p)) {
                // Wrap the source callback function in a promise so that we can call it with await
                o[p + 'Async'] = promisify(m);
            }
        }
    }

    /** Create a promise API from a callback one.
     * @param callbackApi {object} The callback API to 'promisify'
     * @param callbackFunctions {string[]} The names of functions with the pattern: withCallback(arg1, arg2, ... argN, callback) */
    function addAsyncWrappers(callbackApi, ...callbackFunctions) {
        promisifyKnownCallbacks(callbackApi, new Set(callbackFunctions));
    }

    /** Same API as chrome.tabs {@link https://developer.chrome.com/extensions/tabs}, but with promises instead of callbacks. */
    addAsyncWrappers(chrome.tabs,
        'get', 'getCurrent', 'sendMessage', 'create', 'duplicate',
        'query', 'highlight', 'update', 'move', 'reload', 'remove',
        'detectLanguage', 'captureVisibleTab', 'executeScript',
        'insertCSS', 'setZoom', 'getZoom', 'setZoomSettings',
        'getZoomSettings', 'discard');

    /** Same API as chrome.runtime {@link https://developer.chrome.com/extensions/runtime}, but with promises instead of callbacks. */
    addAsyncWrappers(chrome.runtime,
        'getBackgroundPage', 'openOptionsPage', 'setUninstallURL',
        'requestUpdateCheck', 'restartAfterDelay', 'sendMessage',
        'sendNativeMessage', 'getPlatformInfo', 'getPackageDirectoryEntry');

    const knownInStorageArea = ['get', 'getBytesInUse', 'set', 'remove', 'clear'];

    /** Same API as chrome.storage.sync {@link https://developer.chrome.com/extensions/storage#type-StorageArea}, but with promises instead of callbacks. */
    addAsyncWrappers(chrome.storage.sync, ...knownInStorageArea);

    /** Same API as chrome.storage.local {@link https://developer.chrome.com/extensions/storage#type-StorageArea}, but with promises instead of callbacks. */
    addAsyncWrappers(chrome.storage.local, ...knownInStorageArea);

    /** Same API as chrome.storage.managed {@link https://developer.chrome.com/extensions/storage#type-StorageArea}, but with promises instead of callbacks. */
    addAsyncWrappers(chrome.storage.managed, ...knownInStorageArea);

})();