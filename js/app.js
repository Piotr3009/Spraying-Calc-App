// js/app.js
// =========================================================
// SPRAY PAINTING AREA & PRICE CALCULATOR - Advanced 3D Version
// Features: CSG-like Shaker, PBR Textures, Environment Lighting
// =========================================================

document.addEventListener('DOMContentLoaded', function() {
    // =========================================================
    // PRICE TABLE CONFIGURATION
    // =========================================================
    const priceTable = {
        "Flat": { internal: [25, 30, 35], external: [30, 36, 42] },
        "Shaker": { internal: [32, 38, 44], external: [38, 45, 52] },
        "Veneer": { internal: [28, 34, 40], external: [34, 41, 48] },
        "Timber": { internal: [35, 42, 49], external: [42, 50, 58] },
        "V-carve front (dense pattern)": { internal: [45, 54, 63], external: [54, 65, 76] },
        "Door frame": { internal: [30, 36, 42], external: [36, 43, 50] },
        "Sash window (3 elements)": { internal: [55, 66, 77], external: [66, 79, 92] },
        "3D furniture panel": { internal: [48, 58, 68], external: [58, 70, 82] }
    };

    // =========================================================
    // FACE SELECTION STATE
    // =========================================================
    const faces = {
        front:  { selected: true },
        back:   { selected: false },
        top:    { selected: false },
        bottom: { selected: false },
        left:   { selected: false },
        right:  { selected: false }
    };

    let projectElements = [];

    // =========================================================
    // DOM ELEMENT REFERENCES
    // =========================================================
    const projectNameInput = document.getElementById('projectName');
    const clientSiteInput = document.getElementById('clientSite');
    const colourNameInput = document.getElementById('colourName');
    const colourStandardRadios = document.querySelectorAll('input[name="colourStandard"]');
    const ralCodeField = document.getElementById('ralCodeField');
    const ralCodeInput = document.getElementById('ralCode');
    const paintManufacturerInput = document.getElementById('paintManufacturer');
    const paintLocationSelect = document.getElementById('paintLocation');
    const elementTypeSelect = document.getElementById('elementType');
    const pricePerM2Input = document.getElementById('pricePerM2');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const thicknessInput = document.getElementById('thickness');
    const addElementBtn = document.getElementById('addElementBtn');
    const resetProjectBtn = document.getElementById('resetProjectBtn');
    const legendItems = document.querySelectorAll('.legend-item');
    const legendCheckboxes = document.querySelectorAll('.legend-checkbox');
    const selectedFacesDisplay = document.getElementById('selectedFacesDisplay');
    const areaDisplay = document.getElementById('areaDisplay');
    const priceDisplay = document.getElementById('priceDisplay');
    const summaryBody = document.getElementById('summaryBody');
    const emptyState = document.getElementById('emptyState');
    const projectTotalDisplay = document.getElementById('projectTotal');
    const threeCanvas = document.getElementById('threeCanvas');

    const elementTypeError = document.getElementById('elementTypeError');
    const widthError = document.getElementById('widthError');
    const heightError = document.getElementById('heightError');
    const thicknessError = document.getElementById('thicknessError');
    const facesError = document.getElementById('facesError');
    const pricePerM2Error = document.getElementById('pricePerM2Error');

    const STORAGE_KEY = 'sprayCalcLastForm';

    // =========================================================
    // THREE.JS VARIABLES
    // =========================================================
    let scene, camera, renderer, controls;
    let doorGroup;
    let clickableMeshes = [];
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Cached textures
    let textureCache = {};

    // =========================================================
    // COLOR PALETTE
    // =========================================================
    const COLORS = {
        olive: 0x708238,
        oliveLight: 0x8a9f4a,
        oliveDark: 0x5a6a2d,
        mdfBase: 0xc4a574,
        mdfDark: 0xa88a5c,
        timberBase: 0x8b6914,
        timberDark: 0x6b4f0f,
        veneerBase: 0xdeb887,
        veneerDark: 0xc4a060
    };

    // =========================================================
    // TEXTURE GENERATOR CLASS
    // =========================================================
    class ProceduralTextureGenerator {
        constructor(width = 512, height = 512) {
            this.width = width;
            this.height = height;
        }

        createCanvas() {
            const canvas = document.createElement('canvas');
            canvas.width = this.width;
            canvas.height = this.height;
            return canvas;
        }

        // =====================================================
        // MDF TEXTURE WITH NORMAL MAP
        // =====================================================
        createMDFTextures() {
            const diffuse = this.createMDFDiffuse();
            const normal = this.createMDFNormal();
            const roughness = this.createMDFRoughness();
            return { diffuse, normal, roughness };
        }

        createMDFDiffuse() {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');

            // Base color gradient
            const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
            gradient.addColorStop(0, '#d4b896');
            gradient.addColorStop(0.5, '#c4a574');
            gradient.addColorStop(1, '#b89660');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width, this.height);

            // Fine MDF particle texture
            for (let i = 0; i < 50000; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const size = Math.random() * 2 + 0.5;
                const brightness = 160 + Math.random() * 60;
                const r = brightness;
                const g = brightness * 0.82;
                const b = brightness * 0.58;
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.random() * 0.3 + 0.1})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            // Subtle fiber lines
            ctx.strokeStyle = 'rgba(139, 105, 65, 0.1)';
            ctx.lineWidth = 0.5;
            for (let i = 0; i < 200; i++) {
                const y = Math.random() * this.height;
                ctx.beginPath();
                ctx.moveTo(0, y);
                for (let x = 0; x < this.width; x += 5) {
                    ctx.lineTo(x, y + Math.sin(x * 0.02) * 2 + (Math.random() - 0.5) * 2);
                }
                ctx.stroke();
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, 2);
            return texture;
        }

        createMDFNormal() {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');

            // Neutral normal map base (pointing up: 128, 128, 255)
            ctx.fillStyle = 'rgb(128, 128, 255)';
            ctx.fillRect(0, 0, this.width, this.height);

            // Add subtle bumps for MDF grain
            for (let i = 0; i < 20000; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const size = Math.random() * 3 + 1;
                
                // Random normal perturbation
                const nx = 128 + (Math.random() - 0.5) * 30;
                const ny = 128 + (Math.random() - 0.5) * 30;
                
                ctx.fillStyle = `rgb(${nx}, ${ny}, 245)`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, 2);
            return texture;
        }

        createMDFRoughness() {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');

            // Base roughness (lighter = rougher)
            ctx.fillStyle = 'rgb(180, 180, 180)';
            ctx.fillRect(0, 0, this.width, this.height);

            // Variation
            for (let i = 0; i < 10000; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const size = Math.random() * 4 + 1;
                const value = 150 + Math.random() * 60;
                ctx.fillStyle = `rgb(${value}, ${value}, ${value})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, 2);
            return texture;
        }

        // =====================================================
        // TIMBER/WOOD TEXTURE WITH NORMAL MAP
        // =====================================================
        createTimberTextures() {
            const diffuse = this.createTimberDiffuse();
            const normal = this.createTimberNormal();
            const roughness = this.createTimberRoughness();
            return { diffuse, normal, roughness };
        }

        createTimberDiffuse() {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');

            // Base wood color
            const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#a07830');
            gradient.addColorStop(0.3, '#8b6914');
            gradient.addColorStop(0.7, '#7a5c10');
            gradient.addColorStop(1, '#6b4f0f');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width, this.height);

            // Wood grain - main rings
            ctx.lineWidth = 2;
            for (let i = 0; i < 60; i++) {
                const y = i * (this.height / 50);
                const waveAmplitude = 3 + Math.random() * 4;
                const waveFreq = 0.01 + Math.random() * 0.02;
                const darkness = Math.random() * 0.4;
                
                ctx.strokeStyle = `rgba(80, 50, 10, ${0.3 + darkness})`;
                ctx.lineWidth = 1 + Math.random() * 2;
                ctx.beginPath();
                ctx.moveTo(0, y);
                
                for (let x = 0; x < this.width; x += 2) {
                    const offsetY = Math.sin(x * waveFreq) * waveAmplitude + 
                                   Math.sin(x * waveFreq * 2.5) * (waveAmplitude * 0.5);
                    ctx.lineTo(x, y + offsetY);
                }
                ctx.stroke();
            }

            // Fine grain lines
            ctx.lineWidth = 0.5;
            for (let i = 0; i < 150; i++) {
                const y = Math.random() * this.height;
                ctx.strokeStyle = `rgba(60, 40, 5, ${Math.random() * 0.2})`;
                ctx.beginPath();
                ctx.moveTo(0, y);
                for (let x = 0; x < this.width; x += 3) {
                    ctx.lineTo(x, y + Math.sin(x * 0.05) * 1.5 + (Math.random() - 0.5));
                }
                ctx.stroke();
            }

            // Wood knots
            for (let i = 0; i < 3; i++) {
                const knotX = 50 + Math.random() * (this.width - 100);
                const knotY = 50 + Math.random() * (this.height - 100);
                const knotSize = 15 + Math.random() * 25;
                
                // Knot center
                const knotGradient = ctx.createRadialGradient(
                    knotX, knotY, 0,
                    knotX, knotY, knotSize
                );
                knotGradient.addColorStop(0, '#3d2810');
                knotGradient.addColorStop(0.3, '#4a3015');
                knotGradient.addColorStop(0.7, '#5a3d18');
                knotGradient.addColorStop(1, '#6b4f0f');
                
                ctx.fillStyle = knotGradient;
                ctx.beginPath();
                ctx.ellipse(knotX, knotY, knotSize, knotSize * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
                ctx.fill();

                // Knot rings
                for (let r = 0; r < 5; r++) {
                    ctx.strokeStyle = `rgba(30, 20, 5, ${0.3 - r * 0.05})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.ellipse(knotX, knotY, knotSize * (0.3 + r * 0.15), knotSize * 0.7 * (0.3 + r * 0.15), 
                               Math.random() * 0.2, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            // Highlight streaks
            for (let i = 0; i < 30; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const len = 50 + Math.random() * 100;
                
                ctx.strokeStyle = `rgba(180, 140, 60, ${Math.random() * 0.15})`;
                ctx.lineWidth = 2 + Math.random() * 3;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + len, y + (Math.random() - 0.5) * 10);
                ctx.stroke();
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
            return texture;
        }

        createTimberNormal() {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');

            // Base normal
            ctx.fillStyle = 'rgb(128, 128, 255)';
            ctx.fillRect(0, 0, this.width, this.height);

            // Grain bumps - following wood grain direction
            for (let i = 0; i < 80; i++) {
                const y = i * (this.height / 60);
                const waveFreq = 0.01 + Math.random() * 0.015;
                
                ctx.strokeStyle = `rgb(${120 + Math.random() * 16}, ${128 + (Math.random() - 0.5) * 20}, 240)`;
                ctx.lineWidth = 2 + Math.random() * 3;
                ctx.beginPath();
                ctx.moveTo(0, y);
                
                for (let x = 0; x < this.width; x += 2) {
                    const offsetY = Math.sin(x * waveFreq) * 4;
                    ctx.lineTo(x, y + offsetY);
                }
                ctx.stroke();
            }

            // Fine detail
            for (let i = 0; i < 5000; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const nx = 128 + (Math.random() - 0.5) * 40;
                const ny = 128 + (Math.random() - 0.5) * 40;
                ctx.fillStyle = `rgb(${nx}, ${ny}, 250)`;
                ctx.fillRect(x, y, 2, 1);
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            return texture;
        }

        createTimberRoughness() {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');

            // Wood is moderately rough
            ctx.fillStyle = 'rgb(140, 140, 140)';
            ctx.fillRect(0, 0, this.width, this.height);

            // Grain variation in roughness
            for (let i = 0; i < 60; i++) {
                const y = i * (this.height / 50);
                ctx.strokeStyle = `rgb(${120 + Math.random() * 40}, ${120 + Math.random() * 40}, ${120 + Math.random() * 40})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, y);
                for (let x = 0; x < this.width; x += 5) {
                    ctx.lineTo(x, y + Math.sin(x * 0.02) * 3);
                }
                ctx.stroke();
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            return texture;
        }

        // =====================================================
        // VENEER TEXTURE WITH NORMAL MAP
        // =====================================================
        createVeneerTextures() {
            const diffuse = this.createVeneerDiffuse();
            const normal = this.createVeneerNormal();
            const roughness = this.createVeneerRoughness();
            return { diffuse, normal, roughness };
        }

        createVeneerDiffuse() {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');

            // Smooth veneer base
            const gradient = ctx.createLinearGradient(0, 0, this.width, 0);
            gradient.addColorStop(0, '#e8d4b8');
            gradient.addColorStop(0.5, '#deb887');
            gradient.addColorStop(1, '#d4a76a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width, this.height);

            // Elegant thin grain lines
            for (let i = 0; i < 100; i++) {
                const y = Math.random() * this.height;
                const alpha = 0.05 + Math.random() * 0.1;
                ctx.strokeStyle = `rgba(139, 90, 43, ${alpha})`;
                ctx.lineWidth = 0.5 + Math.random();
                ctx.beginPath();
                ctx.moveTo(0, y);
                for (let x = 0; x < this.width; x += 4) {
                    ctx.lineTo(x, y + Math.sin(x * 0.008) * 2);
                }
                ctx.stroke();
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1.5, 1.5);
            return texture;
        }

        createVeneerNormal() {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = 'rgb(128, 128, 255)';
            ctx.fillRect(0, 0, this.width, this.height);

            // Very subtle bumps for smooth veneer
            for (let i = 0; i < 3000; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const nx = 128 + (Math.random() - 0.5) * 15;
                const ny = 128 + (Math.random() - 0.5) * 15;
                ctx.fillStyle = `rgb(${nx}, ${ny}, 252)`;
                ctx.fillRect(x, y, 2, 1);
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1.5, 1.5);
            return texture;
        }

        createVeneerRoughness() {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');

            // Veneer is quite smooth (low roughness = darker)
            ctx.fillStyle = 'rgb(80, 80, 80)';
            ctx.fillRect(0, 0, this.width, this.height);

            // Slight variation
            for (let i = 0; i < 3000; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const value = 70 + Math.random() * 30;
                ctx.fillStyle = `rgb(${value}, ${value}, ${value})`;
                ctx.fillRect(x, y, 3, 3);
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1.5, 1.5);
            return texture;
        }

        // =====================================================
        // PAINTED SURFACE (OLIVE) TEXTURE
        // =====================================================
        createPaintedTextures() {
            const diffuse = this.createPaintedDiffuse();
            const normal = this.createPaintedNormal();
            const roughness = this.createPaintedRoughness();
            return { diffuse, normal, roughness };
        }

        createPaintedDiffuse() {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');

            // Olive base with subtle variation
            const gradient = ctx.createRadialGradient(
                this.width / 2, this.height / 2, 0,
                this.width / 2, this.height / 2, this.width * 0.7
            );
            gradient.addColorStop(0, '#7a9040');
            gradient.addColorStop(0.5, '#708238');
            gradient.addColorStop(1, '#667530');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width, this.height);

            // Paint texture - orange peel effect
            for (let i = 0; i < 8000; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const size = Math.random() * 3 + 1;
                const brightness = Math.random() * 20 - 10;
                const r = Math.min(255, Math.max(0, 112 + brightness));
                const g = Math.min(255, Math.max(0, 130 + brightness));
                const b = Math.min(255, Math.max(0, 56 + brightness));
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            return texture;
        }

        createPaintedNormal() {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = 'rgb(128, 128, 255)';
            ctx.fillRect(0, 0, this.width, this.height);

            // Orange peel bumps
            for (let i = 0; i < 6000; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const size = Math.random() * 4 + 2;
                
                const angle = Math.random() * Math.PI * 2;
                const strength = Math.random() * 25;
                const nx = 128 + Math.cos(angle) * strength;
                const ny = 128 + Math.sin(angle) * strength;
                
                ctx.fillStyle = `rgb(${nx}, ${ny}, 250)`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            return texture;
        }

        createPaintedRoughness() {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');

            // Satin finish paint (medium-low roughness)
            ctx.fillStyle = 'rgb(100, 100, 100)';
            ctx.fillRect(0, 0, this.width, this.height);

            for (let i = 0; i < 5000; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const size = Math.random() * 4 + 1;
                const value = 85 + Math.random() * 30;
                ctx.fillStyle = `rgb(${value}, ${value}, ${value})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            return texture;
        }
    }

    // =========================================================
    // ENVIRONMENT MAP GENERATOR
    // =========================================================
    class EnvironmentGenerator {
        static createStudioEnvironment(renderer) {
            const scene = new THREE.Scene();
            
            // Create gradient background
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            // Studio gradient - warm top, cool bottom
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#f5f0e8');    // Warm white top
            gradient.addColorStop(0.3, '#e8e4dc');
            gradient.addColorStop(0.5, '#d0d0d0');
            gradient.addColorStop(0.7, '#a0a5aa');
            gradient.addColorStop(1, '#606570');    // Cool gray bottom
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add some variation
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const radius = 50 + Math.random() * 100;
                const brightness = Math.random() * 30;
                
                const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                spotGradient.addColorStop(0, `rgba(255, 252, 245, ${0.1 + Math.random() * 0.1})`);
                spotGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = spotGradient;
                ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.mapping = THREE.EquirectangularReflectionMapping;

            // Generate PMREM
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();
            
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            pmremGenerator.dispose();
            
            return envMap;
        }
    }

    // =========================================================
    // SHAKER DOOR GEOMETRY BUILDER
    // =========================================================
    class ShakerDoorBuilder {
        constructor(width, height, thickness, frameWidth = 0.08, recessDepth = 0.015) {
            this.width = width;
            this.height = height;
            this.thickness = thickness;
            this.frameWidth = frameWidth;
            this.recessDepth = recessDepth;
        }

        build(materials, selectedFaces) {
            const group = new THREE.Group();
            const meshes = [];

            // Main back panel (full size, slightly thinner)
            const backPanelThickness = this.thickness - this.recessDepth;
            const backPanel = this.createBackPanel(backPanelThickness, materials, selectedFaces);
            group.add(backPanel);
            meshes.push({ mesh: backPanel, faces: ['back'] });

            // Recessed center panel
            const centerPanel = this.createCenterPanel(materials, selectedFaces);
            group.add(centerPanel);
            meshes.push({ mesh: centerPanel, faces: ['front'] });

            // Frame pieces (top, bottom, left, right)
            const framePieces = this.createFrame(materials, selectedFaces);
            framePieces.forEach(piece => {
                group.add(piece.mesh);
                meshes.push(piece);
            });

            // Side edges
            const sideEdges = this.createSideEdges(materials, selectedFaces);
            sideEdges.forEach(edge => {
                group.add(edge.mesh);
                meshes.push(edge);
            });

            return { group, meshes };
        }

        createBackPanel(thickness, materials, selectedFaces) {
            const geometry = new THREE.BoxGeometry(this.width, this.height, thickness);
            const material = selectedFaces.back ? materials.painted : materials.wood;
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.z = -thickness / 2;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            return mesh;
        }

        createCenterPanel(materials, selectedFaces) {
            const innerWidth = this.width - this.frameWidth * 2;
            const innerHeight = this.height - this.frameWidth * 2;
            const panelThickness = 0.005;

            const geometry = new THREE.BoxGeometry(innerWidth, innerHeight, panelThickness);
            const material = selectedFaces.front ? materials.painted : materials.wood;
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.z = this.thickness / 2 - this.recessDepth;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            return mesh;
        }

        createFrame(materials, selectedFaces) {
            const pieces = [];
            const frameThickness = this.recessDepth + 0.005;

            // Top frame
            const topGeometry = new THREE.BoxGeometry(this.width, this.frameWidth, frameThickness);
            const topMaterial = selectedFaces.front ? materials.painted : materials.wood;
            const topMesh = new THREE.Mesh(topGeometry, topMaterial);
            topMesh.position.set(0, this.height / 2 - this.frameWidth / 2, this.thickness / 2 - frameThickness / 2);
            topMesh.castShadow = true;
            pieces.push({ mesh: topMesh, faces: ['front', 'top'] });

            // Bottom frame
            const bottomGeometry = new THREE.BoxGeometry(this.width, this.frameWidth, frameThickness);
            const bottomMaterial = selectedFaces.front ? materials.painted : materials.wood;
            const bottomMesh = new THREE.Mesh(bottomGeometry, bottomMaterial);
            bottomMesh.position.set(0, -this.height / 2 + this.frameWidth / 2, this.thickness / 2 - frameThickness / 2);
            bottomMesh.castShadow = true;
            pieces.push({ mesh: bottomMesh, faces: ['front', 'bottom'] });

            // Left frame
            const leftGeometry = new THREE.BoxGeometry(this.frameWidth, this.height - this.frameWidth * 2, frameThickness);
            const leftMaterial = selectedFaces.front ? materials.painted : materials.wood;
            const leftMesh = new THREE.Mesh(leftGeometry, leftMaterial);
            leftMesh.position.set(-this.width / 2 + this.frameWidth / 2, 0, this.thickness / 2 - frameThickness / 2);
            leftMesh.castShadow = true;
            pieces.push({ mesh: leftMesh, faces: ['front', 'left'] });

            // Right frame
            const rightGeometry = new THREE.BoxGeometry(this.frameWidth, this.height - this.frameWidth * 2, frameThickness);
            const rightMaterial = selectedFaces.front ? materials.painted : materials.wood;
            const rightMesh = new THREE.Mesh(rightGeometry, rightMaterial);
            rightMesh.position.set(this.width / 2 - this.frameWidth / 2, 0, this.thickness / 2 - frameThickness / 2);
            rightMesh.castShadow = true;
            pieces.push({ mesh: rightMesh, faces: ['front', 'right'] });

            // Inner bevels (the sloped edges going into the recess)
            const bevelPieces = this.createInnerBevels(materials, selectedFaces);
            pieces.push(...bevelPieces);

            return pieces;
        }

        createInnerBevels(materials, selectedFaces) {
            const pieces = [];
            const bevelWidth = 0.015;
            const bevelDepth = this.recessDepth;
            const material = selectedFaces.front ? materials.painted : materials.wood;

            // Create bevel geometry (angled piece)
            const innerWidth = this.width - this.frameWidth * 2;
            const innerHeight = this.height - this.frameWidth * 2;

            // Top inner bevel
            const topBevelShape = new THREE.Shape();
            topBevelShape.moveTo(-innerWidth / 2, 0);
            topBevelShape.lineTo(innerWidth / 2, 0);
            topBevelShape.lineTo(innerWidth / 2 - bevelWidth, -bevelWidth);
            topBevelShape.lineTo(-innerWidth / 2 + bevelWidth, -bevelWidth);
            topBevelShape.closePath();

            const topBevelGeo = new THREE.ExtrudeGeometry(topBevelShape, {
                depth: bevelDepth,
                bevelEnabled: false
            });
            const topBevel = new THREE.Mesh(topBevelGeo, material);
            topBevel.rotation.x = Math.PI / 2;
            topBevel.position.set(0, innerHeight / 2, this.thickness / 2 - this.recessDepth);
            pieces.push({ mesh: topBevel, faces: ['front'] });

            // Bottom inner bevel
            const bottomBevel = new THREE.Mesh(topBevelGeo, material);
            bottomBevel.rotation.x = -Math.PI / 2;
            bottomBevel.rotation.z = Math.PI;
            bottomBevel.position.set(0, -innerHeight / 2, this.thickness / 2 - this.recessDepth);
            pieces.push({ mesh: bottomBevel, faces: ['front'] });

            // Left inner bevel
            const leftBevelShape = new THREE.Shape();
            leftBevelShape.moveTo(0, -innerHeight / 2 + bevelWidth);
            leftBevelShape.lineTo(0, innerHeight / 2 - bevelWidth);
            leftBevelShape.lineTo(bevelWidth, innerHeight / 2 - bevelWidth * 2);
            leftBevelShape.lineTo(bevelWidth, -innerHeight / 2 + bevelWidth * 2);
            leftBevelShape.closePath();

            const leftBevelGeo = new THREE.ExtrudeGeometry(leftBevelShape, {
                depth: bevelDepth,
                bevelEnabled: false
            });
            const leftBevel = new THREE.Mesh(leftBevelGeo, material);
            leftBevel.rotation.y = -Math.PI / 2;
            leftBevel.position.set(-innerWidth / 2, 0, this.thickness / 2 - this.recessDepth + bevelDepth);
            pieces.push({ mesh: leftBevel, faces: ['front'] });

            // Right inner bevel
            const rightBevel = new THREE.Mesh(leftBevelGeo, material);
            rightBevel.rotation.y = Math.PI / 2;
            rightBevel.position.set(innerWidth / 2, 0, this.thickness / 2 - this.recessDepth);
            pieces.push({ mesh: rightBevel, faces: ['front'] });

            return pieces;
        }

        createSideEdges(materials, selectedFaces) {
            const edges = [];
            const edgeDepth = this.thickness;

            // Top edge
            const topEdgeMaterial = selectedFaces.top ? materials.painted : materials.wood;
            const topEdgeGeo = new THREE.BoxGeometry(this.width, 0.001, edgeDepth);
            const topEdge = new THREE.Mesh(topEdgeGeo, topEdgeMaterial);
            topEdge.position.set(0, this.height / 2, 0);
            edges.push({ mesh: topEdge, faces: ['top'] });

            // Bottom edge
            const bottomEdgeMaterial = selectedFaces.bottom ? materials.painted : materials.wood;
            const bottomEdge = new THREE.Mesh(topEdgeGeo, bottomEdgeMaterial);
            bottomEdge.position.set(0, -this.height / 2, 0);
            edges.push({ mesh: bottomEdge, faces: ['bottom'] });

            // Left edge
            const leftEdgeMaterial = selectedFaces.left ? materials.painted : materials.wood;
            const leftEdgeGeo = new THREE.BoxGeometry(0.001, this.height, edgeDepth);
            const leftEdge = new THREE.Mesh(leftEdgeGeo, leftEdgeMaterial);
            leftEdge.position.set(-this.width / 2, 0, 0);
            edges.push({ mesh: leftEdge, faces: ['left'] });

            // Right edge
            const rightEdgeMaterial = selectedFaces.right ? materials.painted : materials.wood;
            const rightEdge = new THREE.Mesh(leftEdgeGeo, rightEdgeMaterial);
            rightEdge.position.set(this.width / 2, 0, 0);
            edges.push({ mesh: rightEdge, faces: ['right'] });

            return edges;
        }
    }

    // =========================================================
    // FLAT PANEL BUILDER
    // =========================================================
    class FlatPanelBuilder {
        constructor(width, height, thickness) {
            this.width = width;
            this.height = height;
            this.thickness = thickness;
        }

        build(materials, selectedFaces) {
            const group = new THREE.Group();
            const meshes = [];

            // Create materials array for BoxGeometry (6 faces)
            // Order: +X (right), -X (left), +Y (top), -Y (bottom), +Z (front), -Z (back)
            const materialArray = [
                selectedFaces.right ? materials.painted : materials.wood,   // right
                selectedFaces.left ? materials.painted : materials.wood,    // left
                selectedFaces.top ? materials.painted : materials.wood,     // top
                selectedFaces.bottom ? materials.painted : materials.wood,  // bottom
                selectedFaces.front ? materials.painted : materials.wood,   // front
                selectedFaces.back ? materials.painted : materials.wood     // back
            ];

            const geometry = new THREE.BoxGeometry(this.width, this.height, this.thickness);
            const mesh = new THREE.Mesh(geometry, materialArray);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Store face mapping for raycasting
            mesh.userData.faceMapping = {
                0: 'right',
                1: 'left',
                2: 'top',
                3: 'bottom',
                4: 'front',
                5: 'back'
            };

            group.add(mesh);
            meshes.push({ mesh, faces: Object.keys(selectedFaces) });

            return { group, meshes };
        }
    }

    // =========================================================
    // MATERIAL FACTORY
    // =========================================================
    class MaterialFactory {
        constructor(textureGenerator, envMap) {
            this.textureGenerator = textureGenerator;
            this.envMap = envMap;
            this.materialCache = {};
        }

        createMaterials(type) {
            const cacheKey = type;
            if (this.materialCache[cacheKey]) {
                return this.materialCache[cacheKey];
            }

            let woodTextures;
            switch (type) {
                case 'Timber':
                    woodTextures = this.textureGenerator.createTimberTextures();
                    break;
                case 'Veneer':
                    woodTextures = this.textureGenerator.createVeneerTextures();
                    break;
                default:
                    woodTextures = this.textureGenerator.createMDFTextures();
            }

            const paintedTextures = this.textureGenerator.createPaintedTextures();

            const materials = {
                wood: new THREE.MeshStandardMaterial({
                    map: woodTextures.diffuse,
                    normalMap: woodTextures.normal,
                    normalScale: new THREE.Vector2(0.5, 0.5),
                    roughnessMap: woodTextures.roughness,
                    roughness: 0.8,
                    metalness: 0.0,
                    envMap: this.envMap,
                    envMapIntensity: 0.3
                }),
                painted: new THREE.MeshStandardMaterial({
                    map: paintedTextures.diffuse,
                    normalMap: paintedTextures.normal,
                    normalScale: new THREE.Vector2(0.3, 0.3),
                    roughnessMap: paintedTextures.roughness,
                    roughness: 0.4,
                    metalness: 0.05,
                    envMap: this.envMap,
                    envMapIntensity: 0.5
                })
            };

            this.materialCache[cacheKey] = materials;
            return materials;
        }

        clearCache() {
            this.materialCache = {};
        }
    }

    // =========================================================
    // THREE.JS INITIALIZATION
    // =========================================================
    let textureGenerator;
    let materialFactory;
    let envMap;

    function initThreeJS() {
        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);

        // Camera
        const aspect = threeCanvas.clientWidth / threeCanvas.clientHeight;
        camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        camera.position.set(2.5, 1.5, 3);

        // Renderer
        renderer = new THREE.WebGLRenderer({ 
            canvas: threeCanvas, 
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(threeCanvas.clientWidth, threeCanvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        renderer.outputEncoding = THREE.sRGBEncoding;

        // Controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = 1.5;
        controls.maxDistance = 8;
        controls.maxPolarAngle = Math.PI * 0.85;
        controls.target.set(0, 0.5, 0);

        // Environment map
        envMap = EnvironmentGenerator.createStudioEnvironment(renderer);
        scene.environment = envMap;

        // Texture generator
        textureGenerator = new ProceduralTextureGenerator(512, 512);
        materialFactory = new MaterialFactory(textureGenerator, envMap);

        // Lighting setup
        setupLighting();

        // Floor
        createFloor();

        // Grid helper
        const gridHelper = new THREE.GridHelper(6, 12, 0x444455, 0x333344);
        gridHelper.position.y = 0.001;
        scene.add(gridHelper);

        // Create initial door
        createDoor();

        // Animation loop
        animate();

        // Event listeners
        window.addEventListener('resize', onWindowResize);
        threeCanvas.addEventListener('click', onCanvasClick);
        threeCanvas.addEventListener('mousemove', onCanvasMouseMove);
    }

    function setupLighting() {
        // Main key light
        const keyLight = new THREE.DirectionalLight(0xfff5eb, 1.0);
        keyLight.position.set(5, 8, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 25;
        keyLight.shadow.camera.left = -5;
        keyLight.shadow.camera.right = 5;
        keyLight.shadow.camera.top = 5;
        keyLight.shadow.camera.bottom = -5;
        keyLight.shadow.bias = -0.0005;
        scene.add(keyLight);

        // Fill light (cooler)
        const fillLight = new THREE.DirectionalLight(0xe0e8ff, 0.4);
        fillLight.position.set(-4, 4, -3);
        scene.add(fillLight);

        // Rim light
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
        rimLight.position.set(0, 3, -5);
        scene.add(rimLight);

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404050, 0.4);
        scene.add(ambientLight);

        // Hemisphere light for natural fill
        const hemiLight = new THREE.HemisphereLight(0xffeedd, 0x404040, 0.4);
        scene.add(hemiLight);
    }

    function createFloor() {
        const floorGeometry = new THREE.PlaneGeometry(10, 10);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x252530,
            roughness: 0.9,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);
    }

    function onWindowResize() {
        const width = threeCanvas.clientWidth;
        const height = threeCanvas.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    // =========================================================
    // CREATE DOOR MODEL
    // =========================================================
    function createDoor() {
        // Remove existing door
        if (doorGroup) {
            scene.remove(doorGroup);
            doorGroup.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }

        clickableMeshes = [];

        // Get dimensions (convert mm to scene units)
        const W = (parseFloat(widthInput.value) || 600) / 500;
        const H = (parseFloat(heightInput.value) || 400) / 500;
        const T = (parseFloat(thicknessInput.value) || 18) / 500;

        const elementType = elementTypeSelect.value || 'Flat';

        // Create materials
        const materials = materialFactory.createMaterials(elementType);

        // Get selected faces state
        const selectedFaces = {
            front: faces.front.selected,
            back: faces.back.selected,
            top: faces.top.selected,
            bottom: faces.bottom.selected,
            left: faces.left.selected,
            right: faces.right.selected
        };

        let result;

        // Build based on type
        switch (elementType) {
            case 'Shaker':
                const shakerBuilder = new ShakerDoorBuilder(W, H, T);
                result = shakerBuilder.build(materials, selectedFaces);
                break;
            default:
                const flatBuilder = new FlatPanelBuilder(W, H, T);
                result = flatBuilder.build(materials, selectedFaces);
        }

        doorGroup = result.group;
        doorGroup.position.y = H / 2 + 0.01;

        // Store clickable meshes
        result.meshes.forEach(item => {
            clickableMeshes.push(item.mesh);
        });

        scene.add(doorGroup);
    }

    // =========================================================
    // RAYCASTING
    // =========================================================
    let hoveredMesh = null;

    function onCanvasClick(event) {
        const rect = threeCanvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(clickableMeshes, true);

        if (intersects.length > 0) {
            const mesh = intersects[0].object;
            
            // Try to determine which face was clicked
            if (mesh.userData.faceMapping) {
                const faceIndex = Math.floor(intersects[0].faceIndex / 2);
                const faceName = mesh.userData.faceMapping[faceIndex];
                if (faceName) {
                    toggleFace(faceName);
                    return;
                }
            }

            // For complex geometry, use normal to determine face
            const normal = intersects[0].face.normal.clone();
            normal.transformDirection(mesh.matrixWorld);
            
            const faceName = normalToFaceName(normal);
            if (faceName) {
                toggleFace(faceName);
            }
        }
    }

    function onCanvasMouseMove(event) {
        const rect = threeCanvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(clickableMeshes, true);

        if (intersects.length > 0) {
            threeCanvas.style.cursor = 'pointer';
        } else {
            threeCanvas.style.cursor = 'grab';
        }
    }

    function normalToFaceName(normal) {
        const threshold = 0.7;
        
        if (normal.z > threshold) return 'front';
        if (normal.z < -threshold) return 'back';
        if (normal.y > threshold) return 'top';
        if (normal.y < -threshold) return 'bottom';
        if (normal.x > threshold) return 'right';
        if (normal.x < -threshold) return 'left';
        
        // For angled faces (bevels), check dominant direction
        if (Math.abs(normal.z) > Math.abs(normal.x) && Math.abs(normal.z) > Math.abs(normal.y)) {
            return normal.z > 0 ? 'front' : 'back';
        }
        
        return 'front'; // Default
    }

    // =========================================================
    // FACE TOGGLE & UI UPDATE
    // =========================================================
    function toggleFace(faceName) {
        faces[faceName].selected = !faces[faceName].selected;
        updateFaceUI();
        createDoor();
        updateCalculations();
    }

    function updateFaceUI() {
        legendItems.forEach(item => {
            const face = item.dataset.face;
            const checkbox = item.querySelector('.legend-checkbox');
            if (faces[face].selected) {
                item.classList.add('selected');
                if (checkbox) checkbox.checked = true;
            } else {
                item.classList.remove('selected');
                if (checkbox) checkbox.checked = false;
            }
        });

        const selectedFaceNames = Object.keys(faces)
            .filter(f => faces[f].selected)
            .map(f => f.charAt(0).toUpperCase() + f.slice(1));
        selectedFacesDisplay.textContent = selectedFaceNames.length > 0 
            ? selectedFaceNames.join(', ') 
            : 'None';

        if (selectedFaceNames.length === 0) {
            facesError.classList.add('visible');
        } else {
            facesError.classList.remove('visible');
        }
    }

    // =========================================================
    // CALCULATIONS
    // =========================================================
    function updateCalculations() {
        const W = parseFloat(widthInput.value) || 0;
        const H = parseFloat(heightInput.value) || 0;
        const T = parseFloat(thicknessInput.value) || 0;
        const pricePerM2 = parseFloat(pricePerM2Input.value) || 0;

        let totalArea = 0;
        if (faces.front.selected) totalArea += W * H;
        if (faces.back.selected) totalArea += W * H;
        if (faces.top.selected) totalArea += W * T;
        if (faces.bottom.selected) totalArea += W * T;
        if (faces.left.selected) totalArea += H * T;
        if (faces.right.selected) totalArea += H * T;

        const areaM2 = totalArea / 1000000;
        const price = areaM2 * pricePerM2;

        areaDisplay.textContent = areaM2.toFixed(3) + ' m²';
        priceDisplay.textContent = '£' + price.toFixed(2);
    }

    // =========================================================
    // VALIDATION
    // =========================================================
    function validateForm() {
        let isValid = true;

        if (!elementTypeSelect.value) {
            elementTypeSelect.classList.add('input-error');
            elementTypeError.classList.add('visible');
            isValid = false;
        }

        if (!pricePerM2Input.value || parseFloat(pricePerM2Input.value) <= 0) {
            pricePerM2Input.classList.add('input-error');
            pricePerM2Error.classList.add('visible');
            isValid = false;
        }

        if (!widthInput.value || parseFloat(widthInput.value) <= 0) {
            widthInput.classList.add('input-error');
            widthError.classList.add('visible');
            isValid = false;
        }
        if (!heightInput.value || parseFloat(heightInput.value) <= 0) {
            heightInput.classList.add('input-error');
            heightError.classList.add('visible');
            isValid = false;
        }
        if (!thicknessInput.value || parseFloat(thicknessInput.value) <= 0) {
            thicknessInput.classList.add('input-error');
            thicknessError.classList.add('visible');
            isValid = false;
        }

        const hasSelectedFace = Object.values(faces).some(f => f.selected);
        if (!hasSelectedFace) {
            facesError.classList.add('visible');
            isValid = false;
        }

        return isValid;
    }

    // =========================================================
    // ADD ELEMENT
    // =========================================================
    function addElement() {
        if (!validateForm()) return;

        const W = parseFloat(widthInput.value);
        const H = parseFloat(heightInput.value);
        const T = parseFloat(thicknessInput.value);

        let totalArea = 0;
        if (faces.front.selected) totalArea += W * H;
        if (faces.back.selected) totalArea += W * H;
        if (faces.top.selected) totalArea += W * T;
        if (faces.bottom.selected) totalArea += W * T;
        if (faces.left.selected) totalArea += H * T;
        if (faces.right.selected) totalArea += H * T;

        const areaM2 = totalArea / 1000000;
        const pricePerM2 = parseFloat(pricePerM2Input.value);
        const price = areaM2 * pricePerM2;

        const element = {
            id: Date.now(),
            type: elementTypeSelect.value,
            width: W,
            height: H,
            thickness: T,
            faces: Object.keys(faces).filter(f => faces[f].selected),
            area: areaM2,
            pricePerM2: pricePerM2,
            paintLocation: paintLocationSelect.value,
            price: price
        };

        projectElements.push(element);
        saveFormToStorage();
        renderSummaryTable();
        updateProjectTotal();

        widthInput.value = '';
        heightInput.value = '';
        thicknessInput.value = '';

        for (const face of Object.keys(faces)) {
            faces[face].selected = (face === 'front');
        }
        updateFaceUI();
        createDoor();
    }

    // =========================================================
    // SUMMARY TABLE
    // =========================================================
    function renderSummaryTable() {
        summaryBody.innerHTML = '';

        if (projectElements.length === 0) {
            emptyState.style.display = 'block';
            document.getElementById('summaryTable').style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        document.getElementById('summaryTable').style.display = 'table';

        projectElements.forEach((elem) => {
            const row = document.createElement('tr');
            const facesDisplay = elem.faces.map(f => f.charAt(0).toUpperCase()).join(', ');

            row.innerHTML = `
                <td>${elem.type}</td>
                <td>${elem.width} × ${elem.height} × ${elem.thickness}</td>
                <td title="${elem.faces.join(', ')}">${elem.faces.length} (${facesDisplay})</td>
                <td>${elem.area.toFixed(3)}</td>
                <td>${elem.paintLocation.charAt(0).toUpperCase() + elem.paintLocation.slice(1)}</td>
                <td class="price-cell">£${elem.price.toFixed(2)}</td>
                <td><button class="delete-btn" data-id="${elem.id}" title="Remove">✕</button></td>
            `;

            summaryBody.appendChild(row);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteElement(parseInt(this.dataset.id));
            });
        });
    }

    function deleteElement(id) {
        projectElements = projectElements.filter(e => e.id !== id);
        renderSummaryTable();
        updateProjectTotal();
    }

    function updateProjectTotal() {
        const total = projectElements.reduce((sum, elem) => sum + elem.price, 0);
        projectTotalDisplay.textContent = '£' + total.toFixed(2);
    }

    function resetProject() {
        if (projectElements.length > 0) {
            if (!confirm('Reset project? All elements will be removed.')) return;
        }
        projectElements = [];
        renderSummaryTable();
        updateProjectTotal();
    }

    // =========================================================
    // LOCAL STORAGE
    // =========================================================
    function loadFormFromStorage() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.projectName) projectNameInput.value = data.projectName;
                if (data.clientSite) clientSiteInput.value = data.clientSite;
                if (data.colourName) colourNameInput.value = data.colourName;
                if (data.colourStandard) {
                    const radio = document.querySelector(`input[name="colourStandard"][value="${data.colourStandard}"]`);
                    if (radio) radio.checked = true;
                    updateRalCodeVisibility();
                }
                if (data.ralCode) ralCodeInput.value = data.ralCode;
                if (data.paintManufacturer) paintManufacturerInput.value = data.paintManufacturer;
                if (data.paintLocation) paintLocationSelect.value = data.paintLocation;
                if (data.elementType) elementTypeSelect.value = data.elementType;
                if (data.pricePerM2) pricePerM2Input.value = data.pricePerM2;
            } catch (e) {
                console.warn('Failed to load form:', e);
            }
        }
    }

    function saveFormToStorage() {
        const data = {
            projectName: projectNameInput.value,
            clientSite: clientSiteInput.value,
            colourName: colourNameInput.value,
            colourStandard: document.querySelector('input[name="colourStandard"]:checked')?.value,
            ralCode: ralCodeInput.value,
            paintManufacturer: paintManufacturerInput.value,
            paintLocation: paintLocationSelect.value,
            elementType: elementTypeSelect.value,
            pricePerM2: pricePerM2Input.value
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function updateRalCodeVisibility() {
        const selected = document.querySelector('input[name="colourStandard"]:checked')?.value;
        ralCodeField.classList.toggle('visible', selected === 'RAL');
    }

    // =========================================================
    // EVENT LISTENERS
    // =========================================================
    colourStandardRadios.forEach(radio => {
        radio.addEventListener('change', updateRalCodeVisibility);
    });

    legendCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function(e) {
            e.stopPropagation();
            toggleFace(this.dataset.face);
        });
    });

    legendItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.target.type !== 'checkbox') {
                e.preventDefault();
                toggleFace(this.dataset.face);
            }
        });
    });

    [widthInput, heightInput, thicknessInput].forEach(input => {
        input.addEventListener('input', function() {
            createDoor();
            updateCalculations();
        });
    });

    elementTypeSelect.addEventListener('change', function() {
        materialFactory.clearCache();
        createDoor();
        updateCalculations();
        this.classList.remove('input-error');
        elementTypeError.classList.remove('visible');
    });

    pricePerM2Input.addEventListener('input', function() {
        updateCalculations();
        this.classList.remove('input-error');
        pricePerM2Error.classList.remove('visible');
    });

    paintLocationSelect.addEventListener('change', updateCalculations);
    addElementBtn.addEventListener('click', addElement);
    resetProjectBtn.addEventListener('click', resetProject);

    [widthInput, heightInput, thicknessInput].forEach((input, index) => {
        input.addEventListener('input', function() {
            this.classList.remove('input-error');
            [widthError, heightError, thicknessError][index].classList.remove('visible');
        });
    });

    // =========================================================
    // INITIALIZATION
    // =========================================================
    loadFormFromStorage();
    updateRalCodeVisibility();
    initThreeJS();
    updateFaceUI();
    renderSummaryTable();
    updateProjectTotal();
});