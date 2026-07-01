// ============================================================
//  MGGX GAMES — Catálogo central de proyectos y versiones
//  Fuente única de verdad. El panel Admin agrega/edita/borra
//  sobre esta base usando un overlay en localStorage.
// ============================================================

export const PLATFORM_META = {
    pc:      { label: 'PC — Windows', icon: '🖥️', color: '#FFA500', colorRgb: '255, 165, 0' },
    android: { label: 'Android — APK', icon: '📱', color: '#3ddc84', colorRgb: '61, 220, 132' },
};

export const PROJECTS = [
    {
        id: 'gas-station',
        name: 'Gas Station Sim 3D',
        page: 'gas-station/',
        color: '#FFA500',
        platforms: ['pc'],
        versions: [
            {
                id: 'gs-1.2', platform: 'pc', version: '1.2',
                title: 'PERFORMANCE',
                note: 'Cargas instantáneas, iluminación realista y bugs corregidos.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/v1.2/Gas.Station.Simulator.3D.exe',
                date: 'Diciembre 2025', active: true, experimental: false,
                details: [
                    { t: 'CARGAS INSTANTÁNEAS', d: 'Sistema optimizado. El juego inicia en menos de 2 segundos.' },
                    { t: 'ILUMINACIÓN REALISTA', d: 'Reconstrucción total de luces (GPU Lightmapping) para eliminar manchas negras.' },
                    { t: 'FIXES', d: 'Solucionado el bug que impedía usar el botón "Salir" y mejoras en el menú de pausa.' },
                ],
            },
            {
                id: 'gs-1.1', platform: 'pc', version: '1.1',
                title: 'STABLE',
                note: 'Versión estable previa a la actualización de rendimiento.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/v1.1/Gas.Station.Simulator.3D.exe',
                date: 'Noviembre 2025', active: true, experimental: false,
                details: [],
            },
            {
                id: 'gs-1.0', platform: 'pc', version: '1.0',
                title: 'LEGACY',
                note: 'Primera versión pública del juego.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/v1.0/Gas.Station.Simulator.3D.exe',
                date: 'Octubre 2025', active: true, experimental: false,
                details: [],
            },
        ],
    },
    {
        id: 'autoclicker',
        name: 'MGGX Autoclicker',
        page: 'autoclicker/',
        color: '#FFA500',
        platforms: ['pc'],
        versions: [
            {
                id: 'ac-1.0.0', platform: 'pc', version: '1.0.0',
                title: 'UTILITY TOOL',
                note: 'Automatización ultra rápida: 0ms delay, bajo consumo de CPU y hotkeys.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/v1.0.0/Autoclicker.instaler.exe',
                date: 'Noviembre 2025', active: true, experimental: false,
                details: [
                    { t: '0MS DELAY', d: 'Clicks instantáneos sin retardo perceptible.' },
                    { t: 'LOW CPU', d: 'Optimizado para no interferir con tus juegos.' },
                    { t: 'HOTKEYS', d: 'Control total con atajos de teclado configurables.' },
                ],
            },
        ],
    },
    {
        id: 'craft-book',
        name: 'Craft Book PC',
        page: 'craft-book/',
        color: '#FFA500',
        platforms: ['pc'],
        versions: [
            {
                id: 'cb-1.1.0', platform: 'pc', version: '1.1.0',
                title: 'RECETAS EXPANDIDAS',
                note: 'Catálogo completo: Redstone, pociones, encantamientos y más.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/1.1.0/CraftBook_Desktop_Setup_v1.1.0.exe',
                date: 'Junio 2026', active: true, experimental: false,
                details: [
                    { t: 'CATÁLOGO EXPANDIDO', d: 'Cientos de crafteos nuevos. Mecánicas completas de Redstone, guías de pociones y encantamientos.' },
                    { t: 'BÚSQUEDA MÁS RÁPIDA', d: 'Motor de búsqueda optimizado para resultados instantáneos.' },
                    { t: 'FIXES', d: 'Corrección de bugs visuales de la versión Beta y mejoras de estabilidad.' },
                    { t: 'PREPARADO PARA EL FUTURO', d: 'Arquitectura interna mejorada para soporte de mods técnicos.' },
                ],
            },
            {
                id: 'cb-1.0.0', platform: 'pc', version: '1.0.0',
                title: 'BETA',
                note: 'Recetas esenciales. Catálogo en construcción.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/1.0.0/CraftBook_Desktop_Setup_v1.0.0.exe',
                date: 'Junio 2026', active: true, experimental: false,
                details: [
                    { t: 'BASE DE DATOS INICIAL', d: 'Recetas esenciales para sobrevivir: herramientas, armas, armaduras y bloques básicos.' },
                    { t: 'BUSCADOR RÁPIDO', d: 'Encontrá el crafteo que necesitás al instante.' },
                    { t: 'INTERFAZ DE ESCRITORIO', d: 'Diseño limpio y optimizado para pantallas grandes con soporte de mouse y teclado.' },
                ],
            },
        ],
    },
    {
        id: 'wtsapp',
        name: 'WtsApp PC',
        page: 'wtsapp/',
        color: '#FFA500',
        platforms: ['pc', 'android'],
        versions: [
            {
                id: 'wa-0.7.2', platform: 'pc', version: '0.7.2',
                title: 'GAMING MODE',
                note: 'Optimización extrema de rendimiento, React.memo en chats y modo gaming ultra-ligero.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/0.7.2/wtsapp-setup-v0.7.2.exe',
                date: 'Junio 2026', active: true, experimental: false,
                details: [
                    { t: 'RENDIMIENTO EXTREMO', d: 'Refactor del frontend para reducir repintados y mantener la app fluida mientras jugás en PC.' },
                    { t: 'CHATS MEMOIZADOS', d: 'MessageBubble y ConversationItem usan React.memo para dibujar solo los mensajes nuevos en conversaciones largas.' },
                    { t: 'GAMING MODE', d: 'Nuevo botón arriba de la lista de chats para apagar sombras, animaciones y blur con la clase .gaming-mode.' },
                    { t: 'TIPOGRAFÍA INTER', d: 'Ajuste visual compartido con Android para una interfaz más clara y liviana.' },
                ],
            },
            {
                id: 'wa-0.7.2a', platform: 'android', version: '0.7.2a',
                title: 'GAMING MODE',
                note: 'Optimización de rendimiento compartida, chats memoizados y Gaming Mode ultra-ligero.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/0.7.2a/wtsapp-v0.7.2a-signed.apk',
                date: 'Junio 2026', active: true, experimental: false,
                details: [
                    { t: 'OPTIMIZACIÓN COMPARTIDA', d: 'La versión Android recibe el mismo refactor de rendimiento del frontend para evitar caídas de FPS.' },
                    { t: 'CHATS MÁS LIVIANOS', d: 'React.memo protege los componentes de mensajes y conversaciones para evitar renderizados innecesarios.' },
                    { t: 'GAMING MODE', d: 'Modo ultra-ligero disponible desde la lista de chats para reducir carga visual y uso de GPU.' },
                    { t: 'VERSIÓN 0.7.2', d: 'Paquetes actualizados para mantener PC y Android alineados.' },
                ],
            },
            {
                id: 'wa-0.7.1a', platform: 'android', version: '0.7.1a',
                title: 'HOTFIX PATCH',
                note: 'Fix de auto log-out tras llamadas, stuttering al volver a chats y modo oscuro estable.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/0.7.1a/wtsapp-v0.7.1a-signed.apk',
                date: 'Junio 2026', active: true, experimental: false,
                details: [
                    { t: 'FIX DE AUTO LOG-OUT', d: 'Eliminado el bug que cerraba la sesión automáticamente al terminar una llamada de voz o video. Tu sesión se mantiene iniciada pase lo que pase.' },
                    { t: 'LLAMADAS Y CHATS', d: 'Optimizada la sincronización con Supabase al colgar, evitando stuttering al volver a la lista de conversaciones.' },
                    { t: 'MODO OSCURO/CLARO ESTABLE', d: 'Ajustados contrastes y transiciones de color en pantallas nativas para un cambio de interfaz completamente limpio.' },
                ],
            },
            {
                id: 'wa-0.7.1', platform: 'pc', version: '0.7.1',
                title: 'HOTFIX PATCH',
                note: 'Modo oscuro pulido, borrado de chats instantáneo y fix de cuelgues con textos largos.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/0.7.1/wtsapp-setup-v0.7.1.exe',
                date: 'Junio 2026', active: true, experimental: false,
                details: [
                    { t: 'MODO OSCURO PULIDO', d: 'Corregidos errores visuales donde algunos elementos no cambiaban de color correctamente al alternar los modos.' },
                    { t: 'BORRADO DE CHATS', d: 'Reparado el sistema de eliminación definitiva — al tocar la papelera roja, la conversación desaparece al instante sin residuos visuales.' },
                    { t: 'FIX DE CUELGUES', d: 'Solucionados pequeños cuelgues internos al procesar textos largos en segundo plano.' },
                ],
            },
            {
                id: 'wa-0.7.0a', platform: 'android', version: '0.7.0a',
                title: 'DARK MODE UPDATE',
                note: 'Modo oscuro, borrar chats, menú de mensajes. Sesión persistente y fix de llamadas.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/0.7.0a/wtsapp-v0.7.0a-signed.apk',
                date: 'Junio 2026', active: true, experimental: false,
                details: [
                    { t: 'SESIÓN PERSISTENTE', d: 'Al cerrar y reabrir la app, tu sesión sigue iniciada. No más usuario y contraseña cada vez.' },
                    { t: 'FIX DE LLAMADAS', d: 'Al cortar una llamada ya no te quedás atascado en esa pantalla — volvés automáticamente a la lista de chats.' },
                    { t: 'MODO OSCURO/CLARO', d: 'Switch en el panel de Perfil para cambiar la apariencia completa de la app.' },
                    { t: 'BORRAR CHATS', d: 'Botón rojo de papelera arriba a la derecha para eliminar una conversación entera.' },
                    { t: 'MENÚ DE MENSAJES', d: 'Cada mensaje tiene "tres puntitos" para editar o borrar al toque.' },
                ],
            },
            {
                id: 'wa-0.7.0', platform: 'pc', version: '0.7.0',
                title: 'DARK MODE UPDATE',
                note: 'Modo oscuro/claro, borrar chats y menú de mensajes (editar/borrar).',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/0.7.0/wtsapp-setup-v0.7.0.exe',
                date: 'Junio 2026', active: true, experimental: false,
                details: [
                    { t: 'MODO OSCURO/CLARO', d: 'Interruptor en tu panel de Perfil para cambiar los colores de toda la interfaz al instante.' },
                    { t: 'BORRAR CHATS', d: 'Botón de papelera roja arriba a la derecha en cada chat para eliminar la conversación completa.' },
                    { t: 'MENÚ DE MENSAJES', d: '"Tres puntitos" en cada mensaje enviado para desplegar las opciones de Editar o Borrar.' },
                ],
            },
            {
                id: 'wa-0.6.1a', platform: 'android', version: '0.6.1a',
                title: 'NATIVE PERMISSIONS',
                note: 'Permisos nativos Android y guías para móvil.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/0.6.1a/wtsapp-v0.6.1a-signed.apk',
                date: 'Junio 2026', active: true, experimental: false,
                details: [
                    { t: 'PERMISOS NATIVOS ANDROID', d: 'Al usar el micrófono o la cámara por primera vez, el sistema te pide permiso con los carteles estándar de Android.' },
                    { t: 'GUÍAS PARA MÓVIL', d: 'Si bloqueás un permiso por error, las instrucciones ahora te llevan por los menús de configuración de tu celular (no de Windows).' },
                    { t: 'UX MEJORADA', d: 'Interacciones más fluidas y coherentes con lo esperado de una app móvil.' },
                ],
            },
            {
                id: 'wa-0.6.0a', platform: 'android', version: '0.6.0a',
                title: 'EXPERIMENTAL',
                note: '⚠️ Primera versión para Android. No recomendada — puede tener bugs.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/0.6.0a/wtsapp-v8-signed.apk',
                date: 'Junio 2026', active: true, experimental: true,
                details: [
                    { t: 'COMPATIBILIDAD TOTAL', d: 'Tus chats de PC y Android están sincronizados en tiempo real.' },
                    { t: 'APP NATIVA PARA CELULAR', d: 'Interfaz adaptada para pantallas táctiles, fluida y rápida.' },
                    { t: 'BAJO CONSUMO', d: 'Mínimo gasto de batería, datos y memoria en celular.' },
                ],
            },
            {
                id: 'wa-0.6.0', platform: 'pc', version: '0.6.0',
                title: 'CROSS-PLATFORM',
                note: 'Compatibilidad Android ↔ PC, menú hamburguesa y optimización general.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/0.6.0/v0.6.0.exe',
                date: 'Junio 2026', active: true, experimental: false,
                details: [
                    { t: 'COMPATIBILIDAD ANDROID ↔ PC', d: 'Continuá tus conversaciones en cualquier dispositivo sin fricción.' },
                    { t: 'MENÚ HAMBURGUESA', d: 'Nueva navegación lateral más intuitiva y accesible.' },
                    { t: 'ULTRA OPTIMIZACIÓN', d: 'Refactorización del código para mayor velocidad en modo multiplataforma.' },
                ],
            },
            {
                id: 'wa-0.5.1', platform: 'pc', version: '0.5.1',
                title: 'AUTO-UPDATER PATCH',
                note: 'Fix del sistema de llamadas y auto-actualización integrada.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/0.5.1/v8.exe',
                date: 'Junio 2026', active: true, experimental: false,
                details: [
                    { t: 'FIX DE LLAMADAS', d: 'Eliminados los bugs de conexión y cuelgues inesperados en llamadas de voz y video.' },
                    { t: 'AUTO-UPDATE', d: 'Sistema de actualización automática integrado — la app se mantiene al día sola.' },
                ],
            },
            {
                id: 'wa-0.5.0', platform: 'pc', version: '0.5.0',
                title: 'MESSAGES UPDATE',
                note: 'Copiar y editar mensajes.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/0.5.0/wtsapp-0.5.0-setup.exe',
                date: 'Junio 2026', active: true, experimental: false,
                details: [
                    { t: 'COPIAR MENSAJES', d: 'Seleccioná y copiá cualquier mensaje con un clic.' },
                    { t: 'EDITAR MENSAJES', d: 'Corregí errores de tipeo al instante, sin borrar y reenviar.' },
                ],
            },
            {
                id: 'wa-0.4.1', platform: 'pc', version: '0.4.1',
                title: 'PERFORMANCE PATCH',
                note: 'Reducción de RAM, fix de scroll con imágenes y mejor estabilidad Supabase.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/0.4.1/wtsapp-0.4.1-setup.exe',
                date: 'Junio 2026', active: true, experimental: false,
                details: [
                    { t: 'USO DE RAM', d: 'Reducción drástica del consumo de memoria en segundo plano.' },
                    { t: 'CARGA DE IMÁGENES', d: 'Arreglado el stuttering al scrollear rápido en chats con muchas fotos.' },
                    { t: 'ESTABILIDAD', d: 'Mejoras en la conexión de Supabase para evitar desconexiones.' },
                ],
            },
            {
                id: 'wa-0.4.0', platform: 'pc', version: '0.4.0',
                title: 'THE CALLS UPDATE',
                note: 'Llamadas de voz y videollamadas integradas.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/0.4.0/wtsapp-0.4.0-setup.exe',
                date: 'Junio 2026', active: true, experimental: false,
                details: [
                    { t: 'LLAMADAS DE AUDIO', d: 'Comunicación por voz de alta calidad con bajo consumo de ancho de banda.' },
                    { t: 'VIDEOLLAMADAS', d: 'Video en tiempo real optimizado para no saturar el procesador.' },
                    { t: 'INTEGRACIÓN COMPLETA', d: 'Pasá de chat a llamada sin cortes ni reinicios.' },
                ],
            },
            {
                id: 'wa-0.3.0', platform: 'pc', version: '0.3.0',
                title: 'SOCIAL UPDATE',
                note: 'Nuevo sistema para agregar contactos y panel renovado.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/0.3.0/wtsapp-0.3.0-setup.exe',
                date: 'Junio 2026', active: true, experimental: false,
                details: [
                    { t: 'AGREGAR PERSONAS', d: 'Nuevo sistema súper fácil para añadir contactos con un par de clics.' },
                    { t: 'LISTA DE CONTACTOS', d: 'Interfaz renovada, más limpia y fluida.' },
                    { t: 'RENDIMIENTO', d: 'Mejoras en las consultas a la base de datos de Supabase.' },
                ],
            },
            {
                id: 'wa-0.2.0', platform: 'pc', version: '0.2.0',
                title: 'MEDIA UPDATE',
                note: 'Soporte de imágenes y notas de voz.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/0.2.0/wtsapp-0.2.0-setup.exe',
                date: 'Junio 2026', active: true, experimental: false,
                details: [
                    { t: 'IMÁGENES', d: 'Soporte para enviar y recibir fotos al instante.' },
                    { t: 'NOTAS DE VOZ', d: 'Integración del sistema de audios nativo.' },
                    { t: 'OPTIMIZACIÓN UI', d: 'Mejoras en la carga del historial de chat para no saturar la memoria.' },
                ],
            },
            {
                id: 'wa-0.1.0', platform: 'pc', version: '0.1.0',
                title: 'ALPHA CORE',
                note: 'Primera versión. Chat de texto básico.',
                url: 'https://github.com/maxgab201/Gas-Station-Simulator-3D/releases/download/0.1.0/wtsapp-0.1.0-setup.exe',
                date: 'Junio 2026', active: true, experimental: false,
                details: [
                    { t: 'REGISTRO EXPRESS', d: 'Creación de cuenta súper fácil y sin vueltas.' },
                    { t: 'CHAT EN TIEMPO REAL', d: 'Mensajería de texto instantánea.' },
                    { t: 'POWERED BY SUPABASE', d: 'Backend moderno para garantizar latencia mínima.' },
                ],
            },
        ],
    },
];
