/**
 * Chegatta i18n - Language Detection & Redirect
 * Runs immediately on page load (before DOMContentLoaded)
 * GitHub Pages compatible - client-side only
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        cookieName: 'chegatta_lang',
        storageKey: 'chegatta_lang',
        supportedLangs: ['en', 'pt', 'es'],
        defaultLang: 'en',
        ptPath: '/pt/',
        esPath: '/es/',
        trialPath: '/trial.html'
    };

    // Utility functions
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    function setCookie(name, value, days = 365) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${value}; expires=${expires}; path=/; domain=chegatta.com; SameSite=Lax`;
    }

    function getStoredLang() {
        // Priority: localStorage > cookie > null
        return localStorage.getItem(CONFIG.storageKey) || getCookie(CONFIG.cookieName);
    }

    function setStoredLang(lang) {
        localStorage.setItem(CONFIG.storageKey, lang);
        setCookie(CONFIG.cookieName, lang);
    }

    function detectBrowserLang() {
        const navLang = navigator.language || navigator.userLanguage || '';
        const lang = navLang.toLowerCase();
        
        // Portuguese (pt-PT, pt-BR, pt, pt-AO, pt-MZ, etc.)
        if (lang.startsWith('pt')) return 'pt';
        
        // Spanish (es-ES, es-MX, es-AR, etc.)
        if (lang.startsWith('es')) return 'es';
        
        // English (en-US, en-GB, en, etc.)
        if (lang.startsWith('en')) return 'en';
        
        return null;
    }

    function getCurrentPath() {
        return window.location.pathname;
    }

    function isOnPtPath() {
        return getCurrentPath().startsWith('/pt/') || getCurrentPath() === '/pt';
    }

    function isOnEsPath() {
        return getCurrentPath().startsWith('/es/') || getCurrentPath() === '/es';
    }

    function getTargetPath(lang) {
        const path = getCurrentPath();
        const isPt = isOnPtPath();
        const isEs = isOnEsPath();
        const isRoot = path === '/' || path === '/index.html';

        // If already on correct language path, stay
        if ((lang === 'pt' && isPt) || (lang === 'es' && isEs) || (lang === 'en' && !isPt && !isEs)) {
            return null; // No redirect needed
        }

        // Determine target path based on current location and target language
        if (lang === 'pt') {
            // Map current page to pt/ equivalent
            return mapPathToLang(path, 'pt');
        } else if (lang === 'es') {
            return mapPathToLang(path, 'es');
        } else {
            // English - map to root
            return mapPathToRoot(path);
        }
    }

    function mapPathToLang(path, lang) {
        const langPrefix = `/${lang}/`;
        
        // Special pages that exist in all languages
        const pageMap = {
            '/index.html': `${langPrefix}index.html`,
            '/features.html': `${langPrefix}features.html`,
            '/pricing.html': `${langPrefix}pricing.html`,
            '/trial.html': `${langPrefix}trial.html`,
            '/contact.html': `${langPrefix}contact.html`,
            '/privacy.html': `${langPrefix}privacy.html`,
            '/terms.html': `${langPrefix}terms.html`,
            '/': `${langPrefix}index.html`,
            '/pt/': `${langPrefix}index.html`,
            '/es/': `${langPrefix}index.html`
        };

        // Spanish translation only exists for index and the two SEO pages
        const esTranslated = [
            '/attendance-software-for-staffing-agencies.html',
            '/employee-clock-in-app-for-staffing-agencies.html'
        ];
        if (lang === 'es' && pageMap[path] && path !== '/index.html' && path !== '/' && !esTranslated.includes(path)) {
            return `${langPrefix}index.html`;
        }

        // Check for direct mapping
        if (pageMap[path]) return pageMap[path];

        // Handle pages in subdirectories (e.g., /pt/attendance-software-for-staffing-agencies.html)
        if (path.startsWith('/pt/') || path.startsWith('/es/')) {
            const pageName = path.split('/').pop();
            return `${langPrefix}${pageName}`;
        }

        // Default: root of language
        return `${langPrefix}index.html`;
    }

    function mapPathToRoot(path) {
        const pageMap = {
            '/pt/index.html': '/index.html',
            '/pt/features.html': '/features.html',
            '/pt/pricing.html': '/pricing.html',
            '/pt/trial.html': '/trial.html',
            '/pt/contact.html': '/contact.html',
            '/pt/privacy.html': '/privacy.html',
            '/pt/terms.html': '/terms.html',
            '/pt/': '/index.html',
            '/es/index.html': '/index.html',
            '/es/features.html': '/features.html',
            '/es/pricing.html': '/pricing.html',
            '/es/trial.html': '/trial.html',
            '/es/contact.html': '/contact.html',
            '/es/privacy.html': '/privacy.html',
            '/es/terms.html': '/terms.html',
            '/es/': '/index.html'
        };

        if (pageMap[path]) return pageMap[path];

        // Handle pages in subdirectories
        if (path.startsWith('/pt/') || path.startsWith('/es/')) {
            const pageName = path.split('/').pop();
            return `/${pageName}`;
        }

        return '/index.html';
    }

    function shouldRedirect() {
        // Don't redirect if:
        // 1. User has explicit preference stored
        // 2. On trial.html (let it handle its own redirect)
        // 3. Already on correct path
        
        const storedLang = getStoredLang();
        if (storedLang) return false; // Respect user choice

        const path = getCurrentPath();
        if (path.includes('trial.html')) return false; // Let trial page handle redirect

        const browserLang = detectBrowserLang();
        if (!browserLang || !CONFIG.supportedLangs.includes(browserLang)) return false;

        const targetPath = getTargetPath(browserLang);
        return targetPath !== null && targetPath !== path;
    }

    function performRedirect() {
        const browserLang = detectBrowserLang();
        if (!browserLang) return;

        const targetPath = getTargetPath(browserLang);
        if (targetPath && targetPath !== getCurrentPath()) {
            // Preserve query string and hash
            const search = window.location.search;
            const hash = window.location.hash;
            window.location.href = targetPath + search + hash;
        }
    }

    // Auto-redirect on load (before DOMContentLoaded for speed)
    if (shouldRedirect()) {
        performRedirect();
    }

    // Public API
    window.ChegattaI18n = {
        getCurrentLang: function() {
            if (isOnPtPath()) return 'pt';
            if (isOnEsPath()) return 'es';
            return 'en';
        },

        getStoredLang: getStoredLang,

        setLang: function(lang) {
            if (!CONFIG.supportedLangs.includes(lang)) return false;
            
            setStoredLang(lang);
            
            const targetPath = getTargetPath(lang);
            if (targetPath && targetPath !== getCurrentPath()) {
                const search = window.location.search;
                const hash = window.location.hash;
                window.location.href = targetPath + search + hash;
            }
            return true;
        },

        // For trial page - redirect to app with lang parameter
        redirectToAppTrial: function(role) {
            const currentLang = this.getCurrentLang();
            const params = new URLSearchParams();
            params.set('lang', currentLang);
            if (role) params.set('role', role);
            
            // Get any existing role from current URL
            const existingRole = new URLSearchParams(window.location.search).get('role');
            if (existingRole && !role) params.set('role', existingRole);
            
            window.location.href = `https://app.chegatta.com/trial?${params.toString()}`;
        },

        // Get lang for current page (used by switcher)
        getPageLang: function() {
            return this.getCurrentLang();
        }
    };

    // Expose config for debugging
    window.ChegattaI18nConfig = CONFIG;

})();