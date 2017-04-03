(function () {
    'use strict';

    /** Resolve a Promise after a timeout (using requestAnimationFrame)
     * @param {number} duration in ms
     * @returns {Promise} that resolves when the timeout expires. */
    function wait(duration) {
        const start = performance.now();
        const end = start + duration;
        return new Promise(resolve => {
            const next = t => {
                if (performance.now() >= end)
                    // Timer expired, resolve the promise
                    resolve();
                else
                    // Use request animation frame rather than setTimeout as we can wait if something else is running
                    requestAnimationFrame(next);
            };

            // Start the requestAnimationFrame loop
            next();
        });
    }

    /** Wrap the async function in an await and a runtime.sendMessage with the result
     * @param {function|string|object} action The async function to inject into the page.
     * @param {string} id Single use random ID.
     * @returns {object} Execution details to pass to chrome.tabs.executeScript */
    function setupDetails(action, id) {
        // Wrap the async function in an await and a runtime.sendMessage with the result
        // This should always call runtime.sendMessage, even if an error is thrown
        const wrapAsyncSendMessage = action =>
            `(async function () {
    const result = { asyncFuncID: '${id}' };
    try {
        result.content = await (${action})();
    }
    catch(x) {
        // Make an explicit copy of the Error properties
        result.error = { 
            message: x.message, 
            arguments: x.arguments, 
            type: x.type, 
            name: x.name, 
            stack: x.stack 
        };
    }
    finally {
        // Always call sendMessage, as without it this might loop forever
        chrome.runtime.sendMessage(result);
    }
})()`;

        // Apply this wrapper to the code passed
        let execArgs = {};
        if (typeof action === 'function' || typeof action === 'string')
            // Passed a function or string, wrap it directly
            execArgs.code = wrapAsyncSendMessage(action);
        else if (action.code) {
            // Passed details object https://developer.chrome.com/extensions/tabs#method-executeScript
            execArgs = action;
            execArgs.code = wrapAsyncSendMessage(action.code);
        }
        else if (action.file)
            throw new Error(`Cannot execute ${action.file}. File based execute scripts are not supported.`);
        else
            throw new Error(`Cannot execute ${JSON.stringify(action)}, it must be a function, string, or have a code property.`);

        return execArgs;
    }

    /** Execute an async function and return the result.
     * @param {number} tab Optional ID of the tab in which to run the script; defaults to the active tab of the current window.
     * @param {function|string|object} action The async function to inject into the page.
     * This must be marked as async or return a Promise.
     * This can be the details object expected by [executeScript]{@link https://developer.chrome.com/extensions/tabs#method-executeScript}, 
     * in which case the code property MUST be populated with a promise-returning function.
     * @param {number} timeout Optional maximum wait (in ms) to wait before giving up. Default 10s. Set to 0 to never timeout.
     * @returns {Promise} Resolves when the injected async script has finished executing and holds the result of the script.
     * Rejects if an error is encountered setting up the function, if an error is thrown by the executing script, or if it times out. */
    chrome.tabs.executeAsyncFunction = async function (tab, action, timeout = 10000) {

        // Generate a random 4-char key to avoid clashes if called multiple times
        const id = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);

        const details = setupDetails(action, id);

        // Add a listener so that we know when the async script finishes
        let message = null;
        chrome.runtime.onMessage.addListener(request => {
            // Check that the message sent is intended for this listener
            if (request && request.asyncFuncID === id) 
                message = request;

            // Return false as we don't want to keep this channel open https://developer.chrome.com/extensions/runtime#event-onMessage
            return false;
        });

        // This will return a serialised promise, which will be broken
        await chrome.tabs.executeScript(tab, details);

        // Wait until we have the result message
        const start = performance.now();
        const timeoutAt = start + timeout;
        while (!message) {
            // Avoid infinite loops with a timeout
            if (timeout > 0 && performance.now() >= timeoutAt)
                throw new Error(`Timeout, operation took too long (over ${timeout}ms).`);

            await wait(50);
        }

        if (message.error)
            throw new Error(`Error thrown in execution script: ${message.error.message}.
Stack: ${message.error.stack}`)

        return message.content;
    }
});