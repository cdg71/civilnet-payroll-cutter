"use strict";
const fs = require("fs").promises;
const path = require("path");
const meta = require("../package.json");
const { Command } = require("commander");
const run = require("../utils/runner");

new Command()
  .name(" ")
  .usage("`npm run exec -- [options]`")
  .version(meta.version, "-v, --version", "affiche la version actuelle.")
  .description(
    "Pour chaque PDF disponible dans le dossier d'entrée, le script d'exécution le déplace dans le dossier de travail et invoque civilnet-payroll-cutter avec les paramètres fournis. Il accepte comme paramètres spécifiques un dossier d'entrée et un dossier de travail. les autres paramètres sont identiques à civilnet-payroll-cutter."
  )
  .requiredOption(
    "-i, --input <folder>",
    "Chemin du dossier d'entrée. (obligatoire)"
  )
  .requiredOption(
    "-w, --working-dir <folder>",
    "Chemin du dossier de travail. (obligatoire)"
  )
  .allowUnknownOption(true)
  .helpOption("-h, --help", "Affiche l'aide.")
  .on("--help", () => {
    console.log("");
    console.log(
      `Exemple:  \`cpc -i c:\\%userprofile%\\Documents\\Civilnet_Payroll.pdf -o c:\\%userprofile%\\Documents\``
    );
    console.log("");
    console.log(
      `Format de sortie:  \`BS_{NUMERO-DE-SECURITE-SOCIALE}_{CLE}_{PERIODE-DE-PAIE-AAAA-MM}_{NOM_COMPLET}_{IDENTIFIANT-DE-DEDOUBLONNAGE}.pdf\` (Ex. \`BS_9999999999999_99_2020-03_DUPONT_JEAN_378hpi5.pdf\`).`
    );
    console.log("");
  })
  .action(async (options, command) => {
    // Préparer le tableau d'option au format dash-case attendu par commander
    // l'option workingDir est ignorée, l'option input est ignorée à cette étape et injectée pour chaque fichier dans la boucle d'invocation du script de découpage

    // Scanner le dossier d'entrée
    const files = await fs.readdir(options.input);

    // Pour chaque fichier pdf
    for (const file of files) {
      try {
        if (path.extname(file).toLowerCase() === ".pdf") {
          // déplacer le fichier dans le dossier de traitement temporaire
          const inputPath = path.resolve(options.input, file);
          const workingDirPath = path.resolve(options.workingDir, file);
          await fs.rename(inputPath, workingDirPath);
          // lancer le découpage de manière synchrone pour ne pas altérer les logs, avec les options supplémentaires passées au script d'exécution notre propre chemin de fichier input spécifique
          await run("./src/cut.js", ["-i", workingDirPath, ...command.args]);
        }
      } catch (error) {
        // On ignore les erreurs éventuelles et on poursuit le script
        console.log(error);
      } finally {
        process.exit();
      }
    }
  })
  .parse(process.argv);
