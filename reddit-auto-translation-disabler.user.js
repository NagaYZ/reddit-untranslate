// ==UserScript==
// @name         Reddit Auto-Translation Disabler
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Disables Reddit's auto-translation feature and removes Google translation parameters
// @author       NagaYZ
// @match        https://www.reddit.com/*
// @grant        none
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // Remove Google translation parameter from URL
    function removeTranslationParam() {
        const url = new URL(window.location.href);
        if (url.searchParams.has('tl')) {
            url.searchParams.delete('tl');
            window.location.replace(url.toString());
            return true;
        }
        return false;
    }

    // Check and remove translation parameter immediately
    if (removeTranslationParam()) {
        // Exit early if we're reloading to avoid running the rest of the script
        return;
    }

    // Flag to prevent infinite recursion
    let settingCookie = false;

    // Function to set the translation cookie
    function setTranslationCookie() {
        if (settingCookie) return;

        settingCookie = true;
        const cookieValue = JSON.stringify({
            shouldDisplayCoachmark: false,
            shouldDisplayFeedbackCoachmark: false,
            coachmarkDisplayCount: 999,
            showCommentTranslationModal: false,
            showPostTranslationModal: false,
            isTranslationActive: false,
            translationEnabled: false,
            autoTranslate: false
        });

        document.cookie = `reddit_translation_status=${encodeURIComponent(cookieValue)}; path=/; domain=.reddit.com; max-age=31536000; SameSite=Lax`;
        settingCookie = false;
    }

    // Set cookie immediately
    setTranslationCookie();

    // Intercept cookie modifications
    const originalCookieSetter = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie').set;
    const originalCookieGetter = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie').get;

    Object.defineProperty(document, 'cookie', {
        set: function(value) {
            // Only intercept if we're not already setting the cookie and it's a translation cookie
            if (!settingCookie && value.includes('reddit_translation_status')) {
                // Check if it's trying to enable translation
                if (value.includes('isTranslationActive":true') ||
                    value.includes('translationEnabled":true') ||
                    value.includes('autoTranslate":true')) {
                    // Set our disabled version instead
                    setTranslationCookie();
                    return;
                }
            }
            return originalCookieSetter.call(document, value);
        },
        get: function() {
            return originalCookieGetter.call(document);
        }
    });

    // Intercept fetch requests to block translation-related API calls
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];

        // Block translation-related GraphQL requests
        if (typeof url === 'string' && url.includes('/svc/shreddit/graphql')) {
            try {
                const body = args[1]?.body;
                if (body && (body.includes('translate') || body.includes('translation'))) {
                    // Return a fake successful response
                    return Promise.resolve(new Response('{}', {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    }));
                }
            } catch (e) {
                // Continue with normal fetch if there's an error
            }
        }

        return originalFetch.apply(this, args);
    };

    // Intercept XMLHttpRequest as well
    const originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(data) {
        if (this._url && this._url.includes('/svc/shreddit/graphql')) {
            try {
                if (data && (data.includes('translate') || data.includes('translation'))) {
                    // Don't send the request
                    this.abort();
                    return;
                }
            } catch (e) {
                // Continue normally if there's an error
            }
        }
        return originalXHRSend.apply(this, arguments);
    };

    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        this._url = url;
        return originalXHROpen.apply(this, arguments);
    };

    // Override localStorage translation settings
    function overrideTranslationSettings() {
        try {
            const settings = {
                translationEnabled: false,
                autoTranslate: false,
                translationLanguage: null,
                isTranslationActive: false
            };

            // Check for any translation-related keys and override them
            for (let key in localStorage) {
                if (key.toLowerCase().includes('translat')) {
                    localStorage.setItem(key, JSON.stringify(settings));
                }
            }
        } catch (e) {
            // Ignore errors
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', overrideTranslationSettings);
    } else {
        overrideTranslationSettings();
    }

    // Periodically check and disable translation
    setInterval(() => {
        setTranslationCookie();
        overrideTranslationSettings();

        // Also try to find and disable any translation toggles in the UI
        try {
            const translationToggles = document.querySelectorAll('[aria-label*="translat"], [data-testid*="translat"], button[class*="translat"]');
            translationToggles.forEach(toggle => {
                if (toggle.getAttribute('aria-checked') === 'true' || toggle.classList.contains('active')) {
                    toggle.click();
                }
            });
        } catch (e) {
            // Ignore errors
        }
    }, 5000);

    // Mutation observer to catch dynamically added translation elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    try {
                        // Check if it's a translation-related element
                        if (node.matches && (node.matches('[aria-label*="translat"], [data-testid*="translat"], button[class*="translat"]'))) {
                            if (node.getAttribute('aria-checked') === 'true' || node.classList.contains('active')) {
                                setTimeout(() => node.click(), 100);
                            }
                        }
                    } catch (e) {
                        // Ignore errors
                    }
                }
            });
        });
    });

    // Start observing when body is available
    const startObserver = () => {
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            setTimeout(startObserver, 100);
        }
    };

    startObserver();

    // Additional check for URL changes (for single-page navigation)
    let lastUrl = window.location.href;
    setInterval(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            removeTranslationParam();
        }
    }, 1000);
})();