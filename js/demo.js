/**
 * Demo page helpers: one-click copy for demo credentials.
 */
(function () {
    'use strict';

    function flashCopied(btn) {
        if (!btn) return;
        const original = btn.textContent;
        btn.classList.add('copied');
        const check = '<svg class="button-copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<path d="M4.5 12.75l6 6 9-13.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        btn.innerHTML = check + ' Copied!';
        setTimeout(function () {
            btn.classList.remove('copied');
            btn.textContent = original;
        }, 1600);
    }

    function copyFallback(value, btn) {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            flashCopied(btn);
        } catch (err) {
            /* ignore */
        }
        document.body.removeChild(ta);
    }

    document.addEventListener('click', function (event) {
        const btn = event.target.closest('[data-copy]');
        if (!btn) return;
        const value = btn.getAttribute('data-copy');
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(value)
                .then(function () { flashCopied(btn); })
                .catch(function () { copyFallback(value, btn); });
        } else {
            copyFallback(value, btn);
        }
    });
})();