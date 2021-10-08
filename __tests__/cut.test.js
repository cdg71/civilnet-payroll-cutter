const fs = require("fs").promises;
const path = require("path");
const cuid = require("cuid");
const run = require("../utils/runner");
const { dumpFolder } = require("../src/lib/parser");

describe("En tant qu'utilisateur je veux découper un train de paye au format PDF en bulletins de salaire individuels. Le script devrait pouvoir...", () => {
  // On crée un dossier unique pour la suite de tests
  const testSuiteFolder = `./tests_results/cut_${cuid.slug()}`;

  // Avant les tests, crée le dossier de la suite de tests avant de l'utiliser ou on le vide s'il existe
  beforeAll(async () => {
    try {
      let exists = false;
      exists = await fs.stat(testSuiteFolder).catch(() => null);
      if (exists)
        await fs.rmdir(testSuiteFolder, {
          recursive: true,
        });
      await fs.mkdir(testSuiteFolder, {
        recursive: true,
      });
    } catch (error) {
      console.log(error);
    }
  });

  // Après les tests, on supprime le dossier de la suite de tests
  // afterAll(async () => {
  //   try {
  //     let exists = false;
  //     exists = await fs.stat(testSuiteFolder).catch(() => null);
  //     if (exists)
  //       await fs.rmdir(testSuiteFolder, {
  //         recursive: true,
  //       });
  //   } catch (error) {
  //     console.log(error);
  //   }
  // });

  test("découper un fichier PDF avec une feuille de paye d'une page", async () => {
    expect.assertions(1);
    let result = null;
    try {
      const testFolder = path.resolve(testSuiteFolder, cuid.slug());
      const fixturePath = path.resolve(testFolder, "fixture.pdf");
      await run("./src/mock.js", ["-o", fixturePath]);
      await run("./src/cut.js", ["-i", fixturePath, "-o", testFolder]);
      result = await dumpFolder(testFolder);
      expect(result).toMatchSnapshot();
    } catch (error) {
      console.log(error);
    }
  });

  test("découper un fichier PDF avec une feuille de paye de trois pages", async () => {
    expect.assertions(1);
    let result = null;
    try {
      const testFolder = path.resolve(testSuiteFolder, cuid.slug());
      const fixturePath = path.resolve(testFolder, "fixture.pdf");
      await run("./src/mock.js", ["-o", fixturePath, "-n", 3, "-p", "[1, 2]"]);
      await run("./src/cut.js", ["-i", fixturePath, "-o", testFolder]);
      result = await dumpFolder(testFolder);
      expect(result).toMatchSnapshot();
    } catch (error) {
      console.log(error);
    }
  });

  test("découper un fichier PDF avec trois feuilles de paye : d'une page, de deux pages et d'une page", async () => {
    expect.assertions(1);
    let result = null;
    try {
      const testFolder = path.resolve(testSuiteFolder, cuid.slug());
      const fixturePath = path.resolve(testFolder, "fixture.pdf");
      await run("./src/mock.js", ["-o", fixturePath, "-n", 4, "-p", "[2]"]);
      await run("./src/cut.js", ["-i", fixturePath, "-o", testFolder]);
      result = await dumpFolder(testFolder);
      expect(result).toMatchSnapshot();
    } catch (error) {
      console.log(error);
    }
  });
});
