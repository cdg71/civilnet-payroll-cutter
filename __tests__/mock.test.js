// const mock = require("mock-fs");
const generateFakePayroll = require("../src/lib/maker");
const { PDFDocument } = require("pdf-lib");

describe("En tant que développeur je veux générer des feuilles de paye à la volée pour effectuer mes tests. Le script devrait pouvoir...", () => {
  test("générer un train de paye PDF avec une feuille de paye d'une page", async () => {
    expect.assertions(1);
    const buffer = await generateFakePayroll(1);
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBe(1);
  });

  test("générer un train de paye PDF avec une feuille de paye de trois pages", async () => {
    expect.assertions(1);
    const buffer = await generateFakePayroll(3, [1, 2]);
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBe(3);
  });

  test("générer un train de paye PDF avec trois feuilles de paye : d'une page, de deux pages et d'une page", async () => {
    expect.assertions(1);
    const buffer = await generateFakePayroll(4, [2]);
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBe(4);
  });
});
