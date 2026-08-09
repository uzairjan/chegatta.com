/**
 * Chegatta Language Switcher - Navbar Component
 * Renders [PT] [EN] [ES] buttons in navbar
 * GitHub Pages compatible - client-side only
 */

(function() {
    'use strict';

    const LANGS = [
        { code: 'pt', label: 'PT', name: 'Português', path: '/pt/' },
        { code: 'en', label: 'EN', name: 'English', path: '/' },
        { code: 'es', label: 'ES', name: 'Español', path: '/es/' }
    ];

    // Pages that actually have an es/ translation (in addition to the PAGE_MAP entries)
    // Root pages without a Spanish version fall back to /es/index.html
    const ES_PAGES = {
        '/index.html': true, '/pt/index.html': true, '/es/index.html': true,
        '/attendance-software-for-staffing-agencies.html': true,
        '/pt/attendance-software-for-staffing-agencies.html': true,
        '/es/attendance-software-for-staffing-agencies.html': true,
        '/employee-clock-in-app-for-staffing-agencies.html': true,
        '/pt/employee-clock-in-app-for-staffing-agencies.html': true,
        '/es/employee-clock-in-app-for-staffing-agencies.html': true
    };

    // Map current page to equivalent in target language
    const PAGE_MAP = {
        // Root pages
        '/index.html': { pt: '/pt/index.html', en: '/index.html', es: '/es/index.html' },
        '/features.html': { pt: '/pt/features.html', en: '/features.html', es: '' },
        '/pricing.html': { pt: '/pt/pricing.html', en: '/pricing.html', es: '' },
        '/trial.html': { pt: '/pt/trial.html', en: '/trial.html', es: '' },
        '/contact.html': { pt: '/pt/contact.html', en: '/contact.html', es: '' },
        '/privacy.html': { pt: '/pt/privacy.html', en: '/privacy.html', es: '' },
        '/terms.html': { pt: '/pt/terms.html', en: '/terms.html', es: '' },
        '/': { pt: '/pt/index.html', en: '/index.html', es: '/es/index.html' },
        
        // pt/ pages
        '/pt/index.html': { pt: '/pt/index.html', en: '/index.html', es: '/es/index.html' },
        '/pt/features.html': { pt: '/pt/features.html', en: '/features.html', es: '' },
        '/pt/pricing.html': { pt: '/pt/pricing.html', en: '/pricing.html', es: '' },
        '/pt/trial.html': { pt: '/pt/trial.html', en: '/trial.html', es: '' },
        '/pt/contact.html': { pt: '/pt/contact.html', en: '/contact.html', es: '' },
        '/pt/privacy.html': { pt: '/pt/privacy.html', en: '/privacy.html', es: '' },
        '/pt/terms.html': { pt: '/pt/terms.html', en: '/terms.html', es: '' },
        
        // es/ pages
        '/es/index.html': { pt: '/pt/index.html', en: '/index.html', es: '/es/index.html' },
        '/es/features.html': { pt: '/pt/features.html', en: '/features.html', es: '' },
        '/es/pricing.html': { pt: '/pt/pricing.html', en: '/pricing.html', es: '' },
        '/es/trial.html': { pt: '/pt/trial.html', en: '/trial.html', es: '' },
        '/es/contact.html': { pt: '/pt/contact.html', en: '/contact.html', es: '' },
        '/es/privacy.html': { pt: '/pt/privacy.html', en: '/privacy.html', es: '' },
        '/es/terms.html': { pt: '/pt/terms.html', en: '/terms.html', es: '' }
    };

    function getCurrentPath() {
        return window.location.pathname;
    }

    function getTargetPath(targetLang) {
        const currentPath = getCurrentPath();
        const normalizedPath = currentPath === '/' ? '/index.html' : currentPath;
        
        // Direct mapping
        if (PAGE_MAP[normalizedPath] && PAGE_MAP[normalizedPath][targetLang]) {
            return PAGE_MAP[normalizedPath][targetLang];
        }

        // Handle pages in subdirectories (e.g., /pt/attendance-software-for-staffing-agencies.html)
        const pathParts = normalizedPath.split('/');
        const pageName = pathParts.pop();
        const currentPrefix = pathParts.join('/');
        
        const langPrefix = targetLang === 'en' ? '' : `/${targetLang}`;
        
        // Fall back to the language home page if this page has no Spanish version
        if (targetLang === 'es' && !ES_PAGES[normalizedPath]) {
            return `${langPrefix}/index.html`;
        }
        
        const targetPath = `${langPrefix}/${pageName}`;
        
        return targetPath || (targetLang === 'en' ? '/index.html' : `/${targetLang}/index.html`);
    }

    function getCurrentLang() {
        const path = getCurrentPath();
        if (path.startsWith('/pt/') || path === '/pt') return 'pt';
        if (path.startsWith('/es/') || path === '/es') return 'es';
        return 'en';
    }

    function createSwitcherHTML() {
        const currentLang = getCurrentLang();
        
        return LANGS.map(lang => {
            const isActive = lang.code === currentLang;
            const targetPath = getTargetPath(lang.code);
            
            return `<a href="${targetPath}" 
                       class="lang-btn ${isActive ? 'active' : ''}" 
                       data-lang="${lang.code}"
                       aria-label="${lang.name}"
                       aria-current="${isActive ? 'page' : 'false'}">
                ${lang.label}
            </a>`;
        }).join('');
    }

    function init() {
        // Find insertion point - after .nav-actions
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) {
            // Fallback: try to find navbar and append before .nav-toggle
            const navbar = document.querySelector('.navbar .nav-container');
            const navToggle = document.querySelector('.nav-toggle');
            if (navbar && navToggle) {
                const container = document.createElement('div');
                container.className = 'lang-switcher';
                container.id = 'langSwitcher';
                container.setAttribute('aria-label', 'Idioma');
                container.innerHTML = createSwitcherHTML();
                navbar.insertBefore(container, navToggle);
            }
            return;
        }

        // Create switcher container
        const container = document.createElement('div');
        container.className = 'lang-switcher';
        container.id = 'langSwitcher';
        container.setAttribute('aria-label', 'Idioma');
        container.innerHTML = createSwitcherHTML();
        
        // Insert after .nav-actions
        navActions.parentNode.insertBefore(container, navActions.nextSibling);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-initialize on navigation (for SPA-like behavior if needed)
    window.addEventListener('popstate', function() {
        const existing = document.getElementById('langSwitcher');
        if (existing) {
            existing.innerHTML = createSwitcherHTML();
        }
    });

})();