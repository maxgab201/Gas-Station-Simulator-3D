// Arranque de la escena 3D del hero (partículas + rayo flotante).
// Externo por la CSP de producción: script-src 'self' sin
// 'unsafe-inline' — un bloque inline no se ejecuta nunca publicado.
import { initHeroScene } from '../../js/3d/hero-scene.js';
import { buildLightningBolt } from '../../js/3d/geo-builders.js';

initHeroScene('hero-canvas', {
    color: 0xffa500,
    particleCount: 1200,
    iconBuilder: buildLightningBolt,
    iconScale: 0.7,
    // Hero de una sola columna centrada (título + card apilados):
    // no hay hueco lateral, así que el icono va bien arriba del
    // título y bien atrás (z muy negativo, se ve chico) para leer
    // como ambiente, no como algo que compite con el texto/card.
    iconOffset: { x: 0, y: 4.2, z: -5 },
});
