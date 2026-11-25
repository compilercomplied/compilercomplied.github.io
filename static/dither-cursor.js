(() => {
    const homepage = document.querySelector(".homepage");
    const main = homepage.querySelector(".home-main");
    const header = homepage.querySelector(".site-header");
    const field = homepage.querySelector(".dither-field");
    const canvas = field.querySelector(".dither-ripple");
    const canAnimate = matchMedia("(any-hover: hover) and (any-pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)");
    const systemTheme = matchMedia("(prefers-color-scheme: dark)");
    const radius = 96;
    const openingTime = 125;
    const recoveryTime = 760;
    const wakeInterval = 105;
    const wakeSpacing = 28;
    const wake = Array(6).fill(null);
    const pointLimit = wake.length + 1;
    const pointData = new Float32Array(pointLimit * 3);
    const pixelBudget = 4_000_000;
    let nextSlot = 0;
    let renderer;
    let cursor = null;
    let lastWake = null;
    let frame = 0;

    function createRenderer() {
        const gl = canvas.getContext("webgl2", {
            antialias: false,
            depth: false,
            failIfMajorPerformanceCaveat: true
        });
        if (!gl) return null;

        const program = gl.createProgram();
        if (!program) return null;
        const sources = [
            [gl.VERTEX_SHADER, `#version 300 es
                void main() {
                    const vec2 vertices[3] = vec2[3](vec2(-1, -1), vec2(3, -1), vec2(-1, 3));
                    gl_Position = vec4(vertices[gl_VertexID], 0, 1);
                }`],
            [gl.FRAGMENT_SHADER, `#version 300 es
                precision highp float;
                uniform vec2 canvasSize;
                uniform vec2 cssPixels;
                uniform vec3 ink;
                uniform vec4 wakeBounds;
                uniform int pointCount;
                uniform vec3 points[${pointLimit}];
                out vec4 color;

                void main() {
                    vec2 pixel = vec2(gl_FragCoord.x, canvasSize.y - gl_FragCoord.y) * cssPixels;
                    vec2 samplePoint = pixel;
                    float visibility = 1.;
                    if (all(greaterThanEqual(pixel, wakeBounds.xy)) && all(lessThanEqual(pixel, wakeBounds.zw))) {
                        for (int i = 0; i < pointCount; ++i) {
                            vec2 offset = pixel - points[i].xy;
                            float falloff = 1. - smoothstep(0., ${radius}., length(offset));
                            // Sample inward to spread the visible dots outward.
                            float strength = points[i].z * falloff;
                            samplePoint -= offset * (.35496 * strength * falloff);
                            visibility *= 1. - .28 * strength;
                        }
                    }
                    // Match the static CSS dot tile. The parent applies the shared fade and opacity.
                    float distanceToDot = length(mod(samplePoint + 1., 4.) - 2.);
                    float opacity = clamp((.91 - distanceToDot) / (.91 - .52), 0., 1.) * visibility;
                    color = vec4(ink * opacity, opacity);
                }`]
        ];
        for (const [type, source] of sources) {
            const shader = gl.createShader(type);
            if (!shader) {
                gl.deleteProgram(program);
                return null;
            }
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            gl.attachShader(program, shader);
            gl.deleteShader(shader);
        }
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program);
            return null;
        }
        gl.useProgram(program);
        const sizeUniform = gl.getUniformLocation(program, "canvasSize");
        const pixelsUniform = gl.getUniformLocation(program, "cssPixels");
        const inkUniform = gl.getUniformLocation(program, "ink");
        const boundsUniform = gl.getUniformLocation(program, "wakeBounds");
        const countUniform = gl.getUniformLocation(program, "pointCount");
        const pointsUniform = gl.getUniformLocation(program, "points[0]");
        const [maxWidth, maxHeight] = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
        let bounds;

        return {
            start() {
                bounds = field.getBoundingClientRect();
                const { width, height } = bounds;
                if (!width || !height) return false;
                const ink = getComputedStyle(field).color.match(/^rgb\(([\d.]+),\s*([\d.]+),\s*([\d.]+)\)$/);
                if (!ink) return false;
                const scale = Math.min(devicePixelRatio, Math.sqrt(pixelBudget / (width * height)), maxWidth / width, maxHeight / height);
                const pixelWidth = Math.max(1, Math.floor(width * scale));
                const pixelHeight = Math.max(1, Math.floor(height * scale));
                if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
                if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
                const bufferWidth = gl.drawingBufferWidth;
                const bufferHeight = gl.drawingBufferHeight;
                if (!bufferWidth || !bufferHeight) return false;
                gl.viewport(0, 0, bufferWidth, bufferHeight);
                gl.uniform2f(sizeUniform, bufferWidth, bufferHeight);
                gl.uniform2f(pixelsUniform, width / bufferWidth, height / bufferHeight);
                gl.uniform3f(inkUniform, ink[1] / 255, ink[2] / 255, ink[3] / 255);
                return !gl.isContextLost();
            },
            draw(points) {
                let left = Infinity;
                let top = Infinity;
                let right = -Infinity;
                let bottom = -Infinity;
                points.forEach(({ x, y, amount }, index) => {
                    const localX = x - bounds.left;
                    const localY = y - bounds.top;
                    const slot = index * 3;
                    pointData[slot] = localX;
                    pointData[slot + 1] = localY;
                    pointData[slot + 2] = amount;
                    left = Math.min(left, localX);
                    top = Math.min(top, localY);
                    right = Math.max(right, localX);
                    bottom = Math.max(bottom, localY);
                });
                gl.uniform4f(boundsUniform, left - radius, top - radius, right + radius, bottom + radius);
                gl.uniform1i(countUniform, points.length);
                gl.uniform3fv(pointsUniform, pointData);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
            }
        };
    }

    function smooth(progress) {
        const t = Math.max(0, Math.min(1, progress));
        return t * t * (3 - 2 * t);
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
        canvas.hidden = true;
        delete homepage.dataset.ditherActive;
    }

    function animate(time) {
        frame = 0;
        const points = [];
        for (let index = 0; index < wake.length; index++) {
            const point = wake[index];
            if (!point) continue;
            const amount = pressure(point, time);
            if (amount <= .005) wake[index] = null;
            else points.push({ x: point.x, y: point.y, amount });
        }
        let recovering = points.length > 0;
        if (cursor) {
            const amount = pressure(cursor, time);
            if (cursor.releasedAt !== null && amount <= .005) {
                cursor = null;
            } else {
                points.push({ x: cursor.x, y: cursor.y, amount });
                recovering ||= cursor.releasedAt !== null || amount < 1;
            }
        }

        if (!points.length) {
            reset();
            return;
        }
        if (canvas.hidden) {
            if (!renderer.start()) {
                reset();
                return;
            }
            canvas.hidden = false;
            homepage.dataset.ditherActive = "";
        }
        renderer.draw(points);
        if (recovering) schedule();
    }

    function schedule() {
        if (!frame) frame = requestAnimationFrame(animate);
    }

    main.addEventListener("pointermove", (event) => {
        if (!canAnimate.matches || event.pointerType === "touch") return;
        if (renderer === undefined) renderer = createRenderer();
        if (!renderer) return;

        const time = performance.now();
        const point = { x: event.clientX, y: event.clientY };
        if (!cursor || cursor.releasedAt !== null) {
            cursor = { ...point, openedAt: time, releasedAt: null };
            lastWake = { ...point, time: time - wakeInterval };
        } else {
            const distance = Math.hypot(point.x - lastWake.x, point.y - lastWake.y);
            if (distance >= wakeSpacing && time - lastWake.time >= wakeInterval) {
                wake[nextSlot] = { x: cursor.x, y: cursor.y, pressure: .60 * pressure(cursor, time), releasedAt: time };
                nextSlot = (nextSlot + 1) % wake.length;
                lastWake = { ...point, time };
            }
            Object.assign(cursor, point);
        }
        schedule();
    }, { passive: true });

    main.addEventListener("pointerleave", () => {
        if (!cursor || cursor.releasedAt !== null) return;
        const time = performance.now();
        cursor.pressure = pressure(cursor, time);
        cursor.releasedAt = time;
        schedule();
    });
    canvas.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        reset();
        renderer = null;
    });
    canvas.addEventListener("webglcontextrestored", () => {
        renderer = undefined;
    });
    // Finish the ripple before the theme switch repaints the background.
    header.addEventListener("pointerenter", reset);
    header.querySelector(".theme-toggle").addEventListener("click", reset, { capture: true });
    window.addEventListener("resize", reset);
    window.addEventListener("scroll", reset, { passive: true });
    window.addEventListener("blur", reset);
    canAnimate.addEventListener("change", reset);
    systemTheme.addEventListener("change", reset);
})();
