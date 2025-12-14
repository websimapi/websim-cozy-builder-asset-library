import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export class World {
    constructor(container) {
        this.container = container;
        this.assets = [];
        
        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#8ecae6'); // Sky Blue
        this.scene.fog = new THREE.Fog('#8ecae6', 15, 60);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(8, 8, 8);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going under ground
        this.controls.minDistance = 2;
        this.controls.maxDistance = 30;

        // Environment
        this.setupLights();
        this.setupGround();
        
        // Listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Loop
        this.animate();
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xffffff, 1.5);
        sun.position.set(10, 20, 10);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 50;
        sun.shadow.camera.left = -20;
        sun.shadow.camera.right = 20;
        sun.shadow.camera.top = 20;
        sun.shadow.camera.bottom = -20;
        this.scene.add(sun);
    }

    setupGround() {
        // Soft Grass / Floor
        const geometry = new THREE.PlaneGeometry(100, 100);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xa8d5ba, // Pastel Green
            roughness: 0.9,
            metalness: 0.0
        });
        const ground = new THREE.Mesh(geometry, material);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Grid
        const grid = new THREE.GridHelper(50, 50, 0xffffff, 0xffffff);
        grid.material.opacity = 0.3;
        grid.material.transparent = true;
        grid.position.y = 0.01;
        this.scene.add(grid);
    }

    spawnAsset(asset) {
        if (!asset || !asset.url) return;

        // Random position near center
        const x = (Math.random() - 0.5) * 6;
        const z = (Math.random() - 0.5) * 6;

        // Try to infer extension for safer loader selection
        const ext = (
            asset.extension ||
            asset.url.split('.').pop().split('?')[0]
        || ''
        ).toLowerCase();

        if (asset.type === 'model') {
            // Decide loader based on extension
            if (ext === 'glb' || ext === 'gltf') {
                const loader = new GLTFLoader();
                loader.load(
                    asset.url,
                    (gltf) => {
                        const model = gltf.scene;
                        
                        // Auto-center and sit on floor
                        const box = new THREE.Box3().setFromObject(model);
                        const height = box.max.y - box.min.y;
                        const center = box.getCenter(new THREE.Vector3());
                        
                        model.position.sub(center); // Center pivot
                        model.position.y += height / 2; // Sit on ground

                        const wrapper = new THREE.Group();
                        wrapper.add(model);
                        wrapper.position.set(x, 0, z);
                        
                        // Shadow setup
                        model.traverse(node => {
                            if (node.isMesh) {
                                node.castShadow = true;
                                node.receiveShadow = true;
                            }
                        });

                        this.scene.add(wrapper);
                        this.assets.push(wrapper);
                    },
                    undefined,
                    (error) => {
                        console.error(
                            '[World.spawnAsset] Failed to load GLTF model:',
                            asset.url,
                            error
                        );
                    }
                );
            } else if (ext === 'fbx') {
                const loader = new FBXLoader();
                loader.load(
                    asset.url,
                    (object) => {
                        const model = object;

                        // Auto-center and sit on floor
                        const box = new THREE.Box3().setFromObject(model);
                        const height = box.max.y - box.min.y;
                        const center = box.getCenter(new THREE.Vector3());

                        model.position.sub(center); // Center pivot
                        model.position.y += height / 2; // Sit on ground

                        const wrapper = new THREE.Group();
                        wrapper.add(model);
                        wrapper.position.set(x, 0, z);

                        // Shadow setup
                        model.traverse(node => {
                            if (node.isMesh) {
                                node.castShadow = true;
                                node.receiveShadow = true;
                            }
                        });

                        this.scene.add(wrapper);
                        this.assets.push(wrapper);
                    },
                    undefined,
                    (error) => {
                        console.error(
                            '[World.spawnAsset] Failed to load FBX model:',
                            asset.url,
                            error
                        );
                    }
                );
            } else {
                console.warn(
                    '[World.spawnAsset] Unsupported model format:',
                    ext,
                    'from url:',
                    asset.url,
                    '— supported formats: .glb, .gltf, .fbx.'
                );
            }
        } 
        else if (asset.type === 'image' || asset.type === 'texture') {
            const loader = new THREE.TextureLoader();
            loader.load(asset.url, (tex) => {
                const aspect = tex.image.width / tex.image.height;
                const height = 2;
                const width = height * aspect;
                
                const geo = new THREE.PlaneGeometry(width, height);
                const mat = new THREE.MeshStandardMaterial({ 
                    map: tex, 
                    transparent: true,
                    side: THREE.DoubleSide
                });
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(x, height/2, z);
                mesh.castShadow = true;
                
                // Face camera initially (yaw only)
                const target = new THREE.Vector3(this.camera.position.x, mesh.position.y, this.camera.position.z);
                mesh.lookAt(target);
                
                this.scene.add(mesh);
                this.assets.push(mesh);
            });
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}