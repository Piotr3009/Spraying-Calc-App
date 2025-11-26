// js/app.js
// =========================================================
// SPRAY PAINTING AREA & PRICE CALCULATOR - Advanced 3D Version
// Features: All wood types, Door Frame, Shaker, RAL Colors, PBR Textures
// Environment Lighting, Material Caching
// =========================================================

document.addEventListener('DOMContentLoaded', function() {
    // =========================================================
    // PRICE TABLE CONFIGURATION
    // =========================================================
    const priceTable = {
        "MDF": { internal: [22, 27, 32], external: [27, 33, 39] },
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
    // RAL COLOR DATABASE
    // =========================================================
    const RAL_COLORS = {
        '1000': 0xCDBA88, '1001': 0xD0B084, '1002': 0xD2AA6D, '1003': 0xF9A800,
        '1004': 0xE49E00, '1005': 0xCB8E00, '1006': 0xE29000, '1007': 0xE88C00,
        '1011': 0xAF804F, '1012': 0xDDBB4F, '1013': 0xE8E4CD, '1014': 0xDDCEA4,
        '1015': 0xE6D2B5, '1016': 0xF1DD38, '1017': 0xF6A950, '1018': 0xFACA30,
        '1019': 0xA48F7A, '1020': 0xA08F65, '1021': 0xEEC900, '1023': 0xF0CA00,
        '1024': 0xBB8B41, '1026': 0xFFFF00, '1027': 0xA77F0E, '1028': 0xFFAB00,
        '1032': 0xE2A300, '1033': 0xF99A1C, '1034': 0xEB9C52, '1035': 0x908370,
        '1036': 0x927549, '1037': 0xEEA205, '2000': 0xDD7907, '2001': 0xBE4E20,
        '2002': 0xC63927, '2003': 0xFA842B, '2004': 0xE75B12, '2005': 0xFF2300,
        '2007': 0xFFA421, '2008': 0xED6B21, '2009': 0xDE5307, '2010': 0xD4652F,
        '2011': 0xEC7C25, '2012': 0xDB6A50, '2013': 0x954527, '3000': 0xAB2524,
        '3001': 0xA02128, '3002': 0xA1232B, '3003': 0x8D1D2C, '3004': 0x6C1C24,
        '3005': 0x5E2028, '3007': 0x402225, '3009': 0x703731, '3011': 0x7E292C,
        '3012': 0xCC8273, '3013': 0x9C322E, '3014': 0xD47479, '3015': 0xE1A6AD,
        '3016': 0xAC4034, '3017': 0xD3545F, '3018': 0xD14152, '3020': 0xC1121C,
        '3022': 0xD56D56, '3024': 0xF70000, '3026': 0xFE0000, '3027': 0xB42041,
        '3028': 0xE72512, '3031': 0xAC323B, '3032': 0x711521, '3033': 0xB24C43,
        '4001': 0x8A5A83, '4002': 0x933D50, '4003': 0xD15B8F, '4004': 0x6B1C3F,
        '4005': 0x83639D, '4006': 0x992572, '4007': 0x4A203B, '4008': 0x904684,
        '4009': 0xA38995, '4010': 0xC63678, '4011': 0x8773A1, '4012': 0x6B6880,
        '5000': 0x384C70, '5001': 0x1F4764, '5002': 0x2B2C7C, '5003': 0x2A3756,
        '5004': 0x1D1F2A, '5005': 0x154889, '5007': 0x41678D, '5008': 0x313C48,
        '5009': 0x2E5978, '5010': 0x13447C, '5011': 0x232C3F, '5012': 0x3481B8,
        '5013': 0x232D53, '5014': 0x6C7C98, '5015': 0x2874B2, '5017': 0x0E518D,
        '5018': 0x21888F, '5019': 0x1A5784, '5020': 0x0B4151, '5021': 0x07737A,
        '5022': 0x2F2A5A, '5023': 0x4D668E, '5024': 0x6A93B0, '5025': 0x296478,
        '5026': 0x102C54, '6000': 0x327662, '6001': 0x28713E, '6002': 0x276235,
        '6003': 0x4B573E, '6004': 0x0E4243, '6005': 0x0F4336, '6006': 0x40433B,
        '6007': 0x283424, '6008': 0x35382E, '6009': 0x26392F, '6010': 0x4D6F39,
        '6011': 0x6C7C59, '6012': 0x31403D, '6013': 0x7D765A, '6014': 0x474135,
        '6015': 0x3D403A, '6016': 0x026A52, '6017': 0x468641, '6018': 0x48A43F,
        '6019': 0xB7D9B1, '6020': 0x354733, '6021': 0x86A47C, '6022': 0x3E3C32,
        '6024': 0x008754, '6025': 0x53753C, '6026': 0x005D52, '6027': 0x81C0BB,
        '6028': 0x2D5546, '6029': 0x007243, '6032': 0x0F8558, '6033': 0x478A84,
        '6034': 0x7FB0B2, '6035': 0x1B542C, '6036': 0x005D4C, '6037': 0x25E712,
        '6038': 0x00F700, '7000': 0x7E8B92, '7001': 0x8F999F, '7002': 0x817F68,
        '7003': 0x7A7B6D, '7004': 0x9EA0A1, '7005': 0x6B716F, '7006': 0x756F61,
        '7008': 0x746643, '7009': 0x5B6259, '7010': 0x575D57, '7011': 0x555D61,
        '7012': 0x596163, '7013': 0x575044, '7015': 0x51565C, '7016': 0x373F43,
        '7021': 0x2E3234, '7022': 0x4B4D46, '7023': 0x818479, '7024': 0x474A50,
        '7026': 0x374447, '7030': 0x939388, '7031': 0x5D6970, '7032': 0xB9B9A8,
        '7033': 0x818979, '7034': 0x939176, '7035': 0xD0D0CD, '7036': 0x9A9697,
        '7037': 0x7C7F7E, '7038': 0xB4B8B0, '7039': 0x6B645F, '7040': 0x9DA3A6,
        '7042': 0x8F9695, '7043': 0x4E5451, '7044': 0xBAB8B1, '7045': 0x91969A,
        '7046': 0x82898E, '7047': 0xD5D6D3, '7048': 0x888175, '8000': 0x89693F,
        '8001': 0x9C6B30, '8002': 0x7B5141, '8003': 0x80542F, '8004': 0x8F4E35,
        '8007': 0x6F4A2F, '8008': 0x6F4F28, '8011': 0x5A3A29, '8012': 0x673831,
        '8014': 0x49392D, '8015': 0x633A34, '8016': 0x4C2F26, '8017': 0x44322D,
        '8019': 0x3D3635, '8022': 0x1A1718, '8023': 0xA65E2F, '8024': 0x79553C,
        '8025': 0x755C49, '8028': 0x4E3B2D, '8029': 0x76513F, '9001': 0xFDF4E3,
        '9002': 0xE7EBDA, '9003': 0xF4F4F4, '9004': 0x282828, '9005': 0x0A0A0A,
        '9006': 0xA5A5A5, '9007': 0x8F8F8F, '9010': 0xFAFAFA, '9011': 0x1C1C1C,
        '9012': 0xFFFDE6, '9016': 0xF7FBF5, '9017': 0x1E1E1E, '9018': 0xCFD3CD,
        '9022': 0x9C9C9C, '9023': 0x7E8182
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
    const ralSelect = document.getElementById('ralSelect');
    const sheenSlider = document.getElementById('sheenSlider');
    const sheenValue = document.getElementById('sheenValue');
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

    // =========================================================
    // GET SELECTED PAINT COLOR
    // =========================================================
    function getSelectedPaintColor() {
        const colourStandard = document.querySelector('input[name="colourStandard"]:checked')?.value;
        if (colourStandard === 'RAL') {
            const ralCode = ralCodeInput.value.trim();
            if (ralCode && RAL_COLORS[ralCode]) {
                return RAL_COLORS[ralCode];
            }
        }
        return 0x708238; // Default olive
    }

    // =========================================================
    // GET SHEEN LEVEL (0-100 -> roughness 1.0-0.0)
    // =========================================================
    function getSheen() {
        const sheenPercent = parseInt(sheenSlider?.value || 30);
        // 0% sheen = 1.0 roughness (total matt)
        // 100% sheen = 0.0 roughness (mirror)
        return 1.0 - (sheenPercent / 100);
    }

    // =========================================================
    // PROCEDURAL TEXTURE GENERATOR CLASS
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
        // SAPELE WOOD TEXTURE (Primary wood - reddish brown)
        // =====================================================
        createSapeleTextures() {
            const diffuse = this.createSapeleDiffuse();
            const normal = this.createSapeleNormal();
            const roughness = this.createSapeleRoughness();
            return { diffuse, normal, roughness };
        }

        createSapeleDiffuse() {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');

            // Base sapele color - reddish brown
            const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#a0583c');
            gradient.addColorStop(0.25, '#8b4532');
            gradient.addColorStop(0.5, '#7a3d2c');
            gradient.addColorStop(0.75, '#8b4532');
            gradient.addColorStop(1, '#a0583c');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width, this.height);

            // Interlocked grain pattern (characteristic of sapele)
            for (let i = 0; i < 80; i++) {
                const y = i * (this.height / 60);
                const waveAmplitude = 2 + Math.random() * 3;
                const waveFreq = 0.008 + Math.random() * 0.012;
                const phase = Math.random() * Math.PI * 2;
                
                // Alternating light/dark bands (ribbon stripe)
                const bandDarkness = (Math.floor(i / 4) % 2 === 0) ? 0.15 : -0.1;
                const baseColor = bandDarkness > 0 ? 
                    `rgba(60, 30, 20, ${0.2 + bandDarkness})` : 
                    `rgba(180, 120, 80, ${Math.abs(bandDarkness)})`;
                
                ctx.strokeStyle = baseColor;
                ctx.lineWidth = 2 + Math.random() * 2;
                ctx.beginPath();
                ctx.moveTo(0, y);
                
                for (let x = 0; x < this.width; x += 2) {
                    const offsetY = Math.sin(x * waveFreq + phase) * waveAmplitude;
                    ctx.lineTo(x, y + offsetY);
                }
                ctx.stroke();
            }

            // Fine grain detail
            ctx.lineWidth = 0.5;
            for (let i = 0; i < 200; i++) {
                const y = Math.random() * this.height;
                ctx.strokeStyle = `rgba(50, 25, 15, ${Math.random() * 0.15})`;
                ctx.beginPath();
                ctx.moveTo(0, y);
                for (let x = 0; x < this.width; x += 3) {
                    ctx.lineTo(x, y + Math.sin(x * 0.03) * 1 + (Math.random() - 0.5));
                }
                ctx.stroke();
            }

            // Pores
            for (let i = 0; i < 3000; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const size = Math.random() * 1.5 + 0.3;
                ctx.fillStyle = `rgba(40, 20, 10, ${Math.random() * 0.3})`;
                ctx.beginPath();
                ctx.ellipse(x, y, size, size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // Highlight streaks
            for (let i = 0; i < 40; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const len = 30 + Math.random() * 80;
                ctx.strokeStyle = `rgba(200, 140, 100, ${Math.random() * 0.12})`;
                ctx.lineWidth = 1 + Math.random() * 2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + len, y + (Math.random() - 0.5) * 5);
                ctx.stroke();
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            return texture;
        }

        createSapeleNormal() {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = 'rgb(128, 128, 255)';
            ctx.fillRect(0, 0, this.width, this.height);

            // Grain bumps
            for (let i = 0; i < 100; i++) {
                const y = i * (this.height / 70);
                const waveFreq = 0.01 + Math.random() * 0.01;
                const nx = 128 + (Math.random() - 0.5) * 20;
                ctx.strokeStyle = `rgb(${nx}, 128, 245)`;
                ctx.lineWidth = 2 + Math.random() * 2;
                ctx.beginPath();
                ctx.moveTo(0, y);
                for (let x = 0; x < this.width; x += 2) {
                    const offsetY = Math.sin(x * waveFreq) * 3;
                    ctx.lineTo(x, y + offsetY);
                }
                ctx.stroke();
            }

            // Pore bumps
            for (let i = 0; i < 2000; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const nx = 128 + (Math.random() - 0.5) * 30;
                const ny = 128 + (Math.random() - 0.5) * 30;
                ctx.fillStyle = `rgb(${nx}, ${ny}, 250)`;
                ctx.fillRect(x, y, 2, 1);
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            return texture;
        }

        createSapeleRoughness() {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = 'rgb(120, 120, 120)';
            ctx.fillRect(0, 0, this.width, this.height);

            for (let i = 0; i < 80; i++) {
                const y = i * (this.height / 60);
                const bandValue = (Math.floor(i / 4) % 2 === 0) ? 130 : 110;
                ctx.strokeStyle = `rgb(${bandValue}, ${bandValue}, ${bandValue})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, y);
                for (let x = 0; x < this.width; x += 5) {
                    ctx.lineTo(x, y + Math.sin(x * 0.01) * 2);
                }
                ctx.stroke();
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            return texture;
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

            // Use sapele-like color for MDF
            const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
            gradient.addColorStop(0, '#a86040');
            gradient.addColorStop(0.5, '#955538');
            gradient.addColorStop(1, '#a86040');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width, this.height);

            // Fine MDF particle texture
            for (let i = 0; i < 50000; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const size = Math.random() * 2 + 0.5;
                const brightness = 130 + Math.random() * 40;
                const r = brightness;
                const g = brightness * 0.65;
                const b = brightness * 0.45;
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.random() * 0.3 + 0.1})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            // Subtle fiber lines
            ctx.strokeStyle = 'rgba(80, 40, 25, 0.1)';
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

            ctx.fillStyle = 'rgb(128, 128, 255)';
            ctx.fillRect(0, 0, this.width, this.height);

            for (let i = 0; i < 20000; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const size = Math.random() * 3 + 1;
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

            ctx.fillStyle = 'rgb(180, 180, 180)';
            ctx.fillRect(0, 0, this.width, this.height);

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

            // Sapele-like base wood color
            const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#a55540');
            gradient.addColorStop(0.3, '#8b4532');
            gradient.addColorStop(0.7, '#7a3d2c');
            gradient.addColorStop(1, '#8b4532');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width, this.height);

            // Wood grain - main rings
            ctx.lineWidth = 2;
            for (let i = 0; i < 60; i++) {
                const y = i * (this.height / 50);
                const waveAmplitude = 3 + Math.random() * 4;
                const waveFreq = 0.01 + Math.random() * 0.02;
                const darkness = Math.random() * 0.4;
                
                ctx.strokeStyle = `rgba(50, 25, 15, ${0.3 + darkness})`;
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
                ctx.strokeStyle = `rgba(40, 20, 10, ${Math.random() * 0.2})`;
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
                
                const knotGradient = ctx.createRadialGradient(
                    knotX, knotY, 0,
                    knotX, knotY, knotSize
                );
                knotGradient.addColorStop(0, '#3d2515');
                knotGradient.addColorStop(0.3, '#4a3020');
                knotGradient.addColorStop(0.7, '#5a3d28');
                knotGradient.addColorStop(1, '#7a4532');
                
                ctx.fillStyle = knotGradient;
                ctx.beginPath();
                ctx.ellipse(knotX, knotY, knotSize, knotSize * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
                ctx.fill();

                // Knot rings
                for (let r = 0; r < 5; r++) {
                    ctx.strokeStyle = `rgba(30, 15, 8, ${0.3 - r * 0.05})`;
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
                
                ctx.strokeStyle = `rgba(200, 150, 100, ${Math.random() * 0.15})`;
                ctx.lineWidth = 2 + Math.random() * 3;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + len, y + (Math.random() - 0.5) * 10);
                ctx.stroke();
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            return texture;
        }

        createTimberNormal() {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = 'rgb(128, 128, 255)';
            ctx.fillRect(0, 0, this.width, this.height);

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

            ctx.fillStyle = 'rgb(140, 140, 140)';
            ctx.fillRect(0, 0, this.width, this.height);

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

            // Sapele veneer - smoother, more refined
            const gradient = ctx.createLinearGradient(0, 0, this.width, 0);
            gradient.addColorStop(0, '#b06048');
            gradient.addColorStop(0.5, '#9a5038');
            gradient.addColorStop(1, '#a85840');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width, this.height);

            // Elegant thin grain lines
            for (let i = 0; i < 100; i++) {
                const y = Math.random() * this.height;
                const alpha = 0.05 + Math.random() * 0.1;
                ctx.strokeStyle = `rgba(60, 30, 20, ${alpha})`;
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

            ctx.fillStyle = 'rgb(80, 80, 80)';
            ctx.fillRect(0, 0, this.width, this.height);

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
        // PAINTED SURFACE TEXTURE (with selected color)
        // =====================================================
        createPaintedTextures(colorHex) {
            const diffuse = this.createPaintedDiffuse(colorHex);
            const normal = this.createPaintedNormal();
            const roughness = this.createPaintedRoughness();
            return { diffuse, normal, roughness };
        }

        hexToRgb(hex) {
            const r = (hex >> 16) & 255;
            const g = (hex >> 8) & 255;
            const b = hex & 255;
            return { r, g, b };
        }

        createPaintedDiffuse(colorHex) {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');
            const rgb = this.hexToRgb(colorHex);

            // Pure flat color - no lightening
            ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            ctx.fillRect(0, 0, this.width, this.height);

            // Very minimal noise for realism
            for (let i = 0; i < 500; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const brightness = Math.random() * 6 - 3;
                const r = Math.min(255, Math.max(0, rgb.r + brightness));
                const g = Math.min(255, Math.max(0, rgb.g + brightness));
                const b = Math.min(255, Math.max(0, rgb.b + brightness));
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.05)`;
                ctx.fillRect(x, y, 1, 1);
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            return texture;
        }

        createPaintedNormal() {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');

            // Almost flat normal map - very subtle variation
            ctx.fillStyle = 'rgb(128, 128, 255)';
            ctx.fillRect(0, 0, this.width, this.height);

            // Minimal surface variation
            for (let i = 0; i < 500; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const nx = 128 + (Math.random() - 0.5) * 4;
                const ny = 128 + (Math.random() - 0.5) * 4;
                ctx.fillStyle = `rgb(${nx}, ${ny}, 254)`;
                ctx.fillRect(x, y, 2, 2);
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            return texture;
        }

        createPaintedRoughness() {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');

            // Smooth satin finish - 25% sheen
            ctx.fillStyle = 'rgb(180, 180, 180)';
            ctx.fillRect(0, 0, this.width, this.height);

            // Very uniform roughness
            for (let i = 0; i < 500; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const value = 175 + Math.random() * 10;
                ctx.fillStyle = `rgb(${value}, ${value}, ${value})`;
                ctx.fillRect(x, y, 2, 2);
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
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            // Dark studio gradient for realistic reflections
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#5a5a5a');
            gradient.addColorStop(0.3, '#454545');
            gradient.addColorStop(0.5, '#353535');
            gradient.addColorStop(0.7, '#2d2d2d');
            gradient.addColorStop(1, '#1a1a1a');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Light spots - BRIGHTER for mirror reflections
            const spots = [
                // Front lights
                { x: canvas.width * 0.25, y: canvas.height * 0.2, radius: 100, intensity: 0.7 },
                { x: canvas.width * 0.35, y: canvas.height * 0.15, radius: 80, intensity: 0.6 },
                // Right side light - closer to front (~20 degrees), lower
                { x: canvas.width * 0.3, y: canvas.height * 0.45, radius: 110, intensity: 0.75 },
                { x: canvas.width * 0.28, y: canvas.height * 0.5, radius: 90, intensity: 0.65 },
                // Back lights
                { x: canvas.width * 0.65, y: canvas.height * 0.2, radius: 85, intensity: 0.55 },
                { x: canvas.width * 0.75, y: canvas.height * 0.15, radius: 100, intensity: 0.6 },
                // Left side lights
                { x: canvas.width * 0.1, y: canvas.height * 0.25, radius: 90, intensity: 0.55 },
                { x: canvas.width * 0.9, y: canvas.height * 0.25, radius: 90, intensity: 0.55 },
                // Top center - bright for ceiling reflection
                { x: canvas.width * 0.5, y: canvas.height * 0.08, radius: 150, intensity: 0.8 }
            ];
            
            spots.forEach(spot => {
                const spotGradient = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, spot.radius);
                spotGradient.addColorStop(0, `rgba(255, 255, 255, ${spot.intensity})`);
                spotGradient.addColorStop(0.4, `rgba(220, 220, 220, ${spot.intensity * 0.5})`);
                spotGradient.addColorStop(1, 'rgba(100, 100, 100, 0)');
                ctx.fillStyle = spotGradient;
                ctx.fillRect(spot.x - spot.radius, spot.y - spot.radius, spot.radius * 2, spot.radius * 2);
            });

            const texture = new THREE.CanvasTexture(canvas);
            texture.mapping = THREE.EquirectangularReflectionMapping;

            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            pmremGenerator.dispose();
            
            return envMap;
        }
    }

    // =========================================================
    // MATERIAL FACTORY (with caching)
    // =========================================================
    class MaterialFactory {
        constructor(textureGenerator, envMap) {
            this.textureGenerator = textureGenerator;
            this.envMap = envMap;
            this.materialCache = {};
        }

        getWoodMaterial(type) {
            const cacheKey = `wood_${type}`;
            if (this.materialCache[cacheKey]) {
                return this.materialCache[cacheKey];
            }

            let textures;
            switch (type) {
                case 'Timber':
                    textures = this.textureGenerator.createTimberTextures();
                    break;
                case 'Veneer':
                    textures = this.textureGenerator.createVeneerTextures();
                    break;
                case 'MDF':
                    textures = this.textureGenerator.createMDFTextures();
                    break;
                case 'Flat':
                case 'Shaker':
                case 'Door frame':
                default:
                    textures = this.textureGenerator.createSapeleTextures();
            }

            const material = new THREE.MeshStandardMaterial({
                map: textures.diffuse,
                normalMap: textures.normal,
                normalScale: new THREE.Vector2(0.5, 0.5),
                roughnessMap: textures.roughness,
                roughness: 0.7,
                metalness: 0.0,
                envMap: this.envMap,
                envMapIntensity: 0.3
            });

            this.materialCache[cacheKey] = material;
            return material;
        }

        getPaintedMaterial(colorHex, roughness) {
            const cacheKey = `paint_${colorHex}_${roughness.toFixed(2)}`;
            if (this.materialCache[cacheKey]) {
                return this.materialCache[cacheKey];
            }

            const textures = this.textureGenerator.createPaintedTextures(colorHex);
            
            // Higher sheen = higher envMapIntensity for more reflection
            const envIntensity = 0.2 + (1 - roughness) * 0.8; // 0.2 for matt, 1.0 for mirror

            const material = new THREE.MeshStandardMaterial({
                map: textures.diffuse,
                normalMap: textures.normal,
                normalScale: new THREE.Vector2(0.1, 0.1),
                roughnessMap: null, // Use direct roughness value
                roughness: roughness,
                metalness: roughness < 0.1 ? 0.1 : 0.0, // Slight metalness for mirror effect
                envMap: this.envMap,
                envMapIntensity: envIntensity
            });

            this.materialCache[cacheKey] = material;
            return material;
        }

        clearPaintCache() {
            // Clear only paint materials when color changes
            Object.keys(this.materialCache).forEach(key => {
                if (key.startsWith('paint_')) {
                    delete this.materialCache[key];
                }
            });
        }

        clearAllCache() {
            this.materialCache = {};
        }
    }

    // =========================================================
    // DOOR FRAME BUILDER (П shape)
    // =========================================================
    class DoorFrameBuilder {
        constructor(width, height, thickness, frameWidth = 0.1) {
            this.width = width;
            this.height = height;
            this.thickness = thickness;
            this.frameWidth = frameWidth;
        }

        build(woodMaterial, paintMaterial, selectedFaces) {
            const group = new THREE.Group();
            const meshes = [];

            // Top horizontal piece
            const topMaterials = this.createFaceMaterials(woodMaterial, paintMaterial, selectedFaces);
            const topGeo = new THREE.BoxGeometry(this.width, this.frameWidth, this.thickness);
            const topMesh = new THREE.Mesh(topGeo, topMaterials);
            topMesh.position.set(0, this.height - this.frameWidth / 2, 0);
            topMesh.castShadow = true;
            topMesh.receiveShadow = true;
            topMesh.userData.faceMapping = { 0: 'right', 1: 'left', 2: 'top', 3: 'bottom', 4: 'front', 5: 'back' };
            group.add(topMesh);
            meshes.push({ mesh: topMesh, faces: Object.keys(selectedFaces) });

            // Left vertical piece
            const leftMaterials = this.createFaceMaterials(woodMaterial, paintMaterial, selectedFaces);
            const sideGeo = new THREE.BoxGeometry(this.frameWidth, this.height - this.frameWidth, this.thickness);
            const leftMesh = new THREE.Mesh(sideGeo, leftMaterials);
            leftMesh.position.set(-this.width / 2 + this.frameWidth / 2, (this.height - this.frameWidth) / 2, 0);
            leftMesh.castShadow = true;
            leftMesh.receiveShadow = true;
            leftMesh.userData.faceMapping = { 0: 'right', 1: 'left', 2: 'top', 3: 'bottom', 4: 'front', 5: 'back' };
            group.add(leftMesh);
            meshes.push({ mesh: leftMesh, faces: Object.keys(selectedFaces) });

            // Right vertical piece
            const rightMaterials = this.createFaceMaterials(woodMaterial, paintMaterial, selectedFaces);
            const rightMesh = new THREE.Mesh(sideGeo, rightMaterials);
            rightMesh.position.set(this.width / 2 - this.frameWidth / 2, (this.height - this.frameWidth) / 2, 0);
            rightMesh.castShadow = true;
            rightMesh.receiveShadow = true;
            rightMesh.userData.faceMapping = { 0: 'right', 1: 'left', 2: 'top', 3: 'bottom', 4: 'front', 5: 'back' };
            group.add(rightMesh);
            meshes.push({ mesh: rightMesh, faces: Object.keys(selectedFaces) });

            return { group, meshes };
        }

        createFaceMaterials(woodMaterial, paintMaterial, selectedFaces) {
            return [
                selectedFaces.right ? paintMaterial : woodMaterial,
                selectedFaces.left ? paintMaterial : woodMaterial,
                selectedFaces.top ? paintMaterial : woodMaterial,
                selectedFaces.bottom ? paintMaterial : woodMaterial,
                selectedFaces.front ? paintMaterial : woodMaterial,
                selectedFaces.back ? paintMaterial : woodMaterial
            ];
        }
    }

    // =========================================================
    // SHAKER DOOR BUILDER (with recess and bevels)
    // =========================================================
    class ShakerDoorBuilder {
        constructor(width, height, thickness, frameWidth = 0.08, recessDepth = 0.015) {
            this.width = width;
            this.height = height;
            this.thickness = thickness;
            this.frameWidth = frameWidth;
            this.recessDepth = recessDepth;
        }

        build(woodMaterial, paintMaterial, selectedFaces) {
            const group = new THREE.Group();
            const meshes = [];

            // Main back panel
            const backPanelThickness = this.thickness - this.recessDepth;
            const backPanel = this.createBackPanel(backPanelThickness, woodMaterial, paintMaterial, selectedFaces);
            group.add(backPanel);
            meshes.push({ mesh: backPanel, faces: ['back'] });

            // Recessed center panel
            const centerPanel = this.createCenterPanel(woodMaterial, paintMaterial, selectedFaces);
            group.add(centerPanel);
            meshes.push({ mesh: centerPanel, faces: ['front'] });

            // Frame pieces
            const framePieces = this.createFrame(woodMaterial, paintMaterial, selectedFaces);
            framePieces.forEach(piece => {
                group.add(piece.mesh);
                meshes.push(piece);
            });

            // Inner bevels
            const bevelPieces = this.createInnerBevels(woodMaterial, paintMaterial, selectedFaces);
            bevelPieces.forEach(piece => {
                group.add(piece.mesh);
                meshes.push(piece);
            });

            return { group, meshes };
        }

        createBackPanel(thickness, woodMaterial, paintMaterial, selectedFaces) {
            const geometry = new THREE.BoxGeometry(this.width, this.height, thickness);
            const material = selectedFaces.back ? paintMaterial : woodMaterial;
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.z = -thickness / 2;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            return mesh;
        }

        createCenterPanel(woodMaterial, paintMaterial, selectedFaces) {
            const innerWidth = this.width - this.frameWidth * 2;
            const innerHeight = this.height - this.frameWidth * 2;
            const panelThickness = 0.005;

            const geometry = new THREE.BoxGeometry(innerWidth, innerHeight, panelThickness);
            const material = selectedFaces.front ? paintMaterial : woodMaterial;
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.z = this.thickness / 2 - this.recessDepth;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            return mesh;
        }

        createFrame(woodMaterial, paintMaterial, selectedFaces) {
            const pieces = [];
            const frameThickness = this.recessDepth + 0.005;
            const frameMaterial = selectedFaces.front ? paintMaterial : woodMaterial;

            // Top frame
            const topGeo = new THREE.BoxGeometry(this.width, this.frameWidth, frameThickness);
            const topMesh = new THREE.Mesh(topGeo, frameMaterial);
            topMesh.position.set(0, this.height / 2 - this.frameWidth / 2, this.thickness / 2 - frameThickness / 2);
            topMesh.castShadow = true;
            pieces.push({ mesh: topMesh, faces: ['front', 'top'] });

            // Bottom frame
            const bottomMesh = new THREE.Mesh(topGeo, frameMaterial);
            bottomMesh.position.set(0, -this.height / 2 + this.frameWidth / 2, this.thickness / 2 - frameThickness / 2);
            bottomMesh.castShadow = true;
            pieces.push({ mesh: bottomMesh, faces: ['front', 'bottom'] });

            // Left frame
            const innerH = this.height - this.frameWidth * 2;
            const sideGeo = new THREE.BoxGeometry(this.frameWidth, innerH, frameThickness);
            const leftMesh = new THREE.Mesh(sideGeo, frameMaterial);
            leftMesh.position.set(-this.width / 2 + this.frameWidth / 2, 0, this.thickness / 2 - frameThickness / 2);
            leftMesh.castShadow = true;
            pieces.push({ mesh: leftMesh, faces: ['front', 'left'] });

            // Right frame
            const rightMesh = new THREE.Mesh(sideGeo, frameMaterial);
            rightMesh.position.set(this.width / 2 - this.frameWidth / 2, 0, this.thickness / 2 - frameThickness / 2);
            rightMesh.castShadow = true;
            pieces.push({ mesh: rightMesh, faces: ['front', 'right'] });

            return pieces;
        }

        createInnerBevels(woodMaterial, paintMaterial, selectedFaces) {
            const pieces = [];
            const bevelWidth = 0.015;
            const bevelDepth = this.recessDepth;
            const material = selectedFaces.front ? paintMaterial : woodMaterial;
            const innerWidth = this.width - this.frameWidth * 2;
            const innerHeight = this.height - this.frameWidth * 2;

            // Top inner bevel
            const topBevelShape = new THREE.Shape();
            topBevelShape.moveTo(-innerWidth / 2, 0);
            topBevelShape.lineTo(innerWidth / 2, 0);
            topBevelShape.lineTo(innerWidth / 2 - bevelWidth, -bevelWidth);
            topBevelShape.lineTo(-innerWidth / 2 + bevelWidth, -bevelWidth);
            topBevelShape.closePath();

            const bevelGeo = new THREE.ExtrudeGeometry(topBevelShape, {
                depth: bevelDepth,
                bevelEnabled: false
            });
            
            const topBevel = new THREE.Mesh(bevelGeo, material);
            topBevel.rotation.x = Math.PI / 2;
            topBevel.position.set(0, innerHeight / 2, this.thickness / 2 - this.recessDepth);
            topBevel.castShadow = true;
            pieces.push({ mesh: topBevel, faces: ['front'] });

            // Bottom inner bevel
            const bottomBevel = new THREE.Mesh(bevelGeo, material);
            bottomBevel.rotation.x = -Math.PI / 2;
            bottomBevel.rotation.z = Math.PI;
            bottomBevel.position.set(0, -innerHeight / 2, this.thickness / 2 - this.recessDepth);
            bottomBevel.castShadow = true;
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
            leftBevel.castShadow = true;
            pieces.push({ mesh: leftBevel, faces: ['front'] });

            // Right inner bevel
            const rightBevel = new THREE.Mesh(leftBevelGeo, material);
            rightBevel.rotation.y = Math.PI / 2;
            rightBevel.position.set(innerWidth / 2, 0, this.thickness / 2 - this.recessDepth);
            rightBevel.castShadow = true;
            pieces.push({ mesh: rightBevel, faces: ['front'] });

            return pieces;
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

        build(woodMaterial, paintMaterial, selectedFaces) {
            const group = new THREE.Group();
            const meshes = [];

            const materials = [
                selectedFaces.right ? paintMaterial : woodMaterial,
                selectedFaces.left ? paintMaterial : woodMaterial,
                selectedFaces.top ? paintMaterial : woodMaterial,
                selectedFaces.bottom ? paintMaterial : woodMaterial,
                selectedFaces.front ? paintMaterial : woodMaterial,
                selectedFaces.back ? paintMaterial : woodMaterial
            ];

            const geometry = new THREE.BoxGeometry(this.width, this.height, this.thickness);
            const mesh = new THREE.Mesh(geometry, materials);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            mesh.userData.faceMapping = {
                0: 'right', 1: 'left', 2: 'top', 3: 'bottom', 4: 'front', 5: 'back'
            };

            group.add(mesh);
            meshes.push({ mesh, faces: Object.keys(selectedFaces) });

            return { group, meshes };
        }
    }

    // =========================================================
    // THREE.JS INITIALIZATION
    // =========================================================
    let textureGenerator, materialFactory, envMap;

    function initThreeJS() {
        // Scene - dark gray background (lighter)
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x2d2d2d);

        // Camera
        const aspect = threeCanvas.clientWidth / threeCanvas.clientHeight;
        camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        camera.position.set(2.5, 1.8, 3.5);

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
        renderer.toneMappingExposure = 0.9;
        renderer.outputEncoding = THREE.sRGBEncoding;

        // Controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = 1.2;
        controls.maxDistance = 8;
        controls.maxPolarAngle = Math.PI * 0.85;
        controls.target.set(0, 0.5, 0);

        // Environment map
        envMap = EnvironmentGenerator.createStudioEnvironment(renderer);
        scene.environment = envMap;

        // Texture generator & material factory
        textureGenerator = new ProceduralTextureGenerator(512, 512);
        materialFactory = new MaterialFactory(textureGenerator, envMap);

        // Lighting
        setupLighting();

        // Floor (shadow only)
        createFloor();

        // Create initial model
        createDoor();

        // Animation loop
        animate();

        // Events
        window.addEventListener('resize', onWindowResize);
        threeCanvas.addEventListener('dblclick', onCanvasClick);
        threeCanvas.addEventListener('mousemove', onCanvasMouseMove);
    }

    function setupLighting() {
        // Key light - front
        const keyLight = new THREE.DirectionalLight(0xffffff, 0.5);
        keyLight.position.set(5, 10, 7);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 25;
        keyLight.shadow.camera.left = -5;
        keyLight.shadow.camera.right = 5;
        keyLight.shadow.camera.top = 5;
        keyLight.shadow.camera.bottom = -5;
        keyLight.shadow.bias = -0.0003;
        scene.add(keyLight);

        // Back light - for back face
        const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
        backLight.position.set(-3, 6, -8);
        scene.add(backLight);

        // Left side light
        const leftLight = new THREE.DirectionalLight(0xffffff, 0.3);
        leftLight.position.set(-8, 5, 2);
        scene.add(leftLight);

        // Right side light - LOWER, at element mid-height, 20 degrees from front
        const rightLight = new THREE.DirectionalLight(0xffffff, 0.45);
        rightLight.position.set(3, 1.5, 7);
        scene.add(rightLight);

        // Top light
        const topLight = new THREE.DirectionalLight(0xffffff, 0.25);
        topLight.position.set(0, 10, 0);
        scene.add(topLight);

        // Ambient - subtle
        const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
        scene.add(ambientLight);

        // Hemisphere
        const hemiLight = new THREE.HemisphereLight(0x404040, 0x101010, 0.15);
        scene.add(hemiLight);
    }

    // =========================================================
    // AUTO ZOOM TO FIT ELEMENT IN CONTAINER
    // =========================================================
    function autoZoomToFit(width, height, thickness) {
        // Calculate the diagonal size of the element
        const maxDimension = Math.max(width, height, thickness);
        
        // Base distance for a 1.0 unit element
        const baseDistance = 3.5;
        
        // Scale distance based on element size
        const requiredDistance = baseDistance * maxDimension;
        
        // Clamp between min and max
        const minDistance = 2;
        const maxDistance = 8;
        const targetDistance = Math.max(minDistance, Math.min(maxDistance, requiredDistance));
        
        // Get current camera direction
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.negate();
        
        // Calculate new camera position
        const targetY = height * 0.4;
        const newPosition = new THREE.Vector3(
            direction.x * targetDistance,
            targetY + targetDistance * 0.4,
            direction.z * targetDistance
        );
        
        // Smoothly update camera
        camera.position.copy(newPosition);
        controls.target.set(0, targetY, 0);
        controls.update();
    }

    function createFloor() {
        // Minimal floor for ground reference only
        const floorGeometry = new THREE.PlaneGeometry(15, 15);
        const floorMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x1a1a1a,
            transparent: true,
            opacity: 0
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
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
    // CREATE DOOR/ELEMENT MODEL
    // =========================================================
    function createDoor() {
        // Remove existing
        if (doorGroup) {
            scene.remove(doorGroup);
            doorGroup.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
            });
        }

        clickableMeshes = [];

        // Dimensions (mm to scene units)
        const W = (parseFloat(widthInput.value) || 600) / 500;
        const H = (parseFloat(heightInput.value) || 800) / 500;
        const T = (parseFloat(thicknessInput.value) || 30) / 500;

        const elementType = elementTypeSelect.value || 'Flat';

        // Get materials
        const paintColor = getSelectedPaintColor();
        const roughness = getSheen();
        materialFactory.clearPaintCache();
        const woodMaterial = materialFactory.getWoodMaterial(elementType);
        const paintMaterial = materialFactory.getPaintedMaterial(paintColor, roughness);

        const selectedFaces = {
            front: faces.front.selected,
            back: faces.back.selected,
            top: faces.top.selected,
            bottom: faces.bottom.selected,
            left: faces.left.selected,
            right: faces.right.selected
        };

        let result;

        switch (elementType) {
            case 'Door frame':
                const frameBuilder = new DoorFrameBuilder(W, H, T);
                result = frameBuilder.build(woodMaterial, paintMaterial, selectedFaces);
                break;
            case 'Shaker':
                const shakerBuilder = new ShakerDoorBuilder(W, H, T);
                result = shakerBuilder.build(woodMaterial, paintMaterial, selectedFaces);
                break;
            case 'MDF':
            case 'Timber':
            case 'Veneer':
            case 'Flat':
            default:
                const flatBuilder = new FlatPanelBuilder(W, H, T);
                result = flatBuilder.build(woodMaterial, paintMaterial, selectedFaces);
        }

        doorGroup = result.group;
        
        // Position at 20% from bottom
        doorGroup.position.y = H * 0.1;

        result.meshes.forEach(item => {
            clickableMeshes.push(item.mesh);
        });

        scene.add(doorGroup);

        // Auto zoom to fit element in container
        autoZoomToFit(W, H, T);
    }

    // =========================================================
    // RAYCASTING
    // =========================================================
    function onCanvasClick(event) {
        const rect = threeCanvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(clickableMeshes, true);

        if (intersects.length > 0) {
            const mesh = intersects[0].object;
            
            if (mesh.userData.faceMapping) {
                const faceIndex = Math.floor(intersects[0].faceIndex / 2);
                const faceName = mesh.userData.faceMapping[faceIndex];
                if (faceName) {
                    toggleFace(faceName);
                    return;
                }
            }

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
        threeCanvas.style.cursor = intersects.length > 0 ? 'pointer' : 'grab';
    }

    function normalToFaceName(normal) {
        const threshold = 0.6;
        if (normal.z > threshold) return 'front';
        if (normal.z < -threshold) return 'back';
        if (normal.y > threshold) return 'top';
        if (normal.y < -threshold) return 'bottom';
        if (normal.x > threshold) return 'right';
        if (normal.x < -threshold) return 'left';
        return 'front';
    }

    // =========================================================
    // FACE TOGGLE & UI
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

        facesError.classList.toggle('visible', selectedFaceNames.length === 0);
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
        radio.addEventListener('change', () => {
            updateRalCodeVisibility();
            createDoor();
        });
    });

    ralCodeInput.addEventListener('input', function() {
        // Clear select when typing
        if (ralSelect) ralSelect.value = '';
        createDoor();
    });

    // RAL Select change
    if (ralSelect) {
        ralSelect.addEventListener('change', function() {
            ralCodeInput.value = this.value;
            createDoor();
        });
    }

    // Sheen slider
    if (sheenSlider) {
        sheenSlider.addEventListener('input', function() {
            if (sheenValue) sheenValue.textContent = this.value;
            materialFactory.clearPaintCache();
            createDoor();
        });
    }

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
        materialFactory.clearAllCache();
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