# Prompt: correcciones y mejoras — MGGX Games

> Este archivo está escrito en formato de prompt: pegalo tal cual a una sesión de IA (o usalo como checklist si lo hace un humano) para que ejecute las correcciones. Está armado después de leer `documentacion_arquitectura.md` y de revisar el código fuente real de cada página involucrada, así que cada punto ya incluye el archivo y la línea exactos donde intervenir — no hace falta redescubrirlos.

---

## Contexto para quien ejecute este prompt

Sos un desarrollador frontend trabajando sobre el sitio estático de MGGX Games (HTML/CSS/JS sin build step, Three.js vendorizado, motor 3D procedural propio en `js/3d/`). Los "modelos" 3D no son `.glb`, son geometría armada en código en `js/3d/geo-builders.js` (ver sección 3 de `documentacion_arquitectura.md` para el porqué). Antes de tocar nada, leé esa sección para entender el patrón (`stdMat`, `mesh()`, `THREE.Group`, `userData`) y mantené el mismo estilo.

Después de cada cambio, verificá visualmente en el navegador (no solo leyendo el diff) — varias de estas fallas son puramente visuales/runtime y no las detecta un linter.

---

## 1. Correcciones obligatorias (reportadas por el cliente)

### 1.1 El ícono 3D de WtsApp y Craft Book se sale de la pantalla por arriba

- **Archivos:** `wtsapp/js/hero-init.js` y `craft-book/js/hero-init.js`
- **Causa:** ambos llaman a `initHeroScene` con `iconOffset: { x: -4.9, y: 2.8, z: 0.2 }`. El `y: 2.8` levanta el ícono (burbuja de chat / libro) por encima del área visible del canvas en la mayoría de resoluciones de escritorio.
- **Qué hacer:** bajar el valor de `y` hasta que el ícono quede completamente contenido dentro del hero en desktop y en mobile (probar en ~1440×900 y en un viewport angosto, ~375px). Como referencia, el ícono del Autoclicker (`autoclicker/js/hero-init.js`) usa `y: 0.7` y no tiene este problema — partir de un valor similar (por ejemplo `y: 1.0`–`1.3`) y ajustar a ojo. Si hace falta, agregar una variante de offset para mobile (`matchMedia`) en vez de un único valor fijo.
- **Verificar:** cargar `/wtsapp/` y `/craft-book/` en desktop y mobile y confirmar que el ícono flotante no se corta contra el borde superior del viewport.

### 1.2 Las ruedas de los autos del Gas Station giran de costado (horizontal) en vez de hacia adelante

- **Archivo:** `gas-station/js/three-scene.js`, línea 248 (dentro del loop de animación de tráfico):
  ```js
  c.mesh.children.forEach((child, i) => { if (i >= 2 && i <= 5) child.rotation.x += dt * c.speed * 2.2; });
  ```
- **Causa:** el chasis del auto (`buildCar`, `js/3d/geo-builders.js`) tiene su eje largo en X (`BoxGeometry(1.9, 0.35, 0.85)`) — el auto se mueve/avanza en X. Las ruedas (`CylinderGeometry`) ya están orientadas correctamente en reposo con `rx: Math.PI / 2` para que su eje de giro quede en Z (el eje del semieje, perpendicular al avance). Pero la animación incrementa `rotation.x` en vez de `rotation.z`, así que en cada frame termina rotando la rueda alrededor del eje de avance (X) — visualmente eso se ve como un giro plano/horizontal ("de costado"), no como una rueda rodando hacia adelante.
- **Qué hacer:** cambiar esa línea para incrementar `rotation.z` en lugar de `rotation.x`:
  ```js
  c.mesh.children.forEach((child, i) => { if (i >= 2 && i <= 5) child.rotation.z += dt * c.speed * 2.2; });
  ```
- **Verificar:** cargar `/gas-station/` y mirar los dos autos que cruzan el fondo — las ruedas deben rodar como si avanzaran, no girar como un trompo.

### 1.3 El puntero (flecha) del Autoclicker parpadea entre negro y naranja al rotar

- **Archivo:** `js/3d/geo-builders.js`, función `buildMousePointer` (usada como ícono flotante en `autoclicker/js/hero-init.js`), aprox. líneas 207–225:
  ```js
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.26, bevelEnabled: true, ... });
  bodyGeo.center();
  const bodyMat = stdMat(color, { ...emissive: color, emissiveIntensity: 0.45 });
  group.add(mesh(bodyGeo, bodyMat));

  const outlineGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false });
  outlineGeo.center();
  const outline = mesh(outlineGeo, outlineMat, { z: -0.14 });
  outline.scale.set(1.14, 1.12, 1);
  group.add(outline);
  ```
- **Causa:** son dos mallas casi coplanares (el cuerpo naranja y el contorno negro) separadas apenas `0.14` en Z, con formas casi idénticas a distinta escala. Como el ícono rota continuamente en `hero-scene.js`, en ciertos ángulos las dos superficies quedan lo bastante cerca en profundidad como para que el z-buffer no pueda decidir cuál está adelante de forma estable → **z-fighting**, que se ve como parpadeo entre el naranja (`bodyMat`) y el negro (`outlineMat`).
- **Qué hacer** (cualquiera de estas soluciones, evaluar cuál se ve mejor):
  - Aumentar la separación en Z entre `outline` y `body` (por ejemplo `z: -0.30` o más, ajustando a ojo hasta que desaparezca el parpadeo en todos los ángulos de rotación).
  - O usar `polygonOffset`/`polygonOffsetFactor` en los materiales para forzar el orden de dibujado sin depender solo de la distancia real.
  - O renderizar el contorno como un `THREE.LineSegments` (edges) en vez de una segunda malla sólida extruida, que es la forma más robusta de tener un "outline" sin z-fighting.
- **Verificar:** en `/autoclicker/`, dejar el ícono rotando varios segundos completos y confirmar que no parpadea en ningún ángulo.

### 1.4 Los botones "Términos y Condiciones" y "Volver al inicio" no funcionan en la página del Autoclicker

- **Archivo:** `autoclicker/index.html`, líneas 201 y 203:
  ```html
  <a href="../" class="back-link">← VOLVER AL ESTUDIO</a>
  <br>
  <a href="../terminos/" style="...">Términos y Condiciones</a>
  ```
- **Diagnóstico a realizar** (el HTML en sí luce correcto — son anchors normales, no hay `onclick` ni `preventDefault` que los intercepte en `js/motion.js`, y `#hero-canvas` ya tiene `pointer-events: none`, así que la causa probablemente sea de despliegue/routing, no de markup):
  1. Confirmar en producción que `/terminos/` responde 200 y no 404 (relacionado con el fix reciente "Serve project pages with trailing slash..." — verificar que `vercel.json` cubre también la carpeta `terminos/`, no solo los cuatro productos).
  2. Revisar con las devtools abiertas si al hacer click aparece algún error de consola o si el evento de click llega a dispararse (puede haber algún overlay invisible superpuesto en producción que no está en este HTML fuente, o un desajuste entre el HTML deployado y el del repo).
  3. Si el problema es que estos dos `<a>` no tienen `position: relative; z-index: 1` como sí lo tienen `h1`, `.tagline` y `.app-card` (líneas 174-175 y 60 de `autoclicker/index.html`), agregarles la misma regla por consistencia, aunque el canvas ya debería no interceptar clicks al tener `pointer-events: none`.
- **Qué hacer:** una vez identificada la causa real (probar en el sitio desplegado, no solo local), corregirla y agregar una verificación automatizada tipo click-a-cada-link en las páginas de producto (ya existe una suite de pruebas mencionada en la sección 4.4/5 de `documentacion_arquitectura.md` — extenderla para cubrir esto).
- **Verificar:** en producción, click en ambos links desde `/autoclicker/` y confirmar que navegan a `/` y a `/terminos/` respectivamente.

### 1.5 Cambiar el mail de contacto/soporte a `soporte@mggx-games.xyz`

- **Ocurrencias actuales de `maxgab201@gmail.com`** (reemplazar las tres, texto visible y `href="mailto:"`):
  - `index.html:164` → `<a href="mailto:maxgab201@gmail.com" class="contact-btn">ENVIAR EMAIL</a>`
  - `terminos/index.html:60` → `<p>Contacto: <a href="mailto:maxgab201@gmail.com">maxgab201@gmail.com</a></p>`
  - `terminos/index.html:113` → `<p><a href="mailto:maxgab201@gmail.com">maxgab201@gmail.com</a></p>`
- **Qué hacer:** reemplazar las tres ocurrencias (texto y atributo `href`) por `soporte@mggx-games.xyz`. Antes de dar por terminado, correr un `grep -rn "maxgab201@gmail.com"` sobre todo el repo para confirmar que no queda ninguna instancia suelta en `wtsapp/`, `craft-book/`, `autoclicker/` o en algún JSON/JS que arme el mailto dinámicamente.

---

## 2. Mejoras adicionales sugeridas (no reportadas, detectadas al leer `documentacion_arquitectura.md`)

Estas no son obligatorias pero están anotadas explícitamente como pendientes en el propio documento de arquitectura (sección 4.2–4.3 y sección 5, "Lo que no se hizo, a propósito"). Tenerlas en un prompt separado o abordarlas en una iteración futura:

1. **Rotar la API key de NVIDIA expuesta en el historial de Git** (sección 4.3) — es la única pendiente de seguridad que depende exclusivamente del usuario, no del código. Si todavía no se hizo, es la prioridad número uno por encima de cualquier mejora visual.
2. **Rate limiting real y distribuido** (Upstash Redis / Vercel KV) — el actual es en memoria por instancia serverless y no persiste bajo carga alta o tras inactividad.
3. **Trusted Types** para los `innerHTML` de `admin.js` y `render-versions.js` — requiere auditar cada uso y envolverlo con una política explícita.
4. **Purga de estilos inline** para poder sacar `unsafe-inline` de `style-src` en el CSP — refactor de alcance mayor, evaluar si vale la pena dado el riesgo bajo que representa hoy (no permite ejecutar JS, solo alterar apariencia).

---

## 3. Orden sugerido de ejecución

1. 1.5 (mail) — cambio trivial, cero riesgo, hacerlo primero.
2. 1.2 (ruedas) — un solo carácter (`x` → `z`), alto impacto visual, bajo riesgo.
3. 1.1 (overflow de íconos) — ajuste de un número, verificar en varios tamaños de pantalla.
4. 1.3 (parpadeo del puntero) — requiere probar visualmente varias soluciones hasta que el z-fighting desaparezca en todos los ángulos.
5. 1.4 (links rotos) — el que más investigación necesita porque el HTML fuente no muestra la causa evidente; probar directamente contra el sitio desplegado.
