/** Inject and execute a single async function or promise in a tab, resolving with the result.
 * @author Keith Henry <keith.henry@evolutionjobs.co.uk>
 * @license MIT */
(function () {
    'use strict';

    /** Wrap the async function in an await and a runtime.sendMessage with the result
     * @param {function|string|object} action The async function to inject into the page.
     * @param {string} id Single use random ID.
     * @param {any[]} params Array of additional parameters to pass.
     * @returns {object} Execution details to pass to chrome.tabs.executeScript */
    function setupDetails(action, id, params) {
        // Wrap the async function in an await and a runtime.sendMessage with the result
        // This should always call runtime.sendMessage, even if an error is thrown
        const wrapAsyncSendMessage = action =>
            `(async function () {
    const result = { asyncFuncID: '${id}' };
    try {
        result.content = await (${action})(${params.map(p => JSON.stringify(p)).join(',')});
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

    /** Create a promise that resolves when chrome.runtime.onMessage fires with the id
     * @param {string} id ID for the message we're expecting.
     * Messages without the ID will not resolve this promise.
     * @returns {Promise} Promise that resolves when chrome.runtime.onMessage.addListener fires. */
    function promisifyRuntimeMessage(id) {
        // We don't have a reject because the finally in the script wrapper should ensure this always gets called.
        return new Promise(resolve => {
            const listener = request => {
                // Check that the message sent is intended for this listener
                if (request && request.asyncFuncID === id) {

                    // Remove this listener
                    chrome.runtime.onMessage.removeListener(listener);
                    resolve(request);
                }

                // Return false as we don't want to keep this channel open https://developer.chrome.com/extensions/runtime#event-onMessage
                return false;
            };

            chrome.runtime.onMessage.addListener(listener);
        });
    }

    /** Execute an async function and return the result.
     * @param {number} tab Optional ID of the tab in which to run the script; defaults to the active tab of the current window.
     * @param {function|string|object} action The async function to inject into the page.
     * This must be marked as async or return a Promise.
     * This can be the details object expected by [executeScript]{@link https://developer.chrome.com/extensions/tabs#method-executeScript}, 
     * in which case the code property MUST be populated with a promise-returning function.
     * @param {any[]} params Parameters to serialise and pass to the action (using JSON.stringify)
     * @returns {Promise} Resolves when the injected async script has finished executing and holds the result of the script.
     * Rejects if an error is encountered setting up the function, if an error is thrown by the executing script, or if it times out. */
    chrome.tabs.executeAsyncFunction = async function (tab, action, ...params) {

        // Generate a random 4-char key to avoid clashes if called multiple times
        const id = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);

        // Write the script and serialise the params
        const details = setupDetails(action, id, params);

        // Add a listener so that we know when the async script finishes
        const message = promisifyRuntimeMessage(id);

        // This will return a serialised promise, which will be broken (http://stackoverflow.com/questions/43144485)
        await chrome.tabs.executeScript(tab, details);

        // Wait until we have the result message
        const { content, error } = await message;

        if (error)
            throw new Error(`Error thrown in execution script: ${error.message}.
Stack: ${error.stack}`)

        return content;
    }
})();