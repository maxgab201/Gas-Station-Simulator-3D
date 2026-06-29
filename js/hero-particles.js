import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export function initHeroParticles(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.z = 5;

    const COUNT = 1800;
    const positions     = new Float32Array(COUNT * 3);
    const origPositions = new Float32Array(COUNT * 3);
    const velocities    = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
        const x = (Math.random() - 0.5) * 14;
        const y = (Math.random() - 0.5) * 8;
        const z = (Math.random() - 0.5) * 0.4;
        positions[i*3]     = origPositions[i*3]     = x;
        positions[i*3+1]   = origPositions[i*3+1]   = y;
        positions[i*3+2]   = origPositions[i*3+2]   = z;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
        color: 0xFFA500,
        size: 0.045,
        transparent: true,
        opacity: 0.75,
        sizeAttenuation: true,
    });
    scene.add(new THREE.Points(geo, mat));

    const raycaster  = new THREE.Raycaster();
    const mouseNDC   = new THREE.Vector2(99999, 99999);
    const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mouseWorld = new THREE.Vector3();

    function trackMouse(cx, cy) {
        const rect = canvas.getBoundingClientRect();
        mouseNDC.x =  ((cx - rect.left) / rect.width)  * 2 - 1;
        mouseNDC.y = -((cy - rect.top)  / rect.height) * 2 + 1;
    }
    window.addEventListener('mousemove', e => trackMouse(e.clientX, e.clientY));
    window.addEventListener('touchmove', e => trackMouse(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

    function onResize() {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    onResize();
    window.addEventListener('resize', onResize);

    const REPEL_RADIUS   = 1.6;
    const REPEL_STRENGTH = 0.18;
    const SPRING         = 0.018;
    const DAMPING        = 0.87;

    function animate() {
        requestAnimationFrame(animate);

        raycaster.setFromCamera(mouseNDC, camera);
        raycaster.ray.intersectPlane(mousePlane, mouseWorld);

        const pos = geo.attributes.position.array;
        const mx = mouseWorld.x, my = mouseWorld.y, mz = mouseWorld.z;

        for (let i = 0; i < COUNT; i++) {
            const ix = i*3, iy = ix+1, iz = ix+2;

            velocities[ix] += (origPositions[ix] - pos[ix]) * SPRING;
            velocities[iy] += (origPositions[iy] - pos[iy]) * SPRING;
            velocities[iz] += (origPositions[iz] - pos[iz]) * SPRING;

            const dx = pos[ix] - mx;
            const dy = pos[iy] - my;
            const dz = pos[iz] - mz;
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (dist < REPEL_RADIUS && dist > 0.001) {
                const f = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH;
                velocities[ix] += (dx / dist) * f;
                velocities[iy] += (dy / dist) * f;
                velocities[iz] += (dz / dist) * f;
            }

            velocities[ix] *= DAMPING; velocities[iy] *= DAMPING; velocities[iz] *= DAMPING;
            pos[ix] += velocities[ix]; pos[iy] += velocities[iy]; pos[iz] += velocities[iz];
        }

        geo.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
    }

    animate();
}
