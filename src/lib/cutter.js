"use strict";
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const { expose } = require("threads/worker");
const rwf = require("../../utils/recursive_write_file");

expose(async (item, options, buffer) => {
  try {
    const file =
      `BS_${item.numSecu}_${item.cleSecu}_${item.periode}_${item.nom}_${item.id}`
        .replace(/[^a-z0-9_-]/gi, "_")
        .replace(/_{2,}/g, "_")
        .replace(/-_/g, "_") + ".pdf";
    // Créer un nouveau stream PDF et charger le fichier externe comme template
    const pages = item.pages.map((n) => --n);
    const ext = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const doc = await PDFDocument.create();
    const extractedPages = await doc.copyPages(ext, pages);
    extractedPages.forEach((page) => {
      doc.addPage(page);
    });
    const savedBytes = await doc.save();
    if (!options.dryRun) {
      await rwf(path.join(options.output, file), savedBytes);
    }

    // Renvoyer le résultat au processus parent
    return {
      file,
    };
  } catch (error) {
    throw new Error(error.message);
  }
});
