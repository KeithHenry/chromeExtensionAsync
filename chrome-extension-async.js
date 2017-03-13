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
        if (callbackApi)
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

    // chrome.permissions https://developer.chrome.com/extensions/permissions
    addAsyncWrappers(chrome.permissions, 'getAll', 'contains', 'request', 'remove');

    // chrome.identity https://developer.chrome.com/extensions/identity
    addAsyncWrappers(chrome.identity,
        'getAuthToken', 'getProfileUserInfo', 'removeCachedAuthToken',
        'launchWebAuthFlow', 'getRedirectURL');

    // chrome.bookmarks https://developer.chrome.com/extensions/bookmarks
    addAsyncWrappers(chrome.bookmarks,
        'get', 'getChildren', 'getRecent', 'getTree', 'getSubTree',
        'search', 'create', 'move', 'update', 'remove', 'removeTree');

    // chrome.browserAction https://developer.chrome.com/extensions/browserAction
    addAsyncWrappers(chrome.browserAction,
        'getTitle', 'setIcon', 'getPopup', 'getBadgeText', 'getBadgeBackgroundColor');

    // chrome.pageAction https://developer.chrome.com/extensions/pageAction
    addAsyncWrappers(chrome.pageAction, 'getTitle', 'setIcon', 'getPopup');

    // chrome.browsingData https://developer.chrome.com/extensions/browsingData
    addAsyncWrappers(chrome.browsingData,
        'settings', 'remove', 'removeAppcache', 'removeCache',
        'removeCookies', 'removeDownloads', 'removeFileSystems',
        'removeFormData', 'removeHistory', 'removeIndexedDB',
        'removeLocalStorage', 'removePluginData', 'removePasswords',
        'removeWebSQL');

    // chrome.downloads https://developer.chrome.com/extensions/downloads
    addAsyncWrappers(chrome.downloads,
        'download', 'search', 'pause', 'resume', 'cancel',
        'getFileIcon', 'erase', 'removeFile', 'acceptDanger');

    // chrome.history https://developer.chrome.com/extensions/history
    addAsyncWrappers(chrome.history, 'search', 'getVisits', 'addUrl', 'deleteUrl', 'deleteRange', 'deleteAll');

    // chrome.alarms https://developer.chrome.com/extensions/alarms
    addAsyncWrappers(chrome.alarms, 'get', 'getAll', 'clear', 'clearAll');

    // chrome.i18n https://developer.chrome.com/extensions/i18n
    addAsyncWrappers(chrome.i18n, 'getAcceptLanguages', 'detectLanguage');

    // chrome.commands https://developer.chrome.com/extensions/commands#method-getAll
    addAsyncWrappers(chrome.commands, 'getAll');

    // chrome.contextMenus https://developer.chrome.com/extensions/contextMenus
    addAsyncWrappers(chrome.contextMenus, 'create', 'update', 'remove', 'removeAll');

    // chrome.extension https://developer.chrome.com/extensions/extension (mostly deprecated in favour of runtime)
    addAsyncWrappers(chrome.extension, 'isAllowedIncognitoAccess', 'isAllowedFileSchemeAccess');

    // chrome.cookies https://developer.chrome.com/extensions/cookies
    addAsyncWrappers(chrome.cookies, 'get', 'getAll', 'set', 'remove', 'getAllCookieStores');

    // chrome.windows https://developer.chrome.com/extensions/windows
    addAsyncWrappers(chrome.windows, 'get', 'getCurrent', 'getLastFocused', 'getAll', 'create', 'update', 'remove');

    // chrome.debugger https://developer.chrome.com/extensions/debugger
    addAsyncWrappers(chrome.debugger, 'attach', 'detach', 'sendCommand', 'getTargets')

    // chrome.desktopCapture https://developer.chrome.com/extensions/desktopCapture
    addAsyncWrappers(chrome.desktopCapture, 'chooseDesktopMedia');

    // chrome.topSites https://developer.chrome.com/extensions/topSites#method-get
    addAsyncWrappers(chrome.topSites, 'get');

    if (chrome.storage) {
        // StorageArea https://developer.chrome.com/extensions/storage#type-StorageArea
        // Todo: this should extend StorageArea.prototype instead
        const knownInStorageArea = ['get', 'getBytesInUse', 'set', 'remove', 'clear'];
        addAsyncWrappers(chrome.storage.sync, ...knownInStorageArea);
        addAsyncWrappers(chrome.storage.local, ...knownInStorageArea);
        addAsyncWrappers(chrome.storage.managed, ...knownInStorageArea);
    }

    if (chrome.contentSettings) {
        // ContentSetting https://developer.chrome.com/extensions/contentSettings#type-ContentSetting
        // Todo: this should extend ContentSetting.prototype instead
        const knownInContentSetting = ['clear', 'get', 'set', 'getResourceIdentifiers'];
        addAsyncWrappers(chrome.contentSettings.cookies, ...knownInContentSetting);
        addAsyncWrappers(chrome.contentSettings.images, ...knownInContentSetting);
        addAsyncWrappers(chrome.contentSettings.javascript, ...knownInContentSetting);
        addAsyncWrappers(chrome.contentSettings.location, ...knownInContentSetting);
        addAsyncWrappers(chrome.contentSettings.plugins, ...knownInContentSetting);
        addAsyncWrappers(chrome.contentSettings.popups, ...knownInContentSetting);
        addAsyncWrappers(chrome.contentSettings.notifications, ...knownInContentSetting);
        addAsyncWrappers(chrome.contentSettings.fullscreen, ...knownInContentSetting);
        addAsyncWrappers(chrome.contentSettings.mouselock, ...knownInContentSetting);
        addAsyncWrappers(chrome.contentSettings.microphone, ...knownInContentSetting);
        addAsyncWrappers(chrome.contentSettings.camera, ...knownInContentSetting);
        addAsyncWrappers(chrome.contentSettings.unsandboxedPlugins, ...knownInContentSetting);
        addAsyncWrappers(chrome.contentSettings.automaticDownloads, ...knownInContentSetting);
    }
})();