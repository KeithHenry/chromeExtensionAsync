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
}