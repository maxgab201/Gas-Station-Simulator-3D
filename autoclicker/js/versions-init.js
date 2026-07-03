// Actualiza la URL de descarga y el tagline con la última versión
// del catálogo. Externo por la CSP de producción (sin
// 'unsafe-inline'). window._downloadUrl es la misma global que
// declara page.js con var — acá se le pisa el valor por defecto.
import { ready, getLatest } from '../../js/version-store.js';

await ready;
const latest = getLatest('autoclicker', 'pc');
if (latest) {
    window._downloadUrl = latest.url;
    const tagline = document.getElementById('hero-tagline');
    if (tagline) tagline.textContent = `Utility Tool v${latest.version}`;
}
