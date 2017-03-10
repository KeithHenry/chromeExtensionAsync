# Chrome Extension Async
Promise wrapper for the Chrome extension API so that it can be used with async/await rather than callbacks

The [Extension API](https://developer.chrome.com/extensions) provided by Chrome uses callbacks. 
However, Chrome now supports `async` and `await` keywords.

This library wraps Chrome extension API callback methods in promises, so that they can be called with `async` and `await`.

## Examples
For instance, to get the current active tab:

```javascript
function startDoSomething(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var activeTab = tabs[0];

        // Do stuff with activeTab...

        callback(activeTab);
    });
}
```

This is replaced with:

```javascript
async function doSomething() {
    const tabs = await chrome.tabsAsync.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];

    // Do stuff with activeTab...

    return activeTab;
}
```

Chrome supports this new ES2017 syntax, so in extensions we can take full advantage of it.

## Installation
Use bower

```
bower install chrome-promise
```

Or download chrome-extension-async.js file and include it directly:
```html
<script type="text/javascript" src="chrome-promise.js"></script>
```