// POST /api/generate (+ token) → genera título, mini descripción y
// patch notes con NVIDIA NIM (meta/llama-3.1-8b-instruct, 8B params).
// La key vive en la variable de entorno NVIDIA_API_KEY (Vercel).
// Al correr server-side no hay problema de CORS con integrate.api.nvidia.com.

import { json, requireAuth } from './_lib.js';

const NIM_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NIM_MODEL = 'meta/llama-3.1-8b-instruct';

export default async function handler(req, res) {
    if (req.method !== 'POST') return json(res, 405, { error: 'Método no permitido' });
    if (!requireAuth(req, res)) return;

    if (!process.env.NVIDIA_API_KEY) {
        return json(res, 503, { error: 'La IA no está configurada: falta NVIDIA_API_KEY en las variables de entorno de Vercel.' });
    }

    const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
    const { projectName, platform, versionNumber, changesText, examples } = body;
    if (!changesText || !String(changesText).trim()) {
        return json(res, 400, { error: 'Falta el texto con los cambios de la versión.' });
    }

    try {
        const raw = await callNim(buildMessages({ projectName, platform, versionNumber, changesText, examples }));
        const parsed = extractJson(raw);
        if (!parsed.title || !parsed.note) throw new Error('Respuesta de IA incompleta.');
        return json(res, 200, {
            title: String(parsed.title).toUpperCase().slice(0, 40),
            note: String(parsed.note).slice(0, 160),
            details: Array.isArray(parsed.details)
                ? parsed.details
                    .filter(d => d && d.d)
                    .slice(0, 6)
                    .map(d => ({ t: String(d.t || '').toUpperCase().slice(0, 40), d: String(d.d).slice(0, 300) }))
                : [],
        });
    } catch (err) {
        console.error('[api/generate]', err);
        return json(res, 502, { error: `La IA no pudo generar el contenido: ${err.message}` });
    }
}

function buildMessages({ projectName, platform, versionNumber, changesText, examples }) {
    const exampleBlock = (Array.isArray(examples) ? examples : []).slice(0, 3).map(v => JSON.stringify({
        title: v.title,
        note: v.note,
        details: (v.details || []).slice(0, 4),
    })).join('\n');

    const system = 'Sos el redactor de patch notes del estudio indie MGGX Games. Escribís en español rioplatense (voseo), con tono entusiasta pero conciso, igual que los ejemplos. Respondés ÚNICAMENTE con un objeto JSON válido, sin texto extra.';

    const user = `Proyecto: ${projectName || 'Proyecto MGGX'} (plataforma: ${platform === 'android' ? 'Android' : 'PC'})
Nueva versión: ${versionNumber || 'sin número definido'}

Cambios que hizo el desarrollador (texto crudo):
"""
${String(changesText).slice(0, 2000)}
"""

Ejemplos del estilo de versiones anteriores de este proyecto (JSON):
${exampleBlock || '(sin ejemplos, usá un estilo de patch notes de videojuego indie)'}

Generá el contenido de la nueva versión con EXACTAMENTE este formato JSON:
{
  "title": "NOMBRE CORTO DE LA UPDATE EN MAYÚSCULAS (2-3 palabras, estilo 'GAMING MODE', 'HOTFIX PATCH')",
  "note": "Mini descripción de una línea (máx 120 caracteres) resumiendo la update.",
  "details": [
    { "t": "ETIQUETA EN MAYÚSCULAS", "d": "Descripción clara del cambio en una o dos oraciones." }
  ]
}
Incluí entre 2 y 5 items en "details", uno por cambio real. No inventes cambios que no estén en el texto.`;

    return [
        { role: 'system', content: system },
        { role: 'user', content: user },
    ];
}

async function callNim(messages) {
    const res = await fetch(NIM_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            model: NIM_MODEL,
            messages,
            temperature: 0.6,
            top_p: 0.9,
            max_tokens: 900,
        }),
    });
    if (!res.ok) throw new Error(`NVIDIA NIM HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? '';
}

function extractJson(text) {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fenced ? fenced[1] : text;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('la IA no devolvió JSON válido.');
    return JSON.parse(candidate.slice(start, end + 1));
}

function safeParse(s) {
    try { return JSON.parse(s); } catch { return {}; }
}
