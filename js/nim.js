// ============================================================
//  MGGX GAMES — Cliente de generación con IA
//  Llama a /api/generate (función de Vercel), que es quien habla
//  con NVIDIA NIM usando la key guardada en variables de entorno.
//  El navegador nunca ve la API key y no hay problemas de CORS.
// ============================================================

/**
 * Genera título, mini descripción y patch notes a partir de un
 * texto corto con los cambios. Requiere el token de sesión Admin.
 */
export async function generateVersionCopy({ projectName, platform, versionNumber, changesText, examples }, token) {
    let res;
    try {
        res = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                projectName,
                platform,
                versionNumber,
                changesText,
                examples: (examples || []).slice(0, 3).map(v => ({
                    title: v.title,
                    note: v.note,
                    details: (v.details || []).slice(0, 4),
                })),
            }),
        });
    } catch {
        throw new Error('No se pudo contactar al servidor de IA. ¿Estás offline?');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Error HTTP ${res.status}`);
    if (!data.title || !data.note) throw new Error('Respuesta de IA incompleta.');
    return data;
}
