// ============================================================
//  MGGX GAMES — Escena 3D del hero de Gas Station Sim 3D
//
//  Reemplaza la carga de DamagedHelmet.glb (modelo de muestra de
//  Khronos sin relación temática con el juego, cargado por error
//  en una versión anterior) por un surtidor de nafta construido
//  100% por geometría procedural en código — ver
//  js/3d/geo-builders.js — más autos animados cruzando el fondo y
//  una interacción real: click en la pistola dispara la animación
//  de "carga" y una ráfaga de partículas de dinero, igual que la
//  mecánica económica descripta en el propio juego.
// ============================================================

import { THREE, createScene, REDUCE_MOTION } from '../../js/3d/scene-runtime.js';
import { buildGasPump, buildCar, buildFloatingParticles } from '../../js/3d/geo-builders.js';

const ACCENT = 0xffa500;

function buildGround() {
    const geo = new THREE.PlaneGeometry(60, 60, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.95, metalness: 0.05 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    return ground;
}

function buildLaneMarkings() {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.6 });
    for (let i = -6; i <= 6; i++) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.08), mat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(i * 1.4, 0.01, -3.4);
        group.add(dash);
    }
    return group;
}

function spawnMoneyBurst(scene, origin, count = 22) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i * 3] = origin.x;
        positions[i * 3 + 1] = origin.y;
        positions[i * 3 + 2] = origin.z;
        const theta = Math.random() * Math.PI * 2;
        const speed = 0.8 + Math.random() * 1.4;
        velocities[i * 3] = Math.cos(theta) * speed * 0.5;
        velocities[i * 3 + 1] = 1.4 + Math.random() * 1.2;
        velocities[i * 3 + 2] = Math.sin(theta) * speed * 0.5;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
        color: 0x9fe870, size: 0.09, transparent: true, opacity: 1, sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    return { points, velocities, positions, life: 0, maxLife: 1.3 };
}

export function initGasStationScene(containerId = 'three-container') {
    const container = document.getElementById(containerId);
    if (!container) return null;

    let canvas = container.querySelector('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        container.appendChild(canvas);
    }

    let pump, nozzleHit, car1, car2;
    let bursts = [];
    const raycaster = new THREE.Raycaster();
    let hoveringNozzle = false;

    const scene3d = createScene(canvas, {
        cameraFov: 45,
        far: 80,
        setup(ctx) {
            ctx.scene.fog = new THREE.FogExp2(0x000000, 0.045);
            ctx.camera.position.set(2.6, 1.7, 4.4);
            ctx.camera.lookAt(0, 1, 0);

            ctx.scene.add(buildGround());
            ctx.scene.add(buildLaneMarkings());

            pump = buildGasPump({ accent: ACCENT });
            ctx.scene.add(pump);

            nozzleHit = new THREE.Mesh(
                new THREE.SphereGeometry(0.32, 8, 8),
                new THREE.MeshBasicMaterial({ visible: false }),
            );
            const nozzleWorldPos = new THREE.Vector3();
            pump.userData.nozzle.getWorldPosition(nozzleWorldPos);
            nozzleHit.position.copy(nozzleWorldPos);
            ctx.scene.add(nozzleHit);

            car1 = buildCar({ color: 0xd94f4f });
            car2 = buildCar({ color: 0x4f7dd9 });
            car1.position.set(-14, 0, -3.4);
            car2.position.set(20, 0, -3.4);
            car2.rotation.y = Math.PI;
            ctx.scene.add(car1, car2);
            ctx.cars = [
                { mesh: car1, speed: 2.1, dir: 1, resetX: -14, endX: 14 },
                { mesh: car2, speed: 1.6, dir: -1, resetX: 14, endX: -14 },
            ];

            const particles = buildFloatingParticles({ count: REDUCE_MOTION ? 20 : 90, radius: 9, color: ACCENT, size: 0.03 });
            particles.position.y = 2;
            ctx.scene.add(particles);
            ctx.ambientParticles = particles;

            ctx.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
            const key = new THREE.DirectionalLight(0xffffff, 1.6);
            key.position.set(6, 8, 4);
            ctx.scene.add(key);
            const fill = new THREE.PointLight(ACCENT, 3, 10);
            fill.position.set(-2, 2.5, 2);
            ctx.scene.add(fill);
            const rim = new THREE.PointLight(0x4488ff, 1.2, 12);
            rim.position.set(3, 3, -4);
            ctx.scene.add(rim);

            canvas.style.pointerEvents = 'auto';
            canvas.style.cursor = 'default';

            function ndcFromEvent(e) {
                const rect = canvas.getBoundingClientRect();
                return new THREE.Vector2(
                    ((e.clientX - rect.left) / rect.width) * 2 - 1,
                    -((e.clientY - rect.top) / rect.height) * 2 + 1,
                );
            }

            canvas.addEventListener('click', e => {
                raycaster.setFromCamera(ndcFromEvent(e), ctx.camera);
                if (raycaster.intersectObject(nozzleHit).length) {
                    ctx.squeezeT = 1;
                    const worldPos = new THREE.Vector3();
                    pump.userData.nozzle.getWorldPosition(worldPos);
                    bursts.push(spawnMoneyBurst(ctx.scene, worldPos));
                }
            });

            canvas.addEventListener('mousemove', e => {
                raycaster.setFromCamera(ndcFromEvent(e), ctx.camera);
                hoveringNozzle = raycaster.intersectObject(nozzleHit).length > 0;
                canvas.style.cursor = hoveringNozzle ? 'pointer' : 'default';
            });

            let scrollFrac = 0;
            function onScroll() {
                const h = container.parentElement?.offsetHeight || window.innerHeight;
                scrollFrac = Math.min(1, Math.max(0, window.scrollY / h));
                ctx.scrollT = scrollFrac;
            }
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();

            ctx.squeezeT = 0;
        },
        onFrame(ctx, dt, elapsed) {
            if (pump?.userData.screen) {
                const flicker = 0.85 + Math.sin(elapsed * 6) * 0.08 + (Math.random() - 0.5) * 0.03;
                pump.userData.screen.material.emissiveIntensity = Math.max(0.4, flicker);
            }
            if (pump?.userData.stripe) {
                pump.userData.stripe.material.emissiveIntensity = hoveringNozzle
                    ? 0.55 + Math.sin(elapsed * 10) * 0.15
                    : 0.35;
            }

            const nozzle = pump?.userData.nozzle;
            if (nozzle) {
                nozzle.rotation.z = Math.sin(elapsed * 1.2) * 0.03;
                if (ctx.squeezeT > 0) {
                    ctx.squeezeT = Math.max(0, ctx.squeezeT - dt * 2.5);
                    const trigger = nozzle.children.find(c => c.name === 'nozzle-trigger');
                    if (trigger) trigger.position.x = -Math.sin(ctx.squeezeT * Math.PI) * 0.03;
                }
            }

            for (const c of ctx.cars || []) {
                c.mesh.position.x += dt * c.speed * c.dir;
                c.mesh.children.forEach((child, i) => { if (i >= 2 && i <= 5) child.rotation.x += dt * c.speed * 2.2; });
                if ((c.dir > 0 && c.mesh.position.x > c.endX) || (c.dir < 0 && c.mesh.position.x < c.endX)) {
                    c.mesh.position.x = c.resetX;
                }
            }

            if (ctx.ambientParticles) {
                ctx.ambientParticles.rotation.y = elapsed * 0.02;
            }

            bursts = bursts.filter(b => {
                b.life += dt;
                const pos = b.points.geometry.attributes.position.array;
                for (let i = 0; i < b.velocities.length / 3; i++) {
                    const ix = i * 3, iy = ix + 1, iz = ix + 2;
                    b.velocities[iy] -= dt * 3.2; // gravedad
                    pos[ix] += b.velocities[ix] * dt;
                    pos[iy] += b.velocities[iy] * dt;
                    pos[iz] += b.velocities[iz] * dt;
                }
                b.points.geometry.attributes.position.needsUpdate = true;
                b.points.material.opacity = Math.max(0, 1 - b.life / b.maxLife);
                if (b.life >= b.maxLife) {
                    ctx.scene.remove(b.points);
                    b.points.geometry.dispose();
                    b.points.material.dispose();
                    return false;
                }
                return true;
            });

            const baseX = 2.6 - ctx.pointer.x * 0.7 - ctx.scrollT * 1.4;
            const baseY = 1.7 + ctx.pointer.y * 0.35 + ctx.scrollT * 0.6;
            ctx.camera.position.x += (baseX - ctx.camera.position.x) * 0.05;
            ctx.camera.position.y += (baseY - ctx.camera.position.y) * 0.05;
            ctx.camera.lookAt(0, 1, 0);
        },
    });

    return scene3d;
}

initGasStationScene();
