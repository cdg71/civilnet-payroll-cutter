const { PDFDocument, PageSizes } = require("pdf-lib");

const makeTemplate = (
  numBulletin,
  numPageBulletin,
  numPagePayroll,
  hasFollower
) => [
  `FAUX BULLETIN #${numBulletin}`,
  `PAGE DU BULLETIN #${numPageBulletin}`,
  `PAGE DU TRAIN DE PAYE #${numPagePayroll}`,
  "4",
  "5",
  "6",
  "7",
  "01-01-2020 - 31-01-2020",
  "9",
  `NOM${numBulletin}`,
  "11",
  "12",
  `NUMSECU${numBulletin}`,
  `CLESECU${numBulletin}`,
  "15",
  "16",
  hasFollower ? ".../..." : "17",
];

const makeFixture = async (
  totalNumberOfPages = 1,
  hasAnotherPageArray = []
) => {
  try {
    const fontSize = 12;
    const padding = 2 * fontSize;
    const lineHeight = 1.5 * fontSize;
    const options = {
      author: "",
      creationDate: "2000-01-01T00:00:00",
      creator: "",
      keywords: [],
      language: "",
      modificationDate: "2000-01-01T00:00:00",
      producer: "",
      subject: "",
      title: "",
    };

    const pdfDoc = await PDFDocument.create({});
    pdfDoc.setAuthor(options.author);
    pdfDoc.setCreationDate(new Date(options.creationDate));
    pdfDoc.setCreator(options.creator);
    pdfDoc.setKeywords(options.keywords);
    pdfDoc.setLanguage(options.language);
    pdfDoc.setModificationDate(new Date(options.modificationDate));
    pdfDoc.setProducer(options.producer);
    pdfDoc.setSubject(options.subject);
    pdfDoc.setTitle(options.title);
    const height = PageSizes.A4[1];
    const top = height - padding;
    let numBulletin = 1;
    let numPage = 1;
    for (let i = 1; i <= totalNumberOfPages; i++) {
      const page = pdfDoc.addPage(PageSizes.A4);
      let items = makeTemplate(
        numBulletin,
        numPage,
        i,
        hasAnotherPageArray.includes(i)
      );
      items.forEach((item, index) => {
        page.drawText(item, {
          size: fontSize,
          x: padding,
          y: top - index * lineHeight,
        });
      });
      if (!hasAnotherPageArray.includes(i)) {
        ++numBulletin;
        numPage = 1;
      } else {
        ++numPage;
      }
    }
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = makeFixture;
