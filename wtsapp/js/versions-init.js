// Render dinámico de versiones (descargas PC/Android, historial y
// tagline). Externo por la CSP de producción (sin 'unsafe-inline').
// iniciarDescarga es global, definida por page.js (script clásico
// que ya corrió para cuando este módulo diferido se ejecuta).
import { renderDownloadList, renderPatchHistory, renderLatestTagline } from '../../js/render-versions.js';

renderDownloadList('download-list-pc', 'wtsapp', 'pc', { onDownload: url => iniciarDescarga(url) });
renderDownloadList('download-list-android', 'wtsapp', 'android', { onDownload: url => iniciarDescarga(url) });
renderPatchHistory('patch-history', 'wtsapp');
renderLatestTagline('hero-tagline', 'wtsapp', (pc, android) => {
    const parts = ['Desktop & Android Messenger'];
    if (android) parts.push(`v${android.version} Android`);
    if (pc) parts.push(`v${pc.version} PC`);
    return parts.join(' · ');
});
