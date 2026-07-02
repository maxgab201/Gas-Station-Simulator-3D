// POST /api/login  { password } → { token, expiresAt }
// La contraseña vive en la variable de entorno ADMIN_PASSWORD (Vercel).

import { json, createToken, timingSafeEqualStr, sleep } from './_lib.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return json(res, 405, { error: 'Método no permitido' });

    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
        return json(res, 503, { error: 'El panel no está configurado: falta ADMIN_PASSWORD en las variables de entorno de Vercel.' });
    }

    const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
    const password = String(body.password || '');

    // Delay fijo para frenar fuerza bruta y no filtrar timing.
    await sleep(400);

    if (!password || !timingSafeEqualStr(password, expected)) {
        return json(res, 401, { error: 'Contraseña incorrecta.' });
    }
    return json(res, 200, createToken());
}

function safeParse(s) {
    try { return JSON.parse(s); } catch { return {}; }
}
