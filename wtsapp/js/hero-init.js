// Arranque de la escena 3D del hero (partículas + burbuja de chat).
// Externo por la CSP de producción: script-src 'self' sin
// 'unsafe-inline' — un bloque inline no se ejecuta nunca publicado.
import { initHeroScene } from '../../js/3d/hero-scene.js';
import { buildChatBubble } from '../../js/3d/geo-builders.js';

initHeroScene('hero-canvas', {
    color: 0x3ddc84,
    particleCount: 1200,
    iconBuilder: buildChatBubble,
    iconScale: 0.85,
    // Hero de dos columnas (foto a la izquierda, texto a la derecha):
    // el icono va a la izquierda, detrás de la portada, para no
    // taparle el párrafo de descripción.
    iconOffset: { x: -3.1, y: 0.6, z: -1.2 },
});
