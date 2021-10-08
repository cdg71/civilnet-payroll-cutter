#!/usr/bin/env node
"use strict";
const { Command } = require("commander");
const moment = require("moment");
const momentDurationFormatSetup = require("moment-duration-format");
momentDurationFormatSetup(moment);
const meta = require("../package.json");
const { createConsoleTransport, createLogger } = require("./lib/logger");
const makeFixture = require("./lib/maker");
const rwf = require("../utils/recursive_write_file");

// Commander configuration
new Command()
  .storeOptionsAsProperties(false)
  .passCommandToAction(false)
  .name(" ")
  .usage("`cpm [options]` ou `civilnet-payroll-mock [options]`")
  .version(meta.version, "-v, --version", "affiche la version actuelle.")
  .description(
    "Génère un fichier PDF qui imite la structure d'un fichier de payes généré par le logiciel civilnet RH."
  )
  .requiredOption(
    "-o, --output <file>",
    "Chemin du fichier PDF de sortie. (obligatoire)"
  )
  .option("-n, --pages <integer>", "Nombre de pages à générer.", 1)
  .option(
    "-p, --predecessors <JSON_Array>",
    "Tableau des pages du fichier qui ont des pages suivantes.",
    "[]"
  )
  .option(
    "-t, --timeout <integer>",
    "Délai d'expiration du taitement, exprimé en secondes. Le script se termine alors automatiquement en erreur au delà de ce délai.",
    "300"
  )
  .helpOption("-h, --help", "Affiche l'aide.")
  .on("--help", () => {
    console.log("");
    console.log(
      `Exemple:  \`cpm -o c:\\%userprofile%\\Documents\\Civilnet_Payroll.pdf -n 6 -p "[2, 4]"\``
    );
    console.log("");
  })
  .action(async (options) => {
    // Gestion du temps
    const start = new moment();
    const countdown = setTimeout(() => {
      const error = new Error("Le délai d'attente est expiré.");
      throw error;
    }, parseInt(options.timeout) * 1000);

    //Configuration du logger
    const logLevel = "info";
    const logTransports = [createConsoleTransport()];
    const logger = createLogger(logLevel, logTransports);
    process.on("unhandledRejection", (error) => {
      logger.error("Exception non gérée", error);
    });
    logger.info("Début de la journalisation.");
    logger.info("Paramètres sélectionnés.", options);

    //Exécution du script
    try {
      logger.info("Initialisation terminée.");

      // Génération
      const data = await makeFixture(
        options.pages,
        JSON.parse(options.predecessors)
      );
      logger.info("Fin de la génération.");

      // écriture
      await rwf(options.output, data);

      // On fait le ménage
      clearTimeout(countdown);
      const end = new moment();
      const duration = moment
        .duration(end.diff(start))
        .format("mm[m ]ss[s ]SS[ms]", {
          trim: false,
        });
      logger.info(`Fin du traitement`, {
        duration,
      });
      process.exit();
    } catch (error) {
      // Gestion des erreurs
      const end = new moment();
      const duration = moment
        .duration(end.diff(start), "milliseconds")
        .format("mm[m ]ss[s ]SS[ms]", {
          trim: false,
        });
      logger.error("Erreur dans le script principal ", { error, duration });
      // On termine tous les processus de force
      process.abort();
    }
  })
  .parse(process.argv);
