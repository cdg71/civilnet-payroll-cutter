"use strict";
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const PDFParser = require("pdf2json");
const cuid = require("cuid");

const getPayrollStructure = async (options) => {
  return new Promise((resolve, reject) => {
    try {
      const pdfParser = new PDFParser();
      pdfParser.on("pdfParser_dataError", (errData) =>
        reject(errData.toString())
      );
      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        // variables partagées entre les pages
        const defaultPage = {
          id: "",
          nom: "",
          numSecu: "",
          cleSecu: "",
          periode: "",
          pages: [],
        };
        let parent;
        let hasFollower = false;
        const index = pdfData.Pages.reduce((pages, page, pageNum) => {
          if (!hasFollower) {
            // Première page d'une série : on ajoute une page à l'index, on extrait les textes et on cherche s'il y a une page suivante
            // parent = pageNum;
            const pageContent = {
              ...defaultPage,
              id: cuid.slug(),
              pages: [++pageNum],
            };
            page.Texts.forEach((text, idx) => {
              const val = decodeURIComponent(text.R[0].T);
              switch (++idx) {
                case parseInt(options.nom):
                  pageContent.nom = val;
                  break;
                case parseInt(options.numSecu):
                  pageContent.numSecu = val;
                  break;
                case parseInt(options.cleSecu):
                  pageContent.cleSecu = val;
                  break;
                case parseInt(options.periode):
                  pageContent.periode = val;
                  break;
              }
              if (val === options.separateur) hasFollower = true;
            });
            pages.push(pageContent);
            parent = pages.length - 1;
          } else {
            // Seconde page et suivantes : on rajoute le numéro de page courante à la page parent et on cherche s'il y a une page suivante
            const bulletin = pages[parent];
            bulletin.pages.push(++pageNum);
            pages[parent] = bulletin;
            page.Texts.forEach((text) => {
              const val = decodeURIComponent(text.R[0].T);
              hasFollower = val === options.separateur;
            });
          }

          return pages;
        }, []);
        resolve(index);
      });
      pdfParser.loadPDF(options.input);
    } catch (error) {
      reject(error.message);
    }
  });
};

const getStickBackwardStructure = async (options) => {
  return new Promise((resolve, reject) => {
    try {
      const pdfParser = new PDFParser();
      pdfParser.on("pdfParser_dataError", (errData) =>
        reject(errData.toString())
      );
      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        // variables partagées entre les pages
        const defaultPage = {
          id: "",
          nom: "",
          pages: [],
        };
        let parent;
        const index = pdfData.Pages.reduce((docs, page, pageNum) => {
          const delimiter = decodeURIComponent(
            page.Texts[parseInt(options.parameter2) - 1].R[0].T
          );
          if (delimiter !== options.parameter3) {
            // Première page : on ajoute un nouveau doc à l'index et on extrait le nom
            docs.push({
              ...defaultPage,
              id: cuid.slug(),
              nom: delimiter,
              pages: [++pageNum],
            });
            parent = docs.length - 1;
          } else {
            // Seconde page et suivantes : on rajoute le numéro de page courante au doc parent
            const doc = docs[parent];
            doc.pages.push(++pageNum);
            docs[parent] = doc;
          }
          return docs;
        }, []);
        resolve(index);
      });
      pdfParser.loadPDF(options.input);
    } catch (error) {
      reject(error.message);
    }
  });
};

const dumpPdf = async (file) => {
  return new Promise((resolve, reject) => {
    try {
      const pdfParser = new PDFParser();
      pdfParser.on("pdfParser_dataError", (errData) =>
        reject(errData.toString())
      );
      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        const index = pdfData.Pages.map((page) =>
          page.Texts.map((text) => decodeURIComponent(text.R[0].T))
        );
        resolve(index);
      });
      pdfParser.loadPDF(file);
    } catch (error) {
      reject(error.message);
    }
  });
};

const dumpJson = async (file) => {
  try {
    const result = await fs.readFile(file).catch(() => {});
    return JSON.parse(result);
  } catch (error) {
    throw new Error(error.message);
  }
};

const dumpFolder = async (folder) => {
  try {
    const result = {};
    const dir = await fs
      .readdir(folder, { withFileTypes: true })
      .catch(() => {});
    for (const file of dir) {
      if (file.isFile()) {
        try {
          const filePath = path.join(folder, file.name);
          let data;
          switch (path.extname(filePath)) {
            case ".pdf":
              data = await dumpPdf(filePath);
              break;
            case ".json":
              data = await dumpJson(filePath);
              break;
          }
          // Le nom du fichier à capturer peut contenir une chaîne alétoire ; on hash le contenu pour ne pas dépendre du nom du fichier
          result[
            crypto.createHash("md5").update(JSON.stringify(data)).digest("hex")
          ] = data;
        } catch (error) {
          null;
        }
      }
    }
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  getPayrollStructure,
  getStickBackwardStructure,
  dumpPdf,
  dumpJson,
  dumpFolder,
};
