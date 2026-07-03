// Render dinámico de versiones (lista de descargas, historial de
// parches y tagline del hero). Externo por la CSP de producción:
// script-src 'self' sin 'unsafe-inline' — inline no se ejecuta.
// iniciarDescarga es global, definida por page.js (script clásico
// que ya corrió para cuando este módulo diferido se ejecuta).
import { renderDownloadList, renderPatchHistory, renderLatestTagline } from '../../js/render-versions.js';

renderDownloadList('download-list', 'gas-station', 'pc', { onDownload: url => iniciarDescarga(url) });
renderPatchHistory('patch-history', 'gas-station');
renderLatestTagline('hero-version', 'gas-station', pc => pc ? `v${pc.version} - ${pc.title}` : '');
