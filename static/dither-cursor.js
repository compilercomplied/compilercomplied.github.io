(() => {
    const homepage = document.querySelector(".homepage");
    const canAnimate = matchMedia("(any-hover: hover) and (any-pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)");
    const radius = 104;
    const featherRadius = 78;
    const displacementScale = 40;
    const openingTime = 125;
    const recoveryTime = 670;
    const wakeInterval = 105;
    const wakeSpacing = 28;

    const layers = [
        { filter: "#page-dither-cursor", element: ".dither-field" },
        { filter: "#hill-dither", element: ".hill-image" }
    ].map(({ filter, element }) => {
        const definition = homepage.querySelector(filter);
        const strengths = definition.querySelectorAll(".cursor-strength");
        return {
            element: homepage.querySelector(element),
            displacement: definition.querySelector("feDisplacementMap"),
            slots: Array.from(definition.querySelectorAll(".cursor-map"), (map, index) => ({
                map,
                strength: strengths[index]
            }))
        };
    });
    const wake = Array(layers[0].slots.length - 1).fill(null);
    let nextSlot = 0;
    let initialized = false;
    let cursor = null;
    let lastWake = null;
    let frame = 0;

    function smooth(progress) {
        const t = Math.max(0, Math.min(1, progress));
        return t * t * (3 - 2 * t);
    }

    function initialize() {
        const size = radius * 2;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) return false;
        const image = context.createImageData(size, size);

        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const dx = col + .5 - radius;
                const dy = row + .5 - radius;
                const distance = Math.hypot(dx, dy);
                const force = .12 * Math.max(0, 1 - (distance / radius) ** 2) ** 2;
                const index = (row * size + col) * 4;
                // Red and green shift the sampling point inward to spread the visible dots outward.
                image.data[index] = 255 * (.5 - (dx * force) / displacementScale);
                image.data[index + 1] = 255 * (.5 - (dy * force) / displacementScale);
                // Leave some grain visible even at the center of the wake.
                const clearance = 1 - smooth(distance / featherRadius);
                image.data[index + 2] = 128 * clearance ** 1.5;
                image.data[index + 3] = 255 * (1 - smooth((distance - featherRadius) / (radius - featherRadius)));
            }
        }

        context.putImageData(image, 0, 0);
        const source = canvas.toDataURL("image/png");
        for (const { slots } of layers) {
            for (const { map } of slots) {
                map.setAttribute("width", size);
                map.setAttribute("height", size);
                map.setAttribute("href", source);
            }
        }
        return true;
    }

    function pressure(point, time) {
        if (point.releasedAt !== null) {
            return point.pressure * (1 - smooth((time - point.releasedAt) / recoveryTime));
        }
        return smooth((time - point.openedAt) / openingTime);
    }

    function reset() {
        cancelAnimationFrame(frame);
        frame = 0;
        cursor = null;
        lastWake = null;
        wake.fill(null);
        delete homepage.dataset.ditherActive;
        for (const { displacement, slots } of layers) {
            displacement.scale.baseVal = 0;
            for (const slot of slots) slot.strength.slope.baseVal = 0;
        }
    }

    function animate(time) {
        frame = 0;
        let recovering = false;
        const points = wake.map((point, index) => {
            if (!point) return null;
            const amount = pressure(point, time);
            if (amount <= .005) {
                wake[index] = null;
                return null;
            }
            recovering = true;
            return { x: point.x, y: point.y, amount };
        });

        if (cursor) {
            const amount = pressure(cursor, time);
            if (cursor.releasedAt !== null && amount <= .005) {
                cursor = null;
            } else {
                points.push({ x: cursor.x, y: cursor.y, amount });
                recovering ||= cursor.releasedAt !== null || amount < 1;
            }
        }

        if (!cursor && !recovering) {
            reset();
            return;
        }

        const bounds = layers.map(({ element }) => element.getBoundingClientRect());
        layers.forEach(({ slots }, layerIndex) => {
            slots.forEach(({ map, strength }, slotIndex) => {
                const point = points[slotIndex];
                strength.slope.baseVal = point?.amount ?? 0;
                if (!point) return;
                map.setAttribute("x", Math.round(point.x - bounds[layerIndex].left - radius));
                map.setAttribute("y", Math.round(point.y - bounds[layerIndex].top - radius));
            });
        });

        if (recovering) schedule();
    }

    function schedule() {
        if (!frame) frame = requestAnimationFrame(animate);
    }

    window.addEventListener("pointermove", (event) => {
        if (!canAnimate.matches || event.pointerType === "touch") return;
        if (!initialized) initialized = initialize();
        if (!initialized) return;

        const time = performance.now();
        const point = { x: event.clientX, y: event.clientY };
        if (!cursor || cursor.releasedAt !== null) {
            cursor = { ...point, openedAt: time, releasedAt: null };
            lastWake = { ...point, time: time - wakeInterval };
        } else {
            const distance = Math.hypot(point.x - lastWake.x, point.y - lastWake.y);
            if (distance >= wakeSpacing && time - lastWake.time >= wakeInterval) {
                wake[nextSlot] = { x: cursor.x, y: cursor.y, pressure: .78 * pressure(cursor, time), releasedAt: time };
                nextSlot = (nextSlot + 1) % wake.length;
                lastWake = { ...point, time };
            }
            Object.assign(cursor, point);
        }

        if (!homepage.hasAttribute("data-dither-active")) {
            homepage.dataset.ditherActive = "";
            for (const { displacement } of layers) displacement.scale.baseVal = displacementScale;
        }
        schedule();
    }, { passive: true });

    document.documentElement.addEventListener("pointerleave", () => {
        if (!cursor || cursor.releasedAt !== null) return;
        const time = performance.now();
        cursor.pressure = pressure(cursor, time);
        cursor.releasedAt = time;
        schedule();
    });
    window.addEventListener("resize", reset);
    window.addEventListener("blur", reset);
    canAnimate.addEventListener("change", reset);
})();
