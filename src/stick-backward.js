#!/usr/bin/env node
"use strict";
const { Command } = require("commander");
const { spawn, Pool, Worker } = require("threads");
const moment = require("moment");
const momentDurationFormatSetup = require("moment-duration-format");
momentDurationFormatSetup(moment);
const os = require("os");
const cpus = os.cpus().length.toString();
const fs = require("fs").promises;
const meta = require("../package.json");
const {
  createConsoleTransport,
  createFileTransport,
  createLogger,
} = require("./lib/logger");
const { getStickBackwardStructure } = require("./lib/parser");

// Commander configuration
new Command()
  .storeOptionsAsProperties(false)
  .passCommandToAction(false)
  .name(" ")
  .usage("`node stick-backward [options]`")
  .version(meta.version, "-v, --version", "affiche la version actuelle.")
  .description(
    "Découpe un fichier PDF global en fichiers PDF individuels. Si la valeur du paramètre d'agglomération est trouvée à l'emplacement indiqué, on considère que la page fait partie du document en cours. Si la valeur d'agglomération n'est pas trouvée à l'emplacement indiqué, on considère que c'est la première page d'un nouveau document."
  )
  .requiredOption(
    "-i, --input <file>",
    "Chemin du fichier PDF d'entrée. (obligatoire)"
  )
  .requiredOption(
    "-o, --output <folder>",
    "Chemin du dossier de sortie. (obligatoire)"
  )
  .option(
    "-c, --clean",
    "Supprime le fichier PDF d'entrée si le découpage est un succès.",
    false
  )
  .option(
    "-d, --dry-run",
    "Exécute la commande sans effectuer de créations, modifications ou suppressions de fichiers, cette option est prioritaire sur l'option --clean.",
    false
  )
  .option(
    "-q, --quiet",
    "Limite le niveau de log aux messages d'erreur, d'avertissement et d'information.",
    false
  )
  .option(
    "-l, --log <folder>",
    "Chemin du dossier de journalisation. Par défaut, un fichier de journalisation par jour est créé dans ce dossier. La rotation des fichiers de journalisation est assurée automatiquement avec une durée de rétention de 99 jours par défaut (3 mois). Ce comportement est configurable avec le paramètre --max-files. Si le dossier de journalisation n'est pas renseigné, la journalisation est désactivée.",
    false
  )
  .option(
    "-M, --max-log-files <string>",
    "Indique le nombre maximum de fichiers de journalisation à conserver. La valeur est transmise à l'option maxFiles du transport [winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file) chargé de la journalisation.",
    "99d"
  )
  .option(
    "-p1 --parameter1 <integer>",
    "Numéro d'ordre du champs de nommage",
    "2"
  )
  .option(
    "-p2 --parameter2 <integer>",
    "Numéro d'ordre du champs d'agglomération",
    "2"
  )
  .option(
    "-p3 --parameter3 <string>",
    "Valeur attendue dans le champs d'agglomération",
    "Nom d'usage ou marital"
  )
  .option(
    "-P, --pool-size <integer>",
    "Taille de la ferme de processus dédiés au multithreading. Cette option s'adapte automatiquement par défaut au nombre de CPUs disponibles.",
    cpus
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
      `Exemple:  \`cpc -i c:\\%userprofile%\\Documents\\File_to_split.pdf -o c:\\%userprofile%\\Documents\``
    );
    console.log("");
    console.log(
      `Format de sortie:  \`{CHAMPS-DE-NOMMAGE}_{IDENTIFIANT-DE-DEDOUBLONNAGE}.pdf\` (Ex. \`JEAN-DUPONT_378hpi5.pdf\`).`
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
    const logLevel = options.quiet ? "info" : "verbose";
    const logTransports = [createConsoleTransport()];
    if (options.log) {
      //
      logTransports.push(createFileTransport(options.log, options.maxFiles));
    }
    const logger = createLogger(logLevel, logTransports);
    process.on("unhandledRejection", (error) => {
      logger.error("Exception non gérée", error);
    });
    logger.info("Début de la journalisation.");
    logger.info("Paramètres sélectionnés.", options);

    // multi threading
    const pool = Pool(
      () => spawn(new Worker("lib/stick-backward-cutter")),
      parseInt(options.poolSize)
    );
    logger.info("Ferme de processus prête pour le découpage.");

    //Exécution du script
    try {
      logger.info("Initialisation terminée.");

      // parse
      const index = await getStickBackwardStructure(options);

      // découpage;
      const buffer = await fs.readFile(options.input);
      index.forEach((item, i) => {
        pool.queue(async (cut) => {
          try {
            const result = await cut(item, options, buffer);
            logger.verbose(`Job #${++i}`, result);
          } catch (error) {
            logger.error(`Job #${++i} `, error);
          }
        });
      });

      await pool.settled();

      // clean
      if (options.clean) {
        try {
          if (!options.dryRun) {
            await fs.unlink(options.input);
          }
          logger.info("Le fichier source a été supprimé.");
        } catch (error) {
          logger.error("Le fichier source n'a pas pu être supprimé.", error);
        }
      }

      // On fait le ménage
      pool.terminate();
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
      pool.terminate(true);
      process.abort();
    }
  })
  .parse(process.argv);
