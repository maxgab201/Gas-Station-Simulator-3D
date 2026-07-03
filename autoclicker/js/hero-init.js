// Externo por la CSP de producción: script-src 'self' sin 'unsafe-inline'.
import { initHeroScene } from '../../js/3d/hero-scene.js';
import { buildMousePointer } from '../../js/3d/geo-builders.js';

initHeroScene('hero-canvas', {
    color: 0xffa500,
    particleCount: 1200,
    iconBuilder: buildMousePointer,
    iconScale: 0.85,
    iconOffset: { x: 4.3, y: 0.7, z: 0.4 },
});
