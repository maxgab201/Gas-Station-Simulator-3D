// ============================================================
//  MGGX GAMES — Escena "hero" reutilizable (partículas + icono
//  procedural flotante). Reemplaza js/particles.js y
//  js/hero-particles.js: mismo comportamiento de partículas con
//  física de repulsión por mouse que ya tenía el sitio, ahora
//  sobre el runtime compartido (pausa en background, reduced
//  motion, resize por ResizeObserver) más un mesh 3D flotante
//  con identidad visual propia por producto.
// ============================================================

import { THREE, createScene, REDUCE_MOTION } from './scene-runtime.js';

/**
 * @param {string} canvasId
 * @param {object} opts
 * @param {number} opts.color               color primario (0xRRGGBB)
 * @param {number} [opts.particleCount=1500]
 * @param {(color:number)=>THREE.Object3D} [opts.iconBuilder] constructor del icono 3D flotante (opcional)
 * @param {number} [opts.iconScale=1]
 * @param {{x?:number,y?:number,z?:number}} [opts.iconOffset] posición base del icono — en layouts de
 *   dos columnas (foto a la izquierda + texto a la derecha) hay que sacarlo del centro para que no
 *   quede tapando el párrafo; el default (0,0.1,1.2) sirve para heros de una sola columna centrada.
 */
export function initHeroScene(canvasId, opts = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const {
        color = 0xffa500,
        particleCount = 1500,
        iconBuilder = null,
        iconScale = 1,
        iconOffset = { x: 0, y: 0.1, z: 1.2 },
    } = opts;
    const baseX = iconOffset.x ?? 0;
    const baseY = iconOffset.y ?? 0.1;
    const baseZ = iconOffset.z ?? 1.2;

    let icon = null;
    let iconHit = null;
    let pulseT = 0;

    const COUNT = REDUCE_MOTION ? Math.min(particleCount, 200) : particleCount;
    const positions = new Float32Array(COUNT * 3);
    const origPositions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);

    const scene3d = createScene(canvas, {
        cameraFov: 60,
        far: 60,
        setup(ctx) {
            ctx.camera.position.set(0, 0, 7);

            for (let i = 0; i < COUNT; i++) {
                const x = (Math.random() - 0.5) * 16;
                const y = (Math.random() - 0.5) * 9;
                const z = (Math.random() - 0.5) * 5 - 1;
                positions[i * 3] = origPositions[i * 3] = x;
                positions[i * 3 + 1] = origPositions[i * 3 + 1] = y;
                positions[i * 3 + 2] = origPositions[i * 3 + 2] = z;
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const mat = new THREE.PointsMaterial({
                color, size: 0.045, transparent: true, opacity: 0.7, sizeAttenuation: true,
            });
            ctx.points = new THREE.Points(geo, mat);
            ctx.scene.add(ctx.points);

            ctx.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
            const key = new THREE.DirectionalLight(0xffffff, 1.4);
            key.position.set(4, 5, 6);
            ctx.scene.add(key);
            const rim = new THREE.PointLight(color, 2.2, 14);
            rim.position.set(-3, -2, 3);
            ctx.scene.add(rim);

            if (iconBuilder) {
                icon = iconBuilder(color);
                icon.scale.setScalar(iconScale);
                icon.position.set(baseX, baseY, baseZ);
                ctx.scene.add(icon);
                iconHit = new THREE.Mesh(
                    new THREE.SphereGeometry(1.1 * iconScale, 8, 8),
                    new THREE.MeshBasicMaterial({ visible: false }),
                );
                iconHit.position.copy(icon.position);
                ctx.scene.add(iconHit);
            }

            const raycaster = new THREE.Raycaster();
            canvas.style.pointerEvents = iconBuilder ? 'auto' : 'none';
            canvas.addEventListener('click', e => {
                if (!iconHit) return;
                const rect = canvas.getBoundingClientRect();
                const ndc = new THREE.Vector2(
                    ((e.clientX - rect.left) / rect.width) * 2 - 1,
                    -((e.clientY - rect.top) / rect.height) * 2 + 1,
                );
                raycaster.setFromCamera(ndc, ctx.camera);
                if (raycaster.intersectObject(iconHit).length) pulseT = 1;
            });
        },
        onFrame(ctx, dt, elapsed) {
            const raycaster = ctx._raycaster ?? (ctx._raycaster = new THREE.Raycaster());
            const mousePlane = ctx._mousePlane ?? (ctx._mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
            const mouseWorld = ctx._mouseWorld ?? (ctx._mouseWorld = new THREE.Vector3());
            raycaster.setFromCamera(new THREE.Vector2(ctx.pointer.x, ctx.pointer.y), ctx.camera);
            raycaster.ray.intersectPlane(mousePlane, mouseWorld);

            const points = ctx.points;
            if (points) {
                const pos = points.geometry.attributes.position.array;
                const mx = mouseWorld?.x ?? 999, my = mouseWorld?.y ?? 999, mz = mouseWorld?.z ?? 999;
                const REPEL_RADIUS = 1.7, REPEL_STRENGTH = 0.2, SPRING = 0.02, DAMPING = 0.88;
                for (let i = 0; i < COUNT; i++) {
                    const ix = i * 3, iy = ix + 1, iz = ix + 2;
                    velocities[ix] += (origPositions[ix] - pos[ix]) * SPRING;
                    velocities[iy] += (origPositions[iy] - pos[iy]) * SPRING;
                    velocities[iz] += (origPositions[iz] - pos[iz]) * SPRING;
                    const dx = pos[ix] - mx, dy = pos[iy] - my, dz = pos[iz] - mz;
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (dist < REPEL_RADIUS && dist > 0.001) {
                        const f = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH;
                        velocities[ix] += (dx / dist) * f;
                        velocities[iy] += (dy / dist) * f;
                        velocities[iz] += (dz / dist) * f;
                    }
                    velocities[ix] *= DAMPING; velocities[iy] *= DAMPING; velocities[iz] *= DAMPING;
                    pos[ix] += velocities[ix]; pos[iy] += velocities[iy]; pos[iz] += velocities[iz];
                }
                points.geometry.attributes.position.needsUpdate = true;
                points.rotation.y = Math.sin(elapsed * 0.05) * 0.08;
            }

            if (icon) {
                icon.rotation.y += dt * 0.35;
                icon.rotation.x = Math.sin(elapsed * 0.4) * 0.12;
                icon.position.y = baseY + Math.sin(elapsed * 0.8) * 0.12;
                icon.position.x = baseX + ctx.pointer.x * 0.35;

                if (pulseT > 0) {
                    pulseT = Math.max(0, pulseT - dt * 2.2);
                    const s = iconScale * (1 + Math.sin(pulseT * Math.PI) * 0.28);
                    icon.scale.setScalar(s);
                } else {
                    icon.scale.setScalar(iconScale);
                }
                iconHit?.position.copy(icon.position);
            }

            const camera = ctx.camera;
            camera.position.x += (ctx.pointer.x * 0.6 - camera.position.x) * 0.04;
            camera.position.y += (ctx.pointer.y * 0.35 - camera.position.y) * 0.04;
            camera.lookAt(0, 0, 0);
        },
    });

    return scene3d;
}
