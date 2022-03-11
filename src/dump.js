#!/usr/bin/env node
"use strict";
const { Command } = require("commander");
const moment = require("moment");
const momentDurationFormatSetup = require("moment-duration-format");
momentDurationFormatSetup(moment);
const meta = require("../package.json");
const { createConsoleTransport, createLogger } = require("./lib/logger");
const { dumpPdf } = require("./lib/parser");
const rwf = require("../utils/recursive_write_file");

// Commander configuration
new Command()
  .name(" ")
  .usage("`cpd [options]` ou `civilnet-payroll-dump [options]`")
  .version(meta.version, "-v, --version", "affiche la version actuelle.")
  .description(
    "Extrait la structure d'un fichier PDF global de payes généré par le logiciel civilnet RH au format json (zones de textes regroupées par page)."
  )
  .requiredOption(
    "-i, --input <file>",
    "Chemin du fichier PDF d'entrée. (obligatoire)"
  )
  .requiredOption(
    "-o, --output <file>",
    "Chemin du fichier JSON de sortie. (obligatoire)"
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
      `Exemple:  \`cpd -i c:\\%userprofile%\\Documents\\Civilnet_Payroll.pdf -o c:\\%userprofile%\\Documents\``
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

      // chargement du fichier source
      logger.info("Fichier d'entrée chargé.");

      // analyse
      const index = await dumpPdf(options.input);
      logger.info("Fin de l'analyse.");

      // écriture
      await rwf(options.output, JSON.stringify(index, null, 2));
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
