// ============================================================
//  MGGX GAMES — Panel Admin
//  Burbuja flotante "A" → contraseña → wizard:
//  proyecto → plataforma (si aplica) → gestionar versiones
//  (agregar / editar / eliminar) con generación por IA (NVIDIA
//  NIM). Cada paso tiene Cancelar/Volver. La sesión NO se
//  guarda: al cerrar, vuelve a pedir contraseña.
// ============================================================

import { getProjects, getProject, getVersions, addVersion, updateVersion, deleteVersion, getBadges, platformColor, PLATFORM_META } from './version-store.js';
import { generateVersionCopy } from './nim.js';
import { toast } from './motion.js';

const PASSWORD = '13245';

const state = {
    unlocked: false,
    projectId: null,
    platform: null,
    editingId: null,   // id de versión en edición (null = alta)
    aiDraft: null,     // resultado de la IA para prellenar
};

let overlay = null;
let panel = null;

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

// ------------------------------------------------------------
// Montaje
// ------------------------------------------------------------
function mount() {
    const fab = document.createElement('button');
    fab.className = 'admin-fab';
    fab.setAttribute('aria-label', 'Panel de administración');
    fab.innerHTML = '<span class="fab-a">A</span><span class="fab-label">Admin</span>';
    fab.addEventListener('click', open);
    document.body.appendChild(fab);

    overlay = document.createElement('div');
    overlay.className = 'admin-overlay';
    overlay.innerHTML = '<div class="admin-panel" role="dialog" aria-modal="true" aria-label="Panel Admin"></div>';
    panel = overlay.firstElementChild;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
    document.body.appendChild(overlay);
}

function open() {
    state.unlocked = false;
    state.projectId = null;
    state.platform = null;
    state.editingId = null;
    state.aiDraft = null;
    overlay.classList.add('open');
    renderPassword();
}

function close() {
    overlay.classList.remove('open');
    state.unlocked = false; // siempre vuelve a pedir contraseña
}

function setStep(html) {
    panel.innerHTML = `<div class="admin-step">${html}</div>`;
}

function header(sub) {
    return `
        <h2 class="admin-title">PANEL <span>ADMIN</span></h2>
        <p class="admin-sub">${esc(sub)}</p>`;
}

function showError(msg) {
    const el = panel.querySelector('.admin-error');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('show');
    void el.offsetWidth; // reinicia la animación de shake
    el.classList.add('show');
}

// ------------------------------------------------------------
// Paso 0 — Contraseña
// ------------------------------------------------------------
function renderPassword() {
    setStep(`
        ${header('Acceso restringido')}
        <div class="admin-field">
            <label for="admin-pass">Contraseña</label>
            <input type="password" id="admin-pass" autocomplete="off" placeholder="•••••">
        </div>
        <p class="admin-error"></p>
        <div class="admin-actions">
            <button class="admin-btn ghost" data-act="cancel">Cancelar</button>
            <button class="admin-btn primary" data-act="enter">Entrar</button>
        </div>
    `);
    const input = panel.querySelector('#admin-pass');
    setTimeout(() => input.focus(), 80);

    const tryEnter = () => {
        if (input.value === PASSWORD) {
            state.unlocked = true;
            renderProjects();
        } else {
            input.value = '';
            showError('Contraseña incorrecta.');
        }
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') tryEnter(); });
    panel.querySelector('[data-act="enter"]').addEventListener('click', tryEnter);
    panel.querySelector('[data-act="cancel"]').addEventListener('click', close);
}

// ------------------------------------------------------------
// Paso 1 — Elegir proyecto
// ------------------------------------------------------------
function renderProjects() {
    const projects = getProjects();
    setStep(`
        ${header('Paso 1 · Elegí el proyecto')}
        <div>
            ${projects.map(p => `
                <button class="admin-option" data-project="${esc(p.id)}">
                    <span>${esc(p.name)}
                        <small>${p.versions.length} versión(es) · ${p.platforms.map(pl => PLATFORM_META[pl].icon).join(' ')}</small>
                    </span>
                    <span class="arrow">→</span>
                </button>`).join('')}
        </div>
        <div class="admin-actions">
            <button class="admin-btn ghost" data-act="cancel">Cancelar</button>
        </div>
    `);
    panel.querySelectorAll('[data-project]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.projectId = btn.dataset.project;
            const project = getProject(state.projectId);
            if (project.platforms.length > 1) {
                renderPlatform();
            } else {
                state.platform = project.platforms[0];
                renderManage();
            }
        });
    });
    panel.querySelector('[data-act="cancel"]').addEventListener('click', close);
}

// ------------------------------------------------------------
// Paso 2 — Elegir plataforma (solo si el proyecto tiene Android)
// ------------------------------------------------------------
function renderPlatform() {
    const project = getProject(state.projectId);
    setStep(`
        ${header(`Paso 2 · ${project.name} — plataforma`)}
        <div>
            ${project.platforms.map(pl => `
                <button class="admin-option ${pl === 'android' ? 'android' : ''}" data-platform="${pl}">
                    <span>${PLATFORM_META[pl].icon} ${esc(PLATFORM_META[pl].label)}
                        <small>${getVersions(state.projectId, pl).length} versión(es)</small>
                    </span>
                    <span class="arrow">→</span>
                </button>`).join('')}
        </div>
        <div class="admin-actions">
            <button class="admin-btn ghost" data-act="back">← Volver</button>
            <button class="admin-btn ghost" data-act="cancel">Cancelar</button>
        </div>
    `);
    panel.querySelectorAll('[data-platform]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.platform = btn.dataset.platform;
            renderManage();
        });
    });
    panel.querySelector('[data-act="back"]').addEventListener('click', renderProjects);
    panel.querySelector('[data-act="cancel"]').addEventListener('click', close);
}

// ------------------------------------------------------------
// Paso 3 — Gestionar versiones (lista + editar/eliminar + nueva)
// ------------------------------------------------------------
function renderManage() {
    const project = getProject(state.projectId);
    const versions = getVersions(state.projectId, state.platform);
    const meta = PLATFORM_META[state.platform];
    const color = platformColor(state.platform);

    const rows = versions.map(v => {
        const badges = getBadges(state.projectId, v).map(b => {
            const style = b.kind === 'latest' ? `background:${color}; color:black;`
                : b.kind === 'experimental' ? 'background:#c0392b; color:white;'
                : b.kind === 'inactive' ? 'background:#333; color:#999;'
                : 'background:#444; color:white;';
            return `<span class="v-badge" style="${style}">${esc(b.text)}</span>`;
        }).join(' ');
        return `
            <div class="admin-version-row">
                <div class="v-info">
                    <div class="v-num">v${esc(v.version)} ${badges}</div>
                    <div class="v-note">${esc(v.note)}</div>
                </div>
                <div class="v-actions">
                    <button class="admin-icon-btn" data-edit="${esc(v.id)}" title="Editar versión" aria-label="Editar v${esc(v.version)}">✏️</button>
                    <button class="admin-icon-btn delete" data-delete="${esc(v.id)}" title="Eliminar versión" aria-label="Eliminar v${esc(v.version)}">🗑️</button>
                </div>
            </div>`;
    }).join('');

    setStep(`
        ${header(`${project.name} · ${meta.icon} ${meta.label}`)}
        <div class="admin-list-scroll">
            ${rows || '<p class="empty-state">No hay versiones para esta plataforma todavía.</p>'}
        </div>
        <p class="admin-error"></p>
        <div class="admin-actions">
            <button class="admin-btn ghost" data-act="back">← Volver</button>
            <button class="admin-btn ghost" data-act="cancel">Cancelar</button>
            <button class="admin-btn primary" data-act="new">➕ Nueva versión</button>
        </div>
    `);

    panel.querySelectorAll('[data-edit]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.editingId = btn.dataset.edit;
            state.aiDraft = null;
            renderForm();
        });
    });
    panel.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', () => {
            const v = versions.find(x => x.id === btn.dataset.delete);
            if (!v) return;
            if (confirm(`¿Eliminar la versión v${v.version} de ${project.name}? Esta acción no se puede deshacer.`)) {
                deleteVersion(state.projectId, v.id);
                toast(`Versión v${v.version} eliminada`);
                renderManage();
            }
        });
    });
    panel.querySelector('[data-act="new"]').addEventListener('click', () => {
        state.editingId = null;
        state.aiDraft = null;
        renderForm();
    });
    panel.querySelector('[data-act="back"]').addEventListener('click', () => {
        const p = getProject(state.projectId);
        p.platforms.length > 1 ? renderPlatform() : renderProjects();
    });
    panel.querySelector('[data-act="cancel"]').addEventListener('click', close);
}

// ------------------------------------------------------------
// Paso 4 — Formulario (alta / edición) + IA
// ------------------------------------------------------------
function detailsToText(details) {
    return (details || []).map(d => (d.t ? `${d.t}: ${d.d}` : d.d)).join('\n');
}

function textToDetails(text) {
    return String(text || '')
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => {
            const m = l.match(/^([^:]{2,50}):\s*(.+)$/);
            return m ? { t: m[1].trim().toUpperCase(), d: m[2].trim() } : { t: '', d: l };
        });
}

function renderForm() {
    const project = getProject(state.projectId);
    const meta = PLATFORM_META[state.platform];
    const editing = state.editingId
        ? getVersions(state.projectId, state.platform).find(v => v.id === state.editingId)
        : null;
    const draft = state.aiDraft || {};

    const val = (field, fallback = '') => draft[field] ?? editing?.[field] ?? fallback;

    setStep(`
        ${header(`${editing ? 'Editar' : 'Nueva'} versión · ${project.name} · ${meta.icon}`)}

        <div class="admin-ai-box">
            <div class="ai-title">⚡ Generar con IA (NVIDIA NIM · Llama 3.1 8B)</div>
            <div class="admin-field" style="margin-bottom:10px;">
                <textarea id="f-ai" rows="3" placeholder="Contá en pocas palabras qué cambió en esta versión... La IA redacta el título, la mini descripción y las patch notes con el estilo del sitio."></textarea>
            </div>
            <button class="admin-btn ai" data-act="ai" style="width:100%;">Generar contenido con IA</button>
        </div>

        <div class="admin-field">
            <label for="f-version">Número de versión *</label>
            <input type="text" id="f-version" placeholder="${state.platform === 'android' ? 'ej: 0.8.0a' : 'ej: 1.3'}" value="${esc(val('version'))}">
        </div>
        <div class="admin-field">
            <label for="f-title">Título de la update *</label>
            <input type="text" id="f-title" placeholder="ej: GAMING MODE" value="${esc(val('title'))}">
            <div class="hint">La etiqueta "ÚLTIMA RELEASE" y los colores por plataforma se aplican automáticamente.</div>
        </div>
        <div class="admin-field">
            <label for="f-note">Mini descripción *</label>
            <input type="text" id="f-note" placeholder="Resumen de una línea que aparece en el botón de descarga" value="${esc(val('note'))}">
        </div>
        <div class="admin-field">
            <label for="f-url">Link a la release *</label>
            <input type="url" id="f-url" placeholder="https://github.com/.../releases/download/..." value="${esc(val('url'))}">
        </div>
        <div class="admin-field">
            <label for="f-details">Patch notes (opcional — una por línea, formato "ETIQUETA: detalle")</label>
            <textarea id="f-details" rows="4" placeholder="RENDIMIENTO: Carga 2x más rápida.\nFIXES: Corregido bug del menú.">${esc(draft.details ? detailsToText(draft.details) : detailsToText(editing?.details))}</textarea>
        </div>
        <div class="admin-field" style="display:flex; gap:26px; flex-wrap:wrap;">
            <label class="admin-toggle">
                <input type="checkbox" id="f-active" ${(editing ? editing.active : true) ? 'checked' : ''}>
                <span class="track"></span>
                <span class="toggle-text">Activada (visible)</span>
            </label>
            <label class="admin-toggle">
                <input type="checkbox" id="f-exp" ${(draft.experimental ?? editing?.experimental) ? 'checked' : ''}>
                <span class="track"></span>
                <span class="toggle-text">Experimental</span>
            </label>
        </div>
        <p class="admin-error"></p>
        <div class="admin-actions">
            <button class="admin-btn ghost" data-act="cancel-form">Cancelar</button>
            <button class="admin-btn primary" data-act="save">${editing ? 'Guardar cambios' : 'Publicar versión'}</button>
        </div>
    `);

    // --- IA ---
    const aiBtn = panel.querySelector('[data-act="ai"]');
    aiBtn.addEventListener('click', async () => {
        const changes = panel.querySelector('#f-ai').value.trim();
        if (!changes) { showError('Escribí primero qué cambió en esta versión.'); return; }
        aiBtn.disabled = true;
        aiBtn.innerHTML = '<span class="admin-spinner"></span>Generando...';
        try {
            const examples = getVersions(state.projectId, state.platform).filter(v => v.details?.length);
            const result = await generateVersionCopy({
                projectName: project.name,
                platform: state.platform,
                versionNumber: panel.querySelector('#f-version').value.trim(),
                changesText: changes,
                examples,
            });
            panel.querySelector('#f-title').value = result.title;
            panel.querySelector('#f-note').value = result.note;
            panel.querySelector('#f-details').value = detailsToText(result.details);
            toast('✨ Contenido generado con IA — revisalo y publicá');
        } catch (err) {
            console.error('[NIM]', err);
            showError(`No se pudo generar con IA: ${err.message}. Podés completar los campos a mano.`);
        } finally {
            aiBtn.disabled = false;
            aiBtn.textContent = 'Generar contenido con IA';
        }
    });

    // --- Guardar ---
    panel.querySelector('[data-act="save"]').addEventListener('click', () => {
        const data = {
            platform: state.platform,
            version: panel.querySelector('#f-version').value.trim(),
            title: panel.querySelector('#f-title').value.trim().toUpperCase(),
            note: panel.querySelector('#f-note').value.trim(),
            url: panel.querySelector('#f-url').value.trim(),
            details: textToDetails(panel.querySelector('#f-details').value),
            active: panel.querySelector('#f-active').checked,
            experimental: panel.querySelector('#f-exp').checked,
        };
        if (!data.version || !data.title || !data.note || !data.url) {
            showError('Completá los campos obligatorios: versión, título, mini descripción y link.');
            return;
        }
        if (!/^https?:\/\//i.test(data.url)) {
            showError('El link a la release debe empezar con http:// o https://');
            return;
        }
        if (editing) {
            updateVersion(state.projectId, editing.id, data);
            renderSuccess(`v${data.version} actualizada`, data);
        } else {
            addVersion(state.projectId, data);
            renderSuccess(`v${data.version} publicada`, data);
        }
    });

    panel.querySelector('[data-act="cancel-form"]').addEventListener('click', renderManage);
}

// ------------------------------------------------------------
// Paso 5 — Éxito
// ------------------------------------------------------------
function renderSuccess(titleText, data) {
    const project = getProject(state.projectId);
    setStep(`
        ${header('Listo')}
        <div class="admin-success">
            <div class="check">✓</div>
            <h3>${esc(titleText)}</h3>
            <p><strong style="color:white;">${esc(project.name)}</strong> · ${PLATFORM_META[state.platform].icon} ${esc(PLATFORM_META[state.platform].label)}</p>
            <p>${data.active
                ? 'La versión ya está visible en la página del proyecto con sus etiquetas y colores automáticos.'
                : 'La versión quedó guardada como <strong style="color:#ccc;">desactivada</strong>: no se muestra al público hasta que la actives.'}</p>
        </div>
        <div class="admin-actions">
            <button class="admin-btn ghost" data-act="more">Cargar otra</button>
            <a class="admin-btn primary" style="text-align:center; text-decoration:none; box-sizing:border-box;" href="${esc(project.page)}">Ver el proyecto →</a>
            <button class="admin-btn ghost" data-act="done">Cerrar</button>
        </div>
    `);
    panel.querySelector('[data-act="more"]').addEventListener('click', renderManage);
    panel.querySelector('[data-act="done"]').addEventListener('click', () => {
        close();
        toast('Sesión de Admin cerrada — se pedirá contraseña de nuevo');
    });
}

// ------------------------------------------------------------
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
    mount();
}
