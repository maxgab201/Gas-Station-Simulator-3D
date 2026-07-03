// Externo por la CSP de producción: script-src 'self' sin 'unsafe-inline'.
import { initHeroScene } from '../../js/3d/hero-scene.js';
import { buildChatBubble } from '../../js/3d/geo-builders.js';

initHeroScene('hero-canvas', {
    color: 0x3ddc84,
    particleCount: 1200,
    iconBuilder: buildChatBubble,
    iconScale: 0.85,
    iconOffset: { x: -4.9, y: 2.8, z: 0.2 },
});
