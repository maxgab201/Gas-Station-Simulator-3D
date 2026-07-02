// ============================================================
//  MGGX GAMES — Helpers compartidos de las funciones /api
//  - Tokens de sesión firmados (HMAC-SHA256, expiran)
//  - Lectura/escritura de data/versions.json en GitHub
//    (Contents API). Sin GITHUB_TOKEN cae al filesystem local
//    (modo desarrollo).
// ============================================================

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const DATA_PATH = 'data/versions.json';
const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutos

export function json(res, status, body) {
    res.status(status).setHeader('Cache-Control', 'no-store');
    res.json(body);
}

// --- Sesión ---------------------------------------------------
// Si no hay SESSION_SECRET dedicado, se deriva uno estable de la
// contraseña para que alcance con configurar ADMIN_PASSWORD.
function secret() {
    if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
    if (process.env.ADMIN_PASSWORD) {
        return crypto.createHash('sha256')
            .update('mggx-session-v1:' + process.env.ADMIN_PASSWORD)
            .digest('hex');
    }
    return null;
}

export function createToken() {
    const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
    const sig = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
    return { token: `${payload}.${sig}`, expiresAt: Date.now() + TOKEN_TTL_MS };
}

export function verifyToken(token) {
    const key = secret();
    if (!key || !token) return false;
    const [payload, sig] = String(token).split('.');
    if (!payload || !sig) return false;
    try {
        const expected = crypto.createHmac('sha256', key).update(payload).digest('base64url');
        if (sig.length !== expected.length) return false;
        if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
        const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        return Date.now() < exp;
    } catch {
        return false;
    }
}

/** Corta la request con 401 si no hay token válido. */
export function requireAuth(req, res) {
    const raw = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!verifyToken(raw)) {
        json(res, 401, { error: 'Sesión inválida o vencida. Volvé a ingresar la contraseña.' });
        return false;
    }
    return true;
}

export function timingSafeEqualStr(a, b) {
    const ha = crypto.createHash('sha256').update(String(a)).digest();
    const hb = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(ha, hb);
}

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// --- Catálogo (GitHub Contents API o filesystem local) --------
const ghRepo = () => process.env.GITHUB_REPO || 'maxgab201/Gas-Station-Simulator-3D';
// En previews de Vercel escribe sobre la misma rama deployada.
const ghBranch = () => process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || 'main';
const ghUrl = () => `https://api.github.com/repos/${ghRepo()}/contents/${DATA_PATH}`;

function ghHeaders() {
    return {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'mggx-admin-panel',
        'X-GitHub-Api-Version': '2022-11-28',
    };
}

function localPath() {
    return path.join(process.cwd(), DATA_PATH);
}

/** Devuelve { catalog, sha, storage }. */
export async function readCatalog() {
    if (!process.env.GITHUB_TOKEN) {
        const catalog = JSON.parse(fs.readFileSync(localPath(), 'utf8'));
        return { catalog, sha: null, storage: 'local' };
    }
    const res = await fetch(`${ghUrl()}?ref=${encodeURIComponent(ghBranch())}`, { headers: ghHeaders() });
    if (!res.ok) throw new Error(`GitHub GET ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const catalog = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
    return { catalog, sha: data.sha, storage: 'github' };
}

/** Commitea el catálogo actualizado. */
export async function writeCatalog(catalog, sha, message) {
    const body = JSON.stringify(catalog, null, 2) + '\n';
    if (!process.env.GITHUB_TOKEN) {
        fs.writeFileSync(localPath(), body);
        return { storage: 'local' };
    }
    const res = await fetch(ghUrl(), {
        method: 'PUT',
        headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            content: Buffer.from(body).toString('base64'),
            sha,
            branch: ghBranch(),
        }),
    });
    if (!res.ok) {
        const err = new Error(`GitHub PUT ${res.status}: ${(await res.text()).slice(0, 200)}`);
        err.status = res.status;
        throw err;
    }
    return { storage: 'github' };
}
