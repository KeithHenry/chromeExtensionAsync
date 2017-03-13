/** Wrap an API that uses callbacks with Promises
 * This expects the pattern function withCallback(arg1, arg2, ... argN, callback) */
(function () {
    'use strict';

    /** Wrap a function with a callback with a Promise.
     * @param f {function} The function to wrap, should be pattern: withCallback(arg1, arg2, ... argN, callback).
     * @returns {Promise} Promise that resolves when the callback fires. */
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
     * @param {object} o The instance to copy members from.
     * @param {Set} known The names of any member functions that should be wrapped in promises. */
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
     * @param {object} callbackApi The callback API to 'promisify'
     * @param {string[]} callbackFunctions The names of functions with the pattern: withCallback(arg1, arg2, ... argN, callback) */
    function addAsyncWrappers(callbackApi, ...callbackFunctions) {
        promisifyKnownCallbacks(callbackApi, new Set(callbackFunctions));
    }

    // chrome.tabs https://developer.chrome.com/extensions/tabs
    addAsyncWrappers(chrome.tabs,
        'get', 'getCurrent', 'sendMessage', 'create', 'duplicate',
        'query', 'highlight', 'update', 'move', 'reload', 'remove',
        'detectLanguage', 'captureVisibleTab', 'executeScript',
        'insertCSS', 'setZoom', 'getZoom', 'setZoomSettings',
        'getZoomSettings', 'discard');

    // chrome.runtime https://developer.chrome.com/extensions/runtime
    addAsyncWrappers(chrome.runtime,
        'getBackgroundPage', 'openOptionsPage', 'setUninstallURL',
        'requestUpdateCheck', 'restartAfterDelay', 'sendMessage',
        'sendNativeMessage', 'getPlatformInfo', 'getPackageDirectoryEntry');

    // StorageArea https://developer.chrome.com/extensions/storage#type-StorageArea
    const knownInStorageArea = ['get', 'getBytesInUse', 'set', 'remove', 'clear'];
    addAsyncWrappers(chrome.storage.sync, ...knownInStorageArea);
    addAsyncWrappers(chrome.storage.local, ...knownInStorageArea);
    addAsyncWrappers(chrome.storage.managed, ...knownInStorageArea);

    // chrome.identity https://developer.chrome.com/extensions/identity
    addAsyncWrappers(chrome.identity,
        'getAuthToken', 'getProfileUserInfo', 'removeCachedAuthToken', 
        'launchWebAuthFlow', 'getRedirectURL');

})();