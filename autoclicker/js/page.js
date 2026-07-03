// ============================================================
//  Autoclicker — lógica de página (modales de descarga/donación).
//  Archivo externo a propósito: la CSP de producción
//  (script-src 'self', sin 'unsafe-inline') bloquea los <script>
//  embebidos en el HTML — inline, estas funciones jamás existían
//  en el sitio publicado. js/motion.js despacha los data-page-act
//  buscándolas por nombre en window, por eso son declaraciones
//  globales clásicas (no módulo).
// ============================================================

var _downloadUrl = "https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/v1.0.0/Autoclicker.instaler.exe";

function abrirAdvertencia() {
    document.getElementById("warningModal").style.display = "flex";
}

function cerrarTodo() {
    document.getElementById("warningModal").style.display = "none";
    document.getElementById("donationModal").style.display = "none";
}

function descargarAhora() {
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
    window.location.href = _downloadUrl;
    cerrarTodo();
}

window.onclick = function(event) {
    if (event.target == document.getElementById("warningModal")) cerrarTodo();
    if (event.target == document.getElementById("donationModal")) cerrarTodo();
}
