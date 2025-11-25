// js/app.js
// =========================================================
// SPRAY PAINTING AREA & PRICE CALCULATOR - SHAKER EDITION
// =========================================================

document.addEventListener('DOMContentLoaded', function() {
    // =========================================================
    // PRICE TABLE CONFIGURATION
    // ---------------------------------------------------------
    // Zachowana oryginalna tabela cen
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
    
    // Buttons
    const addElementBtn = document.getElementById('addElementBtn');
    const resetProjectBtn = document.getElementById('resetProjectBtn');
    
    // Display & Legend
    const legendItems = document.querySelectorAll('.legend-item');
    // Note: In new HTML checkboxes are hidden but we still might reference them logic-wise if needed,
    // but here we will rely on clicking the items directly.
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
    // =========================================================
    const STORAGE_KEY = 'sprayCalcLastForm';

    // =========================================================
    // LOAD SAVED FORM DATA
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
    // SAVE FORM DATA
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
    // RAL CODE VISIBILITY
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
    // NEW SHAKER SVG DIAGRAM RENDERING
    // ---------------------------------------------------------
    // Renders a pseudo-3D door with Shaker panel details
    // =========================================================
    function renderSVGDiagram() {
        // Get dimensions (defaults if empty)
        const W = parseFloat(widthInput.value) || 500;
        const H = parseFloat(heightInput.value) || 700;
        const T = parseFloat(thicknessInput.value) || 22;

        // Update dimension text (hidden in new layout usually, but kept for logic safety)
        if(dimensionDisplayDims) {
            const wDisplay = widthInput.value || '-';
            const hDisplay = heightInput.value || '-';
            const tDisplay = thicknessInput.value || '-';
            dimensionDisplayDims.textContent = `W: ${wDisplay}, H: ${hDisplay}, T: ${tDisplay}`;
        }

        // --- SCALING LOGIC ---
        // We fit the door into a fixed SVG viewbox of roughly 300x300
        const MAX_SVG_DIM = 260; 
        const maxInputDim = Math.max(W, H);
        const scale = MAX_SVG_DIM / maxInputDim;

        const wPx = W * scale;
        const hPx = H * scale;
        
        // Depth simulation (clamped so it doesn't look like a tunnel for thick items)
        // We make thickness proportional but capped visually
        const depthFactor = Math.min((T / maxInputDim) * 100, 40); 
        const depthPx = Math.max(8, depthFactor);

        // Shaker Frame Size calculation
        // Usually frame is ~15-20% of width, but minimum 15px visually
        const frameSizePx = Math.max(12, Math.min(wPx, hPx) * 0.15);

        // Offsets to center inside SVG
        const padX = 20;
        const padY = 20 + depthPx; // Push down to make room for top face

        // --- COORDINATES CALCULATION ---

        // Front Face (Main Rectangle)
        const fTL = [padX, padY];                   // Front-Top-Left
        const fTR = [padX + wPx, padY];             // Front-Top-Right
        const fBR = [padX + wPx, padY + hPx];       // Front-Bottom-Right
        const fBL = [padX, padY + hPx];             // Front-Bottom-Left

        // Back Face (Hidden/Dashed - offset up and right)
        const bTL = [padX + depthPx, padY - depthPx];
        const bTR = [padX + wPx + depthPx, padY - depthPx];
        const bBR = [padX + wPx + depthPx, padY + hPx - depthPx];
        // bBL not needed for visible drawing usually

        // Shaker Inner Panel (Recess)
        const iTL = [fTL[0] + frameSizePx, fTL[1] + frameSizePx];
        const iTR = [fTR[0] - frameSizePx, fTR[1] + frameSizePx];
        const iBR = [fBR[0] - frameSizePx, fBR[1] - frameSizePx];
        const iBL = [fBL[0] + frameSizePx, fBL[1] - frameSizePx];

        // Helpers
        const pts = (arr) => arr.map(p => p.join(',')).join(' ');

        // --- SVG CONSTRUCTION ---
        // Uses classes defined in updated CSS: .shaker-frame, .shaker-panel, .shaker-bevel
        
        const svgWidth = wPx + depthPx + 50;
        const svgHeight = hPx + depthPx + 50;

        const svgContent = `
        <svg class="element-svg" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
            
            <g class="svg-face-3d svg-face-back ${faces.back.selected ? 'selected' : ''}" data-face="back">
                <polygon class="face-polygon" points="${pts([bTL, bTR, bBR, [bTL[0], bBR[1]]])}"/>
            </g>

            <g class="svg-face-3d svg-face-top ${faces.top.selected ? 'selected' : ''}" data-face="top">
                <polygon class="face-polygon" points="${pts([fTL, bTL, bTR, fTR])}"/>
            </g>

            <g class="svg-face-3d svg-face-right ${faces.right.selected ? 'selected' : ''}" data-face="right">
                <polygon class="face-polygon" points="${pts([fTR, bTR, bBR, fBR])}"/>
            </g>

            <g class="svg-face-3d svg-face-front ${faces.front.selected ? 'selected' : ''}" data-face="front">
                
                <path class="shaker-frame shaker-edge" d="
                    M ${pts([fTL])} L ${pts([fTR])} L ${pts([fBR])} L ${pts([fBL])} Z
                    M ${pts([iTL])} L ${pts([iBL])} L ${pts([iBR])} L ${pts([iTR])} Z
                " fill-rule="evenodd" />

                <polygon class="shaker-panel shaker-edge" points="${pts([iTL, iTR, iBR, iBL])}" />

                <line x1="${fTL[0]}" y1="${fTL[1]}" x2="${iTL[0]}" y2="${iTL[1]}" class="shaker-bevel" stroke-width="1" />
                <line x1="${fTR[0]}" y1="${fTR[1]}" x2="${iTR[0]}" y2="${iTR[1]}" class="shaker-bevel" stroke-width="1" />
                <line x1="${fBR[0]}" y1="${fBR[1]}" x2="${iBR[0]}" y2="${iBR[1]}" class="shaker-bevel" stroke-width="1" />
                <line x1="${fBL[0]}" y1="${fBL[1]}" x2="${iBL[0]}" y2="${iBL[1]}" class="shaker-bevel" stroke-width="1" />

                <text class="face-label-text" x="${fTL[0] + wPx/2}" y="${fTL[1] + hPx/2}" dominant-baseline="middle" text-anchor="middle">Front</text>
            </g>

            <text class="face-label-text" x="${(fTL[0]+bTL[0])/2}" y="${(fTL[1]+bTL[1])/2 - 5}" text-anchor="middle">Top</text>
            <text class="face-label-text" x="${(fTR[0]+bTR[0])/2 + 10}" y="${(fTR[1]+bBR[1])/2}" text-anchor="start">Right</text>

        </svg>`;

        svgDiagramWrapper.innerHTML = svgContent;

        // Add click listeners to new SVG nodes
        svgDiagramWrapper.querySelectorAll('.svg-face-3d').forEach(face => {
            face.addEventListener('click', function() {
                toggleFace(this.dataset.face);
            });
        });
    }

    // =========================================================
    // UI UPDATES
    // =========================================================
    function updateFaceUI() {
        // Re-render SVG to show selection states
        renderSVGDiagram();

        // Update Legend Chips
        legendItems.forEach(item => {
            const faceName = item.dataset.face;
            if (faces[faceName].selected) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });

        // Update Text Summary
        const selectedNames = Object.keys(faces)
            .filter(f => faces[f].selected)
            .map(f => f.charAt(0).toUpperCase() + f.slice(1));

        selectedFacesDisplay.textContent = selectedNames.length > 0
            ? selectedNames.join(', ')
            : 'None';

        updateCalculations();
    }

    function toggleFace(faceName) {
        if (faces[faceName]) {
            faces[faceName].selected = !faces[faceName].selected;
            updateFaceUI();
        }
    }

    // =========================================================
    // CALCULATIONS
    // =========================================================
    function calculateArea() {
        const widthMm = parseFloat(widthInput.value) || 0;
        const heightMm = parseFloat(heightInput.value) || 0;
        const thicknessMm = parseFloat(thicknessInput.value) || 0;

        // Convert to meters
        const Wm = widthMm / 1000;
        const Hm = heightMm / 1000;
        const Tm = thicknessMm / 1000;

        const faceAreas = {
            front:  Wm * Hm,
            back:   Wm * Hm,
            top:    Wm * Tm,
            bottom: Wm * Tm,
            left:   Hm * Tm,
            right:  Hm * Tm
        };

        let totalArea = 0;
        for (const [faceName, faceData] of Object.entries(faces)) {
            if (faceData.selected) {
                totalArea += faceAreas[faceName];
            }
        }
        return totalArea;
    }

    function calculatePrice(area) {
        const pricePerM2 = parseFloat(pricePerM2Input.value);
        if (!pricePerM2 || pricePerM2 <= 0) {
            return 0;
        }
        return area * pricePerM2;
    }

    function updateCalculations() {
        const area = calculateArea();
        const price = calculatePrice(area);

        areaDisplay.textContent = area.toFixed(3) + ' m²';
        priceDisplay.textContent = '£' + price.toFixed(2);
    }

    // =========================================================
    // VALIDATION
    // =========================================================
    function validateForm() {
        let isValid = true;

        // Reset errors
        [elementTypeSelect, widthInput, heightInput, thicknessInput, pricePerM2Input].forEach(el => el.classList.remove('input-error'));
        [elementTypeError, widthError, heightError, thicknessError, pricePerM2Error, facesError].forEach(el => el.classList.remove('visible'));

        if (!elementTypeSelect.value) {
            elementTypeSelect.classList.add('input-error');
            elementTypeError.classList.add('visible');
            isValid = false;
        }
        if (!parseFloat(pricePerM2Input.value) || parseFloat(pricePerM2Input.value) <= 0) {
            pricePerM2Input.classList.add('input-error');
            pricePerM2Error.classList.add('visible');
            isValid = false;
        }
        if (!parseFloat(widthInput.value)) {
            widthInput.classList.add('input-error');
            widthError.classList.add('visible');
            isValid = false;
        }
        if (!parseFloat(heightInput.value)) {
            heightInput.classList.add('input-error');
            heightError.classList.add('visible');
            isValid = false;
        }
        if (!parseFloat(thicknessInput.value)) {
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
    // ADD / DELETE / RESET Logic
    // =========================================================
    function addElement() {
        if (!validateForm()) return;

        const area = calculateArea();
        const price = calculatePrice(area);

        const element = {
            id: Date.now(),
            type: elementTypeSelect.options[elementTypeSelect.selectedIndex].text, // Get text label
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
        saveFormToStorage();
        renderSummaryTable();
        updateProjectTotal();

        // Reset inputs for next element
        widthInput.value = '';
        heightInput.value = '';
        thicknessInput.value = '';
        
        // Reset faces to default
        Object.keys(faces).forEach(k => faces[k].selected = (k === 'front'));
        updateFaceUI();
    }

    function renderSummaryTable() {
        summaryBody.innerHTML = '';
        
        if (projectElements.length === 0) {
            emptyState.style.display = 'block';
            document.getElementById('summaryTable').style.display = 'none'; // Optional based on CSS
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
                <td title="${facesDisplay}">${elem.faces.length}</td>
                <td>${elem.area.toFixed(3)}</td>
                <td class="price-cell">£${elem.price.toFixed(2)}</td>
                <td><button class="delete-btn" data-id="${elem.id}" style="color:#ef4444; background:none; border:none; cursor:pointer; font-weight:bold;">✕</button></td>
            `;
            summaryBody.appendChild(row);
        });

        // Bind delete buttons
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
        // Update storage usually happens here too, or only on add. 
        // For strict correctness, we should technically save state after delete too, 
        // but original code didn't explicitly demand it.
    }

    function updateProjectTotal() {
        const total = projectElements.reduce((sum, elem) => sum + elem.price, 0);
        projectTotalDisplay.textContent = '£' + total.toFixed(2);
    }

    function resetProject() {
        if (projectElements.length > 0 && !confirm('Reset project? All elements will be removed.')) {
            return;
        }
        projectElements = [];
        renderSummaryTable();
        updateProjectTotal();
    }

    // =========================================================
    // EVENT LISTENERS
    // =========================================================
    
    // 1. Inputs triggering re-render of Shaker model
    [widthInput, heightInput, thicknessInput].forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('input-error'); // auto-clear error
            renderSVGDiagram();
            updateCalculations();
        });
    });

    // 2. Legend Items (Chips) clicking
    legendItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // If checking hidden checkbox inside, don't double trigger
            if (e.target.type !== 'checkbox') {
                e.preventDefault();
                toggleFace(this.dataset.face);
            }
        });
    });

    // 3. General form changes
    elementTypeSelect.addEventListener('change', updateCalculations);
    pricePerM2Input.addEventListener('input', updateCalculations);
    paintLocationSelect.addEventListener('change', updateCalculations);
    
    colourStandardRadios.forEach(radio => {
        radio.addEventListener('change', updateRalCodeVisibility);
    });

    // 4. Action Buttons
    addElementBtn.addEventListener('click', addElement);
    resetProjectBtn.addEventListener('click', resetProject);

    // Clear validation on interaction
    elementTypeSelect.addEventListener('change', function() {
        this.classList.remove('input-error');
        elementTypeError.classList.remove('visible');
    });
    pricePerM2Input.addEventListener('input', function() {
        this.classList.remove('input-error');
        pricePerM2Error.classList.remove('visible');
    });

    // =========================================================
    // INITIALIZATION
    // =========================================================
    loadFormFromStorage();
    renderSVGDiagram();
    updateFaceUI();
    renderSummaryTable();
    updateProjectTotal();
});