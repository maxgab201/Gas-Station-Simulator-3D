// ============================================================
//  MGGX GAMES — Runtime de escenas Three.js compartido
//  Centraliza todo lo que NO es específico de cada escena:
//  renderer, resize, límite de devicePixelRatio, pausa cuando el
//  canvas sale de pantalla (IntersectionObserver) o la pestaña
//  pierde foco (Page Visibility API), respeto de
//  prefers-reduced-motion (congela en el primer frame), un
//  helper de parallax por puntero/scroll reutilizable, un factor
//  de escala responsive para que la composición 3D no dependa del
//  aspect ratio con el que se calibró, y utilidades táctiles
//  compartidas (mouse y touch resuelven al mismo NDC).
// ============================================================

import * as THREE from '../../vendor/three/three.module.min.js';

const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** true en dispositivos cuyo puntero primario es táctil (sin hover fino). */
export const IS_COARSE_POINTER = window.matchMedia('(pointer: coarse)').matches;

/**
 * Convierte un punto en coordenadas de pantalla (clientX/clientY, de un
 * MouseEvent o de un Touch) a coordenadas NDC (-1..1) relativas al canvas.
 * Se usa igual para mouse y para touch: ambos terminan resolviendo al
 * mismo sistema de coordenadas, así el raycasting de clicks/taps es
 * idéntico sin importar el tipo de puntero.
 */
export function pointToNDC(canvas, clientX, clientY, out = new THREE.Vector2()) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) { out.set(9999, 9999); return out; }
    out.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    out.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    return out;
}

/**
 * Crea renderer + scene + cámara sobre un <canvas> existente y
 * devuelve controles de ciclo de vida. `setup(ctx)` arma la
 * escena una sola vez; `onFrame(ctx, dt, elapsed)` corre cada
 * frame salvo que el motion esté reducido o el canvas no sea
 * visible.
 *
 * `baseAspect` (ancho/alto) es el aspect ratio con el que se
 * calibró a mano la composición de la escena (posición de cámara,
 * offsets de íconos, etc — normalmente en un monitor de escritorio,
 * ~1440x900 ≈ 1.6). En viewports más angostos que eso (celulares en
 * vertical, aspect ratio ~0.5) `ctx.responsiveScale` crece por
 * encima de 1: cada escena lo usa para alejar la cámara del punto
 * de interés en la misma proporción, lo que encoge Y recentra TODA
 * la composición de forma uniforme — sin esto, un objeto calibrado
 * para pantallas anchas termina gigante (llena la pantalla) o
 * directamente fuera de cuadro en un celular, que es exactamente lo
 * que pasaba antes de este ajuste.
 */
export function createScene(canvas, { setup, onFrame, cameraFov = 50, near = 0.1, far = 100, alpha = true, background = null, baseAspect = 1440 / 900 } = {}) {
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
        responsiveScale: 1,
        isTouch: false,
    };

    setup?.(ctx);

    function resize() {
        const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 1;
        const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 1;
        renderer.setSize(w, h, false);
        const aspect = w / (h || 1);
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        // Solo "aleja" la cámara cuando el viewport es MÁS angosto que el
        // de referencia (móvil); en pantallas iguales o más anchas que la
        // base (desktop normal o ultra-wide) el factor queda en 1 y la
        // composición calibrada a mano se ve exactamente como se diseñó.
        ctx.responsiveScale = Math.max(1, baseAspect / aspect);
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    window.addEventListener('resize', resize);
    // La orientación del celular (portrait/landscape) no siempre dispara
    // 'resize' de forma inmediata en todos los navegadores móviles.
    window.addEventListener('orientationchange', () => setTimeout(resize, 60));

    const ndcScratch = { x: 0, y: 0 };
    function trackPointer(clientX, clientY) {
        pointToNDC(canvas, clientX, clientY, ndcScratch);
        ctx.pointer.targetX = ndcScratch.x;
        ctx.pointer.targetY = ndcScratch.y;
    }
    const onMouseMove = e => { ctx.isTouch = false; trackPointer(e.clientX, e.clientY); };
    const onTouchMove = e => {
        if (!e.touches[0]) return;
        ctx.isTouch = true;
        trackPointer(e.touches[0].clientX, e.touches[0].clientY);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchstart', onTouchMove, { passive: true });

    // Pausa el render loop cuando el canvas no está visible (scroll fuera de
    // vista) o la pestaña pasa a segundo plano — ahorra batería/CPU sin
    // cortar la animación de golpe (se retoma exactamente donde quedó, con
    // delta-time acotado). rootMargin da un colchón de 150px: sin esto, en
    // celular la barra de direcciones se muestra/oculta al scrollear y
    // cambia la altura visible del viewport a mitad de gesto, lo que podía
    // hacer que el canvas cruzara el 0%/1% de intersección varias veces en
    // un segundo (falso "sale de pantalla") y el render loop tartamudeara
    // exactamente cuando el usuario estaba scrolleando el hero.
    let isVisible = true;
    const io = new IntersectionObserver(entries => {
        for (const entry of entries) isVisible = entry.isIntersecting;
    }, { threshold: 0, rootMargin: '150px 0px 150px 0px' });
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
            window.removeEventListener('touchstart', onTouchMove);
            window.removeEventListener('resize', resize);
            resizeObserver.disconnect();
            io.disconnect();
            renderer.dispose();
        },
    };
}

export { REDUCE_MOTION };
export { THREE };
