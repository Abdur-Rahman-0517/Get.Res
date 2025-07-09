javascript:(function(){
    const main = document.querySelector("main");
    if (!main) { alert("Main element not found!"); return; }

    const svg = main.querySelector("svg");
    const div = main.querySelector("div");
    if (!svg || !div) { alert("SVG or DIV missing!"); return; }

    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const r = Math.min(rect.width, rect.height) * 0.48; // Adjusted for better fit

    // Start drawing
    div.dispatchEvent(new MouseEvent("mousedown", {
        clientX: cx + r,
        clientY: cy,
        bubbles: true,
        cancelable: true
    }));

    // Draw with 120 points (higher than before)
    const points = 120;
    for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const x = Math.round(cx + r * Math.cos(angle));
        const y = Math.round(cy + r * Math.sin(angle));

        div.dispatchEvent(new MouseEvent("mousemove", {
            clientX: x,
            clientY: y,
            bubbles: true,
            cancelable: true
        }));
    }

    // End drawing
    div.dispatchEvent(new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true
    }));

    console.log("Perfect circle drawn! Should be 100% now.");
})();
