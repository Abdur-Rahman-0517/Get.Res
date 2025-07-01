<script>
        // Get references to DOM elements
        const imageUpload = document.getElementById('imageUpload');
        const mainCanvas = document.getElementById('mainCanvas');
        const mainCtx = mainCanvas.getContext('2d');
        const zoomCanvas = document.getElementById('zoomCanvas');
        const zoomCtx = zoomCanvas.getContext('2d');
        const colorPreview = document.getElementById('colorPreview');
        const rgbValueSpan = document.getElementById('rgbValue');
        const hexValueSpan = document.getElementById('hexValue');
        const hslValueSpan = document.getElementById('hslValue');
        const xCoordSpan = document.getElementById('xCoord');
        const yCoordSpan = document.getElementById('yCoord');
        const clearButton = document.getElementById('clearButton');
        const uploadPrompt = document.getElementById('uploadPrompt');
        const dragDropArea = document.getElementById('dragDropArea');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const lockedIndicator = document.getElementById('lockedIndicator');
        const colorHistoryDiv = document.getElementById('colorHistory');
        const historyPrompt = document.getElementById('historyPrompt');
        const clearHistoryButton = document.getElementById('clearHistoryButton');
        const copyRgbButton = document.getElementById('copyRgb');
        const copyHexButton = document.getElementById('copyHex');
        const copyHslButton = document.getElementById('copyHsl');
        const copyAllColorsButton = document.getElementById('copyAllColors');
        const rgbCopiedFeedback = document.getElementById('rgbCopiedFeedback');
        const hexCopiedFeedback = document.getElementById('hexCopiedFeedback');
        const hslCopiedFeedback = document.getElementById('hslCopiedFeedback');
        const allColorsCopiedFeedback = document.getElementById('allColorsCopiedFeedback');
        const zoomLevelSelect = document.getElementById('zoomLevel');
        const customCrosshair = document.getElementById('customCrosshair');
        const canvasContainer = document.getElementById('canvasContainer');


        let currentImage = null; // Stores the loaded image object
        let isColorLocked = false; // State variable to control locking
        let colorHistory = []; // Array to store picked colors
        let currentPixelScale = parseInt(zoomLevelSelect.value); // Initial pixel scale from dropdown

        // Set zoom canvas dimensions
        const ZOOM_CANVAS_SIZE = 100; // Size of the zoom display area
        // PIXEL_SCALE will be dynamically set by currentPixelScale
        let ZOOM_AREA_SIZE = ZOOM_CANVAS_SIZE / currentPixelScale; // Number of original pixels to show

        zoomCanvas.width = ZOOM_CANVAS_SIZE;
        zoomCanvas.height = ZOOM_CANVAS_SIZE;

        /**
         * Updates ZOOM_AREA_SIZE based on the current PIXEL_SCALE.
         */
        function updateZoomAreaSize() {
            ZOOM_AREA_SIZE = ZOOM_CANVAS_SIZE / currentPixelScale;
        }

        /**
         * Converts RGB values to a Hexadecimal color code.
         * @param {number} r - Red component (0-255).
         * @param {number} g - Green component (0-255).
         * @param {number} b - Blue component (0-255).
         * @returns {string} Hexadecimal color string (e.g., "#RRGGBB").
         */
        function rgbToHex(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
        }

        /**
         * Converts an RGB color value to HSL. Conversion formula
         * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
         * Assumes r, g, and b are contained in the set [0, 255] and
         * returns h, s, and l in the set [0, 1].
         *
         * @param   Number  r       The red color value
         * @param   Number  g       The green color value
         * @param   Number  b       The blue color value
         * @return  Array           The HSL representation
         */
        function rgbToHsl(r, g, b) {
            r /= 255, g /= 255, b /= 255;

            var max = Math.max(r, g, b),
                min = Math.min(r, g, b);
            var h, s, l = (max + min) / 2;

            if (max == min) {
                h = s = 0; // achromatic
            } else {
                var d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

                switch (max) {
                    case r:
                        h = (g - b) / d + (g < b ? 6 : 0);
                        break;
                    case g:
                        h = (b - r) / d + 2;
                        break;
                    case b:
                        h = (r - g) / d + 4;
                        break;
                }

                h /= 6;
            }

            // Convert to percentages and round
            return [
                Math.round(h * 360), // Hue in degrees (0-360)
                Math.round(s * 100), // Saturation in percentage (0-100)
                Math.round(l * 100)  // Lightness in percentage (0-100)
            ];
        }

        /**
         * Copies text to the clipboard.
         * @param {string} text - The text to copy.
         * @param {HTMLElement} feedbackElement - The element to show feedback on.
         */
        function copyToClipboard(text, feedbackElement) {
            try {
                const tempInput = document.createElement('textarea');
                tempInput.value = text;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);

                // Show feedback
                feedbackElement.classList.add('show');
                setTimeout(() => {
                    feedbackElement.classList.remove('show');
                }, 1000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        }

        /**
         * Adds a color to the history, preventing duplicates and limiting size.
         * @param {string} hex - The hex color string to add.
         */
        function addColorToHistory(hex) {
            // Add to the beginning if not already present
            if (!colorHistory.includes(hex)) {
                colorHistory.unshift(hex);
                // Limit history to a certain number of colors (e.g., 20)
                if (colorHistory.length > 20) {
                    colorHistory.pop();
                }
                renderColorHistory();
                saveColorHistory(); // Save to local storage
            }
        }

        /**
         * Loads color history from local storage.
         */
        function loadColorHistory() {
            try {
                const storedHistory = localStorage.getItem('colorPickerHistory');
                if (storedHistory) {
                    colorHistory = JSON.parse(storedHistory);
                    renderColorHistory();
                }
            } catch (e) {
                console.error("Error loading color history from local storage:", e);
                colorHistory = []; // Reset if there's an error
            }
        }

        /**
         * Saves color history to local storage.
         */
        function saveColorHistory() {
            try {
                localStorage.setItem('colorPickerHistory', JSON.stringify(colorHistory));
            } catch (e) {
                console.error("Error saving color history to local storage:", e);
            }
        }

        /**
         * Renders the color history in the dedicated div.
         */
        function renderColorHistory() {
            colorHistoryDiv.innerHTML = ''; // Clear existing history
            if (colorHistory.length === 0) {
                historyPrompt.style.display = 'block';
                colorHistoryDiv.appendChild(historyPrompt);
            } else {
                historyPrompt.style.display = 'none';
                colorHistory.forEach(hex => {
                    const colorSwatch = document.createElement('div');
                    colorSwatch.className = 'w-10 h-10 rounded-md cursor-pointer border border-gray-200 shadow-sm hover:scale-110 transition-transform duration-200 ease-in-out';
                    colorSwatch.style.backgroundColor = hex;
                    colorSwatch.title = hex; // Show hex on hover
                    colorSwatch.addEventListener('click', () => {
                        // Re-pick this color from history
                        const rgb = hexToRgb(hex);
                        if (rgb) {
                            updateColorDisplay(rgb.r, rgb.g, rgb.b);
                            // Set isColorLocked to true to maintain selection from history
                            isColorLocked = true;
                            lockedIndicator.style.display = 'block';
                            // Clear zoom canvas as there's no pixel context
                            zoomCtx.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);
                            zoomCtx.fillStyle = '#f0f0f0';
                            zoomCtx.fillRect(0, 0, zoomCanvas.width, zoomCanvas.height);
                            customCrosshair.style.display = 'none'; // Hide crosshair if picking from history
                            // Coordinates from history are not relevant to live canvas position
                            xCoordSpan.textContent = 'N/A';
                            yCoordSpan.textContent = 'N/A';
                        }
                    });
                    colorHistoryDiv.appendChild(colorSwatch);
                });
            }
        }

        /**
         * Converts a hex color string to RGB object.
         * @param {string} hex - The hex color string (e.g., "#RRGGBB").
         * @returns {object|null} An object with r, g, b properties, or null if invalid.
         */
        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        /**
         * Handles the image file selection and draws it onto the main canvas.
         * @param {File} file - The image file object.
         */
        function processImageFile(file) {
            if (!file) {
                return;
            }

            loadingSpinner.style.display = 'flex'; // Show spinner

            const reader = new FileReader();

            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    currentImage = img; // Store the image

                    // Set canvas dimensions to image natural size for drawing, but use CSS for display size
                    mainCanvas.width = img.width;
                    mainCanvas.height = img.height;
                    mainCanvas.style.width = '100%';
                    mainCanvas.style.height = 'auto'; // Let CSS handle display dimensions

                    mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height); // Clear before drawing
                    mainCtx.drawImage(img, 0, 0);

                    // Show the canvas and hide the prompt
                    mainCanvas.style.display = 'block';
                    uploadPrompt.style.display = 'none';
                    loadingSpinner.style.display = 'none'; // Hide spinner

                    // Reset color display and unlock
                    updateColorDisplay(null, null, null);
                    isColorLocked = false;
                    lockedIndicator.style.display = 'none';
                    xCoordSpan.textContent = 'N/A';
                    yCoordSpan.textContent = 'N/A';
                };
                img.onerror = function() {
                    loadingSpinner.style.display = 'none';
                    uploadPrompt.style.display = 'block';
                    mainCanvas.style.display = 'none';
                    console.error("Error loading image.");
                    // Using a custom message box instead of alert()
                    displayMessage("Failed to load image. Please try a different image file.");
                };
                img.src = e.target.result;
            };

            reader.readAsDataURL(file);
        }

        /**
         * Picks the color of the pixel at the given coordinates on the main canvas
         * and updates the display. Also handles the magnified view.
         * @param {number} x - X coordinate on the canvas (relative to canvas's drawing buffer).
         * @param {number} y - Y coordinate on the canvas (relative to canvas's drawing buffer).
         */
        function pickColor(x, y) {
            if (!currentImage) {
                return; // No image loaded
            }

            // Ensure coordinates are within canvas bounds
            const clampedX = Math.max(0, Math.min(Math.floor(x), mainCanvas.width - 1));
            const clampedY = Math.max(0, Math.min(Math.floor(y), mainCanvas.height - 1));

            // Get the pixel data from the main canvas
            const pixelData = mainCtx.getImageData(clampedX, clampedY, 1, 1).data;
            const r = pixelData[0];
            const g = pixelData[1];
            const b = pixelData[2];

            updateColorDisplay(r, g, b);
            xCoordSpan.textContent = clampedX;
            yCoordSpan.textContent = clampedY;

            // --- Magnified View Logic ---
            zoomCtx.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);
            zoomCtx.fillStyle = '#f0f0f0'; // Light grey background
            zoomCtx.fillRect(0, 0, zoomCanvas.width, zoomCanvas.height);

            // Update zoom area size based on current pixel scale
            updateZoomAreaSize();

            // Calculate the top-left corner of the area to magnify around the cursor
            const halfZoomArea = Math.floor(ZOOM_AREA_SIZE / 2);
            let sourceX = clampedX - halfZoomArea;
            let sourceY = clampedY - halfZoomArea;

            // Ensure sourceX and sourceY don't go out of bounds of the main image
            sourceX = Math.max(0, Math.min(sourceX, mainCanvas.width - ZOOM_AREA_SIZE));
            sourceY = Math.max(0, Math.min(sourceY, mainCanvas.height - ZOOM_AREA_SIZE));

            // Get the image data for the magnified area
            const zoomImageData = mainCtx.getImageData(sourceX, sourceY, ZOOM_AREA_SIZE, ZOOM_AREA_SIZE);

            // Draw each pixel from the zoomImageData onto the zoomCanvas, scaled up
            for (let i = 0; i < zoomImageData.data.length; i += 4) {
                const pixelIndex = i / 4;
                const originalPixelX = pixelIndex % ZOOM_AREA_SIZE;
                const originalPixelY = Math.floor(pixelIndex / ZOOM_AREA_SIZE);

                const displayX = originalPixelX * currentPixelScale;
                const displayY = originalPixelY * currentPixelScale;

                zoomCtx.fillStyle = `rgb(${zoomImageData.data[i]}, ${zoomImageData.data[i+1]}, ${zoomImageData.data[i+2]})`;
                zoomCtx.fillRect(displayX, displayY, currentPixelScale, currentPixelScale);
            }

            // Draw grid lines on the magnified view
            zoomCtx.strokeStyle = 'rgba(0, 0, 0, 0.2)'; // Light gray, semi-transparent
            zoomCtx.lineWidth = 0.5;
            for (let i = 0; i <= ZOOM_AREA_SIZE; i++) {
                // Vertical lines
                zoomCtx.beginPath();
                zoomCtx.moveTo(i * currentPixelScale, 0);
                zoomCtx.lineTo(i * currentPixelScale, ZOOM_CANVAS_SIZE);
                zoomCtx.stroke();
                // Horizontal lines
                zoomCtx.beginPath();
                zoomCtx.moveTo(0, i * currentPixelScale);
                zoomCtx.lineTo(ZOOM_CANVAS_SIZE, i * currentPixelScale);
                zoomCtx.stroke();
            }

            // Highlight the exact selected pixel in the magnified view
            const highlightX = (clampedX - sourceX) * currentPixelScale;
            const highlightY = (clampedY - sourceY) * currentPixelScale;
            zoomCtx.strokeStyle = 'red'; // Highlight color
            zoomCtx.lineWidth = 2;
            zoomCtx.strokeRect(highlightX, highlightY, currentPixelScale, currentPixelScale);
        }

        /**
         * Updates the color display elements.
         * @param {number|null} r - Red value or null.
         * @param {number|null} g - Green value or null.
         * @param {number|null} b - Blue value or null.
         */
        function updateColorDisplay(r, g, b) {
            if (r === null || g === null || b === null) {
                colorPreview.style.backgroundColor = '#ffffff';
                rgbValueSpan.textContent = 'N/A';
                hexValueSpan.textContent = 'N/A';
                hslValueSpan.textContent = 'N/A';
            } else {
                const hsl = rgbToHsl(r, g, b);
                colorPreview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
                rgbValueSpan.textContent = `${r}, ${g}, ${b}`;
                hexValueSpan.textContent = rgbToHex(r, g, b);
                hslValueSpan.textContent = `${hsl[0]}°, ${hsl[1]}%, ${hsl[2]}%`;
            }
        }

        /**
         * Displays a custom message box instead of alert().
         * @param {string} message - The message to display.
         */
        function displayMessage(message) {
            // A simple div overlay for messages
            const messageBox = document.createElement('div');
            messageBox.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            messageBox.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm mx-auto">
                    <p class="text-lg font-semibold mb-4">${message}</p>
                    <button id="messageBoxClose" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200">OK</button>
                </div>
            `;
            document.body.appendChild(messageBox);

            document.getElementById('messageBoxClose').addEventListener('click', () => {
                document.body.removeChild(messageBox);
            });
        }


        /**
         * Resets the application state, clearing canvases and displays.
         */
        function clearCanvas() {
            mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
            zoomCtx.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);
            zoomCtx.fillStyle = '#f0f0f0'; // Reset zoom canvas background
            zoomCtx.fillRect(0, 0, zoomCanvas.width, zoomCanvas.height);
            updateColorDisplay(null, null, null);
            imageUpload.value = ''; // Clear file input
            currentImage = null; // Clear stored image
            isColorLocked = false; // Reset lock state
            lockedIndicator.style.display = 'none';
            customCrosshair.style.display = 'none'; // Hide crosshair
            xCoordSpan.textContent = 'N/A';
            yCoordSpan.textContent = 'N/A';

            // Hide the canvas and show the prompt
            mainCanvas.style.display = 'none';
            uploadPrompt.style.display = 'block';

            // Clear color history and local storage
            colorHistory = [];
            renderColorHistory();
            saveColorHistory(); // Save empty history to local storage
        }

        // --- Event Listeners ---

        // File input change
        imageUpload.addEventListener('change', (event) => {
            processImageFile(event.target.files[0]);
        });

        // Drag and Drop functionality
        dragDropArea.addEventListener('dragover', (event) => {
            event.preventDefault(); // Prevent default to allow drop
            dragDropArea.classList.add('active');
        });

        dragDropArea.addEventListener('dragleave', (event) => {
            event.preventDefault();
            dragDropArea.classList.remove('active');
        });

        dragDropArea.addEventListener('drop', (event) => {
            event.preventDefault();
            dragDropArea.classList.remove('active');
            const file = event.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                processImageFile(file);
            } else {
                console.warn("Dropped file is not an image.");
                displayMessage("Please drop an image file (e.g., JPG, PNG, GIF, BMP).");
            }
        });

        dragDropArea.addEventListener('click', () => {
            imageUpload.click(); // Trigger file input click when drag-drop area is clicked
        });

        // Toggle lock state on click
        mainCanvas.addEventListener('click', function(event) {
            if (currentImage) {
                isColorLocked = !isColorLocked; // Toggle the lock state
                lockedIndicator.style.display = isColorLocked ? 'block' : 'none';

                // If unlocked and clicked, pick the color at the clicked position
                // If locked, the color and zoom remain as they were at the point of click
                const rect = mainCanvas.getBoundingClientRect();
                const scaleX = mainCanvas.width / rect.width;
                const scaleY = mainCanvas.height / rect.height;

                const x = (event.clientX - rect.left) * scaleX;
                const y = (event.clientY - rect.top) * scaleY;
                pickColor(x, y);

                // Add the picked color to history only when it's locked (i.e., chosen)
                if (isColorLocked) {
                    const hex = hexValueSpan.textContent;
                    if (hex !== 'N/A') {
                        addColorToHistory(hex);
                    }
                    customCrosshair.style.display = 'none'; // Hide crosshair when locked
                } else {
                    // If unlocked, ensure crosshair is visible if mouse is over canvas
                    // This uses the canvasContainer's position for accurate placement of the crosshair
                    const containerRect = canvasContainer.getBoundingClientRect();
                    const mouseX = event.clientX;
                    const mouseY = event.clientY;
                    if (mouseX >= containerRect.left && mouseX <= containerRect.right &&
                        mouseY >= containerRect.top && mouseY <= containerRect.bottom) {
                        customCrosshair.style.left = `${event.clientX - containerRect.left}px`;
                        customCrosshair.style.top = `${event.clientY - containerRect.top}px`;
                        customCrosshair.style.display = 'block';
                    }
                }
            }
        });

        // Only update on mousemove if not locked
        mainCanvas.addEventListener('mousemove', function(event) {
            if (currentImage && !isColorLocked) {
                const rect = mainCanvas.getBoundingClientRect();
                const scaleX = mainCanvas.width / rect.width;
                const scaleY = mainCanvas.height / rect.height;

                const x = (event.clientX - rect.left) * scaleX;
                const y = (event.clientY - rect.top) * scaleY;
                pickColor(x, y); // This will update both color and zoom view on hover

                // Position custom crosshair relative to canvasContainer
                const containerRect = canvasContainer.getBoundingClientRect();
                customCrosshair.style.left = `${event.clientX - containerRect.left}px`;
                customCrosshair.style.top = `${event.clientY - containerRect.top}px`;
                customCrosshair.style.display = 'block';
            }
        });

        mainCanvas.addEventListener('mouseleave', () => {
            if (!isColorLocked) {
                customCrosshair.style.display = 'none';
            }
        });

        mainCanvas.addEventListener('mouseenter', () => {
            if (!isColorLocked && currentImage) {
                 customCrosshair.style.display = 'block';
            }
        });


        // Add event listener for the clear button
        clearButton.addEventListener('click', clearCanvas);

        // Add event listener for clear history button
        clearHistoryButton.addEventListener('click', () => {
            colorHistory = [];
            renderColorHistory();
            saveColorHistory(); // Save empty history to local storage
        });

        // Copy RGB value
        copyRgbButton.addEventListener('click', () => {
            const rgbText = rgbValueSpan.textContent;
            if (rgbText !== 'N/A') {
                copyToClipboard(`rgb(${rgbText})`, rgbCopiedFeedback);
            }
        });

        // Copy Hex value
        copyHexButton.addEventListener('click', () => {
            const hexText = hexValueSpan.textContent;
            if (hexText !== 'N/A') {
                copyToClipboard(hexText, hexCopiedFeedback);
            }
        });

        // Copy HSL value
        copyHslButton.addEventListener('click', () => {
            const hslText = hslValueSpan.textContent;
            if (hslText !== 'N/A') {
                copyToClipboard(`hsl(${hslText})`, hslCopiedFeedback);
            }
        });

        // Copy All Colors
        copyAllColorsButton.addEventListener('click', () => {
            const rgbText = rgbValueSpan.textContent;
            const hexText = hexValueSpan.textContent;
            const hslText = hslValueSpan.textContent;

            if (rgbText !== 'N/A') {
                const allColorsText = `RGB: rgb(${rgbText})\nHex: ${hexText}\nHSL: hsl(${hslText})`;
                copyToClipboard(allColorsText, allColorsCopiedFeedback);
            }
        });


        // Zoom level selection change
        zoomLevelSelect.addEventListener('change', (event) => {
            currentPixelScale = parseInt(event.target.value);
            // Re-pick color at current cursor position if active, to update zoom view
            if (currentImage && !isColorLocked) {
                const rect = mainCanvas.getBoundingClientRect();
                // Get approximate center of canvas as reference if mouse not over
                const x = mainCanvas.width / 2;
                const y = mainCanvas.height / 2;
                pickColor(x, y);
            } else {
                 // If no image or locked, just update the zoom canvas background
                 zoomCtx.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);
                 zoomCtx.fillStyle = '#f0f0f0';
                 zoomCtx.fillRect(0, 0, zoomCanvas.width, zoomCanvas.height);
            }
        });


        // Initial setup for the zoom canvas background
        zoomCtx.fillStyle = '#f0f0f0'; // Light grey background
        zoomCtx.fillRect(0, 0, zoomCanvas.width, zoomCanvas.height);

        // Initial render of color history and load from local storage
        loadColorHistory();

        // Handle canvas resizing for responsiveness
        window.addEventListener('resize', () => {
            if (currentImage) {
                // Redraw image to fit new container size without distorting
                const img = currentImage;
                const containerWidth = mainCanvas.parentElement.clientWidth;
                const containerHeight = mainCanvas.parentElement.clientHeight;

                let newWidth = img.width;
                let newHeight = img.height;

                // Only resize if image is larger than container
                if (img.width > containerWidth || img.height > containerHeight) {
                    const aspectRatio = img.width / img.height;
                    if (img.width / containerWidth > img.height / containerHeight) {
                        newWidth = containerWidth;
                        newHeight = containerWidth / aspectRatio;
                    } else {
                        newHeight = containerHeight;
                        newWidth = containerHeight * aspectRatio;
                    }
                }
                
                // Set canvas element's display size via style, not width/height attributes
                // The drawing buffer width/height remain the original image's size for pixel accuracy
                mainCanvas.style.width = '100%';
                mainCanvas.style.height = 'auto'; // Keep aspect ratio
            }
        });
    </script>
