import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export class World {
    constructor(container, options = {}) {
        this.container = container;
        this.assets = [];
        this.sceneType = options.sceneType || 'outdoor';
        this.plotSize = Math.max(6, options.plotSize || 10);

        this.placementAsset = null;
        this.previewMesh = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

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
        this.ground = null;
        this.grid = null;
        this.wallsGroup = null;
        this.setupLights();
        this.updateEnvironment(this.sceneType, this.plotSize);

        // Pointer interaction for placement
        this._handlePointerMove = this.handlePointerMove.bind(this);
        this._handleClick = this.handleClick.bind(this);
        this.renderer.domElement.addEventListener('pointermove', this._handlePointerMove);
        this.renderer.domElement.addEventListener('click', this._handleClick);

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

    // Remove old environment meshes safely
    clearEnvironment() {
        const removeMesh = (mesh) => {
            if (!mesh) return;
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(m => m.dispose && m.dispose());
                } else {
                    mesh.material.dispose && mesh.material.dispose();
                }
            }
        };

        removeMesh(this.ground);
        this.ground = null;

        if (this.grid) {
            this.scene.remove(this.grid);
            this.grid = null;
        }

        if (this.wallsGroup) {
            this.scene.remove(this.wallsGroup);
            this.wallsGroup.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose && child.material.dispose();
                }
            });
            this.wallsGroup = null;
        }
    }

    setupOutdoor() {
        const size = this.plotSize;

        // Ground
        const geometry = new THREE.PlaneGeometry(size, size);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xa8d5ba, // Pastel Green
            roughness: 0.9,
            metalness: 0.0
        });
        const ground = new THREE.Mesh(geometry, material);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.ground = ground;

        // Grid centered on origin
        const divisions = Math.max(6, Math.round(size));
        const grid = new THREE.GridHelper(size, divisions, 0xffffff, 0xffffff);
        grid.material.opacity = 0.3;
        grid.material.transparent = true;
        grid.position.y = 0.01;
        this.scene.add(grid);
        this.grid = grid;
    }

    setupIndoor() {
        const size = this.plotSize;
        const wallHeight = 3;
        const wallThickness = 0.2;
        const doorWidth = Math.min(size * 0.4, 3);
        const doorHeight = 2.2;

        // Floor
        const floorGeo = new THREE.PlaneGeometry(size, size);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0xd1d5db, // light grey
            roughness: 0.9,
            metalness: 0.0
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
        this.ground = floor;

        // Grid on floor for placement
        const divisions = Math.max(6, Math.round(size));
        const grid = new THREE.GridHelper(size, divisions, 0x9ca3af, 0x9ca3af);
        grid.material.opacity = 0.3;
        grid.material.transparent = true;
        grid.position.y = 0.01;
        this.scene.add(grid);
        this.grid = grid;

        // Walls
        const walls = new THREE.Group();
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0xe5e7eb,
            roughness: 0.8,
            metalness: 0.0
        });

        // Back wall (no door) - along X axis at -Z
        const backGeo = new THREE.BoxGeometry(size, wallHeight, wallThickness);
        const backWall = new THREE.Mesh(backGeo, wallMat);
        backWall.position.set(0, wallHeight / 2, -size / 2);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        walls.add(backWall);

        // Left wall (no door) - along Z axis at -X
        const leftGeo = new THREE.BoxGeometry(wallThickness, wallHeight, size);
        const leftWall = new THREE.Mesh(leftGeo, wallMat);
        leftWall.position.set(-size / 2, wallHeight / 2, 0);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        walls.add(leftWall);

        // Right wall (no door) - along Z axis at +X
        const rightGeo = new THREE.BoxGeometry(wallThickness, wallHeight, size);
        const rightWall = new THREE.Mesh(rightGeo, wallMat);
        rightWall.position.set(size / 2, wallHeight / 2, 0);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        walls.add(rightWall);

        // Front wall with doorway: two segments
        const sideLength = (size - doorWidth) / 2;

        if (sideLength > 0) {
            const frontSideGeo = new THREE.BoxGeometry(sideLength, wallHeight, wallThickness);

            // Left front segment
            const frontLeft = new THREE.Mesh(frontSideGeo, wallMat);
            frontLeft.position.set(-size / 2 + sideLength / 2, wallHeight / 2, size / 2);
            frontLeft.castShadow = true;
            frontLeft.receiveShadow = true;
            walls.add(frontLeft);

            // Right front segment
            const frontRight = new THREE.Mesh(frontSideGeo, wallMat);
            frontRight.position.set(size / 2 - sideLength / 2, wallHeight / 2, size / 2);
            frontRight.castShadow = true;
            frontRight.receiveShadow = true;
            walls.add(frontRight);
        }

        // Optional header above door (to avoid full floor-to-ceiling gap)
        if (doorHeight < wallHeight) {
            const headerHeight = wallHeight - doorHeight;
            const headerGeo = new THREE.BoxGeometry(doorWidth, headerHeight, wallThickness);
            const header = new THREE.Mesh(headerGeo, wallMat);
            header.position.set(0, wallHeight - headerHeight / 2, size / 2);
            header.castShadow = true;
            header.receiveShadow = true;
            walls.add(header);
        }

        this.scene.add(walls);
        this.wallsGroup = walls;
    }

    updateEnvironment(sceneType, plotSize) {
        this.sceneType = sceneType || this.sceneType;
        this.plotSize = Math.max(6, plotSize || this.plotSize);

        this.clearEnvironment();

        if (this.sceneType === 'indoor') {
            this.setupIndoor();
        } else {
            this.setupOutdoor();
        }

        if (this.placementAsset) {
            this.ensurePlacementPreview();
        }
    }

    setPlacementAsset(asset) {
        this.placementAsset = asset || null;
        if (this.placementAsset) {
            this.ensurePlacementPreview();
        } else {
            this.hidePlacementPreview();
        }
    }

    ensurePlacementPreview() {
        if (this.previewMesh) {
            this.previewMesh.visible = true;
            return;
        }

        const size = 1;
        const geo = new THREE.PlaneGeometry(size, size);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x38b2ac,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const preview = new THREE.Mesh(geo, mat);
        preview.rotation.x = -Math.PI / 2;
        preview.position.y = 0.02;
        preview.visible = false;
        this.scene.add(preview);
        this.previewMesh = preview;
    }

    hidePlacementPreview() {
        if (this.previewMesh) {
            this.previewMesh.visible = false;
        }
    }

    handlePointerMove(event) {
        if (!this.placementAsset || !this.ground || !this.previewMesh) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.ground, false);

        if (intersects.length > 0) {
            const point = intersects[0].point;

            // clamp to plotSize area
            const half = this.plotSize / 2;
            let x = THREE.MathUtils.clamp(point.x, -half, half);
            let z = THREE.MathUtils.clamp(point.z, -half, half);

            // optional simple grid snap
            const snap = 0.5;
            x = Math.round(x / snap) * snap;
            z = Math.round(z / snap) * snap;

            this.previewMesh.position.set(x, 0.02, z);
            this.previewMesh.visible = true;
        } else {
            this.previewMesh.visible = false;
        }
    }

    handleClick(event) {
        if (!this.placementAsset || !this.ground) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.ground, false);

        if (intersects.length > 0) {
            const point = intersects[0].point;

            const half = this.plotSize / 2;
            let x = THREE.MathUtils.clamp(point.x, -half, half);
            let z = THREE.MathUtils.clamp(point.z, -half, half);

            const snap = 0.5;
            x = Math.round(x / snap) * snap;
            z = Math.round(z / snap) * snap;

            const spawnPoint = new THREE.Vector3(x, 0, z);
            this.spawnAssetAt(this.placementAsset, spawnPoint);

            // clear placement after one placement
            this.setPlacementAsset(null);
        }
    }

    spawnAsset(asset) {
        if (!asset || !asset.url) return;

        const half = this.plotSize / 2 - 1;
        const x = (Math.random() * 2 - 1) * half;
        const z = (Math.random() * 2 - 1) * half;
        const point = new THREE.Vector3(x, 0, z);

        this.spawnAssetAt(asset, point);
    }

    spawnAssetAt(asset, position) {
        if (!asset || !asset.url || !position) return;

        // Try to infer extension for safer loader selection
        const ext = (
            asset.extension ||
            asset.url.split('.').pop().split('?')[0] ||
            ''
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
                        wrapper.position.set(position.x, 0, position.z);
                        
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
                        wrapper.position.set(position.x, 0, position.z);

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
                mesh.position.set(position.x, height / 2, position.z);
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