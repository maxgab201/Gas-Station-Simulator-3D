// Render dinámico de versiones. Externo por la CSP de producción
// (sin 'unsafe-inline'). iniciarDescarga es global, definida por
// page.js (script clásico que ya corrió antes que este módulo).
import { renderDownloadList, renderPatchHistory, renderLatestTagline } from '../../js/render-versions.js';

renderDownloadList('download-list', 'craft-book', 'pc', { onDownload: url => iniciarDescarga(url) });
renderPatchHistory('patch-history', 'craft-book');
renderLatestTagline('hero-tagline', 'craft-book', pc => pc ? `Desktop Utility · v${pc.version} — ${pc.title}` : 'Desktop Utility');
