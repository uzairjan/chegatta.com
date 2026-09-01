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

    // Pages that have an actual translation in each language.
    // Any page without one falls back to that language's index.html.
    const ROOT_PAGES = new Set([
        'about.html',
        'attendance-software-for-staffing-agencies.html',
        'attendance-tracking-software.html',
        'automated-overtime-tracking.html',
        'blog.html',
        'buddy-punching-prevention.html',
        'comparison.html',
        'compliance-requirements.html',
        'contact.html',
        'demo.html',
        'employee-clock-in-app-for-staffing-agencies.html',
        'employee-clock-in-app.html',
        'features.html',
        'free-vs-paid.html',
        'geofence-construction-staffing.html',
        'gps-geofencing.html',
        'healthcare-staffing-attendance.html',
        'hr-platform.html',
        'index.html',
        'kiosk-time-clock.html',
        'multi-company-time-and-attendance.html',
        'payroll-compliance-software.html',
        'prevent-buddy-punching.html',
        'pricing.html',
        'privacy.html',
        'qr-code-employee-clock-in.html',
        'real-time-attendance-monitoring.html',
        'security.html',
        'temporary-worker-attendance-tracking.html',
        'terms.html',
        'trial.html',
        'use-cases.html'
    ]);

    const PT_PAGES = new Set([
        'about.html',
        'attendance-software-for-staffing-agencies.html',
        'attendance-tracking-software.html',
        'automated-overtime-tracking.html',
        'blog.html',
        'buddy-punching-prevention.html',
        'comparison.html',
        'compliance-requirements.html',
        'contact.html',
        'demo.html',
        'employee-clock-in-app-for-staffing-agencies.html',
        'employee-clock-in-app.html',
        'features.html',
        'free-vs-paid.html',
        'geofence-construction-staffing.html',
        'gps-geofencing.html',
        'healthcare-staffing-attendance.html',
        'hr-platform.html',
        'index.html',
        'kiosk-time-clock.html',
        'multi-company-time-and-attendance.html',
        'payroll-compliance-software.html',
        'ponto-eletronico.html',
        'prevent-buddy-punching.html',
        'pricing.html',
        'privacy.html',
        'qr-code-employee-clock-in.html',
        'real-time-attendance-monitoring.html',
        'security.html',
        'temporary-worker-attendance-tracking.html',
        'terms.html',
        'trial.html',
        'use-cases.html'
    ]);

    const ES_PAGES = new Set([
        'about.html',
        'attendance-software-for-staffing-agencies.html',
        'attendance-tracking-software.html',
        'automated-overtime-tracking.html',
        'blog.html',
        'buddy-punching-prevention.html',
        'comparison.html',
        'compliance-requirements.html',
        'contact.html',
        'control-horario.html',
        'demo.html',
        'employee-clock-in-app-for-staffing-agencies.html',
        'employee-clock-in-app.html',
        'features.html',
        'free-vs-paid.html',
        'geofence-construction-staffing.html',
        'gps-geofencing.html',
        'healthcare-staffing-attendance.html',
        'hr-platform.html',
        'index.html',
        'kiosk-time-clock.html',
        'multi-company-time-and-attendance.html',
        'payroll-compliance-software.html',
        'prevent-buddy-punching.html',
        'pricing.html',
        'privacy.html',
        'qr-code-employee-clock-in.html',
        'real-time-attendance-monitoring.html',
        'security.html',
        'temporary-worker-attendance-tracking.html',
        'terms.html',
        'trial.html',
        'use-cases.html'
    ]);

    // PT <-> ES filename translation pairs (localized page names). When building a
    // link to targetLang, the current page's filename (named for the current
    // language) is looked up in FILENAME_MAP[targetLang].
    const FILENAME_MAP = {
        pt: { 'control-horario.html': 'ponto-eletronico.html' },
        es: { 'ponto-eletronico.html': 'control-horario.html' }
    };

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
        if (targetLang === 'en') {
            return ROOT_PAGES.has(pageFile) ? pageFile : 'index.html';
        }
        const set = targetLang === 'pt' ? PT_PAGES : ES_PAGES;
        if (set.has(pageFile)) return pageFile;
        // Localized-filename pair: pageFile is named for the CURRENT language;
        // translate it to the opposite language's filename for the target.
        const map = FILENAME_MAP[targetLang];
        return (map && map[pageFile]) || 'index.html';
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
