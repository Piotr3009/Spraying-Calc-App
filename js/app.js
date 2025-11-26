// js/app.js
// =========================================================
// SPRAY PAINTING AREA & PRICE CALCULATOR - Main Application
// With Three.js 3D Visualization
// =========================================================

document.addEventListener('DOMContentLoaded', function() {
    // =========================================================
    // PRICE TABLE CONFIGURATION
    // =========================================================
    const priceTable = {
        "Flat": {
            internal: [25, 30, 35],
            external: [30, 36, 42]
        },
        "Shaker": {
            internal: [32, 38, 44],
            external: [38, 45, 52]
        },
        "Veneer": {
            internal: [28, 34, 40],
            external: [34, 41, 48]
        },
        "Timber": {
            internal: [35, 42, 49],
            external: [42, 50, 58]
        },
        "V-carve front (dense pattern)": {
            internal: [45, 54, 63],
            external: [54, 65, 76]
        },
        "Door frame": {
            internal: [30, 36, 42],
            external: [36, 43, 50]
        },
        "Sash window (3 elements)": {
            internal: [55, 66, 77],
            external: [66, 79, 92]
        },
        "3D furniture panel": {
            internal: [48, 58, 68],
            external: [58, 70, 82]
        }
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

    // =========================================================
    // PROJECT DATA
    // =========================================================
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

    // Error message elements
    const elementTypeError = document.getElementById('elementTypeError');
    const widthError = document.getElementById('widthError');
    const heightError = document.getElementById('heightError');
    const thicknessError = document.getElementById('thicknessError');
    const facesError = document.getElementById('facesError');
    const pricePerM2Error = document.getElementById('pricePerM2Error');

    const STORAGE_KEY = 'sprayCalcLastForm';

    // =========================================================
    // THREE.JS SETUP
    // =========================================================
    let scene, camera, renderer, controls;
    let doorGroup;
    let faceMeshes = {};
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Colors
    const OLIVE_COLOR = 0x708238;
    const MDF_COLOR = 0xc4a574;
    const TIMBER_COLOR = 0x8b6914;

    function initThreeJS() {
        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);

        // Camera
        const aspect = threeCanvas.clientWidth / threeCanvas.clientHeight;
        camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        camera.position.set(3, 2, 4);

        // Renderer
        renderer = new THREE.WebGLRenderer({ 
            canvas: threeCanvas, 
            antialias: true 
        });
        renderer.setSize(threeCanvas.clientWidth, threeCanvas.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 2;
        controls.maxDistance = 10;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 5, -5);
        scene.add(fillLight);

        // Grid helper
        const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x333333);
        scene.add(gridHelper);

        // Create initial door
        createDoor();

        // Animation loop
        animate();

        // Handle resize
        window.addEventListener('resize', onWindowResize);

        // Handle click
        threeCanvas.addEventListener('click', onCanvasClick);
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
        }

        doorGroup = new THREE.Group();
        faceMeshes = {};

        // Get dimensions (convert mm to scene units, scale down)
        const W = (parseFloat(widthInput.value) || 600) / 400;
        const H = (parseFloat(heightInput.value) || 400) / 400;
        const T = (parseFloat(thicknessInput.value) || 18) / 400;

        const elementType = elementTypeSelect.value || 'Flat';

        // Create textures
        const mdfTexture = createMDFTexture();
        const timberTexture = createTimberTexture();

        // Choose base texture based on type
        let baseTexture = mdfTexture;
        if (elementType === 'Timber') {
            baseTexture = timberTexture;
        }

        // Create materials for each face
        const createMaterial = (faceName) => {
            const isSelected = faces[faceName].selected;
            if (isSelected) {
                return new THREE.MeshStandardMaterial({
                    color: OLIVE_COLOR,
                    roughness: 0.3,
                    metalness: 0.1
                });
            } else {
                return new THREE.MeshStandardMaterial({
                    map: baseTexture,
                    roughness: 0.8,
                    metalness: 0.0
                });
            }
        };

        // Create box with separate materials for each face
        // Order: right, left, top, bottom, front, back
        const materials = [
            createMaterial('right'),   // +X
            createMaterial('left'),    // -X
            createMaterial('top'),     // +Y
            createMaterial('bottom'),  // -Y
            createMaterial('front'),   // +Z
            createMaterial('back')     // -Z
        ];

        const geometry = new THREE.BoxGeometry(W, H, T);
        const mainBox = new THREE.Mesh(geometry, materials);
        mainBox.castShadow = true;
        mainBox.receiveShadow = true;
        mainBox.position.y = H / 2;

        // Store face references for raycasting
        mainBox.userData.faceMapping = {
            0: 'right',
            1: 'left',
            2: 'top',
            3: 'bottom',
            4: 'front',
            5: 'back'
        };

        doorGroup.add(mainBox);
        faceMeshes.main = mainBox;

        // Add Shaker style frame if needed
        if (elementType === 'Shaker') {
            addShakerFrame(W, H, T, baseTexture);
        }

        scene.add(doorGroup);
    }

    function addShakerFrame(W, H, T, texture) {
        const frameWidth = 0.08;
        const frameDepth = T * 0.3;
        const innerW = W - frameWidth * 2;
        const innerH = H - frameWidth * 2;

        const frameMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.7
        });

        // Top frame
        const topFrame = new THREE.Mesh(
            new THREE.BoxGeometry(W, frameWidth, frameDepth),
            faces.front.selected ? 
                new THREE.MeshStandardMaterial({ color: OLIVE_COLOR, roughness: 0.3 }) : 
                frameMaterial
        );
        topFrame.position.set(0, H - frameWidth/2, T/2 + frameDepth/2);
        doorGroup.add(topFrame);

        // Bottom frame
        const bottomFrame = new THREE.Mesh(
            new THREE.BoxGeometry(W, frameWidth, frameDepth),
            faces.front.selected ? 
                new THREE.MeshStandardMaterial({ color: OLIVE_COLOR, roughness: 0.3 }) : 
                frameMaterial
        );
        bottomFrame.position.set(0, frameWidth/2, T/2 + frameDepth/2);
        doorGroup.add(bottomFrame);

        // Left frame
        const leftFrame = new THREE.Mesh(
            new THREE.BoxGeometry(frameWidth, innerH, frameDepth),
            faces.front.selected ? 
                new THREE.MeshStandardMaterial({ color: OLIVE_COLOR, roughness: 0.3 }) : 
                frameMaterial
        );
        leftFrame.position.set(-W/2 + frameWidth/2, H/2, T/2 + frameDepth/2);
        doorGroup.add(leftFrame);

        // Right frame
        const rightFrame = new THREE.Mesh(
            new THREE.BoxGeometry(frameWidth, innerH, frameDepth),
            faces.front.selected ? 
                new THREE.MeshStandardMaterial({ color: OLIVE_COLOR, roughness: 0.3 }) : 
                frameMaterial
        );
        rightFrame.position.set(W/2 - frameWidth/2, H/2, T/2 + frameDepth/2);
        doorGroup.add(rightFrame);
    }

    // =========================================================
    // TEXTURE GENERATION
    // =========================================================
    function createMDFTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Base MDF color
        ctx.fillStyle = '#c4a574';
        ctx.fillRect(0, 0, 256, 256);

        // Add subtle grain
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const brightness = 180 + Math.random() * 30;
            ctx.fillStyle = `rgb(${brightness}, ${brightness * 0.85}, ${brightness * 0.6})`;
            ctx.fillRect(x, y, 1, 1);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    function createTimberTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Base wood color
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(0, 0, 256, 256);

        // Wood grain lines
        ctx.strokeStyle = '#6b4f0f';
        ctx.lineWidth = 1;
        for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            const y = i * 6 + Math.random() * 4;
            ctx.moveTo(0, y);
            for (let x = 0; x < 256; x += 10) {
                ctx.lineTo(x, y + Math.sin(x * 0.05) * 3 + Math.random() * 2);
            }
            ctx.stroke();
        }

        // Add knots
        for (let i = 0; i < 2; i++) {
            const x = Math.random() * 200 + 28;
            const y = Math.random() * 200 + 28;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
            gradient.addColorStop(0, '#4a3508');
            gradient.addColorStop(1, '#8b6914');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(x, y, 12, 8, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    // =========================================================
    // RAYCASTING - CLICK ON FACES
    // =========================================================
    function onCanvasClick(event) {
        const rect = threeCanvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(faceMeshes.main);

        if (intersects.length > 0) {
            const faceIndex = Math.floor(intersects[0].faceIndex / 2);
            const faceName = faceMeshes.main.userData.faceMapping[faceIndex];
            if (faceName) {
                toggleFace(faceName);
            }
        }
    }

    // =========================================================
    // FACE TOGGLE & UI UPDATE
    // =========================================================
    function toggleFace(faceName) {
        faces[faceName].selected = !faces[faceName].selected;
        updateFaceUI();
        createDoor(); // Rebuild door with new colors
        updateCalculations();
    }

    function updateFaceUI() {
        // Update legend items
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

        // Update selected faces display
        const selectedFaceNames = Object.keys(faces)
            .filter(f => faces[f].selected)
            .map(f => f.charAt(0).toUpperCase() + f.slice(1));
        selectedFacesDisplay.textContent = selectedFaceNames.length > 0 
            ? selectedFaceNames.join(', ') 
            : 'None';

        // Handle faces error
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

        // Calculate area for selected faces
        let totalArea = 0;
        if (faces.front.selected) totalArea += W * H;
        if (faces.back.selected) totalArea += W * H;
        if (faces.top.selected) totalArea += W * T;
        if (faces.bottom.selected) totalArea += W * T;
        if (faces.left.selected) totalArea += H * T;
        if (faces.right.selected) totalArea += H * T;

        // Convert mm² to m²
        const areaM2 = totalArea / 1000000;

        // Calculate price
        const price = areaM2 * pricePerM2;

        // Update displays
        areaDisplay.textContent = areaM2.toFixed(3) + ' m²';
        priceDisplay.textContent = '£' + price.toFixed(2);
    }

    // =========================================================
    // VALIDATION
    // =========================================================
    function validateForm() {
        let isValid = true;

        // Element type
        if (!elementTypeSelect.value) {
            elementTypeSelect.classList.add('input-error');
            elementTypeError.classList.add('visible');
            isValid = false;
        }

        // Price
        if (!pricePerM2Input.value || parseFloat(pricePerM2Input.value) <= 0) {
            pricePerM2Input.classList.add('input-error');
            pricePerM2Error.classList.add('visible');
            isValid = false;
        }

        // Dimensions
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

        // At least one face
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

        // Clear dimensions
        widthInput.value = '';
        heightInput.value = '';
        thicknessInput.value = '';

        // Reset faces
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

        projectElements.forEach((elem, index) => {
            const row = document.createElement('tr');
            const facesDisplay = elem.faces.map(f => f.charAt(0).toUpperCase()).join(', ');

            row.innerHTML = `
                <td>${elem.type}</td>
                <td>${elem.width} × ${elem.height} × ${elem.thickness}</td>
                <td title="${elem.faces.join(', ')}">${elem.faces.length} (${facesDisplay})</td>
                <td>${elem.area.toFixed(3)}</td>
                <td>${elem.paintLocation.charAt(0).toUpperCase() + elem.paintLocation.slice(1)}</td>
                <td class="price-cell">£${elem.price.toFixed(2)}</td>
                <td><button class="delete-btn" data-id="${elem.id}" title="Remove element">✕</button></td>
            `;

            summaryBody.appendChild(row);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                deleteElement(id);
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

    // =========================================================
    // RESET PROJECT
    // =========================================================
    function resetProject() {
        if (projectElements.length > 0) {
            if (!confirm('Are you sure you want to reset the project? All elements will be removed.')) {
                return;
            }
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
                console.warn('Failed to load saved form data:', e);
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
        if (selected === 'RAL') {
            ralCodeField.classList.add('visible');
        } else {
            ralCodeField.classList.remove('visible');
        }
    }

    // =========================================================
    // EVENT LISTENERS
    // =========================================================

    // Colour standard
    colourStandardRadios.forEach(radio => {
        radio.addEventListener('change', updateRalCodeVisibility);
    });

    // Legend checkboxes
    legendCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function(e) {
            e.stopPropagation();
            toggleFace(this.dataset.face);
        });
    });

    // Legend items click
    legendItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.target.type !== 'checkbox') {
                e.preventDefault();
                toggleFace(this.dataset.face);
            }
        });
    });

    // Dimension inputs
    [widthInput, heightInput, thicknessInput].forEach(input => {
        input.addEventListener('input', function() {
            createDoor();
            updateCalculations();
        });
    });

    // Element type change
    elementTypeSelect.addEventListener('change', function() {
        createDoor();
        updateCalculations();
        this.classList.remove('input-error');
        elementTypeError.classList.remove('visible');
    });

    // Price input
    pricePerM2Input.addEventListener('input', function() {
        updateCalculations();
        this.classList.remove('input-error');
        pricePerM2Error.classList.remove('visible');
    });

    // Paint location
    paintLocationSelect.addEventListener('change', updateCalculations);

    // Add element
    addElementBtn.addEventListener('click', addElement);

    // Reset project
    resetProjectBtn.addEventListener('click', resetProject);

    // Clear validation errors
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