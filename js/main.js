/* ============================================
   Chegatta — Product Website JavaScript
   ============================================ */

(function () {
    'use strict';

    /* ============================================
       Navbar Scroll Effect
       ============================================ */
    const navbar = document.getElementById('navbar');

    function handleNavbarScroll() {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleNavbarScroll, { passive: true });

    /* ============================================
       Mobile Menu Toggle
       ============================================ */
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function () {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close mobile menu when a link is clicked (unless it's the Solutions dropdown toggle)
        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                if (link.classList.contains('nav-dropdown-toggle')) {
                    // Toggle the nested menu open state on mobile
                    const dropdown = link.closest('.nav-dropdown');
                    if (dropdown) {
                        dropdown.classList.toggle('open');
                    }
                    return;
                }
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function (e) {
            if (
                !navToggle.contains(e.target) &&
                !navLinks.contains(e.target) &&
                navLinks.classList.contains('active')
            ) {
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });

        // Reset mobile menu state on resize to desktop
        window.addEventListener('resize', function () {
            document.querySelectorAll('.nav-dropdown.open').forEach(function (d) {
                d.classList.remove('open');
            });
            if (window.innerWidth >= 1024) {
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        }, { passive: true });
    }

    /* ============================================
       Scroll Reveal Animation
       ============================================ */
    const revealElements = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        revealObserver.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px',
            }
        );

        revealElements.forEach(function (el) {
            revealObserver.observe(el);
        });
    } else {
        // Fallback: just show everything
        revealElements.forEach(function (el) {
            el.classList.add('visible');
        });
    }

    /* ============================================
       FAQ Accordion
       ============================================ */
    window.toggleFaq = function (button) {
        const faqItem = button.parentElement;
        const isActive = faqItem.classList.contains('active');

        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(function (item) {
            item.classList.remove('active');
        });

        // Open the clicked one if it was closed
        if (!isActive) {
            faqItem.classList.add('active');
        }
    };

    /* ============================================
       CTA Form Handler
       ============================================ */
    window.handleCtaSubmit = function (event) {
        event.preventDefault();
        const input = event.target.querySelector('.cta-input');
        const email = input.value.trim();
        const button = event.target.querySelector('button[type="submit"]');

        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.3)';
            input.focus();
            return false;
        }

        // Reset input style
        input.style.boxShadow = '';

        // Track CTA email capture goal
        if (window.umami) {
            window.umami.track('cta_submit');
        }

        // Simulate submission
        const originalText = button.textContent;
        button.textContent = 'Submitting...';
        button.disabled = true;

        setTimeout(function () {
            button.textContent = '✓ Subscribed!';
            button.style.background = '#10b981';
            input.value = '';

            setTimeout(function () {
                button.textContent = originalText;
                button.disabled = false;
                button.style.background = '';
            }, 2500);
        }, 800);

        return false;
    };

    /* ============================================
       App CTA Click Tracking (trial + demo)
       ============================================ */
    document.addEventListener('click', function (e) {
        var trialAnchor = e.target.closest('a[href*="app.chegatta.com/trial"]');
        if (trialAnchor && window.umami) {
            window.umami.track('start_trial_click');
        }
        var demoAnchor = e.target.closest('a[href*="app.chegatta.com/demo/request"]');
        if (demoAnchor && window.umami) {
            window.umami.track('request_demo_click');
        }
    });


    /* ============================================
       Smooth Scroll for Anchor Links
       ============================================ */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = window.innerWidth >= 768 ? 72 : 60;
                const targetPosition =
                    target.getBoundingClientRect().top + window.pageYOffset - offset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth',
                });
            }
        });
    });

    /* ============================================
       Animate Mockup Bars on Load
       ============================================ */
    const mockupBars = document.querySelectorAll('.mockup-bar');
    if (mockupBars.length > 0) {
        // Set initial height to 0, then animate to target
        const targetHeights = Array.from(mockupBars).map(function (bar) {
            return bar.style.height;
        });

        mockupBars.forEach(function (bar) {
            bar.style.height = '0';
            bar.style.transition = 'height 0.8s ease-out';
        });

        setTimeout(function () {
            mockupBars.forEach(function (bar, i) {
                bar.style.height = targetHeights[i];
            });
        }, 300);
    }

    /* ============================================
       Animate Insight Bars on Scroll
       ============================================ */
    const insightBars = document.querySelectorAll('.insight-bar');
    if (insightBars.length > 0 && 'IntersectionObserver' in window) {
        const insightObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        const bar = entry.target;
                        const targetWidth = bar.style.width;
                        bar.style.width = '0';
                        setTimeout(function () {
                            bar.style.width = targetWidth;
                        }, 100);
                        insightObserver.unobserve(bar);
                    }
                });
            },
            { threshold: 0.3 }
        );

        insightBars.forEach(function (bar) {
            insightObserver.observe(bar);
        });
    }
})();