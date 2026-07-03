# Documentación de Arquitectura — MGGX Games

**Última reescritura mayor:** rediseño integral frontend 3D + hardening de seguridad del backend.
**Alcance de este documento:** estructura de carpetas, funcionamiento técnico de la integración 3D, arquitectura de seguridad, y el propósito general de estas decisiones. Está escrito para que cualquiera (incluida una futura sesión de IA) pueda retomar el proyecto sin arqueología de código.

---

## 1. Qué es este proyecto

MGGX Games es el sitio oficial de un estudio indie de un solo desarrollador (Maximo). Es un **sitio estático** (HTML/CSS/JS sin build step, sin framework) desplegado en **Vercel**, con un puñado de **funciones serverless** (`/api/*`) que le dan un backend real a un panel de administración embebido. No hay base de datos: el catálogo de versiones de cada producto vive en un archivo JSON versionado en el propio repositorio de GitHub, y las funciones serverless lo leen/escriben a través de la API de GitHub.

Los cuatro productos que vende/promociona el sitio:

| Proyecto | Carpeta | Plataformas |
|---|---|---|
| Gas Station Sim 3D | `gas-station/` | PC |
| WtsApp PC | `wtsapp/` | PC y Android |
| Craft Book PC | `craft-book/` | PC |
| MGGX Autoclicker | `autoclicker/` | PC |

---

## 2. Estructura de carpetas

```
/
├── index.html                  Home del estudio (hero 3D + catálogo de proyectos)
├── vercel.json                 Cabeceras de seguridad (CSP, HSTS, etc.) — ver sección 4
├── package.json                Metadata mínima (type: module, sin dependencias de build)
├── ads.txt                     Verificación de Google AdSense
│
├── gas-station/                Producto: Gas Station Sim 3D
│   ├── index.html
│   ├── js/three-scene.js       Escena 3D específica: surtidor procedural interactivo
│   └── *.jpg                   Capturas de pantalla / fondo del hero
│
├── wtsapp/                     Producto: WtsApp PC — index.html + assets
├── craft-book/                 Producto: Craft Book PC — index.html + assets
├── autoclicker/                Producto: MGGX Autoclicker — index.html + assets
├── terminos/                   Términos y condiciones (página estática, sin 3D)
│
├── css/
│   └── site.css                Capa visual compartida: tokens, motion, panel Admin,
│                                microinteracciones, tilt 3D, responsive
│
├── js/
│   ├── 3d/                     Motor 3D procedural — ver sección 3
│   │   ├── scene-runtime.js    Runtime genérico: renderer, loop, pausa, resize
│   │   ├── geo-builders.js     Constructores de geometría (surtidor, auto, orbe, íconos)
│   │   └── hero-scene.js       Composición reutilizable "partículas + ícono flotante"
│   ├── motion.js                Reveal on scroll, toasts, delegación de clicks (data-page-act),
│   │                             tilt 3D de cards, accesibilidad por teclado
│   ├── admin.js                 Panel Admin: wizard completo (login → proyecto → plataforma
│   │                             → alta/edición/baja de versiones → IA)
│   ├── version-store.js         Cliente: trae el catálogo de /api/versions, cachea en memoria,
│   │                             expone getters síncronos + mutaciones async
│   ├── render-versions.js       Dibuja listas de descarga y patch notes desde version-store
│   └── nim.js                   Cliente delgado de /api/generate (generación con IA)
│
├── api/                        Funciones serverless de Vercel — ver sección 4
│   ├── _lib.js                  Helpers compartidos: tokens, rate limiting, catálogo, errores
│   ├── login.js                 POST — valida contraseña, emite token de sesión
│   ├── versions.js              GET/POST — lee y muta el catálogo de versiones
│   └── generate.js              POST — genera título/descripción/patch notes con IA
│
├── vendor/
│   └── three/                   Three.js vendorizado localmente (ver sección 3.1)
│       ├── three.module.min.js
│       └── LICENSE
│
└── data/
    └── versions.json            Catálogo de versiones — fuente de verdad, commiteado a GitHub
```

Se eliminaron de esta reescritura: `gas-station/models/*.glb` (un casco de prueba sin relación temática y un archivo de 0 bytes que nunca funcionó — ver sección 3.2), `js/particles.js` y `js/hero-particles.js` (reemplazados por `js/3d/hero-scene.js`).

---

## 3. Integración 3D

### 3.1. Por qué geometría procedural y no modelos `.glb`

Antes de esta reescritura, `gas-station/js/three-scene.js` cargaba `DamagedHelmet.glb` — el modelo de muestra estándar que usa el propio equipo de Three.js/Khronos para demos, sin ninguna relación con una estación de servicio — con un cubo verde como *fallback* si la carga fallaba. Había también un `gas_pump.glb` de **0 bytes**: un placeholder que nunca se llegó a generar. En la práctica, la escena "3D" del juego insignia del estudio mostraba un casco genérico.

Este entorno no tiene Blender ni ningún editor de modelado 3D disponible. La alternativa que se usó — explícitamente habilitada por el pedido original — es **modelar en código**: cada objeto 3D del sitio (el surtidor de nafta, los autos, el orbe de la home, los íconos de cada producto) se arma combinando primitivas de Three.js (`BoxGeometry`, `CylinderGeometry`, `ConeGeometry`, `IcosahedronGeometry`, `TubeGeometry` sobre una curva Catmull-Rom para la manguera, `ExtrudeGeometry` con un `Shape` 2D para el rayo del Autoclicker) en un `THREE.Group`, con materiales `MeshStandardMaterial` cacheados por color.

Ventajas reales de este enfoque frente a cargar `.glb`:

- **Cero binarios que versionar.** Todo el "modelo" es código legible y diffeable en Git.
- **Editable por parámetros.** Cambiar el color de acento del surtidor es cambiar un argumento (`buildGasPump({ accent: 0xffa500 })`), no reexportar un archivo desde un editor externo.
- **Tamaño mínimo.** No hay descarga de malla — el "modelo" pesa lo mismo que el JavaScript que lo describe (unos pocos KB).
- **Sin dependencia de herramientas externas.** No hace falta Blender, ni un pipeline de exportación, para tocar la geometría.

La contrapartida honesta: la fidelidad visual de geometría procedural con primitivas es menor a la de un modelo esculpido por un artista 3D. El estilo resultante es deliberadamente low-poly/geométrico, consistente con la estética general del sitio (tipografía Anton, paleta naranja/negro, bordes duros).

**Three.js vendorizado localmente** (`vendor/three/three.module.min.js`, build r160 minificado, MIT license incluida en `vendor/three/LICENSE`): antes se importaba desde `unpkg.com` vía CDN. Se descargó y se sirve ahora desde el propio dominio por dos razones:
1. **Seguridad** — elimina una dependencia de un tercero en `script-src` del CSP (ver sección 4.2) y el riesgo de *supply-chain* si ese CDN fuera comprometido.
2. **Resiliencia** — el sitio no depende de que `unpkg.com` esté arriba.

### 3.2. `js/3d/geo-builders.js` — los "modelos"

Expone funciones puras que devuelven un `THREE.Group` armado:

- `buildGasPump({ accent })` — surtidor completo: base, cuerpo, franja de acento emisiva, pantalla de precio, panel de 4 botones, gancho, manguera (tubo sobre curva), y una pistola/nozzle como sub-`Group` separado (`userData.nozzle`) para poder animarla independientemente — incluye un `nozzle-trigger` nombrado que se anima al hacer click (ver 3.3).
- `buildCar({ color })` — auto low-poly: chasis, cabina (vidrio oscuro), 4 ruedas, faro emisivo.
- `buildOrb({ color, detail })` — icosaedro *flat-shaded* + una segunda capa wireframe más grande — el elemento central de la home.
- `buildChatBubble`, `buildBook`, `buildLightningBolt` — íconos flotantes de identidad por producto (WtsApp, Craft Book, Autoclicker respectivamente).
- `buildFloatingParticles({ count, radius, color })` — nube de puntos distribuida en una esfera, usada como partículas de "combustible" ambientales en Gas Station.

### 3.3. `js/3d/scene-runtime.js` — el motor compartido

Centraliza todo lo que **no** es específico de una escena particular:

- **Renderer**: `WebGLRenderer` con `powerPreference: 'low-power'` y `devicePixelRatio` capado a 2 (evita quemar batería/GPU en pantallas de alta densidad sin ganancia visual perceptible). `shadowMap` desactivado a propósito: se prioriza mantener 60 FPS en hardware modesto antes que sombras dinámicas.
- **Resize**: `ResizeObserver` sobre el canvas (más preciso que escuchar `window.resize`, reacciona también a cambios de layout que no vienen de redimensionar la ventana).
- **Pausa automática**: un `IntersectionObserver` detiene el loop de render cuando el canvas sale de la pantalla (scroll), y la Page Visibility API (`document.hidden`) lo pausa cuando la pestaña pasa a segundo plano. Al volver, se retoma exactamente donde quedó (el `delta` del reloj se cappea a 100ms para no generar saltos bruscos tras una pausa larga).
- **`prefers-reduced-motion`**: si el usuario lo tiene activado, se dibuja **un único frame estático** y el loop nunca se reanuda — se respeta la preferencia de accesibilidad sin dejar el canvas completamente vacío.
- **Parallax de puntero**: cada escena recibe `ctx.pointer.{x,y}` suavizado (interpolación exponencial), listo para usar en `onFrame` sin que cada escena tenga que reimplementar el tracking de mouse/touch.

### 3.4. `js/3d/hero-scene.js` — partículas + ícono, reutilizable

Reemplaza lo que antes eran dos archivos casi idénticos (`particles.js` para la home, `hero-particles.js` para los productos). Una sola función, `initHeroScene(canvasId, opciones)`, con:

- Campo de partículas con física de repulsión por mouse (resorte hacia la posición original + repulsión cuando el puntero se acerca) — el mismo comportamiento que ya tenía el sitio, ahora en 3D real (con profundidad en Z) y corriendo sobre el runtime compartido.
- Un ícono 3D flotante opcional (`iconBuilder`), con rotación continua, *bobbing* vertical (seno), reacción al puntero, y una animación de "pulso" al hacer click (raycasting contra una esfera invisible que envuelve el ícono).
- **`iconOffset`**: la posición base del ícono es configurable por página. En la home (layout centrado, una sola columna) el ícono va al centro. En las páginas de producto con layout de dos columnas (foto a la izquierda, texto a la derecha — WtsApp, Craft Book) el ícono se desplaza a la izquierda para no superponerse con el párrafo de descripción. En Autoclicker (layout de una sola columna con card centrada, sin hueco lateral) el ícono se ubica arriba del título y bien atrás en el eje Z, para leer como un detalle ambiental en vez de competir visualmente con el texto. Esto no es un detalle cosmético menor: en la primera iteración el ícono quedaba literalmente encima del texto en los tres productos, y se corrigió verificando visualmente cada página con capturas de pantalla reales antes de darlo por terminado.

### 3.5. La escena insignia: `gas-station/js/three-scene.js`

Reemplaza por completo la carga de `DamagedHelmet.glb`. Composición:

- Suelo con marcas de carril, surtidor (`buildGasPump`) posicionado sobre él, dos autos (`buildCar`) que cruzan el fondo de forma continua en direcciones opuestas y se reciclan al salir de cámara (con las ruedas rotando en función de la velocidad), una nube de partículas ambientales, niebla exponencial (`FogExp2`) para dar sensación de profundidad, e iluminación de tres puntos (direccional + dos point lights de relleno/contraluz).
- **Interacción real**: la pantalla de precio del surtidor parpadea como un display LED (seno + ruido aleatorio en `emissiveIntensity`); al pasar el mouse por la pistola, la franja de acento del surtidor se ilumina más (feedback de *hover*); **al hacer click en la pistola** se dispara una animación de "apriete" del gatillo y una ráfaga de partículas verdes que caen con gravedad simulada — una referencia visual directa a la mecánica económica que describe el propio juego ("Gana dinero por cada litro vendido").
- **Cámara con parallax + scroll**: la posición de la cámara sigue al puntero suavemente y también reacciona al scroll de la página (se aleja/gira levemente a medida que el usuario baja), calculado a partir de `window.scrollY`.

---

## 4. Arquitectura de seguridad

Antes de detallar cada medida: **ninguna arquitectura es "impenetrable"** en un sentido absoluto, y cualquier documentación que lo prometa sin matices no es seria. Lo que sigue es una descripción honesta de qué se implementó, por qué, y qué límites tiene cada capa — incluyendo las decisiones de **no** aplicar ciertas restricciones porque hubieran roto funcionalidad real del sitio (monetización por ads, tipografías) a cambio de un beneficio marginal.

### 4.1. Modelo de amenazas y por qué el diseño ya es CSRF-safe por construcción

El panel Admin **no usa cookies de sesión**. El token que emite `/api/login` viaja siempre en un header `Authorization: Bearer <token>` que el propio JavaScript del panel adjunta manualmente a cada request, y vive solo en memoria (una variable JS, nunca en `localStorage` ni en una cookie). Esto es relevante porque **CSRF clásico depende de que el navegador adjunte automáticamente una credencial ambiente** (una cookie) a una request iniciada por un sitio de terceros. Sin cookie de sesión, no hay nada que un sitio malicioso pueda hacer viajar automáticamente — un formulario o `fetch` disparado desde otro dominio no tiene forma de conocer ni adjuntar el token, que solo existe en la memoria de la pestaña donde el admin inició sesión.

Sobre esa base ya sólida se agregó una **capa adicional de defensa en profundidad**: `enforceSameOrigin()` en `api/_lib.js` rechaza con `403` cualquier `POST` a `/api/login`, `/api/versions` o `/api/generate` cuyo header `Origin` no coincida con el host del propio sitio (cuando el navegador lo informa — clientes sin `Origin`, como llamadas servidor-a-servidor, no se bloquean por esta capa). Se verificó con una prueba automatizada real (no simulada) que un `Origin` ajeno efectivamente recibe `403`.

### 4.2. Cabeceras HTTP — `vercel.json`

Se aplican a **todas** las rutas del sitio:

| Cabecera | Valor (resumen) | Qué evita |
|---|---|---|
| `Content-Security-Policy` | Ver detalle abajo | XSS, carga de recursos no autorizados, clickjacking |
| `X-Content-Type-Options` | `nosniff` | Que el navegador "adivine" un tipo MIME distinto al declarado |
| `X-Frame-Options` | `DENY` | Que el sitio se embeba en un `<iframe>` ajeno (clickjacking) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Fuga de URLs completas (con paths/query) a sitios de terceros |
| `Permissions-Policy` | Deniega cámara, micrófono, geolocalización, USB, pago, etc. | Que un script comprometido pida acceso a hardware/APIs sensibles que el sitio no usa |
| `Cross-Origin-Opener-Policy` | `same-origin` | Ataques de canal lateral vía `window.opener` entre pestañas |
| `Strict-Transport-Security` | `max-age` de 2 años + `includeSubDomains` + `preload` | Downgrade a HTTP (nota: el flag `preload` en la cabecera **no inscribe automáticamente** el dominio en la lista de precarga de los navegadores; eso requiere un trámite manual aparte en hstspreload.org) |

`/api/*` recibe además `Cache-Control: no-store` explícito a nivel de CDN (redundante a propósito con lo que ya hace `api/_lib.js` en cada respuesta — defensa en profundidad) y `X-Robots-Tag: noindex` (las respuestas de la API no tienen nada que hacer en un buscador). `/vendor/*` recibe cacheo agresivo de un año (`immutable`) porque es una librería vendorizada con nombre de archivo fijo — si algún día se actualiza la versión de Three.js, debe cambiarse el nombre del archivo para invalidar la caché.

**Detalle del CSP y sus concesiones deliberadas:**

- `script-src`: `'self'` + los dominios exactos que necesita el script de Google AdSense (`pagead2.googlesyndication.com` y los dominios de anuncios de Google que ese script carga dinámicamente). **`script-src-attr: 'none'`** — ningún atributo `onclick=""` puede ejecutar código, ni siquiera si un atacante lograra inyectar HTML. Esto es posible porque **se eliminaron los 42 atributos `onclick=""` que tenía el sitio** (ver sección 4.4) — sin esa limpieza previa, esta directiva hubiera roto todos los modales de descarga/donación del sitio el día uno.
- `style-src`: incluye `'unsafe-inline'`. Esta es una concesión **consciente y documentada**, no un descuido: el sitio tiene cientos de atributos `style="..."` inline y bloques `<style>` embebidos por página (heredados del diseño original), y una purga completa a clases CSS es un refactor de un orden de magnitud mayor al de este proyecto, con alto riesgo de romper visualmente algo. El riesgo real de `unsafe-inline` en `style-src` es mucho menor que en `script-src`: un atributo `style=""` inyectado puede, como mucho, alterar la apariencia visual (phishing de UI, por ejemplo superponer un elemento falso) pero **no puede ejecutar JavaScript arbitrario** — es la concesión estándar que hacen incluso sitios con CSP estrictos cuando migran una base de código existente en vez de reescribirla desde cero.
- `connect-src 'self'`: no hace falta permitir `api.github.com` ni `integrate.api.nvidia.com` porque **ambas integraciones corren 100% del lado del servidor** (dentro de las funciones de `/api/`) — el navegador nunca llama directamente a esos servicios, así que el CSP del cliente no necesita saber que existen.
- **Qué NO se activó, y por qué**: `Cross-Origin-Embedder-Policy: require-corp` se evaluó y se descartó a propósito. Esa cabecera exige que *todo* recurso de terceros declare explícitamente que permite ser embebido (vía `Cross-Origin-Resource-Policy`/CORS), y **Google AdSense y Google Fonts no garantizan eso de forma consistente** — activarla arriesgaba con romper silenciosamente la publicidad (una fuente de ingresos real del sitio) y la tipografía en todas las páginas. Se prefirió una protección real pero compatible antes que una teóricamente más fuerte que probablemente hubiera roto el sitio en producción. Por la misma razón no se implementó **Trusted Types**: hubiera requerido auditar y envolver cada uso de `innerHTML` en el código (`admin.js`, `render-versions.js`) con una política explícita, un trabajo real pero de mayor alcance que el de esta iteración — queda anotado como mejora recomendada a futuro.

### 4.3. Backend — `api/_lib.js` y cada función

**Tokens de sesión** (`createToken`/`verifyToken`): HMAC-SHA256 sobre un payload `{exp, v}`, comparación de firma con `crypto.timingSafeEqual` (inmune a ataques de timing), expiran a los 30 minutos. La clave de firma es `SESSION_SECRET` si está configurada, o se deriva de `ADMIN_PASSWORD` si no — así alcanza con configurar una sola variable de entorno para tener el panel funcionando de forma segura.

**Rate limiting** (`rateLimit`/`enforceRateLimit`): ventana deslizante en memoria, con límites distintos por endpoint según su costo/riesgo — `/api/login` (8 intentos / 5 min, el más estricto: es la puerta de entrada), `/api/versions` GET (120/min, generoso porque es de lectura pública), `/api/versions` POST (30/min) y `/api/generate` (10/min, el más ajustado porque cada llamada consume cuota real de NVIDIA NIM). **Limitación documentada sin rodeos**: las funciones serverless de Vercel no garantizan un proceso persistente entre invocaciones. En tráfico bajo/medio la misma instancia suele reutilizarse (y el límite funciona tal cual, verificado con una prueba automatizada real que dispara 429 tras exceder el umbral), pero bajo carga alta o tras inactividad puede arrancar una instancia nueva con el contador en cero. Esto **sí** frena bots simples y ataques de fuerza bruta no distribuidos, pero **no** es un rate limiter distribuido real — para eso hace falta un store compartido (Vercel KV / Upstash Redis) que este proyecto no tiene provisionado. Queda como mejora recomendada, no como algo que se simule tener.

**Errores genéricos al cliente** (`safeError`): toda excepción se loguea completa con `console.error` (visible solo en los logs de Vercel) y el cliente recibe siempre un mensaje fijo y seguro. Antes de esta reescritura, algunos errores devolvían texto crudo de la API de GitHub o de NVIDIA directamente al navegador — eso podía filtrar detalles internos (estructura del repo, límites de cuota, mensajes de error específicos de un proveedor) útiles para un atacante mapeando el backend.

**Validación estricta** (`api/versions.js`): `projectId`/`versionId` se validan contra un patrón `[a-z0-9._-]` antes de tocar el catálogo (nunca llegan sin validar a formar parte de una URL de la API de GitHub o de un mensaje de commit); `action` se valida contra un `Set` explícito de tres valores permitidos; la plataforma de cada versión debe pertenecer a la lista de plataformas del proyecto (si no, se rechaza en vez de sustituirla silenciosamente por un valor por defecto); las URLs de descarga se validan con `new URL()` exigiendo **solo `https:`** (antes se aceptaba también `http:`, y cualquier cosa que empezara con `http` pasaba una regex simple) — esto descarta categóricamente esquemas como `javascript:` o `data:` en el campo del link de descarga.

**Secreto histórico expuesto — acción pendiente del lado del usuario**: en una iteración anterior de este proyecto, una API key de NVIDIA quedó escrita directamente en un archivo del repositorio antes de migrar a variables de entorno. Aunque ya no está en el código actual, **sigue existiendo en el historial de Git**, que es público. Si todavía no se rotó esa key en build.nvidia.com, hacerlo es la acción de seguridad más urgente pendiente — ninguna cabecera HTTP ni validación de input compensa una credencial ya filtrada.

### 4.4. Eliminación de `onclick=""` inline — por qué fue necesario, no cosmético

El sitio tenía 42 atributos `onclick="funcion()"` repartidos en 6 páginas (modales de advertencia, cierre de modales, flujo de donación). Un CSP que permite `'unsafe-inline'` en `script-src` para que esos atributos sigan funcionando **anula gran parte de la protección contra XSS** que el CSP existe para dar: si un atacante lograra inyectar HTML en algún punto del sitio, un simple `<img src=x onerror="robarDatos()">` se ejecutaría igual.

Se reemplazaron los 42 atributos por un atributo de datos (`data-page-act="nombreDeFuncion"`) y un único listener delegado en `js/motion.js` (`wirePageActions`) que, al detectar un click sobre un elemento con ese atributo, llama a `window[nombreDeFuncion]()` — mismas funciones (`abrirAdvertencia`, `cerrarTodo`, `donarYDescargar`, etc.), mismo comportamiento exacto, cero atributos `onclick` en el HTML. Esto es lo que permite poner `script-src-attr: 'none'` en el CSP sin romper ni un solo modal del sitio — verificado end-to-end con pruebas automatizadas sobre las 6 páginas después del cambio.

De paso se agregó `wireA11yForActions()`: los elementos que no son nativamente interactivos (los `<span class="close">` que cierran los modales) reciben `role="button"` + `tabindex="0"`, y `wirePageActions` también escucha `Enter`/`Espacio` — antes esos botones de cierre solo eran operables con mouse/touch, ahora también con teclado.

También se reemplazó el único `href="javascript:void(0)"` que quedaba en el sitio (en los botones de descarga generados dinámicamente por `render-versions.js`) por un `<button type="button">` real con el mismo manejo de clicks por `addEventListener` que ya existía — limpieza menor, mismo espíritu.

---

## 5. Qué significa "mejora del 100%" en la práctica

Es una consigna deliberadamente ambiciosa y, tomada de forma literal, no cuantificable — no existe una métrica objetiva de "100% mejor". Lo que se hizo, de forma concreta y verificable:

1. **El juego insignia del estudio pasó de mostrar un casco de prueba genérico y roto a tener una escena 3D propia, temática e interactiva** (surtidor + autos + partículas + feedback de click), construida enteramente en código.
2. **Los otros tres productos y la home ganaron identidad visual 3D propia** (burbuja de chat, libro, rayo, orbe), en vez de un campo de partículas genérico compartido.
3. **El sitio pasó de tener cero cabeceras de seguridad a tener un CSP real, HSTS, y las cabeceras estándar de hardening**, con las concesiones necesarias documentadas explícitamente en vez de omitidas en silencio.
4. **El backend pasó de devolver errores con detalle interno y no tener ningún límite de tasa, a tener errores genéricos + rate limiting + validación estricta de cada input** en los tres endpoints.
5. **Se eliminó por completo la superficie de XSS vía atributos inline**, habilitando un CSP sin `unsafe-inline` para scripts.
6. Todo lo anterior se verificó con **pruebas automatizadas reales contra un backend real** (no mocks): las 6 páginas, el panel Admin completo, las tres interacciones 3D nuevas, y los dos mecanismos de seguridad nuevos (rechazo de origen ajeno, rate limiting) — 28 verificaciones, 0 fallas en la corrida final.

Lo que **no** se hizo, a propósito, y por qué queda anotado en vez de mencionado con la boca chica:

- Rate limiting real y distribuido (necesita Upstash Redis / Vercel KV — no provisionado).
- Purga completa de estilos inline para poder sacar `unsafe-inline` de `style-src` (refactor de alcance mucho mayor).
- Trusted Types (requiere auditar cada `innerHTML` del código con una política explícita).
- Rotación de la API key de NVIDIA expuesta en el historial de Git — **esta es la única pendiente que depende exclusivamente del usuario**, no del código.
