(() => {
    const preview = document.querySelector(".mood-motion-preview");
    const track = preview.querySelector(".mood-motion-track");
    const toggle = preview.querySelector(".mood-motion-mode");
    const runner = preview.querySelector(".mood-motion-runner");
    const modes = [...document.querySelectorAll(".mood-framework-motion [data-motion-mode]")];
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const endPause = 1000;
    const animation = new Animation(new KeyframeEffect(runner, []), document.timeline);
    let index = 0;
    let visible = false;

    function updateMode() {
        const mode = modes[index];
        const label = mode.querySelector("dt").textContent;
        preview.dataset.motion = mode.dataset.motionMode;
        toggle.textContent = label;

        const style = getComputedStyle(preview);
        const travel = parseFloat(style.getPropertyValue("--preview-duration"));
        const easing = style.getPropertyValue("--preview-easing").trim();
        const startOpacity = parseFloat(style.getPropertyValue("--preview-start-opacity"));
        const left = { transform: "translateX(0)", opacity: startOpacity };
        const right = { transform: "translateX(100%)", opacity: 1 };
        const cycle = 2 * (endPause + travel);
        const elapsed = animation.currentTime;
        const previousCycle = animation.effect.getComputedTiming().duration;

        animation.effect.setKeyframes([
            { ...left, offset: 0 },
            { ...left, offset: endPause / cycle, easing },
            { ...right, offset: (endPause + travel) / cycle },
            { ...right, offset: (2 * endPause + travel) / cycle, easing },
            { ...left, offset: 1 },
        ]);
        animation.effect.updateTiming({ duration: cycle, iterations: Infinity });
        animation.currentTime = typeof elapsed === "number" && previousCycle > 0
            ? elapsed * cycle / previousCycle
            : 0;
        updatePlayback();
    }

    function updatePlayback() {
        const paused = preview.hasAttribute("data-paused");
        track.disabled = reducedMotion.matches;
        track.setAttribute("aria-label", reducedMotion.matches ? "Static motion preview" :
            paused ? "Play motion preview" : "Pause motion preview");
        track.title = track.getAttribute("aria-label");
        const next = modes[(index + 1) % modes.length].querySelector("dt").textContent;
        toggle.setAttribute("aria-label", paused && !reducedMotion.matches
            ? `Play ${toggle.textContent}`
            : `${toggle.textContent}. Switch to ${next}`);

        if (reducedMotion.matches) animation.cancel();
        else if (visible && !paused) animation.play();
        else animation.pause();
    }

    function advancePastHold() {
        if (reducedMotion.matches) return;
        const cycle = animation.effect.getComputedTiming().duration;
        const time = animation.currentTime % cycle;
        const right = cycle / 2;
        if (time < endPause) animation.currentTime = endPause;
        else if (time >= right && time < right + endPause) animation.currentTime = right + endPause;
    }

    toggle.addEventListener("click", () => {
        if (!reducedMotion.matches && preview.hasAttribute("data-paused")) {
            preview.removeAttribute("data-paused");
            updatePlayback();
        } else {
            index = (index + 1) % modes.length;
            updateMode();
        }
        advancePastHold();
    });

    track.addEventListener("click", () => {
        const paused = preview.toggleAttribute("data-paused");
        updatePlayback();
        if (!paused) advancePastHold();
    });
    reducedMotion.addEventListener("change", updatePlayback);
    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        updatePlayback();
    }).observe(preview);

    preview.hidden = false;
    updateMode();
})();

(() => {
    const controls = document.querySelector(".mood-framework-controls");
    const note = controls.querySelector(".mood-framework-field");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let fade;

    function cancelFade() {
        fade?.cancel();
        fade = undefined;
    }

    async function save(event) {
        event.preventDefault();
        if (!note.value || fade) return;
        if (reducedMotion.matches) {
            note.value = "";
            return;
        }

        const style = getComputedStyle(note);
        const duration = parseFloat(style.getPropertyValue("--mood-fade"));
        const saving = note.animate([{ color: style.color }, { color: "transparent" }], {
            duration, easing: "ease", fill: "forwards",
        });
        fade = saving;
        await Promise.allSettled([saving.finished]);
        if (fade !== saving) return;
        note.value = "";
        cancelFade();
    }

    controls.addEventListener("reset", save);
    controls.addEventListener("submit", save);
    note.addEventListener("input", cancelFade);
})();
