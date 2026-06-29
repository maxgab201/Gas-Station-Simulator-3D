import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('particle-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 5;

// Particle setup
const COUNT = 2500;
const positions    = new Float32Array(COUNT * 3);
const origPositions = new Float32Array(COUNT * 3);
const velocities   = new Float32Array(COUNT * 3);

for (let i = 0; i < COUNT; i++) {
    const x = (Math.random() - 0.5) * 12;
    const y = (Math.random() - 0.5) * 7;
    const z = (Math.random() - 0.5) * 1;
    positions[i*3]     = origPositions[i*3]     = x;
    positions[i*3 + 1] = origPositions[i*3 + 1] = y;
    positions[i*3 + 2] = origPositions[i*3 + 2] = z;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
    color: 0xFFA500,
    size: 0.028,
    transparent: true,
    opacity: 0.65,
    sizeAttenuation: true,
});

scene.add(new THREE.Points(geometry, material));

// Mouse → world plane intersection
const raycaster = new THREE.Raycaster();
const mouseNDC  = new THREE.Vector2(9999, 9999);
const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const mouseWorld = new THREE.Vector3();

window.addEventListener('mousemove', e => {
    mouseNDC.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouseNDC, camera);
    raycaster.ray.intersectPlane(mousePlane, mouseWorld);
});

window.addEventListener('touchmove', e => {
    const t = e.touches[0];
    mouseNDC.x =  (t.clientX / window.innerWidth)  * 2 - 1;
    mouseNDC.y = -(t.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouseNDC, camera);
    raycaster.ray.intersectPlane(mousePlane, mouseWorld);
}, { passive: true });

// Resize
function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}
onResize();
window.addEventListener('resize', onResize);

// Physics constants
const REPEL_RADIUS   = 1.6;
const REPEL_STRENGTH = 0.18;
const SPRING         = 0.018;
const DAMPING        = 0.87;

function animate() {
    requestAnimationFrame(animate);

    const pos = geometry.attributes.position.array;
    const mx = mouseWorld.x, my = mouseWorld.y;

    for (let i = 0; i < COUNT; i++) {
        const ix = i * 3, iy = ix + 1, iz = ix + 2;

        // Spring toward original position
        velocities[ix] += (origPositions[ix] - pos[ix]) * SPRING;
        velocities[iy] += (origPositions[iy] - pos[iy]) * SPRING;

        // Repel from mouse
        const dx = pos[ix] - mx;
        const dy = pos[iy] - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0.001) {
            const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH;
            velocities[ix] += (dx / dist) * force;
            velocities[iy] += (dy / dist) * force;
        }

        // Damping + apply
        velocities[ix] *= DAMPING;
        velocities[iy] *= DAMPING;
        pos[ix] += velocities[ix];
        pos[iy] += velocities[iy];
    }

    geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
}

animate();
