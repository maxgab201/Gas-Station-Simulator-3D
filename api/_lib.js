// ============================================================
//  MGGX GAMES — Helpers compartidos de las funciones /api
//
//  Contiene:
//  - Tokens de sesión firmados (HMAC-SHA256, expiran a los 30 min)
//  - Lectura/escritura de data/versions.json en GitHub (Contents
//    API). Sin GITHUB_TOKEN cae al filesystem local (modo dev).
//  - Rate limiting best-effort por IP (ver limitación documentada
//    más abajo — no reemplaza un WAF/Vercel Firewall real).
//  - Verificación de Origin/Sec-Fetch-Site como defensa en
//    profundidad adicional contra CSRF en endpoints que mutan
//    estado (el diseño ya es CSRF-safe por construcción: no se
//    usan cookies de sesión, así que no hay credencial ambiente
//    que un sitio de terceros pueda hacer viajar automáticamente;
//    esta capa extra sencillamente rechaza pedidos cuyo origen
//    declarado no sea el propio sitio, cuando el navegador informa
//    ese dato).
//  - Respuestas de error genéricas al cliente: el detalle completo
//    de cualquier excepción se loguea server-side con console.error
//    y NUNCA se refleja tal cual en la respuesta HTTP, para no
//    filtrar rutas internas, mensajes de la API de GitHub/NVIDIA,
//    ni nada que ayude a un atacante a mapear el backend.
// ============================================================

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const DATA_PATH = 'data/versions.json';
const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutos

// ------------------------------------------------------------
// Respuestas HTTP
// ------------------------------------------------------------

/** Respuesta JSON estándar: nunca cacheable, tipo de contenido explícito. */
export function json(res, status, body) {
    res.status(status);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.json(body);
}

/**
 * Registra el error completo en los logs del servidor (visibles
 * solo en el dashboard de Vercel, nunca al cliente) y devuelve al
 * cliente un mensaje genérico y seguro. `context` identifica el
 * endpoint/operación en los logs sin exponer detalle interno.
 */
export function safeError(res, status, context, err, publicMessage) {
    console.error(`[api:${context}]`, err);
    return json(res, status, { error: publicMessage });
}

// ------------------------------------------------------------
// Sesión — token firmado con HMAC-SHA256
// ------------------------------------------------------------
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
    const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS, v: 1 })).toString('base64url');
    const sig = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
    return { token: `${payload}.${sig}`, expiresAt: Date.now() + TOKEN_TTL_MS };
}

export function verifyToken(token) {
    const key = secret();
    if (!key || !token || typeof token !== 'string' || token.length > 512) return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [payload, sig] = parts;
    if (!payload || !sig) return false;
    try {
        const expected = crypto.createHmac('sha256', key).update(payload).digest('base64url');
        // Longitud distinta ya descarta timingSafeEqual (que exige buffers
        // del mismo tamaño); comparamos longitud primero de forma segura
        // igualmente porque revelar "longitud distinta" no filtra el secreto.
        if (sig.length !== expected.length) return false;
        if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
        const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        return typeof exp === 'number' && Date.now() < exp;
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

// ------------------------------------------------------------
// Rate limiting — best-effort, en memoria del proceso
// ------------------------------------------------------------
// LIMITACIÓN HONESTA: las funciones serverless de Vercel no
// garantizan un proceso persistente entre invocaciones; en tráfico
// bajo/medio, invocaciones sucesivas suelen reutilizar la misma
// instancia "caliente" (donde este Map sí persiste y el límite
// funciona), pero bajo carga alta o tras un período de inactividad
// puede arrancar una instancia nueva con el contador en cero. Esto
// SÍ frena bots simples/no distribuidos y reduce el impacto de un
// intento de fuerza bruta sostenido desde un mismo origen, pero NO
// es un rate limiter distribuido real. Para eso hace falta un store
// compartido (Vercel KV / Upstash Redis) que este proyecto no tiene
// provisionado — queda documentado como mejora recomendada en
// documentacion_arquitectura.md en vez de aparentar una garantía
// que no existe.
const buckets = new Map();
const MAX_BUCKETS = 5000; // cota de memoria: evita crecimiento sin límite

function pruneBuckets(now) {
    if (buckets.size < MAX_BUCKETS) return;
    for (const [key, b] of buckets) {
        if (now - b.windowStart > 10 * 60 * 1000) buckets.delete(key);
    }
}

/**
 * Ventana deslizante simple: `limit` pedidos cada `windowMs` por
 * clave (normalmente IP + endpoint). Devuelve true si el pedido
 * está permitido.
 */
export function rateLimit(key, { limit = 20, windowMs = 60_000 } = {}) {
    const now = Date.now();
    pruneBuckets(now);
    let bucket = buckets.get(key);
    if (!bucket || now - bucket.windowStart > windowMs) {
        bucket = { count: 0, windowStart: now };
        buckets.set(key, bucket);
    }
    bucket.count++;
    return bucket.count <= limit;
}

/** IP del cliente según la cabecera que agrega el edge de Vercel. */
export function clientIp(req) {
    const fwd = req.headers['x-forwarded-for'];
    if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
    return req.socket?.remoteAddress || 'unknown';
}

/**
 * Aplica rate limiting y corta con 429 si se excede. `name`
 * identifica el bucket lógico (ej. "login", "versions-write").
 */
export function enforceRateLimit(req, res, name, opts) {
    const ip = clientIp(req);
    if (!rateLimit(`${name}:${ip}`, opts)) {
        res.setHeader('Retry-After', String(Math.ceil((opts?.windowMs ?? 60000) / 1000)));
        json(res, 429, { error: 'Demasiados intentos. Esperá un momento y volvé a intentar.' });
        return false;
    }
    return true;
}

// ------------------------------------------------------------
// Defensa en profundidad anti-CSRF: verificación de Origin
// ------------------------------------------------------------
// El diseño ya es inmune a CSRF clásico (no hay cookies de sesión;
// el token viaje SIEMPRE en un header Authorization que un sitio
// de terceros no puede adjuntar automáticamente a una request
// cross-site). Esta función agrega una verificación explícita de
// que, cuando el navegador informa Origin/Referer, coincida con el
// propio host — belt-and-braces, no la base de la protección.
export function enforceSameOrigin(req, res) {
    const origin = req.headers.origin;
    if (!origin) return true; // clientes sin Origin (curl, server-to-server) no se bloquean acá
    try {
        const originHost = new URL(origin).host;
        const requestHost = req.headers.host;
        if (originHost !== requestHost) {
            json(res, 403, { error: 'Origen de la solicitud no permitido.' });
            return false;
        }
    } catch {
        json(res, 403, { error: 'Origen de la solicitud inválido.' });
        return false;
    }
    return true;
}

/** Parsea el body como JSON con límite de tamaño defensivo. */
export function parseJsonBody(req, maxBytes = 200_000) {
    if (typeof req.body === 'object' && req.body !== null) return req.body;
    const raw = typeof req.body === 'string' ? req.body : '';
    if (raw.length > maxBytes) throw new Error('Cuerpo de la solicitud demasiado grande.');
    if (!raw) return {};
    return JSON.parse(raw);
}

// ------------------------------------------------------------
// Catálogo (GitHub Contents API o filesystem local)
// ------------------------------------------------------------
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
