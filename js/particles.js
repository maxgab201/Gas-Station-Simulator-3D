import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('particle-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 0, 10);

// ── PARTICLES ─────────────────────────────────────────────────────────────────
const COUNT = 200;
const pPos   = new Float32Array(COUNT * 3);
const pOrig  = new Float32Array(COUNT * 3);
const pVel   = new Float32Array(COUNT * 3);
const pDrift = new Float32Array(COUNT * 3);

for (let i = 0; i < COUNT; i++) {
    const x = (Math.random() - 0.5) * 14;
    const y = (Math.random() - 0.5) * 8;
    const z = (Math.random() - 0.5) * 6;
    pPos[i*3] = pOrig[i*3] = x;
    pPos[i*3+1] = pOrig[i*3+1] = y;
    pPos[i*3+2] = pOrig[i*3+2] = z;
    pDrift[i*3]   = (Math.random() - 0.5) * 0.0018;
    pDrift[i*3+1] = (Math.random() - 0.5) * 0.0018;
    pDrift[i*3+2] = (Math.random() - 0.5) * 0.0009;
}

const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat = new THREE.PointsMaterial({
    color: 0xFFA500,
    size: 0.07,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
});
scene.add(new THREE.Points(pGeo, pMat));

// ── CONNECTION LINES ──────────────────────────────────────────────────────────
const MAX_LINES = 600;
const lPos = new Float32Array(MAX_LINES * 6);
const lGeo = new THREE.BufferGeometry();
lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3));
lGeo.setDrawRange(0, 0);
const lMat = new THREE.LineBasicMaterial({ color: 0xFFA500, transparent: true, opacity: 0.13 });
scene.add(new THREE.LineSegments(lGeo, lMat));

// ── MOUSE TRACKING ────────────────────────────────────────────────────────────
const raycaster  = new THREE.Raycaster();
const mouseNDC   = new THREE.Vector2(99999, 99999);
const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const mouseWorld = new THREE.Vector3();

function trackMouse(cx, cy) {
    mouseNDC.x =  (cx / window.innerWidth)  * 2 - 1;
    mouseNDC.y = -(cy / window.innerHeight) * 2 + 1;
}
window.addEventListener('mousemove', e => trackMouse(e.clientX, e.clientY));
window.addEventListener('touchmove',  e => trackMouse(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

// ── RESIZE ────────────────────────────────────────────────────────────────────
function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}
onResize();
window.addEventListener('resize', onResize);

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const REPEL_RADIUS   = 2.2;
const REPEL_STRENGTH = 0.22;
const SPRING         = 0.011;
const DAMPING        = 0.87;
const CONNECT_DIST   = 3.2;
const CONNECT_DIST2  = CONNECT_DIST * CONNECT_DIST;
const ORBIT_SPEED    = 0.00025;
const ORBIT_R        = 10;

let tick = 0;

function animate() {
    requestAnimationFrame(animate);
    tick++;

    // Slow camera orbit around Y axis
    camera.position.x = Math.sin(tick * ORBIT_SPEED) * ORBIT_R;
    camera.position.z = Math.cos(tick * ORBIT_SPEED) * ORBIT_R;
    camera.position.y = Math.sin(tick * ORBIT_SPEED * 0.4) * 1.5;
    camera.lookAt(0, 0, 0);

    // Update mouse plane to always face camera, then intersect
    camera.getWorldDirection(mousePlane.normal);
    raycaster.setFromCamera(mouseNDC, camera);
    raycaster.ray.intersectPlane(mousePlane, mouseWorld);

    const pos = pGeo.attributes.position.array;
    const mx = mouseWorld.x, my = mouseWorld.y, mz = mouseWorld.z;

    for (let i = 0; i < COUNT; i++) {
        const ix = i*3, iy = ix+1, iz = ix+2;

        // Organic drift — origin slowly wanders within bounds
        pOrig[ix] += pDrift[ix];
        pOrig[iy] += pDrift[iy];
        pOrig[iz] += pDrift[iz];
        if (Math.abs(pOrig[ix]) > 7)  pDrift[ix]  *= -1;
        if (Math.abs(pOrig[iy]) > 4)  pDrift[iy]  *= -1;
        if (Math.abs(pOrig[iz]) > 3)  pDrift[iz]  *= -1;

        // Spring toward drifting origin
        pVel[ix] += (pOrig[ix] - pos[ix]) * SPRING;
        pVel[iy] += (pOrig[iy] - pos[iy]) * SPRING;
        pVel[iz] += (pOrig[iz] - pos[iz]) * SPRING;

        // 3D mouse repulsion
        const dx = pos[ix] - mx;
        const dy = pos[iy] - my;
        const dz = pos[iz] - mz;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist < REPEL_RADIUS && dist > 0.001) {
            const f = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH;
            pVel[ix] += (dx / dist) * f;
            pVel[iy] += (dy / dist) * f;
            pVel[iz] += (dz / dist) * f;
        }

        pVel[ix] *= DAMPING; pVel[iy] *= DAMPING; pVel[iz] *= DAMPING;
        pos[ix] += pVel[ix]; pos[iy] += pVel[iy]; pos[iz] += pVel[iz];
    }

    // Build connection lines
    let lc = 0;
    for (let i = 0; i < COUNT && lc < MAX_LINES; i++) {
        for (let j = i + 1; j < COUNT && lc < MAX_LINES; j++) {
            const dx = pos[i*3] - pos[j*3];
            const dy = pos[i*3+1] - pos[j*3+1];
            const dz = pos[i*3+2] - pos[j*3+2];
            if (dx*dx + dy*dy + dz*dz < CONNECT_DIST2) {
                lPos[lc*6]   = pos[i*3];   lPos[lc*6+1] = pos[i*3+1]; lPos[lc*6+2] = pos[i*3+2];
                lPos[lc*6+3] = pos[j*3];   lPos[lc*6+4] = pos[j*3+1]; lPos[lc*6+5] = pos[j*3+2];
                lc++;
            }
        }
    }
    lGeo.setDrawRange(0, lc * 2);
    lGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
}

animate();
