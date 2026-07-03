// ============================================================
//  MGGX GAMES — Runtime de escenas Three.js compartido
//  Centraliza todo lo que NO es específico de cada escena:
//  renderer, resize, límite de devicePixelRatio, pausa cuando el
//  canvas sale de pantalla (IntersectionObserver) o la pestaña
//  pierde foco (Page Visibility API), respeto de
//  prefers-reduced-motion (congela en el primer frame), y un
//  helper de parallax por puntero/scroll reutilizable.
// ============================================================

import * as THREE from '../../vendor/three/three.module.min.js';

const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Crea renderer + scene + cámara sobre un <canvas> existente y
 * devuelve controles de ciclo de vida. `setup(ctx)` arma la
 * escena una sola vez; `onFrame(ctx, dt, elapsed)` corre cada
 * frame salvo que el motion esté reducido o el canvas no sea
 * visible.
 */
export function createScene(canvas, { setup, onFrame, cameraFov = 50, near = 0.1, far = 100, alpha = true, background = null } = {}) {
    if (!canvas) return null;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = false; // sombras dinámicas desactivadas: prioriza 60fps en gama baja

    const scene = new THREE.Scene();
    if (background !== null) scene.background = background;

    const camera = new THREE.PerspectiveCamera(cameraFov, 1, near, far);

    const ctx = {
        renderer, scene, camera, canvas,
        pointer: { x: 0, y: 0, targetX: 0, targetY: 0 },
        scrollT: 0,
    };

    setup?.(ctx);

    function resize() {
        const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 1;
        const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / (h || 1);
        camera.updateProjectionMatrix();
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    window.addEventListener('resize', resize);

    function trackPointer(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        ctx.pointer.targetX = ((clientX - rect.left) / rect.width) * 2 - 1;
        ctx.pointer.targetY = -((clientY - rect.top) / rect.height) * 2 + 1;
    }
    const onMouseMove = e => trackPointer(e.clientX, e.clientY);
    const onTouchMove = e => { if (e.touches[0]) trackPointer(e.touches[0].clientX, e.touches[0].clientY); };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    // Pausa el render loop cuando el canvas no está visible (scroll fuera de vista)
    // o la pestaña pasa a segundo plano — ahorra batería/CPU sin cortar la animación
    // de golpe (se retoma exactamente donde quedó, con delta-time acotado).
    let isVisible = true;
    const io = new IntersectionObserver(entries => {
        for (const entry of entries) isVisible = entry.isIntersecting;
    }, { threshold: 0.01 });
    io.observe(canvas);

    let running = true;
    const clock = new THREE.Clock();
    let rafId = null;
    let frozenFrameDone = false;

    function renderFrame() {
        const dt = Math.min(clock.getDelta(), 0.1); // cap para evitar saltos tras un tab en pausa
        const elapsed = clock.getElapsedTime();

        ctx.pointer.x += (ctx.pointer.targetX - ctx.pointer.x) * 0.06;
        ctx.pointer.y += (ctx.pointer.targetY - ctx.pointer.y) * 0.06;

        onFrame?.(ctx, dt, elapsed);
        renderer.render(scene, camera);
    }

    function loop() {
        if (!running) return;
        rafId = requestAnimationFrame(loop);
        if (REDUCE_MOTION) {
            // Un único frame estático: respeta la preferencia de accesibilidad
            // sin dejar el canvas completamente en blanco.
            if (!frozenFrameDone) { renderFrame(); frozenFrameDone = true; }
            return;
        }
        if (!isVisible || document.hidden) return;
        renderFrame();
    }
    loop();

    return {
        ctx,
        dispose() {
            running = false;
            if (rafId) cancelAnimationFrame(rafId);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('resize', resize);
            resizeObserver.disconnect();
            io.disconnect();
            renderer.dispose();
        },
    };
}

export { REDUCE_MOTION };
export { THREE };
