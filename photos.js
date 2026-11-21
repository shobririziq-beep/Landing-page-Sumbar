/* =========================================================
   RANAH SUMBAR — LOCAL PHOTO MANIFEST

   Semua slot foto sengaja dikosongkan untuk sementara.
   Saat Member sudah mengumpulkan foto, tambahkan pemetaan
   berdasarkan ID destinasi di LOCAL_PHOTOS di bawah.

   Contoh:
   "jam-gadang": {
       src: "assets/images/destinasi/jam-gadang.jpg",
       credit: "Dokumentasi pribadi"
   }

   Jangan memakai foto destinasi lain sebagai pengganti.
========================================================= */

(() => {
    "use strict";

    const previousReady = window.SUMBAR_DATA_READY;

    if (!previousReady || typeof previousReady.then !== "function") {
        console.error("RANAH SUMBAR: data.js harus dimuat sebelum photos.js.");
        return;
    }

    const LOCAL_PHOTOS = {
        // Tambahkan foto lokal di sini setelah file tersedia.
        // "jam-gadang": {
        //     src: "assets/images/destinasi/jam-gadang.jpg",
        //     credit: "Dokumentasi pribadi"
        // },
    };

    const allowedPath = /^assets\/images\/destinasi\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i;

    window.SUMBAR_DATA_READY = Promise.resolve(previousReady).then(database => {
        const items = Array.isArray(window.SUMBAR_WISATA)
            ? window.SUMBAR_WISATA
            : (database?.destinations || []);

        const byId = new Map(items.map(item => [item.id, item]));
        let applied = 0;

        // Clear remote/old photo URLs. Empty slots remain intentionally blank.
        for (const item of items) {
            delete item.image;
            delete item.imageCredit;
            delete item.imageLicense;
            delete item.imageSource;
            delete item.imageLicenseUrl;
            item.imageStatus = "photo-needed";
        }

        // Apply only exact ID mappings to local files within the project's photo folder.
        for (const [id, photo] of Object.entries(LOCAL_PHOTOS)) {
            const item = byId.get(id);
            if (!item || !photo || !allowedPath.test(photo.src || "")) {
                console.warn("RANAH SUMBAR: mapping foto lokal dilewati:", id, photo?.src);
                continue;
            }

            item.image = photo.src;
            item.imageCredit = photo.credit || "Dokumentasi pengguna";
            item.imageLicense = photo.license || "Pastikan izin penggunaan foto telah diperoleh";
            item.imageSource = photo.source || "";
            item.imageLicenseUrl = photo.licenseUrl || "";
            item.imageStatus = "user-supplied";
            applied++;
        }

        window.SUMBAR_LOCAL_PHOTO_COUNT = applied;

        console.info("RANAH SUMBAR — PHOTO STATUS", {
            destinations: items.length,
            localPhotosLoaded: applied,
            emptyPhotoSlots: items.length - applied
        });

        return database;
    }).catch(error => {
        console.error("RANAH SUMBAR: foto-lokal gagal diproses.", error);
        throw error;
    });
})();