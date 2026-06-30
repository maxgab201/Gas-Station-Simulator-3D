(function () {
  var cfg = window.MGGX_LOADER;
  if (!cfg) return;

  var SB_URL = 'https://ixbhyqoadriuvlcgkgcb.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Ymh5cW9hZHJpdXZsY2drZ2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODA2MDEsImV4cCI6MjA5NzU1NjYwMX0.-aPNvSgyDQ2L_yPFicakyKRJZSez-vYvlXLi2sTYQYY';

  // Inject .version-note CSS (gas-station and autoclicker don't have it)
  var sEl = document.createElement('style');
  sEl.textContent = '.version-note{font-size:11px;color:#888;display:block;margin-top:4px;font-weight:normal}';
  document.head.appendChild(sEl);

  function fmtDate(iso) {
    var d = new Date(iso);
    var mo = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto',
               'Septiembre','Octubre','Noviembre','Diciembre'];
    return mo[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  }

  function clr(title, isFirst, platform) {
    if (isFirst) {
      var c = platform === 'android' ? '#3ddc84' : '#FFA500';
      return { border: c, bg: c, fg: 'black' };
    }
    var u = (title || '').toUpperCase();
    if (u.indexOf('EXPERIMENTAL') >= 0 || u.indexOf('ALPHA') >= 0) {
      return { border: '#e74c3c', bg: '#e74c3c', fg: 'white' };
    }
    if (u.indexOf('BETA') >= 0) {
      return { border: '#444', bg: '#888', fg: 'black' };
    }
    return { border: '#444', bg: '#444', fg: 'white' };
  }

  function verBtn(row, isFirst, platform) {
    var c = clr(row.title, isFirst, platform);
    var lbl = row.title + (isFirst ? ' (NUEVA)' : '');
    var url = (row.download_url || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    var note = row.description
      ? '<span class="version-note">' + row.description + '</span>'
      : '';
    return '<a href="javascript:void(0)" onclick="iniciarDescarga(\'' + url + '\')"'
         + ' class="version-btn" style="border-color:' + c.border + ';text-align:left;">'
         + 'VERSIÓN ' + row.version
         + ' <span class="version-tag" style="background:' + c.bg + ';color:' + c.fg + ';">' + lbl + '</span>'
         + note
         + '</a>';
  }

  function patchBox(row) {
    var isAndroid = row.platform === 'android';
    var bl  = isAndroid ? '#3ddc84' : '#FFA500';
    var tbg = isAndroid ? '#3ddc84' : '#FFA500';
    var notes = row.patch_notes_html
      ? '<ul class="patch-list">' + row.patch_notes_html + '</ul>'
      : '';
    var desc = row.description
      ? '<p style="color:#888;font-size:13px;margin:8px 0 0;">' + row.description + '</p>'
      : '';
    return '<div class="patch-box" style="border-left-color:' + bl + '">'
         + '<div class="patch-header">'
         + '<span class="patch-title">v' + row.version
         + ' <span class="patch-tag" style="background:' + tbg + ';color:black;">' + row.title + '</span>'
         + '</span>'
         + '<span class="patch-date">' + fmtDate(row.created_at) + '</span>'
         + '</div>'
         + notes + desc
         + '</div>';
  }

  function sbFetch(qs) {
    return fetch(SB_URL + '/rest/v1/mggx_versions?' + qs, {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
    }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
  }

  function injectModal(rows, modalId, platform) {
    if (!rows.length) return;
    var modal = document.getElementById(modalId);
    if (!modal) return;
    var first = modal.querySelector('.version-btn');
    if (!first) return;
    var html = rows.map(function (r, i) { return verBtn(r, i === 0, platform); }).join('');
    first.insertAdjacentHTML('beforebegin', html);
  }

  function injectPatch(rows) {
    if (!rows.length) return;
    var info = document.getElementById('info');
    if (!info) return;
    var first = info.querySelector('.patch-box');
    if (!first) return;
    var html = rows.map(function (r) { return patchBox(r); }).join('');
    first.insertAdjacentHTML('beforebegin', html);
  }

  function setupAutoclicker(rows) {
    // Inject .version-btn and .version-tag CSS (autoclicker page lacks them)
    var s2 = document.createElement('style');
    s2.textContent = [
      '.version-btn{display:block;width:100%;padding:15px;margin:10px 0;background:#222;',
        'color:white;border:1px solid #444;text-decoration:none;font-weight:bold;',
        'transition:.3s;box-sizing:border-box;text-align:left;cursor:pointer}',
      '.version-btn:hover{background:#FFA500;color:black;border-color:#FFA500}',
      '.version-tag{font-size:10px;padding:2px 5px;border-radius:3px;margin-left:10px;text-transform:uppercase}',
    ].join('');
    document.head.appendChild(s2);

    // Build version list HTML
    var listHtml = rows.map(function (r, i) { return verBtn(r, i === 0, 'pc'); }).join('');

    // Create the version selection modal
    var modal = document.createElement('div');
    modal.id = 'acVersionModal';
    modal.className = 'modal';
    modal.style.display = 'none';
    modal.innerHTML =
      '<div class="modal-content" style="border:1px solid #333;box-shadow:0 0 20px rgba(0,0,0,.5);text-align:left;">'
      + '<span onclick="cerrarTodo()" style="position:absolute;top:10px;right:18px;'
      +   'font-size:28px;color:#555;cursor:pointer;line-height:1;">&times;</span>'
      + '<h2 style="margin-top:0;font-family:\'Anton\',sans-serif;color:white;letter-spacing:1px;">ELEGÍ TU VERSIÓN</h2>'
      + '<p style="color:#777;font-size:13px;margin-bottom:16px;text-transform:uppercase;letter-spacing:1px;">DESDE GITHUB</p>'
      + listHtml
      + '</div>';
    document.body.appendChild(modal);

    // Close on overlay click
    modal.addEventListener('click', function (e) {
      if (e.target === modal) window.cerrarTodo();
    });

    // Patch cerrarTodo to also hide this modal
    var origCerrar = window.cerrarTodo;
    window.cerrarTodo = function () {
      origCerrar();
      modal.style.display = 'none';
    };

    // Add iniciarDescarga (autoclicker originally doesn't have it)
    window.iniciarDescarga = function (url) {
      window._downloadUrl = url;
      window.cerrarTodo();
      document.getElementById('donationModal').style.display = 'flex';
    };

    // Override descargarAhora to show version selector instead of going straight to donation
    window.descargarAhora = function () {
      document.getElementById('warningModal').style.display = 'none';
      document.getElementById('acVersionModal').style.display = 'flex';
    };
  }

  function run() {
    var project  = cfg.project;
    var platforms = cfg.platforms || ['pc'];

    if (project === 'autoclicker') {
      sbFetch('project=eq.autoclicker&platform=eq.pc&active=eq.true&order=created_at.desc')
        .then(function (rows) { if (rows.length) setupAutoclicker(rows); });
      return;
    }

    // Fetch each platform for modal injection, collect all for patch notes
    Promise.all(platforms.map(function (p) {
      var modalId = p === 'android' ? 'downloadAndroidModal' : 'downloadModal';
      return sbFetch('project=eq.' + project + '&platform=eq.' + p + '&active=eq.true&order=created_at.desc')
        .then(function (rows) {
          injectModal(rows, modalId, p);
          return rows; // rows already have `platform` field from the DB column
        });
    })).then(function (byPlat) {
      var all = [].concat.apply([], byPlat)
        .sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      injectPatch(all);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
