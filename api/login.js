// POST /api/login  { password } → { token, expiresAt }
// La contraseña vive en la variable de entorno ADMIN_PASSWORD (Vercel).
//
// Capas de defensa contra fuerza bruta, en orden:
//   1. enforceSameOrigin — descarta pedidos con Origin de otro sitio.
//   2. enforceRateLimit  — máximo 8 intentos cada 5 minutos por IP
//      (ventana deslizante en memoria, ver limitación documentada
//      en api/_lib.js).
//   3. sleep(400ms) fijo — encarece cualquier intento igual, evita
//      que el atacante mida el tiempo de respuesta para inferir
//      nada (además de igualar el timing entre "existe"/"no existe").
//   4. timingSafeEqualStr — comparación de tiempo constante contra
//      la contraseña real, para que ni un ataque de timing local
//      filtre cuántos caracteres coinciden.

import { json, safeError, createToken, timingSafeEqualStr, sleep, enforceSameOrigin, enforceRateLimit, parseJsonBody } from './_lib.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return json(res, 405, { error: 'Método no permitido' });
    if (!enforceSameOrigin(req, res)) return;
    if (!enforceRateLimit(req, res, 'login', { limit: 8, windowMs: 5 * 60_000 })) return;

    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
        return json(res, 503, { error: 'El panel no está configurado: falta ADMIN_PASSWORD en las variables de entorno de Vercel.' });
    }

    let body;
    try {
        body = parseJsonBody(req);
    } catch (err) {
        return safeError(res, 400, 'login', err, 'Solicitud inválida.');
    }
    const password = String(body.password || '').slice(0, 200);

    // Delay fijo para frenar fuerza bruta y no filtrar timing.
    await sleep(400);

    if (!password || !timingSafeEqualStr(password, expected)) {
        return json(res, 401, { error: 'Contraseña incorrecta.' });
    }
    return json(res, 200, createToken());
}
