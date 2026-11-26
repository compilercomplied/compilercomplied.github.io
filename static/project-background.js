(() => {
    const root = document.documentElement;
    const script = document.currentScript;
    const isProjects = script.hasAttribute("data-project-list");
    const otherPage = new URL(script.dataset.from, location.href);
    const navigationType = performance.getEntriesByType("navigation")[0]?.type;
    const fromOtherPage = navigationType === "navigate" && document.referrer === otherPage.href;
    const returnKey = "project-background-return";

    if (fromOtherPage) root.dataset.projectBackground = "";

    if (isProjects) {
        const optOut = document.createElement("style");
        optOut.textContent = "@view-transition { navigation: none; }";

        function restoreBackground() {
            try {
                if (sessionStorage.getItem(returnKey) !== location.pathname) return;
                sessionStorage.removeItem(returnKey);
                root.dataset.projectBackground = "";
            } catch {
                // The page works when session storage is unavailable.
            }
        }

        if (navigationType === "back_forward") restoreBackground();
        window.addEventListener("pageshow", event => {
            optOut.remove();
            if (event.persisted) restoreBackground();
        });
        window.addEventListener("pagehide", () => delete root.dataset.projectBackground);
        document.addEventListener("click", event => {
            const link = event.target.closest(".project-title");
            if (link?.href === otherPage.href && isPlainClick(event)) document.head.append(optOut);
        });
        return;
    }

    document.addEventListener("DOMContentLoaded", async () => {
        const journal = document.querySelector(".memory-frame");
        const backdrop = document.querySelector(".mood-backdrop");
        const fade = backdrop.getAnimations();
        if (fade.length) await Promise.allSettled(fade.map(animation => animation.finished));
        journal.replaceWith(journal.content);
    }, { once: true });

    if (fromOtherPage) {
        document.addEventListener("click", event => {
            if (!event.target.closest(".project-back") || !isPlainClick(event)) return;
            try {
                sessionStorage.setItem(returnKey, otherPage.pathname);
            } catch {
                return;
            }
            event.preventDefault();
            history.back();
        });
    }

    function isPlainClick(event) {
        return !event.defaultPrevented && event.button === 0 &&
            !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    }
})();
