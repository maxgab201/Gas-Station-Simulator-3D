// ============================================================
//  MGGX GAMES — Arranque de la escena 3D de la home.
//  Vive en un archivo externo (y no inline en el HTML) a
//  propósito: la CSP de producción (vercel.json) fija
//  script-src 'self' sin 'unsafe-inline', así que el navegador
//  BLOQUEA cualquier <script> embebido en el HTML. Un bloque
//  inline acá se ejecutaba perfecto en un server local sin
//  headers, pero en el sitio publicado moría en silencio y la
//  página quedaba sin partículas ni orbe.
// ============================================================

import { initHeroScene } from './3d/hero-scene.js';
import { buildOrb } from './3d/geo-builders.js';

initHeroScene('particle-canvas', {
    color: 0xffa500,
    particleCount: 1600,
    iconBuilder: buildOrb,
    iconScale: 1.15,
});
