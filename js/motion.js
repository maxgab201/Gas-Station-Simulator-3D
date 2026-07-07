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

/**
 * Delegación de clicks para reemplazar los onclick="fn()" inline.
 * Cada elemento marcado con data-page-act="nombreDeFuncion" dispara
 * window[nombreDeFuncion]() al clickearlo. Esto permite eliminar
 * TODOS los atributos onclick del HTML (necesario para poder poner
 * script-src sin 'unsafe-inline' en el CSP — ver vercel.json) sin
 * tocar la lógica de cada página, que sigue definiendo sus
 * funciones (abrirAdvertencia, cerrarTodo, etc.) como siempre.
 * Usa un atributo distinto de data-act (el que usa js/admin.js
 * dentro del panel) para que ambos sistemas de delegación convivan
 * sin pisarse ni colisionar entre sí.
 */
function wirePageActions() {
    document.addEventListener('click', (event) => {
        const el = event.target.closest('[data-page-act]');
        if (!el) return;
        const fn = window[el.dataset.pageAct];
        if (typeof fn === 'function') fn(el);
    });
    // Los elementos no nativamente interactivos (ej. <span class="close">)
    // reciben role="button" + tabindex="0" más abajo (ver wireA11yForActions);
    // acá completamos el soporte de teclado para que Enter/Espacio también
    // disparen la acción, igual que un click.
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const el = event.target.closest('[data-page-act]');
        if (!el || el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT') return;
        event.preventDefault();
        const fn = window[el.dataset.pageAct];
        if (typeof fn === 'function') fn(el);
    });
}

/** Da semántica de botón + foco por teclado a elementos no nativos con data-page-act. */
function wireA11yForActions() {
    document.querySelectorAll('[data-page-act]').forEach(el => {
        if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT') return;
        if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    });
}

/**
 * Accesibilidad de teclado/foco para los modales de descarga
 * (.modal en cada página de producto): Escape cierra el modal
 * abierto, y al cerrarse el foco vuelve al elemento que lo abrió
 * — el mismo comportamiento que ya tenía el panel Admin
 * (js/admin.js), acá generalizado para no repetirlo por página.
 * Se implementa una sola vez acá porque las cinco páginas de
 * producto comparten el mismo <div class="modal"> + cerrarTodo()
 * global (ver page.js de cada una).
 */
function wireModalA11y() {
    const modals = document.querySelectorAll('.modal');
    if (!modals.length) return;

    let lastFocused = null;

    document.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-page-act]');
        if (!trigger) return;
        // Se dispara ANTES de que window[fn]() corra y muestre el modal
        // (mismo listener de click que wirePageActions, agregado después,
        // así que corre después en el mismo evento — pero como solo
        // necesitamos "quién tenía el foco antes del click", guardarlo acá
        // es seguro sin depender del orden entre listeners).
        lastFocused = trigger;
    });

    function findOpenModal() {
        for (const m of modals) {
            if (getComputedStyle(m).display !== 'none') return m;
        }
        return null;
    }

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        const open = findOpenModal();
        if (!open) return;
        window.cerrarTodo?.();
    });

    // Cuando un modal pasa de visible a oculto, devuelve el foco a quien
    // lo abrió — evita que el foco del teclado quede "flotando" en un
    // elemento ya invisible tras cerrar.
    const mo = new MutationObserver((mutations) => {
        for (const mut of mutations) {
            const el = mut.target;
            if (getComputedStyle(el).display === 'none' && lastFocused) {
                lastFocused.focus?.();
                lastFocused = null;
            }
        }
    });
    modals.forEach(m => mo.observe(m, { attributes: true, attributeFilter: ['style'] }));
}

/**
 * Tilt 3D sutil por puntero en .game-card (y cualquier [data-tilt]):
 * rota la card en perspectiva siguiendo la posición del cursor o del
 * dedo, puramente con transform (GPU, sin reflow). Los Pointer
 * Events (pointermove/pointerup/pointercancel) ya unifican mouse,
 * touch y stylus en un solo modelo de eventos — no hace falta (ni
 * conviene) escribir un camino aparte para touch: el mismo
 * pointermove dispara igual arrastrando el dedo sobre la card,
 * mientras el gesto de scroll de la página sigue funcionando normal
 * porque nunca se llama preventDefault(). El único ajuste por tipo
 * de puntero es CUÁNDO soltar la inclinación: en mouse alcanza con
 * "el cursor salió de la card" (pointerleave); en touch no existe
 * ese concepto — hay que esperar a que el dedo se levante o el
 * gesto se cancele (pointerup/pointercancel), así el tilt no queda
 * "pegado" en la última posición tocada.
 */
function initTilt() {
    if (reduceMotion) return;
    const targets = document.querySelectorAll('.game-card, [data-tilt]');
    targets.forEach(card => {
        card.classList.add('tilt-active');
        card.style.transformStyle = 'preserve-3d';
        card.style.willChange = 'transform';
        let raf = null;
        const applyTilt = (clientX, clientY) => {
            const rect = card.getBoundingClientRect();
            const px = (clientX - rect.left) / rect.width - 0.5;
            const py = (clientY - rect.top) / rect.height - 0.5;
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                card.style.transform = `perspective(900px) rotateX(${(-py * 9).toFixed(2)}deg) rotateY(${(px * 11).toFixed(2)}deg) translateY(-10px) scale(1.015)`;
            });
        };
        const resetTilt = () => {
            if (raf) cancelAnimationFrame(raf);
            card.style.transform = '';
        };
        card.addEventListener('pointermove', e => applyTilt(e.clientX, e.clientY));
        card.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') resetTilt(); });
        card.addEventListener('pointerup', e => { if (e.pointerType === 'touch') resetTilt(); });
        card.addEventListener('pointercancel', resetTilt);
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
    wirePageActions();
    wireA11yForActions();
    wireModalA11y();
    initTilt();
}

window.mggxMotion = { observe, toast, init };

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}
