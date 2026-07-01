// ============================================================
//  MGGX GAMES — Motor de motion compartido
//  - Reveal on scroll con IntersectionObserver + stagger
//  - Toast global
//  Sin dependencias: transform/opacity para mantener 60 FPS.
// ============================================================

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let observer = null;

function getObserver() {
    if (observer) return observer;
    observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    return observer;
}

/** Observa [data-reveal] dentro de root y aplica stagger por grupos cercanos. */
export function observe(root = document) {
    const els = root.querySelectorAll('[data-reveal]:not(.is-visible)');
    if (reduceMotion) {
        els.forEach(el => el.classList.add('is-visible'));
        return;
    }
    let lastParent = null;
    let i = 0;
    els.forEach(el => {
        if (el.parentElement !== lastParent) { i = 0; lastParent = el.parentElement; }
        el.style.setProperty('--reveal-delay', `${Math.min(i * 70, 420)}ms`);
        i++;
        getObserver().observe(el);
    });
}

/** Marca automáticamente los bloques principales de la página. */
export function autoTag() {
    const selectors = [
        '.game-card', '.patch-box', '.feature-item', '.gallery-img',
        '.section-header', '.sec-title', '.contact-box', '.text-block',
        '.app-card', '.hero-text > *', '.hero-cover',
    ];
    document.querySelectorAll(selectors.join(',')).forEach(el => {
        if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', '');
    });
}

/** Toast liviano para confirmaciones. */
export function toast(message, ms = 2800) {
    let el = document.querySelector('.mggx-toast');
    if (!el) {
        el = document.createElement('div');
        el.className = 'mggx-toast';
        el.setAttribute('role', 'status');
        document.body.appendChild(el);
    }
    el.textContent = message;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), ms);
}

export function init() {
    autoTag();
    observe();
}

window.mggxMotion = { observe, toast, init };

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}
