// Pooja Bilaskar — portfolio interactions
// Progressive enhancement: all content remains visible without JavaScript.

(function () {
    'use strict';

    const root = document.documentElement;
    const body = document.body;
    const header = document.querySelector('[data-header]');
    const navToggle = document.querySelector('.nav-toggle');
    const navPanel = document.querySelector('.nav-panel');
    const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
    const scrollProgress = document.querySelector('[data-scroll-progress]');
    const revealElements = Array.from(document.querySelectorAll('[data-reveal]'));
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(max-width: 960px)');
    const focusableSelector = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

    let lastFocusedElement = null;

    root.classList.remove('no-js');

    // ---------- Footer year ----------
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = String(new Date().getFullYear());
    }

    // ---------- Mobile navigation ----------
    function isNavOpen() {
        return Boolean(header && header.classList.contains('nav-open'));
    }

    function openNav() {
        if (!header || !navToggle || !navPanel) return;

        lastFocusedElement = document.activeElement;
        header.classList.add('nav-open');
        body.classList.add('nav-open');
        navToggle.setAttribute('aria-expanded', 'true');
        navToggle.setAttribute('aria-label', 'Close menu');

        const firstLink = navPanel.querySelector(focusableSelector);
        if (firstLink) {
            // Wait for the panel's visibility transition to apply before
            // moving focus, otherwise the hidden link cannot receive it.
            window.requestAnimationFrame(function () {
                window.requestAnimationFrame(function () {
                    firstLink.focus();
                });
            });
        }
    }

    function closeNav(returnFocus) {
        if (!header || !navToggle || !navPanel) return;

        const wasOpen = isNavOpen();
        header.classList.remove('nav-open');
        body.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');

        if (wasOpen && returnFocus) {
            const target = lastFocusedElement && document.contains(lastFocusedElement)
                ? lastFocusedElement
                : navToggle;
            target.focus();
        }
    }

    if (navToggle && navPanel) {
        navToggle.addEventListener('click', function () {
            if (isNavOpen()) {
                closeNav(true);
            } else {
                openNav();
            }
        });

        navLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                if (isNavOpen()) closeNav(false);
            });
        });

        document.addEventListener('click', function (event) {
            if (!isNavOpen()) return;
            if (navPanel.contains(event.target) || navToggle.contains(event.target)) return;
            closeNav(true);
        });

        document.addEventListener('keydown', function (event) {
            if (!isNavOpen()) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                closeNav(true);
                return;
            }

            if (event.key !== 'Tab') return;

            // Keep keyboard focus inside the open menu.
            const focusable = Array.from(navPanel.querySelectorAll(focusableSelector))
                .filter(function (element) {
                    return element.offsetParent !== null;
                });

            if (!focusable.length) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (!navPanel.contains(document.activeElement)) {
                event.preventDefault();
                first.focus();
            } else if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });

        // Close the menu if the viewport returns to the desktop layout.
        const handleBreakpointChange = function (event) {
            if (!event.matches) closeNav(false);
        };

        if (typeof mobileQuery.addEventListener === 'function') {
            mobileQuery.addEventListener('change', handleBreakpointChange);
        } else if (typeof mobileQuery.addListener === 'function') {
            mobileQuery.addListener(handleBreakpointChange);
        }
    }

    // ---------- Active section in navigation ----------
    const sections = navLinks
        .map(function (link) {
            const href = link.getAttribute('href');
            if (!href || href.charAt(0) !== '#' || href.length < 2) return null;
            const section = document.getElementById(href.slice(1));
            return section ? { link: link, section: section } : null;
        })
        .filter(Boolean);

    function updateActiveLink(scrollY) {
        if (!sections.length) return;

        const headerHeight = header ? header.offsetHeight : 0;
        const marker = scrollY + headerHeight + Math.min(180, window.innerHeight * 0.25);
        let current = null;

        sections.forEach(function (entry) {
            if (entry.section.offsetTop <= marker) {
                current = entry;
            }
        });

        // At the very bottom, highlight the final section.
        if (window.innerHeight + scrollY >= document.documentElement.scrollHeight - 2) {
            current = sections[sections.length - 1];
        }

        sections.forEach(function (entry) {
            const isCurrent = current === entry;
            entry.link.classList.toggle('is-active', isCurrent);
            if (isCurrent) {
                entry.link.setAttribute('aria-current', 'location');
            } else {
                entry.link.removeAttribute('aria-current');
            }
        });
    }

    // ---------- Header state + scroll progress ----------
    let scrollTicking = false;

    function updateOnScroll() {
        const scrollY = window.scrollY || window.pageYOffset;

        if (header) {
            header.classList.toggle('is-scrolled', scrollY > 24);
        }

        if (scrollProgress) {
            const maxScroll = Math.max(
                1,
                document.documentElement.scrollHeight - window.innerHeight
            );
            const percent = Math.min(100, Math.max(0, (scrollY / maxScroll) * 100));
            scrollProgress.style.width = percent + '%';
        }

        updateActiveLink(scrollY);
        scrollTicking = false;
    }

    function requestScrollUpdate() {
        if (scrollTicking) return;
        scrollTicking = true;
        window.requestAnimationFrame(updateOnScroll);
    }

    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    window.addEventListener('resize', requestScrollUpdate, { passive: true });
    updateOnScroll();

    // ---------- Scroll reveal ----------
    if (revealElements.length) {
        if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
            revealElements.forEach(function (element) {
                element.classList.add('will-reveal', 'is-visible');
            });
        } else {
            revealElements.forEach(function (element) {
                element.classList.add('will-reveal');
            });

            const revealObserver = new IntersectionObserver(
                function (entries, observer) {
                    entries.forEach(function (entry) {
                        if (!entry.isIntersecting) return;
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    });
                },
                {
                    threshold: 0.12,
                    rootMargin: '0px 0px -8% 0px'
                }
            );

            revealElements.forEach(function (element) {
                revealObserver.observe(element);
            });
        }
    }

    // CSS scroll-padding keeps anchored sections clear of the sticky header.
    // Native anchor navigation is left intact so browser history and focus
    // behavior keep working as expected.

    // Ensure reveals settle correctly if the motion preference changes.
    if (typeof prefersReducedMotion.addEventListener === 'function') {
        prefersReducedMotion.addEventListener('change', function (event) {
            if (!event.matches) return;
            revealElements.forEach(function (element) {
                element.classList.add('will-reveal', 'is-visible');
            });
        });
    }
})();
