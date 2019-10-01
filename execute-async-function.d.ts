declare namespace chrome.tabs {

    /** Similar to details for executeScript, but code property is not optional */
    interface InjectAsyncDetails {
        /** JavaScript or CSS code to inject.
         * Warning: Be careful using the code parameter. Incorrect use of it may open your extension to cross site scripting attacks. */
        code: string;
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
    export function executeAsyncFunction(tab: number, action: ((...p: any[]) => any) | string | InjectAsyncDetails, ...params: any[]): Promise<any>;

    /** Creates a Promise that resolves only when the created tab is finished loading.
     * The normal chrome.tabs.create function executes its' callback before the tab finishes loading the page.
     * @param {object} createProperties same as the createProperties param for [chrome.tabs.create]{@link https://developer.chrome.com/extensions/tabs#method-create}.
     * @param {number} msTimeout Optional milliseconds to timeout when tab is loading
     * If this value is null or zero, it defaults to 120,000 ms (2 minutes).
     * @returns {Promise} Resolves when the created tab has finished loading and holds the result.
     * The result is an object containing the parameters passed to the callback for [chrome.tabs.onUpdated]{@link https://developer.chrome.com/extensions/tabs#event-onUpdated}.
     * Rejects if an error is encountered loading the tab, or if it times out. */
    export function createAndWait(createProperties: object, msTimeout: number): Promise<any>;

    /** Creates a Promise that resolves only when the tab is finished reloading.
     * The normal chrome.tabs.reload function executes its' callback before the tab finishes loading the page.
     * @param {integer} tabId same as the tabId parameter for [chrome.tabs.reload]{@link https://developer.chrome.com/extensions/tabs#method-reload}.
     * @param {object} reloadProperties Optional. same as the reloadProperties parameter for [chrome.tabs.reload]{@link https://developer.chrome.com/extensions/tabs#method-reload}.
     * @param {number} msTimeout Optional milliseconds to timeout when tab is loading
     * If this value is null or zero, it defaults to 120,000 ms (2 minutes).
     * @returns {Promise} Resolves when the tab has finished reloading and holds the result.
     * The result is an object containing the parameters passed to the callback for [chrome.tabs.onUpdated]{@link https://developer.chrome.com/extensions/tabs#event-onUpdated}.
     * Rejects if an error is encountered loading the tab, or if it times out. */
    export function reloadAndWait(tabId: number, reloadProperties: object, msTimeout: number): Promise<any>;
}