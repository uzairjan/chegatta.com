/**
 * Chegatta Language Switcher - Navbar Component
 * Renders [PT] [EN] [ES] buttons in navbar
 * Works when served from a domain root (https://chegatta.com/) AND
 * when opened directly via file:// (local preview).
 */

(function() {
    'use strict';

    const LANG_ORDER = ['pt', 'en', 'es'];
    const LANGS = {
        pt: { label: 'PT', name: 'Português' },
        en: { label: 'EN', name: 'English' },
        es: { label: 'ES', name: 'Español' }
    };

    // Root pages that have an actual translation in each language.
    // Any page without one falls back to that language's index.html.
    const PT_PAGES = new Set([
        'attendance-software-for-staffing-agencies.html',
        'contact.html',
        'demo.html',
        'employee-clock-in-app-for-staffing-agencies.html',
        'features.html',
        'index.html',
        'pricing.html',
        'privacy.html',
        'terms.html',
        'trial.html'
    ]);

    const ES_PAGES = new Set([
        'attendance-software-for-staffing-agencies.html',
        'employee-clock-in-app-for-staffing-agencies.html',
        'index.html',
        'demo.html'
    ]);

    function getLocation() {
        const parts = window.location.pathname.split('/').filter(Boolean);
        const file = parts.length ? parts[parts.length - 1] : '';
        const pageFile = file === '' ? 'index.html' : file;
        const parent = parts.length > 1 ? parts[parts.length - 2] : '';
        const langDir = (parent === 'pt' || parent === 'es') ? parent : '';
        return { langDir: langDir, pageFile: pageFile };
    }

    function getCurrentLang() {
        const { langDir } = getLocation();
        return langDir || 'en';
    }

    function getTargetFile(targetLang, pageFile) {
        if (targetLang === 'en') return pageFile;
        const set = targetLang === 'pt' ? PT_PAGES : ES_PAGES;
        return set.has(pageFile) ? pageFile : 'index.html';
    }

    function buildHref(targetLang) {
        const { langDir, pageFile } = getLocation();
        const targetFile = getTargetFile(targetLang, pageFile);
        const up = langDir ? '../' : '';
        const dir = targetLang === 'en' ? '' : targetLang + '/';
        return up + dir + targetFile;
    }

    function createSwitcherHTML() {
        const currentLang = getCurrentLang();

        return LANG_ORDER.map(lang => {
            const isActive = lang === currentLang;
            const targetPath = buildHref(lang);

            return `<a href="${targetPath}" 
                       class="lang-btn ${isActive ? 'active' : ''}" 
                       data-lang="${lang}"
                       aria-label="${LANGS[lang].name}"
                       aria-current="${isActive ? 'page' : 'false'}">
                ${LANGS[lang].label}
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

        // Save the chosen language (for i18n.js) before navigating
        container.addEventListener('click', function (e) {
            const link = e.target.closest('.lang-btn');
            if (!link) return;
            const lang = link.getAttribute('data-lang');
            if (lang) {
                try {
                    localStorage.setItem('chegatta_lang', lang);
                    document.cookie = `chegatta_lang=${lang}; expires=${new Date(Date.now() + 365 * 864e5).toUTCString()}; path=/; domain=chegatta.com; SameSite=Lax`;
                } catch (err) {
                    /* ignore */
                }
            }
        });
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
