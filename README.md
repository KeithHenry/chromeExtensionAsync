# Chrome Extension Async
Promise wrapper for the Chrome extension API so that it can be used with async/await rather than callbacks

The [Extension API](https://developer.chrome.com/extensions) provided by Chrome uses callbacks. 
However, Chrome now supports `async` and `await` keywords.

This library wraps Chrome extension API callback methods in promises, so that they can be called with `async` and `await`.

Once activated against the Chrome API each callback function gets a `Promise` version.

Chrome supports ES2017 syntax, so in extensions we can take full advantage of it.

## Examples
For instance, to get the current active tab:

```javascript
function startDoSomething(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        
        // Check API for any errors thrown
        if (chrome.runtime.lastError) {
            // Handle errors from chrome.tabs.query
        }
        else {
            try {
                var activeTab = tabs[0];

                // Do stuff with activeTab...

                callback(activeTab);
            }
            catch(err) {
                // Handle errors from my code
            }
        }
    });
}
```

Instead use `await`:

```javascript
async function doSomething() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];

        // Do stuff with activeTab...

        return activeTab;
    }
    catch(err) {
        // Handle errors from chrome.tabs.query or my code
    }
}
```

Some callbacks take multiple parameters - in these cases the `Promise` will be a combined object:

```javascript
async function checkUpdate() {
    try {
        // API is chrome.runtime.requestUpdateCheck(function (status, details) { ... });
        // Instead we use deconstruction-assignment and await
        const { status, details } = await chrome.runtime.requestUpdateCheck();
        alert(`Status: ${status}\nDetails: ${JSON.stringify(details)}`);
    }
    catch(err) {
        // Handle errors from chrome.runtime.requestUpdateCheck or my code
    }
}
```

## Installation
Use bower
```
bower install chrome-extension-async
```

Or download `chrome-extension-async.js` file and include it directly:
```html
<script type="text/javascript" src="chrome-extension-async.js"></script>
```

TypeScript definitions for the altered API are in `chrome-extension-async.d.ts`

## Release Notes
This only 'promisifies' API functions that use callbacks and are not marked as deprecated. 
No backwards compatibility is attempted.

Each API is added manually as JS can't spot deprecated or functions with no callbacks itself.

Supported API:

- [chrome.tabs](https://developer.chrome.com/extensions/tabs)
- [chrome.runtime](https://developer.chrome.com/extensions/runtime)
- [chrome.permissions](https://developer.chrome.com/extensions/permissions)
- [chrome.identity](https://developer.chrome.com/extensions/identity)
- [chrome.bookmarks](https://developer.chrome.com/extensions/bookmarks)
- [chrome.browserAction](https://developer.chrome.com/extensions/browserAction)
- [chrome.pageAction](https://developer.chrome.com/extensions/pageAction)
- [chrome.browsingData](https://developer.chrome.com/extensions/browsingData)
- [chrome.downloads](https://developer.chrome.com/extensions/downloads)
- [chrome.history](https://developer.chrome.com/extensions/history)
- [chrome.alarms](https://developer.chrome.com/extensions/alarms)
- [chrome.i18n](https://developer.chrome.com/extensions/i18n)
- [chrome.commands](https://developer.chrome.com/extensions/commands#method-getAll)
- [chrome.contextMenus](https://developer.chrome.com/extensions/contextMenus)
- [chrome.extension](https://developer.chrome.com/extensions/extension)
- [chrome.cookies](https://developer.chrome.com/extensions/cookies)
- [chrome.windows](https://developer.chrome.com/extensions/windows)
- [chrome.debugger](https://developer.chrome.com/extensions/debugger)
- [chrome.desktopCapture](https://developer.chrome.com/extensions/desktopCapture)
- [chrome.topSites](https://developer.chrome.com/extensions/topSites#method-get)
- [chrome.sessions](https://developer.chrome.com/extensions/sessions)
- [chrome.socket](https://developer.chrome.com/extensions/socket)
- [chrome.system.cpu](https://developer.chrome.com/extensions/system_cpu)
- [chrome.system.memory](https://developer.chrome.com/extensions/system_memory)
- [chrome.system.storage](https://developer.chrome.com/extensions/system_storage)
- [chrome.tabCapture](https://developer.chrome.com/extensions/tabCapture)
- [chrome.tts](https://developer.chrome.com/extensions/tts)
- [chrome.types](https://developer.chrome.com/extensions/types)
- [chrome.wallpaper](https://developer.chrome.com/extensions/wallpaper#method-setWallpaper)
- [chrome.platformKeys](https://developer.chrome.com/extensions/platformKeys)
- [chrome.pageCapture](https://developer.chrome.com/extensions/pageCapture#method-saveAsMHTML)
- [chrome.webNavigation](https://developer.chrome.com/extensions/webNavigation)
- [chrome.notifications](https://developer.chrome.com/extensions/notifications)
- [chrome.networking.config](https://developer.chrome.com/extensions/networking_config)
- [chrome.management](https://developer.chrome.com/extensions/management)
- [chrome.input.ime](https://developer.chrome.com/extensions/input_ime)
- [chrome.idle](https://developer.chrome.com/extensions/idle#method-queryState)
- [chrome.gcm](https://developer.chrome.com/extensions/gcm)
- [chrome.fontSettings](https://developer.chrome.com/extensions/fontSettings)
- [chrome.fileSystemProvider](https://developer.chrome.com/extensions/fileSystemProvider)
- [chrome.fileBrowserHandler](https://developer.chrome.com/extensions/enterprise_platformKeys)
- [chrome.enterprise.platformKeys](https://developer.chrome.com/extensions/fileBrowserHandler#method-selectFile)
- [chrome.documentScan](https://developer.chrome.com/extensions/documentScan#method-scan)
- [chrome.storage StorageArea](https://developer.chrome.com/extensions/storage#type-StorageArea)
- [chrome.contentSettings ContentSetting](https://developer.chrome.com/extensions/contentSettings#type-ContentSetting)

Pull requests with additional API gratefully received.

### 3.0.0
3.0.0 is a breaking change from v1 and v2: now the original API is wrapped by an identical method that can be called with either old or new syntax.
Callbacks can still be used on the same methods, and will fire before the promise resolves.
Any error thrown inside the callback function will cause the promise to reject.

You can use both a callback and `await` if you want to work with existing API code, but also want the `try`-`catch` support:

```javascript
async function startDoSomethingHybrid(callback) {
    try{
        // Using await means any exception is passed to the catch, even from the callback
        await chrome.tabs.query({ active: true, currentWindow: true }, tabs => callback(tabs[0]));
    }
    catch(err) {
        // Handle errors thrown by the API or by the callback
    }
}
```

Older versions added a `...Async` suffix to either the function (2.0.0) or the API class (1.0.0).