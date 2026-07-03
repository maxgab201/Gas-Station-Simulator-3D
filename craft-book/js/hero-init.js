// Arranque de la escena 3D del hero (partículas + libro flotante).
// Externo por la CSP de producción: script-src 'self' sin
// 'unsafe-inline' — un bloque inline no se ejecuta nunca publicado.
import { initHeroScene } from '../../js/3d/hero-scene.js';
import { buildBook } from '../../js/3d/geo-builders.js';

initHeroScene('hero-canvas', {
    color: 0xffa500,
    particleCount: 1200,
    iconBuilder: buildBook,
    iconScale: 0.9,
    // Mismo layout de dos columnas que WtsApp: icono a la izquierda.
    iconOffset: { x: -3.1, y: 0.6, z: -1.2 },
});
