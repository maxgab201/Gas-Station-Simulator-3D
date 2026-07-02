// ============================================================
//  MGGX GAMES — Render de versiones en páginas de proyecto
//  Dibuja la lista de descargas del modal y el historial de
//  patch notes leyendo del version-store (base + Admin).
// ============================================================

import { ready, getActiveVersions, getLatest, getBadges, platformColor, PLATFORM_META } from './version-store.js';

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

function badgeStyle(badge, color) {
    switch (badge.kind) {
        case 'latest': return `background:${color}; color:black;`;
        case 'experimental': return 'background:#c0392b; color:white;';
        case 'inactive': return 'background:#333; color:#999;';
        default: return 'background:#444; color:white;';
    }
}

function versionButton(projectId, v, { highlight = false } = {}) {
    const color = platformColor(v.platform);
    const badges = getBadges(projectId, v)
        .filter(b => b.kind !== 'title' || b.text)
        .map(b => `<span class="version-tag" style="${badgeStyle(b, color)}">${esc(b.text)}</span>`)
        .join(' ');
    const style = highlight ? `border-color:${color};` : (v.experimental ? 'border-color:#663333; opacity:0.8;' : '');
    return `
        <a href="javascript:void(0)" data-download-url="${esc(v.url)}" class="version-btn" style="${style}">
            VERSIÓN ${esc(v.version)} ${badges}
            <span class="version-note"${v.experimental ? ' style="color:#e74c3c;"' : ''}>${esc(v.note)}</span>
        </a>`;
}

/**
 * Lista de descargas de un modal: última release destacada +
 * historial plegable con las anteriores.
 */
export async function renderDownloadList(container, projectId, platform, { onDownload } = {}) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;
    await ready;

    const versions = getActiveVersions(projectId, platform);
    const meta = PLATFORM_META[platform];

    if (!versions.length) {
        el.innerHTML = '<p class="empty-state">Todavía no hay versiones publicadas para esta plataforma.</p>';
        return;
    }

    const [latest, ...rest] = versions;
    let html = `<p class="dl-platform-label">${meta.icon} ${esc(meta.label)}</p>`;
    html += versionButton(projectId, latest, { highlight: true });

    if (rest.length) {
        html += `
            <details class="version-history${platform === 'android' ? ' android' : ''}">
                <summary>Ver versiones anteriores</summary>
                <div class="version-history-list">
                    ${rest.map(v => versionButton(projectId, v)).join('')}
                </div>
            </details>`;
    }

    el.innerHTML = html;
    el.querySelectorAll('[data-download-url]').forEach(a => {
        a.addEventListener('click', () => onDownload?.(a.dataset.downloadUrl));
    });
}

/**
 * Historial completo de patch notes (todas las plataformas
 * mezcladas, ordenadas de más nueva a más vieja).
 */
export async function renderPatchHistory(container, projectId) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;
    await ready;

    const platforms = Object.keys(PLATFORM_META);
    let all = [];
    for (const p of platforms) all = all.concat(getActiveVersions(projectId, p));
    all.sort((a, b) => {
        // Mezcla por número de versión; a igual versión, PC primero
        const diff = String(b.version).localeCompare(String(a.version), undefined, { numeric: true });
        if (diff !== 0) return diff;
        return a.platform === 'pc' ? -1 : 1;
    });

    if (!all.length) {
        el.innerHTML = '<p class="empty-state">Sin versiones publicadas todavía.</p>';
        return;
    }

    el.innerHTML = all.map(v => {
        const color = platformColor(v.platform);
        const badges = getBadges(projectId, v)
            .map(b => `<span class="patch-tag" style="${badgeStyle(b, color)}">${esc(b.text)}${b.kind === 'title' && v.platform === 'android' ? ' (ANDROID)' : ''}</span>`)
            .join(' ');
        const items = (v.details?.length ? v.details : (v.note ? [{ t: '', d: v.note }] : []))
            .map(d => `<li>${d.t ? `<strong>${esc(d.t)}:</strong> ` : ''}${esc(d.d)}</li>`)
            .join('');
        return `
            <div class="patch-box" data-reveal style="border-left-color:${color};">
                <div class="patch-header">
                    <span class="patch-title">v${esc(v.version)} ${badges}</span>
                    <span class="patch-date">${esc(v.date)}</span>
                </div>
                <ul class="patch-list" style="--accent:${color};">${items}</ul>
            </div>`;
    }).join('');

    // Re-observa los elementos nuevos para las animaciones de reveal
    window.mggxMotion?.observe?.(el);
}

/** Actualiza taglines tipo "v1.2 — TÍTULO" con la última release. */
export async function renderLatestTagline(container, projectId, template) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;
    await ready;
    const pc = getLatest(projectId, 'pc');
    const android = getLatest(projectId, 'android');
    el.textContent = template(pc, android);
}
