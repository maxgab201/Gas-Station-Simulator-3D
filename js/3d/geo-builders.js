// ============================================================
//  MGGX GAMES — Constructores de geometría procedural
//  Alternativa 100% en código a modelar en Blender: cada función
//  arma un THREE.Group combinando primitivas (cajas, cilindros,
//  toros, tubos con curvas) en vez de cargar un .glb binario.
//  Ventajas: sin assets binarios que versionar, totalmente
//  editable por parámetros, tamaño mínimo (no hay descarga de
//  malla), y cero dependencia de herramientas externas de 3D.
// ============================================================

import * as THREE from '../../vendor/three/three.module.min.js';

const MAT_CACHE = new Map();

/** Material estándar cacheado por color+propiedades para no duplicar instancias. */
function stdMat(color, { roughness = 0.55, metalness = 0.35, emissive = null, emissiveIntensity = 1 } = {}) {
    const key = `${color}|${roughness}|${metalness}|${emissive}|${emissiveIntensity}`;
    if (MAT_CACHE.has(key)) return MAT_CACHE.get(key);
    const mat = new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness,
        emissive: emissive ?? 0x000000,
        emissiveIntensity,
    });
    MAT_CACHE.set(key, mat);
    return mat;
}

function mesh(geo, mat, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, castShadow = true, receiveShadow = true } = {}) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = castShadow;
    m.receiveShadow = receiveShadow;
    return m;
}

// ------------------------------------------------------------
// SURTIDOR DE NAFTA (gas pump) — cuerpo, pantalla, manguera curva,
// pistola/nozzle animable por separado (se devuelve como referencia).
// ------------------------------------------------------------
export function buildGasPump({ accent = 0xffa500 } = {}) {
    const group = new THREE.Group();
    group.name = 'gas-pump';

    const bodyMat = stdMat(0x1c1c1c, { roughness: 0.4, metalness: 0.6 });
    const accentMat = stdMat(accent, { roughness: 0.3, metalness: 0.2, emissive: accent, emissiveIntensity: 0.35 });
    const screenMat = stdMat(0x0a0a0a, { roughness: 0.2, metalness: 0.1, emissive: accent, emissiveIntensity: 0.9 });
    const metalMat = stdMat(0x888888, { roughness: 0.25, metalness: 0.9 });

    // Base
    const base = mesh(new THREE.BoxGeometry(1.3, 0.15, 0.8), stdMat(0x2a2a2a, { roughness: 0.6 }), { y: 0.075 });
    group.add(base);

    // Cuerpo principal
    const body = mesh(new THREE.BoxGeometry(1.0, 1.9, 0.6), bodyMat, { y: 1.1 });
    group.add(body);

    // Franja de acento vertical
    const stripe = mesh(new THREE.BoxGeometry(1.02, 1.9, 0.08), accentMat, { y: 1.1, z: 0.27 });
    group.add(stripe);

    // Pantalla digital (precio)
    const screen = mesh(new THREE.BoxGeometry(0.7, 0.42, 0.05), screenMat, { y: 1.75, z: 0.33 });
    group.add(screen);

    // Techo/cornisa
    const roof = mesh(new THREE.BoxGeometry(1.25, 0.1, 0.75), metalMat, { y: 2.15 });
    group.add(roof);

    // Panel de botones
    const panel = mesh(new THREE.BoxGeometry(0.55, 0.5, 0.06), stdMat(0x333333, { roughness: 0.5 }), { y: 1.05, z: 0.33 });
    group.add(panel);
    for (let i = 0; i < 4; i++) {
        const btn = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12), accentMat, {
            x: -0.18 + (i % 2) * 0.36,
            y: 1.18 - Math.floor(i / 2) * 0.24,
            z: 0.37,
            rx: Math.PI / 2,
        });
        group.add(btn);
    }

    // Soporte lateral de manguera
    const hook = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 10), metalMat, { x: 0.55, y: 1.5, z: 0, rz: Math.PI / 2 });
    group.add(hook);

    // Manguera: curva tipo Catmull-Rom extruida en tubo
    const hoseCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.62, 1.5, 0),
        new THREE.Vector3(0.9, 1.2, 0.15),
        new THREE.Vector3(0.75, 0.7, 0.35),
        new THREE.Vector3(0.55, 0.35, 0.55),
        new THREE.Vector3(0.4, 0.15, 0.7),
    ]);
    const hoseGeo = new THREE.TubeGeometry(hoseCurve, 32, 0.035, 8, false);
    const hose = mesh(hoseGeo, stdMat(0x111111, { roughness: 0.8, metalness: 0.1 }));
    group.add(hose);

    // Pistola/nozzle (grupo aparte para poder animarlo con un "squeeze")
    const nozzle = new THREE.Group();
    nozzle.name = 'nozzle';
    nozzle.position.set(0.4, 0.15, 0.7);
    const nozzleBody = mesh(new THREE.BoxGeometry(0.22, 0.09, 0.09), metalMat, { x: 0.08 });
    const nozzleGrip = mesh(new THREE.BoxGeometry(0.08, 0.16, 0.08), stdMat(0x1a1a1a, { roughness: 0.7 }), { x: -0.02, y: -0.09 });
    const nozzleTip = mesh(new THREE.ConeGeometry(0.035, 0.12, 10), metalMat, { x: 0.22, rz: -Math.PI / 2 });
    const nozzleTrigger = mesh(new THREE.BoxGeometry(0.03, 0.07, 0.06), accentMat, { x: 0.0, y: -0.02 });
    nozzleTrigger.name = 'nozzle-trigger';
    nozzle.add(nozzleBody, nozzleGrip, nozzleTip, nozzleTrigger);
    group.add(nozzle);

    group.userData.nozzle = nozzle;
    group.userData.screen = screen;
    group.userData.stripe = stripe;
    return group;
}

// ------------------------------------------------------------
// AUTO estilizado low-poly (para animación de tráfico ambiente)
// ------------------------------------------------------------
export function buildCar({ color = 0xcccccc } = {}) {
    const group = new THREE.Group();
    group.name = 'car';

    const bodyMat = stdMat(color, { roughness: 0.35, metalness: 0.55 });
    const glassMat = stdMat(0x111820, { roughness: 0.1, metalness: 0.8 });
    const wheelMat = stdMat(0x0c0c0c, { roughness: 0.9, metalness: 0.1 });
    const lightMat = stdMat(0xffe9a8, { roughness: 0.2, metalness: 0.1, emissive: 0xffcc55, emissiveIntensity: 1.2 });

    const chassis = mesh(new THREE.BoxGeometry(1.9, 0.35, 0.85), bodyMat, { y: 0.35 });
    const cabin = mesh(new THREE.BoxGeometry(1.0, 0.34, 0.78), glassMat, { x: -0.1, y: 0.68 });
    group.add(chassis, cabin);

    const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.2, 16);
    const wheelPositions = [
        [0.65, 0.22, 0.45], [0.65, 0.22, -0.45],
        [-0.65, 0.22, 0.45], [-0.65, 0.22, -0.45],
    ];
    for (const [x, y, z] of wheelPositions) {
        group.add(mesh(wheelGeo, wheelMat, { x, y, z, rx: Math.PI / 2 }));
    }

    group.add(mesh(new THREE.BoxGeometry(0.08, 0.12, 0.7), lightMat, { x: 0.93, y: 0.4 }));
    group.userData.wheels = wheelPositions.length;
    return group;
}

// ------------------------------------------------------------
// LOGO 3D — extrusión low-poly de un icosaedro deformado, usado
// como pieza central flotante en la home.
// ------------------------------------------------------------
export function buildOrb({ color = 0xffa500, detail = 1 } = {}) {
    const geo = new THREE.IcosahedronGeometry(1, detail);
    const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.25,
        metalness: 0.65,
        emissive: color,
        emissiveIntensity: 0.15,
        flatShading: true,
    });
    const wireMat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.18 });
    const group = new THREE.Group();
    group.add(new THREE.Mesh(geo, mat));
    group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, detail), wireMat));
    return group;
}

// ------------------------------------------------------------
// Iconos flotantes por producto — geometría simple y reconocible.
// ------------------------------------------------------------
export function buildChatBubble({ color = 0x3ddc84 } = {}) {
    const group = new THREE.Group();
    const bodyMat = stdMat(color, { roughness: 0.3, metalness: 0.25, emissive: color, emissiveIntensity: 0.25 });
    group.add(mesh(new THREE.SphereGeometry(0.55, 24, 16), bodyMat));
    const tail = mesh(new THREE.ConeGeometry(0.18, 0.35, 4), bodyMat, { x: -0.35, y: -0.5, rz: Math.PI + 0.5 });
    group.add(tail);
    const dotMat = stdMat(0x0a0a0a, { roughness: 0.4 });
    for (let i = -1; i <= 1; i++) group.add(mesh(new THREE.SphereGeometry(0.07, 10, 10), dotMat, { x: i * 0.22, z: 0.5 }));
    return group;
}

export function buildBook({ color = 0xffa500 } = {}) {
    const group = new THREE.Group();
    const coverMat = stdMat(color, { roughness: 0.4, metalness: 0.15, emissive: color, emissiveIntensity: 0.2 });
    const pagesMat = stdMat(0xf2ead8, { roughness: 0.9, metalness: 0 });
    group.add(mesh(new THREE.BoxGeometry(0.9, 1.2, 0.15), coverMat));
    group.add(mesh(new THREE.BoxGeometry(0.78, 1.06, 0.12), pagesMat, { z: 0.01 }));
    for (let i = -2; i <= 2; i++) {
        group.add(mesh(new THREE.BoxGeometry(0.78, 0.02, 0.13), stdMat(0xd8cba8, { roughness: 0.9 }), { y: i * 0.2, z: 0.015 }));
    }
    return group;
}

export function buildLightningBolt({ color = 0xffa500 } = {}) {
    const shape = new THREE.Shape();
    shape.moveTo(0.15, 1.0);
    shape.lineTo(-0.25, 0.1);
    shape.lineTo(0.02, 0.1);
    shape.lineTo(-0.15, -1.0);
    shape.lineTo(0.3, -0.05);
    shape.lineTo(0.02, -0.05);
    shape.lineTo(0.15, 1.0);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
    geo.center();
    const mat = stdMat(color, { roughness: 0.2, metalness: 0.4, emissive: color, emissiveIntensity: 0.6 });
    return mesh(geo, mat);
}

/** Nube de partículas tipo "combustible flotando" — puntos con leve deriva. */
export function buildFloatingParticles({ count = 60, radius = 6, color = 0xffa500, size = 0.045 } = {}) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const r = radius * Math.cbrt(Math.random());
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.55, sizeAttenuation: true });
    return new THREE.Points(geo, mat);
}
