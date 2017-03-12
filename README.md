# Chrome Extension Async
Promise wrapper for the Chrome extension API so that it can be used with async/await rather than callbacks

The [Extension API](https://developer.chrome.com/extensions) provided by Chrome uses callbacks. 
However, Chrome now supports `async` and `await` keywords.

This library wraps Chrome extension API callback methods in promises, so that they can be called with `async` and `await`.

Once activated against the Chrome API each callback function gets a Promise version, so if `apiMethod` requires a callback `apiMethodAsync` will return a `Promise` instead.

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

Instead use `await`:

```javascript
async function doSomething() {
    const tabs = await chrome.tabs.queryAsync({ active: true, currentWindow: true });
    const activeTab = tabs[0];

    // Do stuff with activeTab...

    return activeTab;
}
```

Chrome supports ES2017 syntax, so in extensions we can take full advantage of it.

## Installation
Use bower
```
bower install chrome-extension-async
```

Or download `chrome-extension-async.js` file and include it directly:
```html
<script type="text/javascript" src="chrome-extension-async.js"></script>
```

## Alpha Release
This only 'promisifies' API functions that use callbacks and are not marked as deprecated. 
No backwards compatibility is attempted.

Each API is added manually (I'm still working through them at the moment, feel free to help) as JS can't spot deprecated or functions with no callbacks itself.

### 2.0.0
Breaking changes, as in the initial release this created a new class that wrapped the entire API.

In 2.0.0 this was changed to just add the `...Async` functions to the existing API instead.