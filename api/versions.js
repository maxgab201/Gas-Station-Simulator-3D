// GET  /api/versions            → catálogo completo (público, sin caché)
// POST /api/versions (+ token)  → { action: 'add'|'edit'|'delete', ... }
//     add:    { projectId, platform, version: {...} }
//     edit:   { projectId, versionId, patch: {...} }
//     delete: { projectId, versionId }
// Cada mutación se commitea a data/versions.json en el repo de GitHub.

import { json, requireAuth, readCatalog, writeCatalog } from './_lib.js';

const EDITABLE_FIELDS = ['version', 'title', 'note', 'url', 'date', 'active', 'experimental', 'details', 'platform'];

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const { catalog, storage } = await readCatalog();
            return json(res, 200, { projects: catalog.projects, storage });
        }
        if (req.method !== 'POST') return json(res, 405, { error: 'Método no permitido' });
        if (!requireAuth(req, res)) return;

        const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        const { action, projectId } = body;

        // Reintenta una vez si el sha quedó viejo (commit concurrente).
        for (let attempt = 0; attempt < 2; attempt++) {
            const { catalog, sha } = await readCatalog();
            const project = catalog.projects.find(p => p.id === projectId);
            if (!project) return json(res, 400, { error: `Proyecto desconocido: ${projectId}` });

            let message;
            if (action === 'add') {
                const v = sanitizeVersion(body.version, project);
                if (v.error) return json(res, 400, { error: v.error });
                project.versions.push(v.version);
                message = `Admin: agrega ${project.name} v${v.version.version}`;
            } else if (action === 'edit') {
                const target = project.versions.find(x => x.id === body.versionId);
                if (!target) return json(res, 404, { error: 'Versión no encontrada.' });
                const patch = pick(body.patch || {}, EDITABLE_FIELDS);
                const merged = sanitizeVersion({ ...target, ...patch }, project, target.id);
                if (merged.error) return json(res, 400, { error: merged.error });
                Object.assign(target, merged.version);
                message = `Admin: edita ${project.name} v${target.version}`;
            } else if (action === 'delete') {
                const idx = project.versions.findIndex(x => x.id === body.versionId);
                if (idx === -1) return json(res, 404, { error: 'Versión no encontrada.' });
                const [removed] = project.versions.splice(idx, 1);
                message = `Admin: elimina ${project.name} v${removed.version}`;
            } else {
                return json(res, 400, { error: `Acción desconocida: ${action}` });
            }

            try {
                const { storage } = await writeCatalog(catalog, sha, message);
                return json(res, 200, { ok: true, projects: catalog.projects, storage });
            } catch (err) {
                // 409 = sha desactualizado → releer y reintentar una vez
                if (err.status === 409 && attempt === 0) continue;
                throw err;
            }
        }
    } catch (err) {
        console.error('[api/versions]', err);
        return json(res, 502, { error: `No se pudo guardar en GitHub: ${err.message}` });
    }
}

function pick(obj, keys) {
    const out = {};
    for (const k of keys) if (k in obj) out[k] = obj[k];
    return out;
}

function sanitizeVersion(raw, project, keepId = null) {
    if (!raw || typeof raw !== 'object') return { error: 'Datos de versión inválidos.' };
    const platform = project.platforms.includes(raw.platform) ? raw.platform : project.platforms[0];
    const version = String(raw.version || '').trim();
    const title = String(raw.title || '').trim().toUpperCase().slice(0, 60);
    const note = String(raw.note || '').trim().slice(0, 200);
    const url = String(raw.url || '').trim();
    if (!version || !title || !note || !url) {
        return { error: 'Faltan campos obligatorios: versión, título, mini descripción y link.' };
    }
    if (!/^https?:\/\//i.test(url)) {
        return { error: 'El link a la release debe empezar con http:// o https://' };
    }
    const details = Array.isArray(raw.details)
        ? raw.details
            .filter(d => d && typeof d.d === 'string' && d.d.trim())
            .slice(0, 10)
            .map(d => ({ t: String(d.t || '').toUpperCase().slice(0, 60), d: String(d.d).slice(0, 400) }))
        : [];
    return {
        version: {
            id: keepId || `${project.id}-${platform}-${version}-${Date.now().toString(36)}`,
            platform,
            version,
            title,
            note,
            url,
            date: String(raw.date || defaultDate()).slice(0, 40),
            active: !!raw.active,
            experimental: !!raw.experimental,
            details,
        },
    };
}

function defaultDate() {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const now = new Date();
    return `${meses[now.getMonth()]} ${now.getFullYear()}`;
}
