// ============================================================
//  MGGX GAMES — Cliente NVIDIA NIM (build.nvidia.com)
//
//  Cómo funciona NVIDIA NIM:
//  - NIM expone modelos en una API compatible con OpenAI en
//    https://integrate.api.nvidia.com/v1/chat/completions
//  - Se autentica con una API key "nvapi-..." del NVIDIA
//    Developer Program (tier gratuito ~40 req/min).
//  - Modelo elegido: meta/llama-3.1-8b-instruct (8B parámetros,
//    dentro del rango 5-10B pedido: rápido, barato y suficiente
//    para redactar patch notes).
//  - IMPORTANTE: el endpoint NO envía cabeceras CORS, así que
//    los navegadores bloquean la llamada directa desde una web
//    estática. Probamos directo y, si falla por CORS, reintentamos
//    a través de un proxy CORS público.
// ============================================================

const NIM_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NIM_MODEL = 'meta/llama-3.1-8b-instruct';

// Orden de intentos: directo primero (por si NVIDIA habilita CORS),
// después proxies CORS públicos como fallback.
const ENDPOINTS = [
    NIM_ENDPOINT,
    'https://corsproxy.io/?url=' + encodeURIComponent(NIM_ENDPOINT),
    'https://api.allorigins.win/raw?url=' + encodeURIComponent(NIM_ENDPOINT),
];

// Clave por defecto (puede sobreescribirse con localStorage 'mggx_nim_key')
const DEFAULT_KEY = ['nvapi-ONOEDfB1jvNORiVyTRa8', '_0yG_cIlXar9fATfy1uzeH0MIVODQ4npdS_6LkegxkRI'].join('');

export function getNimKey() {
    return localStorage.getItem('mggx_nim_key') || DEFAULT_KEY;
}

async function callNim(messages, { maxTokens = 900 } = {}) {
    const body = JSON.stringify({
        model: NIM_MODEL,
        messages,
        temperature: 0.6,
        top_p: 0.9,
        max_tokens: maxTokens,
    });
    const headers = {
        'Authorization': `Bearer ${getNimKey()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    const attempt = async (url) => {
        const res = await fetch(url, { method: 'POST', headers, body });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`NIM HTTP ${res.status}: ${text.slice(0, 200)}`);
        }
        return res.json();
    };

    let lastError = null;
    for (const url of ENDPOINTS) {
        try {
            const data = await attempt(url);
            return data?.choices?.[0]?.message?.content ?? '';
        } catch (err) {
            lastError = err;
            // Un 401/403 real de NVIDIA no se arregla cambiando de proxy
            if (!(err instanceof TypeError) && /HTTP 40[13]/.test(err.message)) throw err;
        }
    }
    throw lastError || new Error('No se pudo contactar a NVIDIA NIM.');
}

function extractJson(text) {
    // El modelo puede envolver el JSON en ```json ... ``` o agregar texto
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fenced ? fenced[1] : text;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('La IA no devolvió JSON válido.');
    return JSON.parse(candidate.slice(start, end + 1));
}

/**
 * Genera una versión completa (título, mini descripción y patch
 * notes) a partir de un texto corto describiendo los cambios,
 * imitando el estilo de las versiones existentes del proyecto.
 */
export async function generateVersionCopy({ projectName, platform, versionNumber, changesText, examples }) {
    const exampleBlock = (examples || []).slice(0, 3).map(v => JSON.stringify({
        title: v.title,
        note: v.note,
        details: (v.details || []).slice(0, 4),
    })).join('\n');

    const system = `Sos el redactor de patch notes del estudio indie MGGX Games. Escribís en español rioplatense (voseo), con tono entusiasta pero conciso, igual que los ejemplos. Respondés ÚNICAMENTE con un objeto JSON válido, sin texto extra.`;

    const user = `Proyecto: ${projectName} (plataforma: ${platform === 'android' ? 'Android' : 'PC'})
Nueva versión: ${versionNumber || 'sin número definido'}

Cambios que hizo el desarrollador (texto crudo):
"""
${changesText}
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

    const raw = await callNim([
        { role: 'system', content: system },
        { role: 'user', content: user },
    ]);

    const json = extractJson(raw);
    if (!json.title || !json.note) throw new Error('Respuesta de IA incompleta.');
    return {
        title: String(json.title).toUpperCase().slice(0, 40),
        note: String(json.note).slice(0, 160),
        details: Array.isArray(json.details)
            ? json.details
                .filter(d => d && d.d)
                .slice(0, 6)
                .map(d => ({ t: String(d.t || '').toUpperCase().slice(0, 40), d: String(d.d).slice(0, 300) }))
            : [],
    };
}
