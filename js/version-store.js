// ============================================================
//  MGGX GAMES — Version Store
//  Combina el catálogo base (versions-data.js) con un overlay
//  persistido en localStorage (altas / ediciones / bajas del
//  panel Admin). Toda la web lee versiones desde acá.
// ============================================================

import { PROJECTS, PLATFORM_META } from './versions-data.js';

const STORAGE_KEY = 'mggx_versions_overlay_v1';

function loadOverlay() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const data = raw ? JSON.parse(raw) : null;
        return {
            added: Array.isArray(data?.added) ? data.added : [],
            edited: data?.edited && typeof data.edited === 'object' ? data.edited : {},
            deleted: Array.isArray(data?.deleted) ? data.deleted : [],
        };
    } catch {
        return { added: [], edited: {}, deleted: [] };
    }
}

function saveOverlay(overlay) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overlay));
}

// --- Orden semántico de versiones ("0.7.2a" > "0.7.1") -----
function versionKey(v) {
    return String(v.version || '')
        .split(/[.\-]/)
        .map(part => {
            const n = parseInt(part, 10);
            return Number.isNaN(n) ? 0 : n;
        });
}

export function compareVersions(a, b) {
    const ka = versionKey(a), kb = versionKey(b);
    const len = Math.max(ka.length, kb.length);
    for (let i = 0; i < len; i++) {
        const diff = (kb[i] || 0) - (ka[i] || 0);
        if (diff !== 0) return diff;
    }
    return 0;
}

// --- API pública --------------------------------------------
export { PLATFORM_META };

export function getProjects() {
    return PROJECTS.map(p => ({ ...p, versions: getVersions(p.id) }));
}

export function getProject(projectId) {
    const base = PROJECTS.find(p => p.id === projectId);
    if (!base) return null;
    return { ...base, versions: getVersions(projectId) };
}

/** Todas las versiones del proyecto (incluye inactivas), ordenadas desc. */
export function getVersions(projectId, platform = null) {
    const base = PROJECTS.find(p => p.id === projectId);
    if (!base) return [];
    const overlay = loadOverlay();

    let list = base.versions
        .filter(v => !overlay.deleted.includes(v.id))
        .map(v => overlay.edited[v.id] ? { ...v, ...overlay.edited[v.id] } : v);

    list = list.concat(
        overlay.added
            .filter(v => v.projectId === projectId && !overlay.deleted.includes(v.id))
            .map(v => overlay.edited[v.id] ? { ...v, ...overlay.edited[v.id] } : v)
    );

    if (platform) list = list.filter(v => v.platform === platform);
    return list.sort(compareVersions);
}

/** Solo versiones activas (lo que ve el público). */
export function getActiveVersions(projectId, platform = null) {
    return getVersions(projectId, platform).filter(v => v.active);
}

/** La release más nueva activa de una plataforma. */
export function getLatest(projectId, platform) {
    return getActiveVersions(projectId, platform)[0] || null;
}

/**
 * Etiquetas automáticas para una versión:
 * "ÚLTIMA RELEASE" para la más nueva activa de su plataforma,
 * "EXPERIMENTAL" si está marcada, más su título propio.
 */
export function getBadges(projectId, v) {
    const latest = getLatest(projectId, v.platform);
    const badges = [];
    if (v.title) badges.push({ text: v.title, kind: 'title' });
    if (latest && latest.id === v.id) badges.push({ text: 'ÚLTIMA RELEASE', kind: 'latest' });
    if (v.experimental) badges.push({ text: 'EXPERIMENTAL', kind: 'experimental' });
    if (!v.active) badges.push({ text: 'DESACTIVADA', kind: 'inactive' });
    return badges;
}

export function platformColor(platform) {
    return PLATFORM_META[platform]?.color || '#FFA500';
}

// --- Mutaciones (panel Admin) -------------------------------
export function addVersion(projectId, data) {
    const overlay = loadOverlay();
    const version = {
        id: `${projectId}-${data.platform}-${data.version}-${Date.now().toString(36)}`,
        projectId,
        platform: data.platform || 'pc',
        version: String(data.version || '').trim(),
        title: String(data.title || '').trim().toUpperCase(),
        note: String(data.note || '').trim(),
        url: String(data.url || '').trim(),
        date: data.date || defaultDate(),
        active: !!data.active,
        experimental: !!data.experimental,
        details: Array.isArray(data.details) ? data.details : [],
    };
    overlay.added.push(version);
    saveOverlay(overlay);
    return version;
}

export function updateVersion(projectId, versionId, patch) {
    const overlay = loadOverlay();
    const idx = overlay.added.findIndex(v => v.id === versionId);
    if (idx >= 0) {
        overlay.added[idx] = { ...overlay.added[idx], ...patch };
    } else {
        overlay.edited[versionId] = { ...(overlay.edited[versionId] || {}), ...patch };
    }
    saveOverlay(overlay);
}

export function deleteVersion(projectId, versionId) {
    const overlay = loadOverlay();
    const idx = overlay.added.findIndex(v => v.id === versionId);
    if (idx >= 0) {
        overlay.added.splice(idx, 1);
    } else {
        if (!overlay.deleted.includes(versionId)) overlay.deleted.push(versionId);
        delete overlay.edited[versionId];
    }
    saveOverlay(overlay);
}

export function resetOverlay() {
    localStorage.removeItem(STORAGE_KEY);
}

function defaultDate() {
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const now = new Date();
    return `${meses[now.getMonth()]} ${now.getFullYear()}`;
}
