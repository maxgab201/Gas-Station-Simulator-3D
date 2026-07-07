// Externo por la CSP de producción: script-src 'self' sin 'unsafe-inline'.
import { initHeroScene } from '../../js/3d/hero-scene.js';
import { buildMedicCross } from '../../js/3d/geo-builders.js';

initHeroScene('hero-canvas', {
    color: 0x7ac74f,
    particleCount: 1200,
    iconBuilder: buildMedicCross,
    iconScale: 0.85,
    iconOffset: { x: -5.6, y: 2.55, z: -1 },
});
