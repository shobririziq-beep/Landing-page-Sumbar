/* =========================================================
   RANAH SUMBAR — IMAGE FALLBACK + STAT COUNTER REPAIR
   Load AFTER script.js on every page.
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       01. RELIABLE IMAGE ERROR HANDLER

       Memperbaiki bug lama:
       parent gambar diambil sebelum gambar dihapus.
    ===================================================== */

    function handleBrokenImage(image) {
        if (!(image instanceof HTMLImageElement)) return;

        if (image.dataset.ranahFallbackDone === "1") return;

        const frame = image.closest(
            ".destination-card-image, .detail-hero"
        );

        if (!frame) return;

        image.dataset.ranahFallbackDone = "1";

        const isDetailHero =
            frame.classList.contains("detail-hero");

        const placeholderSelector = isDetailHero
            ? ".detail-hero-photo-placeholder"
            : ".photo-placeholder-content";

        const placeholder = frame.querySelector(
            placeholderSelector
        );

        // Perbaiki frame terlebih dahulu.
        frame.classList.remove("has-photo");
        frame.classList.add("image-placeholder");

        if (placeholder) {
            placeholder.style.display = "flex";
        }

        // Baru hapus gambar yang gagal.
        image.onerror = null;
        image.remove();
    }


    /* =====================================================
       02. GLOBAL IMAGE ERROR WATCHER
    ===================================================== */

    document.addEventListener("error", event => {

        if (event.target instanceof HTMLImageElement) {

            handleBrokenImage(event.target);

            event.stopImmediatePropagation();
        }

    }, true);


    /* =====================================================
       03. REPAIR IMAGES THAT ALREADY FAILED
    ===================================================== */

    function inspectImages(root = document) {

        if (!root || !root.querySelectorAll) return;

        const images = [];

        if (root instanceof HTMLImageElement) {
            images.push(root);
        }

        root.querySelectorAll(
            ".destination-card-image > img, .detail-hero > img"
        ).forEach(img => images.push(img));


        images.forEach(image => {

            if (
                image.dataset.ranahFallbackWatch === "1"
            ) return;

            image.dataset.ranahFallbackWatch = "1";

            image.addEventListener(
                "error",
                () => handleBrokenImage(image),
                { once: true }
            );

            // Tangani gambar yang sudah gagal sebelum diperiksa.
            if (
                image.complete &&
                image.naturalWidth === 0
            ) {
                handleBrokenImage(image);
            }

        });


        root.querySelectorAll(
            ".destination-card-image.image-placeholder"
        ).forEach(frame => {

            const placeholder = frame.querySelector(
                ".photo-placeholder-content"
            );

            if (placeholder) {
                placeholder.style.display = "flex";
            }

        });


        root.querySelectorAll(
            ".detail-hero.image-placeholder"
        ).forEach(frame => {

            const placeholder = frame.querySelector(
                ".detail-hero-photo-placeholder"
            );

            if (placeholder) {
                placeholder.style.display = "flex";
            }

        });

    }


    /* =====================================================
       04. COUNT-UP ANIMATION
    ===================================================== */

    function animateCount(
        element,
        target,
        duration = 1600
    ) {

        if (!element) return;

        const finalValue = Math.max(
            0,
            Math.round(Number(target) || 0)
        );

        if (
            element.dataset.countUpTarget === String(finalValue)
        ) {
            return;
        }

        element.dataset.countUpTarget =
            String(finalValue);

        element.textContent = "0";

        const formatter = new Intl.NumberFormat("id-ID");

        const reduceMotion =
            window.matchMedia &&
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;

        if (reduceMotion) {

            element.textContent =
                formatter.format(finalValue);

            return;
        }


        let started = false;

        function start() {

            if (started) return;

            started = true;

            const startTime = performance.now();

            function step(now) {

                const progress = Math.min(
                    (now - startTime) / duration,
                    1
                );

                const eased =
                    1 - Math.pow(1 - progress, 3);

                const current = Math.round(
                    finalValue * eased
                );

                element.textContent =
                    formatter.format(current);

                if (progress < 1) {

                    requestAnimationFrame(step);

                } else {

                    element.textContent =
                        formatter.format(finalValue);

                }

            }

            requestAnimationFrame(step);
        }


        if ("IntersectionObserver" in window) {

            const observer = new IntersectionObserver(
                (entries, instance) => {

                    if (
                        entries.some(entry => entry.isIntersecting)
                    ) {

                        start();
                        instance.disconnect();

                    }

                },
                {
                    threshold: 0.2
                }
            );

            observer.observe(element);

        } else {

            start();

        }

    }


    /* =====================================================
       05. INITIALIZE STATISTICS
    ===================================================== */

    async function initializeCounters() {

        try {

            if (window.SUMBAR_DATA_READY) {
                await window.SUMBAR_DATA_READY;
            }

        } catch (error) {

            console.error(
                "RANAH SUMBAR: database tidak dapat dibaca untuk statistik.",
                error
            );

            return;
        }


        const regions =
            Array.isArray(window.SUMBAR_REGIONS)
                ? window.SUMBAR_REGIONS.length
                : 19;

        const destinationCount =
            Array.isArray(window.SUMBAR_WISATA)
                ? window.SUMBAR_WISATA.length
                : 0;


        const regionCounter =
            document.querySelector(
                ".intro-stats .stat-item:first-child strong"
            );

        const destinationCounter =
            document.getElementById(
                "total-destinations"
            );


        if (regionCounter) {
            animateCount(regionCounter, regions);
        }

        if (destinationCounter) {
            animateCount(destinationCounter, destinationCount);
        }

    }


    /* =====================================================
       06. INITIALIZE ALL PAGES
    ===================================================== */

    function start() {

        inspectImages(document);

        initializeCounters();


        if (
            "MutationObserver" in window &&
            document.body
        ) {

            const observer = new MutationObserver(records => {

                for (const record of records) {

                    for (const node of record.addedNodes) {

                        if (
                            node.nodeType === Node.ELEMENT_NODE
                        ) {

                            inspectImages(node);

                        }

                    }

                }

            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

        }

    }


    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            start,
            { once: true }
        );

    } else {

        start();

    }

})();