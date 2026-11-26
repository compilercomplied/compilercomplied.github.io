(() => {
    if (!document.referrer || !matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    if (performance.getEntriesByType("navigation")[0]?.type !== "navigate") return;

    const previousPage = new URL(document.referrer);
    if (previousPage.origin !== location.origin) return;

    const headerPages = document.currentScript.dataset.headerPages?.split(" ");
    const hasNativeTransition = typeof window.CSSViewTransitionRule === "function" &&
        matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (!hasNativeTransition && previousPage.pathname !== location.pathname &&
        headerPages?.includes(previousPage.pathname)) {
        document.documentElement.dataset.contentEntering = "";
    }

    document.addEventListener("DOMContentLoaded", () => {
        const links = [...document.querySelectorAll(".nav-links .nav-link")];
        const previousLink = links.find(link => link.pathname === previousPage.pathname);
        const previous = previousLink ?? links.find(link =>
            link.pathname !== "/" && previousPage.pathname.startsWith(`${link.pathname.replace(/\/$/, "")}/`)
        );
        const current = links.find(link => link.getAttribute("aria-current") === "page");
        if (!previous || !current || previous === current) return;

        const start = previous.getBoundingClientRect();
        const end = current.getBoundingClientRect();
        const offsetX = start.left - end.left;
        current.style.setProperty("--selection-offset-x", `${offsetX}px`);
        current.style.setProperty("--selection-offset-y", `${start.top - end.top}px`);
        current.style.setProperty("--selection-overtravel", `${-Math.sign(offsetX) * 2}px`);
        current.dataset.selectionMotion = "";
    }, { once: true });
})();
