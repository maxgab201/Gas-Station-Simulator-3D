// Render dinámico de versiones: lista completa de descargas en el
// modal (última destacada + historial plegable), patch notes en la
// sección VERSIONES y tagline del hero con la última release.
// Externo por la CSP de producción (sin 'unsafe-inline').
// iniciarDescarga es global, definida por page.js (script clásico
// que ya corrió para cuando este módulo diferido se ejecuta).
import { renderDownloadList, renderPatchHistory, renderLatestTagline } from '../../js/render-versions.js';

renderDownloadList('download-list', 'autoclicker', 'pc', { onDownload: url => iniciarDescarga(url) });
renderPatchHistory('patch-history', 'autoclicker');
renderLatestTagline('hero-tagline', 'autoclicker', pc => pc ? `Utility Tool v${pc.version} — ${pc.title}` : 'Utility Tool');
