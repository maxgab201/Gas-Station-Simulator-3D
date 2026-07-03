// Externo por la CSP de producción: script-src 'self' sin 'unsafe-inline'.
import { initHeroScene } from '../../js/3d/hero-scene.js';
import { buildBook } from '../../js/3d/geo-builders.js';

initHeroScene('hero-canvas', {
    color: 0xffa500,
    particleCount: 1200,
    iconBuilder: buildBook,
    iconScale: 0.9,
    iconOffset: { x: -4.9, y: 2.8, z: 0.2 },
});
