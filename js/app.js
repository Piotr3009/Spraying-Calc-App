// js/app.js
// =========================================================
// SPRAY PAINTING AREA & PRICE CALCULATOR - Main Application
// =========================================================

document.addEventListener('DOMContentLoaded', function() {
    // =========================================================
    // PRICE TABLE CONFIGURATION
    // ---------------------------------------------------------
    // Edit the prices below to change the cost per square meter.
    // Structure: priceTable[elementType][paintLocation][priceLevelIndex]
    // paintLocation: 'internal' or 'external'
    // priceLevelIndex: 0 = Level 1, 1 = Level 2, 2 = Level 3
    // All prices are in GBP (£) per square meter.
    // =========================================================
    const priceTable = {
        "Flat": {
            internal: [25, 30, 35],      // Level 1, 2, 3 for internal
            external: [30, 36, 42]       // Level 1, 2, 3 for external
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
    // ---------------------------------------------------------
    // Tracks which faces are selected for painting.
    // Default: only 'front' is selected initially.
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
    // ---------------------------------------------------------
    // Stores all added elements for the project summary.
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
    const svgDiagramWrapper = document.getElementById('svgDiagramWrapper');
    const dimensionDisplayDims = document.getElementById('dimensionDisplayDims');

    // Error message elements
    const elementTypeError = document.getElementById('elementTypeError');
    const widthError = document.getElementById('widthError');
    const heightError = document.getElementById('heightError');
    const thicknessError = document.getElementById('thicknessError');
    const facesError = document.getElementById('facesError');
    const pricePerM2Error = document.getElementById('pricePerM2Error');

    // =========================================================
    // LOCAL STORAGE KEY
    // ---------------------------------------------------------
    // Used to persist form values between sessions.
    // Does NOT store dimensions or face selections.
    // =========================================================
    const STORAGE_KEY = 'sprayCalcLastForm';

    // =========================================================
    // LOAD SAVED FORM DATA FROM LOCAL STORAGE
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

    // =========================================================
    // SAVE FORM DATA TO LOCAL STORAGE
    // ---------------------------------------------------------
    // Called after each successful element addition.
    // =========================================================
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

    // =========================================================
    // RAL CODE FIELD VISIBILITY
    // ---------------------------------------------------------
    // Shows/hides the RAL code input based on colour standard.
    // =========================================================
    function updateRalCodeVisibility() {
        const selected = document.querySelector('input[name="colourStandard"]:checked')?.value;
        if (selected === 'RAL') {
            ralCodeField.classList.add('visible');
        } else {
            ralCodeField.classList.remove('visible');
        }
    }

    // =========================================================
    // PSEUDO-3D SVG DIAGRAM RENDERING
    // ---------------------------------------------------------
    // Creates an isometric-looking 3D box representation of
    // the element based on width, height, and thickness values.
    //
    // The box shows 3 visible faces:
    // - Front face (main rectangle)
    // - Top face (parallelogram slanting back)
    // - Right face (parallelogram slanting back)
    //
    // Other faces (back, bottom, left) are controlled via
    // the legend checkboxes only.
    // =========================================================
    function renderSVGDiagram() {
        // Get current dimension values (default to reasonable values if not set)
        const W = parseFloat(widthInput.value) || 600;
        const H = parseFloat(heightInput.value) || 400;
        const T = parseFloat(thicknessInput.value) || 18;

        // Update dimension display
        const wDisplay = widthInput.value || '-';
        const hDisplay = heightInput.value || '-';
        const tDisplay = thicknessInput.value || '-';
        dimensionDisplayDims.textContent = `Width: ${wDisplay} mm, Height: ${hDisplay} mm, Thickness: ${tDisplay} mm`;

        // =========================================================
        // PROPORTIONAL SIZING CALCULATIONS
        // =========================================================

        // Maximum dimensions for the front rectangle in pixels
        const maxFrontWidth = 200;
        const maxFrontHeight = 150;

        // Calculate front rectangle size maintaining aspect ratio
        const widthToHeightRatio = W / H;
        let frontWidthPx, frontHeightPx;

        if (widthToHeightRatio >= 1) {
            frontWidthPx = maxFrontWidth;
            frontHeightPx = maxFrontWidth / widthToHeightRatio;
            if (frontHeightPx > maxFrontHeight) {
                frontHeightPx = maxFrontHeight;
                frontWidthPx = maxFrontHeight * widthToHeightRatio;
            }
        } else {
            frontHeightPx = maxFrontHeight;
            frontWidthPx = maxFrontHeight * widthToHeightRatio;
            if (frontWidthPx > maxFrontWidth) {
                frontWidthPx = maxFrontWidth;
                frontHeightPx = maxFrontWidth / widthToHeightRatio;
            }
        }

        // Depth calculation
        const depthFactor = T / Math.max(W, H);
        let depthPx = frontWidthPx * depthFactor;
        depthPx = Math.max(12, Math.min(depthPx, 35));

        // Padding and layout
        const padding = 30;
        const barGap = 15; // Gap between main model and side bars
        const barThickness = 20; // Thickness of bottom/left bars

        // Calculate positions
        const mainModelX = padding + barThickness + barGap;
        const mainModelY = padding + depthPx;

        // Front face (main rectangle)
        const frontPoints = [
            [mainModelX, mainModelY],
            [mainModelX + frontWidthPx, mainModelY],
            [mainModelX + frontWidthPx, mainModelY + frontHeightPx],
            [mainModelX, mainModelY + frontHeightPx]
        ];

        // Top face
        const topPoints = [
            [mainModelX, mainModelY],
            [mainModelX + depthPx, mainModelY - depthPx],
            [mainModelX + frontWidthPx + depthPx, mainModelY - depthPx],
            [mainModelX + frontWidthPx, mainModelY]
        ];

        // Right face
        const rightPoints = [
            [mainModelX + frontWidthPx, mainModelY],
            [mainModelX + frontWidthPx + depthPx, mainModelY - depthPx],
            [mainModelX + frontWidthPx + depthPx, mainModelY + frontHeightPx - depthPx],
            [mainModelX + frontWidthPx, mainModelY + frontHeightPx]
        ];

        // Back face (hidden behind, shown with dashed outline and arrow)
        const backX = mainModelX + depthPx;
        const backY = mainModelY - depthPx;
        const backPoints = [
            [backX, backY],
            [backX + frontWidthPx, backY],
            [backX + frontWidthPx, backY + frontHeightPx],
            [backX, backY + frontHeightPx]
        ];

        // Bottom bar (horizontal bar below main model)
        const bottomBarY = mainModelY + frontHeightPx + barGap;
        const bottomBarPoints = [
            [mainModelX, bottomBarY],
            [mainModelX + frontWidthPx, bottomBarY],
            [mainModelX + frontWidthPx, bottomBarY + barThickness],
            [mainModelX, bottomBarY + barThickness]
        ];

        // Left bar (vertical bar to the left of main model)
        const leftBarX = padding;
        const leftBarPoints = [
            [leftBarX, mainModelY],
            [leftBarX + barThickness, mainModelY],
            [leftBarX + barThickness, mainModelY + frontHeightPx],
            [leftBarX, mainModelY + frontHeightPx]
        ];

        // Helper functions
        function pointsToString(points) {
            return points.map(p => p.join(',')).join(' ');
        }

        function getCentroid(points) {
            const n = points.length;
            let cx = 0, cy = 0;
            points.forEach(p => { cx += p[0]; cy += p[1]; });
            return [cx / n, cy / n];
        }

        const frontCenter = getCentroid(frontPoints);
        const topCenter = getCentroid(topPoints);
        const rightCenter = getCentroid(rightPoints);
        const backCenter = getCentroid(backPoints);
        const bottomCenter = getCentroid(bottomBarPoints);
        const leftCenter = getCentroid(leftBarPoints);

        // Calculate total SVG dimensions
        const svgWidth = mainModelX + frontWidthPx + depthPx + padding;
        const svgHeight = bottomBarY + barThickness + padding + 30; // Extra space for label

        // Arrow from back to main model
        const arrowStartX = backCenter[0];
        const arrowStartY = backCenter[1];
        const arrowEndX = frontCenter[0];
        const arrowEndY = frontCenter[1];

        // =========================================================
        // BUILD SVG CONTENT
        // =========================================================
        const svgContent = `
        <svg class="element-svg" viewBox="0 0 ${svgWidth} ${svgHeight}"
             xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="panelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#3a4038" stop-opacity="0.95"/>
                    <stop offset="100%" stop-color="#2f352e" stop-opacity="0.98"/>
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#a8b5a0" />
                </marker>
            </defs>

            <!-- Background panel -->
            <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" rx="18" class="scene-backdrop" fill="url(#panelGradient)" />
            <rect x="12" y="12" width="${svgWidth - 24}" height="${svgHeight - 24}" rx="14" class="scene-grid" />

            <!-- Back face (dashed outline) -->
            <g class="svg-face-3d svg-face-back ${faces.back.selected ? 'selected' : ''}" data-face="back">
                <polygon class="face-polygon" points="${pointsToString(backPoints)}" 
                         stroke-dasharray="5 3" fill-opacity="0.3"/>
                <text class="face-label-text" x="${backCenter[0]}" y="${backCenter[1]}" fill="#a8b5a0" opacity="0.7">Back</text>
            </g>

            <!-- Arrow from back to model -->
            <line x1="${arrowStartX}" y1="${arrowStartY}" 
                  x2="${arrowEndX}" y2="${arrowEndY}" 
                  stroke="#a8b5a0" stroke-width="1.5" 
                  stroke-dasharray="3 2" opacity="0.6"
                  marker-end="url(#arrowhead)"/>

            <!-- Top face -->
            <g class="svg-face-3d svg-face-top ${faces.top.selected ? 'selected' : ''}" data-face="top" filter="url(#glow)">
                <polygon class="face-polygon" points="${pointsToString(topPoints)}"/>
                <text class="face-label-text" x="${topCenter[0]}" y="${topCenter[1]}">Top</text>
            </g>

            <!-- Right face -->
            <g class="svg-face-3d svg-face-right ${faces.right.selected ? 'selected' : ''}" data-face="right" filter="url(#glow)">
                <polygon class="face-polygon" points="${pointsToString(rightPoints)}"/>
                <text class="face-label-text" x="${rightCenter[0]}" y="${rightCenter[1]}">Right</text>
            </g>

            <!-- Front face -->
            <g class="svg-face-3d svg-face-front ${faces.front.selected ? 'selected' : ''}" data-face="front" filter="url(#glow)">
                <polygon class="face-polygon" points="${pointsToString(frontPoints)}"/>
                <text class="face-label-text" x="${frontCenter[0]}" y="${frontCenter[1]}">Front</text>
            </g>

            <!-- Bottom bar -->
            <g class="svg-face-3d svg-face-bottom ${faces.bottom.selected ? 'selected' : ''}" data-face="bottom" filter="url(#glow)">
                <rect class="face-polygon" x="${bottomBarPoints[0][0]}" y="${bottomBarPoints[0][1]}" 
                      width="${frontWidthPx}" height="${barThickness}" rx="3"/>
                <text class="face-label-text" x="${bottomCenter[0]}" y="${bottomCenter[1]}">Bottom</text>
            </g>

            <!-- Left bar -->
            <g class="svg-face-3d svg-face-left ${faces.left.selected ? 'selected' : ''}" data-face="left" filter="url(#glow)">
                <rect class="face-polygon" x="${leftBarPoints[0][0]}" y="${leftBarPoints[0][1]}" 
                      width="${barThickness}" height="${frontHeightPx}" rx="3"/>
                <text class="face-label-text" x="${leftCenter[0]}" y="${leftCenter[1]}" 
                      transform="rotate(-90 ${leftCenter[0]} ${leftCenter[1]})">Left</text>
            </g>

            <!-- 3D edge highlights -->
            <line class="edge-line-dark"
                  x1="${mainModelX + frontWidthPx}" y1="${mainModelY}"
                  x2="${mainModelX + frontWidthPx + depthPx}" y2="${mainModelY - depthPx}"/>
            <line class="edge-line-dark"
                  x1="${mainModelX}" y1="${mainModelY}"
                  x2="${mainModelX + depthPx}" y2="${mainModelY - depthPx}"/>

            <!-- Label under model -->
            <text x="${svgWidth / 2}" y="${svgHeight - 10}" 
                  fill="#a8b5a0" font-size="11" text-anchor="middle" font-weight="600">
                ${wDisplay} × ${hDisplay} × ${tDisplay} mm
            </text>
        </svg>`;

        svgDiagramWrapper.innerHTML = svgContent;

        // Add click handlers to all faces
        const svgFaces = svgDiagramWrapper.querySelectorAll('.svg-face-3d');
        svgFaces.forEach(face => {
            face.addEventListener('click', function() {
                toggleFace(this.dataset.face);
            });
        });
    }

    // =========================================================
    // FACE SELECTION HANDLERS
    // ---------------------------------------------------------
    // Toggles face selection and updates the UI.
    // =========================================================
    function updateFaceUI() {
        // Re-render SVG diagram with current selection state
        renderSVGDiagram();

        // Update legend items and checkboxes
        legendItems.forEach(item => {
            const faceName = item.dataset.face;
            if (faces[faceName].selected) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });

        legendCheckboxes.forEach(checkbox => {
            const faceName = checkbox.dataset.face;
            checkbox.checked = faces[faceName].selected;
        });

        // Update selected faces display
        const selectedNames = Object.keys(faces)
            .filter(f => faces[f].selected)
            .map(f => f.charAt(0).toUpperCase() + f.slice(1));

        selectedFacesDisplay.textContent = selectedNames.length > 0
            ? selectedNames.join(', ')
            : 'None';

        // Update calculations
        updateCalculations();
    }

    function toggleFace(faceName) {
        faces[faceName].selected = !faces[faceName].selected;
        updateFaceUI();
    }

    // =========================================================
    // AREA CALCULATION
    // ---------------------------------------------------------
    // Calculates the total painted area in square meters.
    //
    // Formula:
    // - Convert mm to meters: divide by 1000
    // - Front/Back area: width * height
    // - Top/Bottom area: width * thickness
    // - Left/Right area: height * thickness
    // - Total = sum of all selected face areas
    // =========================================================
    function calculateArea() {
        const widthMm = parseFloat(widthInput.value) || 0;
        const heightMm = parseFloat(heightInput.value) || 0;
        const thicknessMm = parseFloat(thicknessInput.value) || 0;

        // Convert mm to meters
        const Wm = widthMm / 1000;
        const Hm = heightMm / 1000;
        const Tm = thicknessMm / 1000;

        // Calculate area for each face type
        const faceAreas = {
            front:  Wm * Hm,
            back:   Wm * Hm,
            top:    Wm * Tm,
            bottom: Wm * Tm,
            left:   Hm * Tm,
            right:  Hm * Tm
        };

        // Sum selected face areas
        let totalArea = 0;
        for (const [faceName, faceData] of Object.entries(faces)) {
            if (faceData.selected) {
                totalArea += faceAreas[faceName];
            }
        }

        return totalArea;
    }

    // =========================================================
    // PRICE CALCULATION
    // ---------------------------------------------------------
    // Calculates the price based on:
    // - Element type
    // - Paint location (internal/external)
    // - Price level (1, 2, or 3)
    // - Total painted area
    //
    // Formula: price = area (m²) × price per m²
    // =========================================================
    function calculatePrice(area) {
        const pricePerM2 = parseFloat(pricePerM2Input.value);

        if (!pricePerM2 || pricePerM2 <= 0) {
            return 0;
        }

        // Calculate total price
        const totalPrice = area * pricePerM2;

        return totalPrice;
    }

    // =========================================================
    // UPDATE CALCULATION DISPLAYS
    // =========================================================
    function updateCalculations() {
        const area = calculateArea();
        const price = calculatePrice(area);

        areaDisplay.textContent = area.toFixed(3) + ' m²';
        priceDisplay.textContent = '£' + price.toFixed(2);
    }

    // =========================================================
    // FORM VALIDATION
    // ---------------------------------------------------------
    // Validates required fields before adding an element.
    // Returns true if valid, false otherwise.
    // =========================================================
    function validateForm() {
        let isValid = true;

        // Clear previous errors
        elementTypeSelect.classList.remove('input-error');
        widthInput.classList.remove('input-error');
        heightInput.classList.remove('input-error');
        thicknessInput.classList.remove('input-error');
        pricePerM2Input.classList.remove('input-error');
        elementTypeError.classList.remove('visible');
        widthError.classList.remove('visible');
        heightError.classList.remove('visible');
        thicknessError.classList.remove('visible');
        facesError.classList.remove('visible');
        pricePerM2Error.classList.remove('visible');

        // Validate element type
        if (!elementTypeSelect.value) {
            elementTypeSelect.classList.add('input-error');
            elementTypeError.classList.add('visible');
            isValid = false;
        }

        // Validate price per m²
        const pricePerM2 = parseFloat(pricePerM2Input.value);
        if (!pricePerM2 || pricePerM2 <= 0) {
            pricePerM2Input.classList.add('input-error');
            pricePerM2Error.classList.add('visible');
            isValid = false;
        }

        // Validate dimensions
        const width = parseFloat(widthInput.value);
        const height = parseFloat(heightInput.value);
        const thickness = parseFloat(thicknessInput.value);

        if (!width || width <= 0) {
            widthInput.classList.add('input-error');
            widthError.classList.add('visible');
            isValid = false;
        }

        if (!height || height <= 0) {
            heightInput.classList.add('input-error');
            heightError.classList.add('visible');
            isValid = false;
        }

        if (!thickness || thickness <= 0) {
            thicknessInput.classList.add('input-error');
            thicknessError.classList.add('visible');
            isValid = false;
        }

        // Validate at least one face selected
        const hasSelectedFace = Object.values(faces).some(f => f.selected);
        if (!hasSelectedFace) {
            facesError.classList.add('visible');
            isValid = false;
        }

        return isValid;
    }

    // =========================================================
    // ADD ELEMENT TO PROJECT
    // ---------------------------------------------------------
    // Validates, calculates, and adds the element to the table.
    // Clears dimensions and face selections after adding.
    // =========================================================
    function addElement() {
        if (!validateForm()) {
            return;
        }

        const area = calculateArea();
        const price = calculatePrice(area);

        const element = {
            id: Date.now(),
            type: elementTypeSelect.value,
            width: parseFloat(widthInput.value),
            height: parseFloat(heightInput.value),
            thickness: parseFloat(thicknessInput.value),
            faces: Object.keys(faces).filter(f => faces[f].selected),
            area: area,
            pricePerM2: parseFloat(pricePerM2Input.value),
            paintLocation: paintLocationSelect.value,
            price: price
        };

        projectElements.push(element);

        // Save form to localStorage (excludes dimensions & faces)
        saveFormToStorage();

        // Update UI
        renderSummaryTable();
        updateProjectTotal();

        // Clear dimension fields for next element
        // NOTE: Face selections are also reset to default (front only)
        // This makes each element start fresh. Modify below if you prefer
        // to keep the last face selection.
        widthInput.value = '';
        heightInput.value = '';
        thicknessInput.value = '';

        // Reset faces to default (front only selected)
        for (const face of Object.keys(faces)) {
            faces[face].selected = (face === 'front');
        }
        updateFaceUI();
    }

    // =========================================================
    // RENDER SUMMARY TABLE
    // ---------------------------------------------------------
    // Rebuilds the project elements table from the data array.
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

            const facesDisplay = elem.faces
                .map(f => f.charAt(0).toUpperCase())
                .join(', ');

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

        // Add delete handlers
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                deleteElement(id);
            });
        });
    }

    // =========================================================
    // DELETE ELEMENT
    // ---------------------------------------------------------
    // Removes an element from the project by ID.
    // =========================================================
    function deleteElement(id) {
        projectElements = projectElements.filter(e => e.id !== id);
        renderSummaryTable();
        updateProjectTotal();
    }

    // =========================================================
    // UPDATE PROJECT TOTAL
    // ---------------------------------------------------------
    // Calculates and displays the sum of all element prices.
    // =========================================================
    function updateProjectTotal() {
        const total = projectElements.reduce((sum, elem) => sum + elem.price, 0);
        projectTotalDisplay.textContent = '£' + total.toFixed(2);
    }

    // =========================================================
    // RESET PROJECT
    // ---------------------------------------------------------
    // Clears all elements from the project.
    // Keeps form values in localStorage.
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
    // EVENT LISTENERS
    // =========================================================

    // Colour standard radio change
    colourStandardRadios.forEach(radio => {
        radio.addEventListener('change', updateRalCodeVisibility);
    });

    // Legend checkbox changes
    legendCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function(e) {
            e.stopPropagation(); // Prevent label click from triggering twice
            toggleFace(this.dataset.face);
        });
    });

    // Legend item clicks (on the label area, not checkbox)
    legendItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Only toggle if click wasn't on the checkbox itself
            if (e.target.type !== 'checkbox') {
                e.preventDefault();
                toggleFace(this.dataset.face);
            }
        });
    });

    // Dimension inputs - update calculations and re-render diagram on change
    [widthInput, heightInput, thicknessInput].forEach(input => {
        input.addEventListener('input', function() {
            renderSVGDiagram();
            updateCalculations();
        });
    });

    // Element type and price changes - update calculations
    elementTypeSelect.addEventListener('change', updateCalculations);
    pricePerM2Input.addEventListener('input', updateCalculations);
    paintLocationSelect.addEventListener('change', updateCalculations);

    // Add element button
    addElementBtn.addEventListener('click', addElement);

    // Reset project button
    resetProjectBtn.addEventListener('click', resetProject);

    // Clear validation errors on input
    elementTypeSelect.addEventListener('change', function() {
        this.classList.remove('input-error');
        elementTypeError.classList.remove('visible');
    });

    pricePerM2Input.addEventListener('input', function() {
        this.classList.remove('input-error');
        pricePerM2Error.classList.remove('visible');
    });

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
    renderSVGDiagram();
    updateFaceUI();
    renderSummaryTable();
    updateProjectTotal();
});