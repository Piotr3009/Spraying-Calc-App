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
    const priceLevelSelect = document.getElementById('priceLevel');
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
                if (data.priceLevel !== undefined) priceLevelSelect.value = data.priceLevel;
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
            priceLevel: priceLevelSelect.value
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
    // SVG DIAGRAM RENDERING
    // ---------------------------------------------------------
    // Creates a proportional SVG representation of the element
    // based on the width, height, and thickness values.
    //
    // - Front/Back: main rectangle (uses width x height ratio)
    // - Top/Bottom: thin bars on top/bottom edges
    // - Left/Right: thin bars on left/right edges
    // =========================================================
    function renderSVGDiagram() {
        // Get current dimension values (default to 100 if not set)
        const widthVal = parseFloat(widthInput.value) || 100;
        const heightVal = parseFloat(heightInput.value) || 100;
        const thicknessVal = parseFloat(thicknessInput.value) || 18;

        // Update dimension display
        const wDisplay = widthInput.value || '-';
        const hDisplay = heightInput.value || '-';
        const tDisplay = thicknessInput.value || '-';
        dimensionDisplayDims.textContent = `Width: ${wDisplay} mm, Height: ${hDisplay} mm, Thickness: ${tDisplay} mm`;

        // Calculate aspect ratio for the main face (front/back)
        const aspectRatio = widthVal / heightVal;

        // Maximum dimensions for the main rectangle in the SVG
        const maxWidth = 180;
        const maxHeight = 160;
        // Thickness bar size (proportional but capped)
        const edgeThickness = Math.min(Math.max(thicknessVal / 5, 12), 30);

        // Calculate actual rectangle dimensions while maintaining aspect ratio
        let rectWidth, rectHeight;
        if (aspectRatio >= 1) {
            // Wider than tall or square
            rectWidth = maxWidth;
            rectHeight = maxWidth / aspectRatio;
            if (rectHeight > maxHeight) {
                rectHeight = maxHeight;
                rectWidth = maxHeight * aspectRatio;
            }
        } else {
            // Taller than wide
            rectHeight = maxHeight;
            rectWidth = maxHeight * aspectRatio;
            if (rectWidth > maxWidth) {
                rectWidth = maxWidth;
                rectHeight = maxWidth / aspectRatio;
            }
        }

        // SVG viewBox dimensions (with padding for edge faces)
        const padding = 20;
        const svgWidth = rectWidth + 2 * edgeThickness + 2 * padding + 30;
        const svgHeight = rectHeight + 2 * edgeThickness + 2 * padding + 30;

        // Offset for 3D effect
        const offset3D = 15;

        // Starting position for the front face
        const frontX = padding + edgeThickness;
        const frontY = padding + edgeThickness + offset3D;

        // Build the SVG content
        let svgContent = `
        <svg class="element-svg" viewBox="0 0 ${svgWidth} ${svgHeight}"
             xmlns="http://www.w3.org/2000/svg">
            <defs>
                <!-- Gradient for selected faces -->
                <linearGradient id="selectedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#8FBC5A"/>
                    <stop offset="100%" style="stop-color:#6B8E23"/>
                </linearGradient>
            </defs>

            <!-- Back face (offset behind front for 3D effect) -->
            <g class="svg-face svg-face-back ${faces.back.selected ? 'selected' : ''}" data-face="back">
                <rect class="svg-face-fill"
                      x="${frontX + offset3D}" y="${frontY - offset3D}"
                      width="${rectWidth}" height="${rectHeight}" rx="4"/>
                <text class="svg-face-label"
                      x="${frontX + offset3D + rectWidth/2}" y="${frontY - offset3D + rectHeight/2}">Back</text>
            </g>

            <!-- Top face (thin bar at top edge, skewed for 3D) -->
            <g class="svg-face svg-face-top ${faces.top.selected ? 'selected' : ''}" data-face="top">
                <polygon class="svg-face-fill"
                         points="${frontX},${frontY}
                                 ${frontX + rectWidth},${frontY}
                                 ${frontX + rectWidth + offset3D},${frontY - offset3D}
                                 ${frontX + offset3D},${frontY - offset3D}"/>
                <text class="svg-face-label"
                      x="${frontX + rectWidth/2 + offset3D/2}" y="${frontY - offset3D/2}">Top</text>
            </g>

            <!-- Right face (thin bar on right edge, skewed for 3D) -->
            <g class="svg-face svg-face-right ${faces.right.selected ? 'selected' : ''}" data-face="right">
                <polygon class="svg-face-fill"
                         points="${frontX + rectWidth},${frontY}
                                 ${frontX + rectWidth + offset3D},${frontY - offset3D}
                                 ${frontX + rectWidth + offset3D},${frontY + rectHeight - offset3D}
                                 ${frontX + rectWidth},${frontY + rectHeight}"/>
                <text class="svg-face-label"
                      x="${frontX + rectWidth + offset3D/2}" y="${frontY + rectHeight/2}"
                      transform="rotate(90, ${frontX + rectWidth + offset3D/2}, ${frontY + rectHeight/2})">Right</text>
            </g>

            <!-- Left face (thin bar on left edge) -->
            <g class="svg-face svg-face-left ${faces.left.selected ? 'selected' : ''}" data-face="left">
                <rect class="svg-face-fill"
                      x="${frontX - edgeThickness}" y="${frontY}"
                      width="${edgeThickness}" height="${rectHeight}" rx="2"/>
                <text class="svg-face-label"
                      x="${frontX - edgeThickness/2}" y="${frontY + rectHeight/2}"
                      transform="rotate(-90, ${frontX - edgeThickness/2}, ${frontY + rectHeight/2})">Left</text>
            </g>

            <!-- Bottom face (thin bar at bottom edge) -->
            <g class="svg-face svg-face-bottom ${faces.bottom.selected ? 'selected' : ''}" data-face="bottom">
                <rect class="svg-face-fill"
                      x="${frontX}" y="${frontY + rectHeight}"
                      width="${rectWidth}" height="${edgeThickness}" rx="2"/>
                <text class="svg-face-label"
                      x="${frontX + rectWidth/2}" y="${frontY + rectHeight + edgeThickness/2 + 1}">Bottom</text>
            </g>

            <!-- Front face (main rectangle - drawn last to be on top) -->
            <g class="svg-face svg-face-front ${faces.front.selected ? 'selected' : ''}" data-face="front">
                <rect class="svg-face-fill"
                      x="${frontX}" y="${frontY}"
                      width="${rectWidth}" height="${rectHeight}" rx="4"/>
                <text class="svg-face-label"
                      x="${frontX + rectWidth/2}" y="${frontY + rectHeight/2}">Front</text>
            </g>
        </svg>`;

        svgDiagramWrapper.innerHTML = svgContent;

        // Add click handlers to SVG faces
        const svgFaces = svgDiagramWrapper.querySelectorAll('.svg-face');
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
        const elementType = elementTypeSelect.value;
        const paintLocation = paintLocationSelect.value;
        const priceLevelIndex = parseInt(priceLevelSelect.value);

        if (!elementType || !priceTable[elementType]) {
            return 0;
        }

        // Lookup the price per square meter from the price table
        const basePricePerSqm = priceTable[elementType][paintLocation][priceLevelIndex];

        // Calculate total price
        const totalPrice = area * basePricePerSqm;

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
        elementTypeError.classList.remove('visible');
        widthError.classList.remove('visible');
        heightError.classList.remove('visible');
        thicknessError.classList.remove('visible');
        facesError.classList.remove('visible');

        // Validate element type
        if (!elementTypeSelect.value) {
            elementTypeSelect.classList.add('input-error');
            elementTypeError.classList.add('visible');
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
            priceLevel: parseInt(priceLevelSelect.value) + 1,
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
                <td>L${elem.priceLevel}</td>
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

    // Element type and price level changes - update calculations
    elementTypeSelect.addEventListener('change', updateCalculations);
    priceLevelSelect.addEventListener('change', updateCalculations);
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
