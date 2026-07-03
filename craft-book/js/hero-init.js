// Externo por la CSP de producción: script-src 'self' sin 'unsafe-inline'.
import { initHeroScene } from '../../js/3d/hero-scene.js';
import { buildBook } from '../../js/3d/geo-builders.js';

initHeroScene('hero-canvas', {
    color: 0xffa500,
    particleCount: 1200,
    iconBuilder: buildBook,
    iconScale: 0.9,
    iconOffset: { x: -5.6, y: 2.55, z: -1 },
});
