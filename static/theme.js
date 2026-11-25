(() => {
    const themes = ["system", "light", "dark"];
    const root = document.documentElement;
    let theme = "system";

    try {
        const saved = localStorage.getItem("theme");
        if (themes.includes(saved)) theme = saved;
    } catch {
        // The theme can still be changed for this page when storage is unavailable.
    }

    function applyTheme() {
        if (theme === "system") {
            delete root.dataset.theme;
        } else {
            root.dataset.theme = theme;
        }
    }

    applyTheme();

    document.addEventListener("DOMContentLoaded", () => {
        const toggle = document.querySelector(".theme-toggle");
        if (!toggle) return;

        const nextTheme = () => themes[(themes.indexOf(theme) + 1) % themes.length];

        function updateToggle() {
            const label = `Theme: ${theme}. Switch to ${nextTheme()}.`;
            toggle.dataset.mode = theme;
            toggle.setAttribute("aria-label", label);
            toggle.title = label;
        }

        updateToggle();
        document.querySelector(".theme-fallback").hidden = true;
        toggle.hidden = false;

        toggle.addEventListener("click", () => {
            theme = nextTheme();
            applyTheme();
            updateToggle();
            try {
                localStorage.setItem("theme", theme);
            } catch {
                // The selection remains active for the current page.
            }
        });
    });
})();
