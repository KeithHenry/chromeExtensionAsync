# Chrome Extension Async
[![npm version](http://img.shields.io/npm/v/chrome-extension-async.svg)](https://www.npmjs.com/package/chrome-extension-async)
[![bower version](https://img.shields.io/bower/v/chrome-extension-async.svg)](https://github.com/KeithHenry/chromeExtensionAsync/releases)

Promise wrapper for the Chrome extension API so that it can be used with async/await rather than callbacks

The [Extension API](https://developer.chrome.com/extensions) provided by Chrome uses callbacks. 
However, Chrome now supports `async` and `await` keywords.

This library wraps Chrome extension API callback methods in promises, so that they can be called with `async` and `await`.

Once activated against the Chrome API each callback function gets a `Promise` version.

Chrome supports ES2017 syntax, so in extensions we can take full advantage of it.

## Installation
Use bower
```
bower install chrome-extension-async
```

Or [npm](https://www.npmjs.com/package/chrome-extension-async)
```
npm i chrome-extension-async
```

Or [download](chrome-extension-async.js) `chrome-extension-async.js` file and include it directly:
```html
<script type="text/javascript" src="chrome-extension-async.js"></script>
```

TypeScript definitions for the altered API are in [`chrome-extension-async.d.ts`](chrome-extension-async.d.ts)

## Examples
Using the basic Chrome API, let's:
- Get the current active tab 
- Execute a script in that tab
- Do something with the first result of the script

```javascript
function startDoSomething(script, callback) {
    // Fire off the tabs query and continue in the callback
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        
        // Check API for any errors thrown
        if (chrome.runtime.lastError) {
            // Handle errors from chrome.tabs.query
        }
        else {
            var activeTab = tabs[0];

            // Fire off the injected script and continue in the callback
            chrome.tabs.executeScript(activeTab.id, { code: script }, function(results) {
                
                // Check API for any errors thrown, again
                if (chrome.runtime.lastError) {
                    // Handle errors from chrome.tabs.executeScript
                }
                else {
                    var firstScriptResult = results[0];
                    callback(firstScriptResult);
                }
            });
        }
    });
}
```

This works, but the nested callbacks are painful to debug and maintain, and they can quickly lead to 'callback hell'.

Instead, with this library, we can use `await`:

```javascript
async function doSomething(script) {
    try {
        // Query the tabs and continue once we have the result
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];

        // Execute the injected script and continue once we have the result
        const results = await chrome.tabs.executeScript(activeTab.id, { code: script });
        const firstScriptResult = results[0];
        return firstScriptResult;
    }
    catch(err) {
        // Handle errors from chrome.tabs.query, chrome.tabs.executeScript or my code
    }
}

// If you want to use the same callback you can use Promise syntax too:
doSomething(script).then(callback);
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

This also includes a check against [`chrome.runtime.lastError`](https://developer.chrome.com/extensions/runtime#property-lastError), so that you can use `try`-`catch` to get exceptions thrown from the Chrome API.

### Execute Injected Scripts Asynchronously With `chrome.tabs.executeAsyncFunction`
New in v3.2 is `chrome.tabs.executeAsyncFunction`, an enhancement to the tabs API that allows a popup or browser/page action to easily execute asynchronous code in a page. This:

- Adds `chrome.runtime.sendMessage` to the injected script to return the result.
- Uses `chrome.runtime.onMessage.addListener` to listen for the injected event.
- Fires the script with `chrome.tabs.executeScript`.
- Wraps the whole thing in a promise that resolves with the final result.
- Adds all the relevant error handling by rejecting the promise.

```javascript
const scriptToExecute = async function() {
    // await promises in the tab
}

try{
    // The await returns the complete result of the function
    const results = await chrome.tabs.executeAsyncFunction(
        activeTab.id,       // If null this will be the current tab
        scriptToExecute,    // Will be .toString and applied to the {code:} property
        123, 'foo');        // Additional parameters will be passed to scriptToExecute

    // results now holds the output of the asynchronous code run in the page
}
catch(err) {
    // Any error either setting up or executing the script
    // Note that errors from the page will be re-thrown copies
}
```

`chrome.tabs.executeAsyncFunction` can take a `function`, `string`, or [`executeScript` details](https://developer.chrome.com/extensions/tabs#method-executeScript) with the `code` property set. The script must be `async` or return a `Promise`. Details with a `file` property are not supported. Scripts that output multiple values are not supported.

Unlike `chrome.tabs.executeScript` this can take a `function`, but note that it just converts the function to a string to pass it. This means that it must be self contained (it cannot call other user defined functions) and it cannot be native (as many serialise to `function foobar() { [native code] }`).

This is held in its own file: [`execute-async-function.js`](execute-async-function.js):

```html
<script type="text/javascript" src="execute-async-function.js"></script>
```

This relies on a `chrome.runtime.onMessage.addListener` subscription, so it will fail if called from within a listener event.

## Supported APIs
This only 'promisifies' API functions that use callbacks and are not marked as deprecated. 
No backwards compatibility is attempted.

Each API is added manually as JS can't spot deprecated or functions with no callbacks itself.

Supported API:

- [chrome.alarms](https://developer.chrome.com/extensions/alarms)
- [chrome.bookmarks](https://developer.chrome.com/extensions/bookmarks)
- [chrome.browserAction](https://developer.chrome.com/extensions/browserAction)
- [chrome.browsingData](https://developer.chrome.com/extensions/browsingData)
- [chrome.commands](https://developer.chrome.com/extensions/commands#method-getAll)
- [chrome.contentSettings ContentSetting](https://developer.chrome.com/extensions/contentSettings#type-ContentSetting)
- [chrome.contextMenus](https://developer.chrome.com/extensions/contextMenus)
- [chrome.cookies](https://developer.chrome.com/extensions/cookies)
- [chrome.debugger](https://developer.chrome.com/extensions/debugger)
- [chrome.desktopCapture](https://developer.chrome.com/extensions/desktopCapture)
- [chrome.documentScan](https://developer.chrome.com/extensions/documentScan#method-scan)
- [chrome.downloads](https://developer.chrome.com/extensions/downloads)
- [chrome.enterprise.platformKeys](https://developer.chrome.com/extensions/fileBrowserHandler#method-selectFile)
- [chrome.extension](https://developer.chrome.com/extensions/extension)
- [chrome.fileBrowserHandler](https://developer.chrome.com/extensions/enterprise_platformKeys)
- [chrome.fileSystemProvider](https://developer.chrome.com/extensions/fileSystemProvider)
- [chrome.fontSettings](https://developer.chrome.com/extensions/fontSettings)
- [chrome.gcm](https://developer.chrome.com/extensions/gcm)
- [chrome.history](https://developer.chrome.com/extensions/history)
- [chrome.i18n](https://developer.chrome.com/extensions/i18n)
- [chrome.identity](https://developer.chrome.com/extensions/identity)
- [chrome.idle](https://developer.chrome.com/extensions/idle#method-queryState)
- [chrome.input.ime](https://developer.chrome.com/extensions/input_ime)
- [chrome.management](https://developer.chrome.com/extensions/management)
- [chrome.networking.config](https://developer.chrome.com/extensions/networking_config)
- [chrome.notifications](https://developer.chrome.com/extensions/notifications)
- [chrome.pageAction](https://developer.chrome.com/extensions/pageAction)
- [chrome.pageCapture](https://developer.chrome.com/extensions/pageCapture#method-saveAsMHTML)
- [chrome.permissions](https://developer.chrome.com/extensions/permissions)
- [chrome.platformKeys](https://developer.chrome.com/extensions/platformKeys)
- [chrome.runtime](https://developer.chrome.com/extensions/runtime)
- [chrome.sessions](https://developer.chrome.com/extensions/sessions)
- [chrome.socket](https://developer.chrome.com/extensions/socket)
- [chrome.sockets.tcp](https://developer.chrome.com/extensions/sockets_tcp)
- [chrome.sockets.tcpServer](https://developer.chrome.com/extensions/sockets_tcpServer)
- [chrome.sockets.udp](https://developer.chrome.com/extensions/sockets_udp)
- [chrome.storage StorageArea](https://developer.chrome.com/extensions/storage#type-StorageArea)
- [chrome.system.cpu](https://developer.chrome.com/extensions/system_cpu)
- [chrome.system.memory](https://developer.chrome.com/extensions/system_memory)
- [chrome.system.storage](https://developer.chrome.com/extensions/system_storage)
- [chrome.tabCapture](https://developer.chrome.com/extensions/tabCapture)
- [chrome.tabs](https://developer.chrome.com/extensions/tabs)
- [chrome.topSites](https://developer.chrome.com/extensions/topSites#method-get)
- [chrome.tts](https://developer.chrome.com/extensions/tts)
- [chrome.types](https://developer.chrome.com/extensions/types)
- [chrome.wallpaper](https://developer.chrome.com/extensions/wallpaper#method-setWallpaper)
- [chrome.webNavigation](https://developer.chrome.com/extensions/webNavigation)
- [chrome.windows](https://developer.chrome.com/extensions/windows)

Pull requests with additional API gratefully received.

## Release Notes

### v3.2
v3.2 adds `chrome.tabs.executeAsyncFunction`; this is backwards compatible and opt-in functionality.

### v3 Changes
v3 introduces a breaking change from v1 and v2: now the original Chrome API is wrapped by an identical method that can be called with either old or new syntax.
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

Older versions added a `...Async` suffix to either the function (2.0.0) or the API class (1.0.0). These are still available on bower (but not npm) and are not maintained.