// ============================================================
//  Gas Station — lógica de página (modales de descarga/donación).
//  Archivo externo a propósito: la CSP de producción
//  (script-src 'self', sin 'unsafe-inline') bloquea los <script>
//  embebidos en el HTML, así que estas funciones definidas inline
//  jamás existían en el sitio publicado y todos los botones de
//  descarga quedaban muertos. js/motion.js despacha los
//  data-page-act buscando estas funciones por nombre en window,
//  por eso deben ser declaraciones globales clásicas (no módulo).
// ============================================================

var _pendingDownloadUrl = null;

function abrirAdvertencia() { document.getElementById("warningModal").style.display = "flex"; }
function pasarAVersiones() {
    document.getElementById("warningModal").style.display = "none";
    document.getElementById("downloadModal").style.display = "flex";
}

function iniciarDescarga(url) {
    _pendingDownloadUrl = url;
    cerrarTodo();
    document.getElementById("donationModal").style.display = "flex";
}

function donarYDescargar() {
    window.open("https://ko-fi.com/mggxgames", "_blank");
    ejecutarDescarga();
}

function descargarSinDonar() {
    ejecutarDescarga();
}

function ejecutarDescarga() {
    if (_pendingDownloadUrl) {
        window.location.href = _pendingDownloadUrl;
        _pendingDownloadUrl = null;
    }
    cerrarTodo();
}

function cerrarTodo() {
    document.getElementById("warningModal").style.display = "none";
    document.getElementById("downloadModal").style.display = "none";
    document.getElementById("donationModal").style.display = "none";
}
window.onclick = function(event) {
    if (event.target == document.getElementById("warningModal")) cerrarTodo();
    if (event.target == document.getElementById("downloadModal")) cerrarTodo();
    if (event.target == document.getElementById("donationModal")) cerrarTodo();
}
