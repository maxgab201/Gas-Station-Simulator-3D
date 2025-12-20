// three-scene.js
import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, model, mixer;

function init() {
    // 1. Configuración de la escena
    const container = document.getElementById('three-container');
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Fondo negro para que se mezcle con el hero

    // 2. Configuración de la cámara
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 3); // Posición de la cámara ajustada // Posición inicial de la cámara

    // 3. Configuración del renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 4. Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // 5. Cargar el modelo 3D (Usaremos un cubo temporal si no hay modelo)
    const loader = new GLTFLoader();
    loader.load(
        './models/DamagedHelmet.glb', // Ruta al modelo GLB/GLTF
        function (gltf) {
            model = gltf.scene;
            model.scale.set(10, 10, 10); // Escala ajustada para el casco // Ajustar escala si es necesario
            model.position.set(0, 0, 0); // Posición del modelo
            scene.add(model);

            // Si el modelo tiene animaciones
            if (gltf.animations && gltf.animations.length) {
                mixer = new THREE.AnimationMixer(model);
                const action = mixer.clipAction(gltf.animations[0]);
                action.play();
            }
            
            animate(); // Iniciar el bucle de animación después de cargar el modelo
        },
        undefined,
        function (error) {
            console.error('Error al cargar el modelo GLTF:', error);
            // Si falla la carga, añadir un cubo temporal
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
            model = new THREE.Mesh(geometry, material);
            scene.add(model);
            animate(); // Iniciar el bucle de animación con el cubo
        }
    );

    // 6. Manejo de redimensionamiento
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    const container = document.getElementById('three-container');
    if (!container) return;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Rotación simple del modelo si no hay animaciones
    if (model && !mixer) {
        model.rotation.y += 0.005;
    }

    // Actualizar el mezclador de animaciones
    if (mixer) {
        mixer.update(delta);
    }

    renderer.render(scene, camera);
}

// Iniciar la escena
init();
