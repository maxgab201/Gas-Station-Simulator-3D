(function () {
  const SB_URL = 'https://ixbhyqoadriuvlcgkgcb.supabase.co';
  const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Ymh5cW9hZHJpdXZsY2drZ2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODA2MDEsImV4cCI6MjA5NzU1NjYwMX0.-aPNvSgyDQ2L_yPFicakyKRJZSez-vYvlXLi2sTYQYY';
  const NV_KEY = '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';
  const PASS   = '13245';

  const PROJECTS = [
    { id: 'wtsapp',      label: 'WtsApp',            hasAndroid: true  },
    { id: 'craft-book',  label: 'Craft Book PC',      hasAndroid: false },
    { id: 'autoclicker', label: 'MGGX Autoclicker',   hasAndroid: false },
    { id: 'gas-station', label: 'Gas Station Sim 3D', hasAndroid: false },
  ];

  let _proj = null, _plat = 'pc';

  // ── CSS ──────────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #ma-btn {
      position: fixed; bottom: 22px; right: 22px; z-index: 9999;
      width: 40px; height: 40px; border-radius: 20px;
      background: #111; border: 1px solid #333;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; overflow: hidden;
      transition: width .3s ease, border-color .3s, box-shadow .3s;
      font-family: 'Anton', sans-serif; font-size: 14px; color: #555;
      letter-spacing: 1px; text-transform: uppercase; white-space: nowrap;
      box-shadow: 0 2px 10px rgba(0,0,0,.5);
    }
    #ma-btn:hover {
      width: 104px; border-color: #FFA500; color: #FFA500;
      box-shadow: 0 0 18px rgba(255,165,0,.2);
    }
    #ma-ov {
      display: none; position: fixed; inset: 0; z-index: 10000;
      background: rgba(0,0,0,.93); backdrop-filter: blur(10px);
      align-items: center; justify-content: center;
    }
    #ma-panel {
      background: #111; border: 1px solid #2a2a2a; padding: 36px;
      width: 500px; max-width: 93vw; max-height: 88vh;
      overflow-y: auto; position: relative;
      box-shadow: 0 0 60px rgba(0,0,0,.95);
    }
    #ma-panel h2 {
      font-family: 'Anton', sans-serif; font-size: 22px; color: #FFA500;
      margin: 0 0 5px; letter-spacing: 1px;
    }
    .ma-sub { color: #555; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 26px; }
    .ma-x { position: absolute; top: 12px; right: 18px; font-size: 26px; color: #555; cursor: pointer; background: none; border: none; line-height: 1; }
    .ma-x:hover { color: white; }
    .ma-fld { margin-bottom: 15px; }
    .ma-fld label { display: block; font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px; }
    .ma-fld input, .ma-fld textarea {
      width: 100%; background: #0d0d0d; border: 1px solid #2a2a2a;
      color: white; padding: 11px 13px; font-size: 14px;
      font-family: 'Roboto', sans-serif; box-sizing: border-box; outline: none;
      transition: border-color .2s;
    }
    .ma-fld input:focus, .ma-fld textarea:focus { border-color: #FFA500; }
    .ma-fld textarea { resize: vertical; min-height: 80px; }
    .ma-proj {
      display: block; width: 100%; padding: 13px 16px; margin: 7px 0;
      background: #0d0d0d; border: 1px solid #2a2a2a; color: #bbb;
      text-align: left; cursor: pointer; font-size: 14px; font-weight: bold;
      transition: .2s;
    }
    .ma-proj:hover { border-color: #FFA500; color: #FFA500; }
    .ma-plat {
      display: flex; align-items: center; gap: 14px; width: 100%;
      padding: 15px 18px; margin: 9px 0; background: #0d0d0d;
      border: 1px solid #2a2a2a; color: #ccc;
      cursor: pointer; font-size: 15px; font-weight: bold; transition: .2s;
    }
    .ma-plat:hover { border-color: #FFA500; color: white; }
    .ma-pri {
      width: 100%; padding: 13px; background: #FFA500; color: black;
      border: none; font-weight: 900; font-size: 14px; cursor: pointer;
      text-transform: uppercase; margin-top: 8px; transition: .2s; letter-spacing: .5px;
    }
    .ma-pri:hover { background: white; }
    .ma-pri:disabled { background: #333; color: #666; cursor: not-allowed; }
    .ma-sec {
      width: 100%; padding: 11px; background: transparent; color: #777;
      border: 1px solid #333; font-weight: bold; font-size: 12px;
      cursor: pointer; text-transform: uppercase; margin-top: 7px; transition: .2s;
    }
    .ma-sec:hover { border-color: #FFA500; color: #FFA500; }
    .ma-sec:disabled { opacity: .35; cursor: not-allowed; }
    .ma-hr { border: none; border-top: 1px solid #1a1a1a; margin: 18px 0; }
    .ma-tog-w { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
    .ma-tog {
      width: 42px; height: 23px; background: #333; border-radius: 12px;
      cursor: pointer; position: relative; transition: background .2s; flex-shrink: 0;
    }
    .ma-tog.on { background: #FFA500; }
    .ma-tog::after {
      content: ''; position: absolute; top: 3px; left: 3px;
      width: 17px; height: 17px; border-radius: 50%; background: white;
      transition: transform .2s;
    }
    .ma-tog.on::after { transform: translateX(19px); }
    .ma-err { color: #e74c3c; font-size: 12px; margin-top: 7px; display: none; }
    .ma-ai-st { font-size: 12px; color: #666; margin-top: 5px; min-height: 16px; }
    .ma-ok-wrap { text-align: center; padding: 28px 10px; }
    .ma-ok-ico { font-size: 50px; margin-bottom: 14px; }
    .ma-ok-wrap h3 { font-family: 'Anton', sans-serif; font-size: 22px; color: #FFA500; margin: 0 0 8px; letter-spacing: 1px; }
    .ma-ok-wrap p { color: #666; font-size: 13px; margin: 0; }
    .ma-back { background: none; border: none; color: #555; cursor: pointer; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; padding: 0; }
    .ma-back:hover { color: #FFA500; }
    #ma-pass-inp {
      width: 100%; background: #0d0d0d; border: 1px solid #2a2a2a; color: white;
      padding: 14px; font-size: 22px; letter-spacing: 8px; text-align: center;
      box-sizing: border-box; outline: none; margin-bottom: 4px;
    }
    #ma-pass-inp:focus { border-color: #FFA500; }
    .ma-notes-ta {
      width: 100%; background: #0d0d0d; border: 1px solid #2a2a2a; color: #ccc;
      padding: 12px 13px; font-size: 12px; font-family: monospace;
      min-height: 120px; box-sizing: border-box; resize: vertical; outline: none;
    }
    .ma-notes-ta:focus { border-color: #FFA500; }
    .ma-hint { font-size: 11px; color: #444; margin-top: 4px; }
  `;
  document.head.appendChild(style);

  // ── HTML ─────────────────────────────────────────────────────────────────────
  document.body.insertAdjacentHTML('beforeend', `
    <div id="ma-btn" onclick="window.__ma.open()">ADMIN</div>

    <div id="ma-ov">
      <div id="ma-panel">
        <button class="ma-x" onclick="window.__ma.close()">&times;</button>

        <div id="ma-s-pass">
          <h2>PANEL ADMIN</h2>
          <p class="ma-sub">contraseña para continuar</p>
          <input id="ma-pass-inp" type="password" placeholder="••••••" autocomplete="off"
            onkeydown="if(event.key==='Enter') window.__ma.checkPass()">
          <p class="ma-err" id="ma-pass-err">Contraseña incorrecta.</p>
          <button class="ma-pri" style="margin-top:14px" onclick="window.__ma.checkPass()">INGRESAR</button>
        </div>

        <div id="ma-s-proj" style="display:none">
          <h2>NUEVO LANZAMIENTO</h2>
          <p class="ma-sub">seleccioná el proyecto</p>
          <div id="ma-proj-btns"></div>
        </div>

        <div id="ma-s-plat" style="display:none">
          <button class="ma-back" onclick="window.__ma.show('ma-s-proj')">← VOLVER</button>
          <h2 id="ma-plat-h">PLATAFORMA</h2>
          <p class="ma-sub">¿para qué plataforma es esta versión?</p>
          <button class="ma-plat" onclick="window.__ma.selPlat('pc')">🖥️ <span>PC — Windows (.exe)</span></button>
          <button class="ma-plat" onclick="window.__ma.selPlat('android')">📱 <span>Android — APK (.apk)</span></button>
        </div>

        <div id="ma-s-form" style="display:none">
          <button class="ma-back" id="ma-form-bk" onclick="window.__ma.formBack()">← VOLVER</button>
          <h2 id="ma-form-h"></h2>
          <p class="ma-sub" id="ma-form-sub"></p>

          <div class="ma-fld">
            <label>Número de versión</label>
            <input id="ma-ver" type="text" placeholder="ej: 0.8.0">
          </div>
          <div class="ma-fld">
            <label>Tag / título</label>
            <input id="ma-tag" type="text" placeholder="ej: GAMING MODE · HOTFIX PATCH · STABILITY UPDATE">
            <p class="ma-hint">Si contiene BETA, ALPHA o EXPERIMENTAL → se marca automáticamente como experimental.</p>
          </div>
          <div class="ma-fld">
            <label>Nota breve (bajo el botón de versión)</label>
            <input id="ma-desc" type="text" placeholder="ej: Fix de llamadas y mejoras de rendimiento.">
          </div>
          <div class="ma-fld">
            <label>URL de descarga</label>
            <input id="ma-url" type="text" placeholder="https://github.com/.../releases/download/...">
          </div>

          <hr class="ma-hr">

          <div class="ma-fld">
            <label>¿Qué cambió? — la IA genera las patch notes</label>
            <textarea id="ma-what" placeholder="Ej: Se arregló el crash al abrir mensajes largos. Mejor velocidad de carga un 40%. Soporte para modo oscuro en Android."></textarea>
          </div>
          <button class="ma-sec" id="ma-ai-btn" onclick="window.__ma.generate()">▶ GENERAR CON NVIDIA AI</button>
          <p class="ma-ai-st" id="ma-ai-st"></p>

          <div id="ma-notes-wrap" style="display:none; margin-top:10px">
            <div class="ma-fld">
              <label>Notas generadas <span style="color:#333">(podés editar el HTML directamente)</span></label>
              <textarea class="ma-notes-ta" id="ma-notes"></textarea>
            </div>
          </div>

          <hr class="ma-hr">
          <div class="ma-tog-w">
            <div id="ma-tog" class="ma-tog on" onclick="this.classList.toggle('on')"></div>
            <span style="color:#aaa; font-size:14px">Versión activa (visible en el sitio)</span>
          </div>

          <p class="ma-err" id="ma-form-err"></p>
          <button class="ma-pri" style="margin-top:18px" id="ma-submit" onclick="window.__ma.submit()">PUBLICAR VERSIÓN</button>
        </div>

        <div id="ma-s-ok" style="display:none">
          <div class="ma-ok-wrap">
            <div class="ma-ok-ico">✅</div>
            <h3>VERSIÓN PUBLICADA</h3>
            <p id="ma-ok-txt"></p>
          </div>
        </div>

      </div>
    </div>
  `);

  // Build project buttons
  PROJECTS.forEach(p => {
    const b = document.createElement('button');
    b.className = 'ma-proj';
    b.textContent = p.label;
    b.onclick = () => window.__ma.selProject(p.id);
    document.getElementById('ma-proj-btns').appendChild(b);
  });

  // ── LOGIC ─────────────────────────────────────────────────────────────────────
  const STEPS = ['ma-s-pass','ma-s-proj','ma-s-plat','ma-s-form','ma-s-ok'];

  window.__ma = {
    open() {
      document.getElementById('ma-ov').style.display = 'flex';
      document.getElementById('ma-pass-inp').value = '';
      document.getElementById('ma-pass-err').style.display = 'none';
      this.show('ma-s-pass');
      setTimeout(() => document.getElementById('ma-pass-inp').focus(), 80);
    },
    close() {
      document.getElementById('ma-ov').style.display = 'none';
      _proj = null; _plat = 'pc';
    },
    show(id) {
      STEPS.forEach(s => document.getElementById(s).style.display = s === id ? 'block' : 'none');
    },
    checkPass() {
      if (document.getElementById('ma-pass-inp').value === PASS) {
        document.getElementById('ma-pass-err').style.display = 'none';
        this.show('ma-s-proj');
      } else {
        document.getElementById('ma-pass-err').style.display = 'block';
        document.getElementById('ma-pass-inp').value = '';
        document.getElementById('ma-pass-inp').focus();
      }
    },
    selProject(id) {
      _proj = PROJECTS.find(p => p.id === id);
      if (_proj.hasAndroid) {
        document.getElementById('ma-plat-h').textContent = _proj.label.toUpperCase();
        this.show('ma-s-plat');
      } else {
        _plat = 'pc';
        this._openForm();
      }
    },
    selPlat(p) { _plat = p; this._openForm(); },
    formBack() {
      this.show(_proj && _proj.hasAndroid ? 'ma-s-plat' : 'ma-s-proj');
    },
    _openForm() {
      ['ma-ver','ma-tag','ma-desc','ma-url','ma-what','ma-notes'].forEach(id => {
        document.getElementById(id).value = '';
      });
      document.getElementById('ma-notes-wrap').style.display = 'none';
      document.getElementById('ma-ai-st').textContent = '';
      document.getElementById('ma-form-err').style.display = 'none';
      document.getElementById('ma-tog').classList.add('on');
      document.getElementById('ma-ai-btn').disabled = false;
      document.getElementById('ma-form-h').textContent = _proj.label.toUpperCase();
      document.getElementById('ma-form-sub').textContent = _plat === 'android' ? '📱 Android — APK' : '🖥️ PC — Windows';
      this.show('ma-s-form');
    },
    async generate() {
      const what = document.getElementById('ma-what').value.trim();
      if (!what) { document.getElementById('ma-ai-st').textContent = 'Escribí qué cambió primero.'; return; }
      const btn = document.getElementById('ma-ai-btn');
      const st  = document.getElementById('ma-ai-st');
      btn.disabled = true;
      st.textContent = '⏳ Generando con NVIDIA AI...';
      try {
        const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${NV_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'meta/llama-3.1-70b-instruct',
            messages: [
              {
                role: 'system',
                content: `Sos un redactor de patch notes para aplicaciones de software indie.
Dado lo que cambió en una nueva versión, devolvé ÚNICAMENTE de 2 a 4 elementos HTML <li> con este formato EXACTO:
<li><strong>ETIQUETA EN MAYÚSCULAS:</strong> Descripción breve del cambio en una oración.</li>

Reglas estrictas:
- Devolvé SOLO los <li>, nada más
- NO incluyas <ul>, <ol>, \`\`\`, markdown, ni ningún otro tag
- Las etiquetas entre <strong> van siempre en MAYÚSCULAS en español
- Las descripciones en minúsculas (primera letra en mayúscula)
- Sé conciso y técnico`
              },
              {
                role: 'user',
                content: `Proyecto: ${_proj.label} v${document.getElementById('ma-ver').value || '?'} — ${document.getElementById('ma-tag').value || ''}\nPlataforma: ${_plat === 'android' ? 'Android' : 'PC'}\n\nCambios: ${what}`
              }
            ],
            max_tokens: 500,
            temperature: 0.55,
          })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        let raw = (data.choices[0].message.content || '').trim();
        raw = raw.replace(/```[^`]*```/gs, '').replace(/```/g, '').trim();
        document.getElementById('ma-notes').value = raw;
        document.getElementById('ma-notes-wrap').style.display = 'block';
        st.textContent = '✅ Generado. Podés editar el HTML antes de publicar.';
      } catch(e) {
        st.textContent = `❌ Error al generar: ${e.message}`;
      } finally {
        btn.disabled = false;
      }
    },
    async submit() {
      const ver   = document.getElementById('ma-ver').value.trim();
      const tag   = document.getElementById('ma-tag').value.trim();
      const desc  = document.getElementById('ma-desc').value.trim();
      const url   = document.getElementById('ma-url').value.trim();
      const notes = document.getElementById('ma-notes').value.trim();
      const active = document.getElementById('ma-tog').classList.contains('on');
      const errEl = document.getElementById('ma-form-err');

      if (!ver || !tag || !url) {
        errEl.textContent = 'Completá al menos: versión, tag y URL de descarga.';
        errEl.style.display = 'block';
        return;
      }
      errEl.style.display = 'none';

      const btn = document.getElementById('ma-submit');
      btn.disabled = true;
      btn.textContent = 'PUBLICANDO...';

      try {
        const res = await fetch(`${SB_URL}/rest/v1/mggx_versions`, {
          method: 'POST',
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            project: _proj.id,
            platform: _plat,
            version: ver,
            title: tag,
            description: desc,
            patch_notes_html: notes,
            download_url: url,
            active,
          })
        });
        if (!res.ok) throw new Error(await res.text());
        document.getElementById('ma-ok-txt').textContent =
          `${_proj.label} ${_plat === 'android' ? '(Android)' : '(PC)'} v${ver} ya está visible en el sitio.`;
        this.show('ma-s-ok');
        setTimeout(() => {
          this.close();
          btn.disabled = false;
          btn.textContent = 'PUBLICAR VERSIÓN';
        }, 3500);
      } catch(e) {
        errEl.textContent = `Error al guardar: ${e.message}`;
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'PUBLICAR VERSIÓN';
      }
    }
  };

  document.getElementById('ma-ov').addEventListener('click', e => {
    if (e.target === document.getElementById('ma-ov')) window.__ma.close();
  });
})();
