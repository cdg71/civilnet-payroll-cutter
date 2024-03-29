# Civilnet-Payroll-Cutter

Ce logiciel en ligne de commande fournit des utilitaires pour le découpage d'un fichier PDF global de payes généré par le logiciel civilnet RH en bulletins de salaires PDF individuels.

Il peut fonctionner dans d'autres cas de figures comparables mais a été développé spécifiquement pour cet usage.

## Sommaire

- [Démarrage rapide](#démarrage-rapide)
  - [Pré-requis](#pré-requis)
  - [Installation](#installation)
  - [Configuration d'une tâche planifiée](#configuration-dune-tâche-planifiée)
  - [Mise à jour](#mise-à-jour)
- [Scripts disponibles](#scripts-disponibles)
  - [Script d'exécution](#script-dexécution)
  - [Script de découpage](#script-de-découpage)
  - [Script d'extraction](#script-dextraction)
  - [Script de génération](script-de-génération)
- [Support](#support)
- [Contribution](#contribution)
- [Licence](#licence)

## Démarrage rapide

### Pré-requis

Le logiciel fonctionne dans l'environnement d'exécution node.js

Une version récente de git, [node.js](https://nodejs.org/en/) (12x LTS et supérieures) et du gestionnaire de package npm (6.14.4 et supérieures - inclus avec l'installeur de node.js) sont nécessaires.

### Installation

Cloner le dépôt avec git dans le dossier cible `git clone https://github.com/cdg71/civilnet-payroll-cutter` et installer avec l'exécutable npm `npm install`.

### Configuration d'une tâche planifiée

Sous Windows, une tâche planifiée peut être configurée avec les options suivantes :

- Actions > Démarrer un programme
  - Programme / script : `npm`
  - Ajouter des arguments : `run exec -- --input C:\chemin\du\dossier\d\entree --working-dir C:\chemin\du\dossier\de\travail --output C:\chemin\du\dossier\de\sortie --log C:\chemin\du\dossier\de\log --clean`
  - Commencer dans : `C:\chemin\de\l\outil\civinet-payroll-cutter`

### Mise à jour

Pour mettre l'outil à jour, exécutez `git pull` suivi de `npm install` dans le dossier d'installation.

## Scripts disponibles

### Script d'exécution

Ce script est un script d'orchestration pour faciliter le déploiement par tâche planifiée.

Pour chaque PDF disponible dans le dossier d'entrée, le script d'exécution le déplace dans le dossier de travail et invoque civilnet-payroll-cutter avec les paramètres fournis. Il accepte comme paramètres spécifiques un dossier d'entrée et un dossier de travail. les autres paramètres sont identiques à civilnet-payroll-cutter.

**Usage:**

`npm run exec -- [options]`

**Options spécifiques :**

- `-i, --input <folder>`  
  Chemin du dossier d'entrée. (obligatoire)
- `-w, --working-dir <folder>`  
  Chemin du dossier de travail. (obligatoire)
- `-h, --help `  
  Affiche l'aide.
- [...]
  d'autres options sont disponibles, voir ci-après ...

**Autres options :**

Les autres options du script d'exécution sont transférées au script de découpage. Voir le détail dans le paragraphe dédié.

**Exemple:**

`npm run exec -- -i c:\%userprofile%\Documents\entree -w c:\%userprofile%\Documents\sortie -w c:\%userprofile%\Documents\temp -o c:\%userprofile%\Documents\sortie`

### Script de découpage

**Avant d'utiliser le script de découpage**

> Les fichiers PDF générés Par CivilNet sont protégés. Il faut supprimer la protection sur le fichier source avant de l'utiliser avec le script de découpage civilnet-payroll-cut.

Il est simple de réaliser cette optimisation manuellement. Ouvrez le fichier contenant les bulletins de paye dans Google Chrome par glisser-déposer et imprimez le avec l'option "Enregistrer au format PDF" pour le normaliser avant de le soumettre au script de découpage. Dans mes tests ce processus est très efficace puisqu'il divise par plus de 16 fois la taille des bulletins de paye finaux (30 Ko par bulletin simple environ).

Vous pouvez également préparer le fichier avec une autre imprimante PDF comme, par exemple, Microsoft Print to PDF qui est disponible par défaut sur les versions récentes de Windows. Cependant, dans mes tests, ces imprimantes produisent des bulletins individuels plus volumineux (entre 250 Ko et 500 Ko pour un bulletin simple).

**Usage :**

`npm run cut -- [options]`

Découpe un fichier PDF global de payes généré par le logiciel civilnet RH en bulletins de salaires individuels au format PDF.

**Options :**

- `-v, --version`  
  Affiche la version actuelle.
- `-i, --input <file>`  
  Chemin du fichier PDF d'entrée. (obligatoire)
- `-o, --output <folder>`  
  Chemin du dossier de sortie. (obligatoire)
- `-c, --clean`
  Supprime le fichier PDF d'entrée si le découpage est un succès.
- `-d, --dry-run`  
  Exécute la commande sans effectuer réellement de création, modification ou suppression de fichier.
- `-q, --quiet`  
  Limite le niveau de log aux messages d'erreur, d'avertissement et d'information.
- `-l, --log <folder>`  
  Chemin du dossier de journalisation. Par défaut, un fichier de journalisation par jour est créé dans ce dossier. La rotation des fichiers de journalisation est assurée automatiquement avec une durée de rétention de 99 jours par défaut (3 mois). Ce comportement est configurable avec le paramètre --max-files. Si le dossier de journalisation n'est pas renseigné, la journalisation est désactivée.
- `-M, --max-files <string>`  
  Indique le nombre maximum de fichiers de journalisation à conserver. La valeur est transmise à l'option maxFiles du transport [winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file) chargé de la journalisation. (default: "365d")
- `-s, --separateur <integer>`  
  Valeur du séparateur indiquant que la page suivante fait partie du bulletin courant. (default: ".../...")
- `-n, --nom <integer>`  
  Numéro d'ordre du nom de l'agent dans un bulletin de salaire. (default: "10")
- `-N, --num-secu <integer>`  
  Numéro d'ordre du numéro de sécurité sociale de l'agent dans un bulletin de salaire. (default: "13")
- `-c, --cle-secu <integer>`  
  Numéro d'ordre de la clé du numéro de sécurité sociale de l'agent dans un bulletin de salaire. (default: "14")
- `-p, --periode <integer>`  
  Numéro d'ordre de la période de paye dans un bulletin de salaire. (default: "8")
- `-P, --pool-size <integer>`  
  Taille de la ferme de processus dédiés au multithreading. Cette option s'adapte automatiquement par défaut au nombre de CPUs disponibles. (default: "12")
- `-t, --timeout`
  Délai d'expiration du traitement, exprimé en secondes. Le script se termine alors automatiquement en erreur au delà de ce délai. (default: "300")
- `-h, --help`  
  Affiche l'aide.

**Exemple :**

`npm run cut -- -i c:\%userprofile%\Documents\Civilnet_Payroll.pdf -o c:\%userprofile%\Documents`

**Format de sortie :**

Les fichiers découpés sont nommés selon le format suivant `BS_{NUMERO-DE-SECURITE-SOCIALE}_{CLE}_{PERIODE-DE-PAIE-AAAA-MM}_{NOM_COMPLET}_{IDENTIFIANT-DE-DEDOUBLONNAGE}.pdf`. Par exemple :

```text
BS_9999999999999_99_2020-03_DUPONT_JEAN_378hpi5.pdf
```

### Script d'extraction

**Usage :**

`npm run dump -- [options]`

Extrait la structure d'un fichier PDF global de payes généré par le logiciel civilnet RH au format json (zones de textes regroupées par page).

**Options :**

- `-v, --version`
  Affiche la version actuelle.
- `-i, --input <file>`
  Chemin du fichier PDF d'entrée. (obligatoire)
- `-o, --output <file>`
  Chemin du fichier JSON de sortie. (obligatoire)
- `-t, --timeout`
  Délai d'expiration du taitement, exprimé en secondes. Le script se termine alors automatiquement en erreur au delà de ce délai. (default: "300")
- `-h, --help`
  Affiche l'aide.

**Exemple :**

`npm run dump -- -i c:\%userprofile%\Documents\Civilnet_Payroll.pdf -o c:\%userprofile%\Documents`

### Script de génération

**Usage :**

`npm run mock -- [options]`

Génère un fichier PDF qui imite la structure d'un fichier de payes généré par le logiciel civilnet RH.

**Options :**

- `-v, --version`  
  Affiche la version actuelle.
- `-o, --output <file>`  
  Chemin du fichier PDF de sortie. (obligatoire)
- `-n, --pages <integer>`  
  Nombre de pages à générer. (default: 1)
- `-p, --predecessors <JSON_Array>`  
  Tableau des pages du fichier qui ont des pages suivantes. (default: "[]")
- `-t, --timeout <integer>`  
  Délai d'expiration du taitement, exprimé en secondes. Le script se termine alors automatiquement en erreur au delà de ce délai. (default: "300")
- `-h, --help`  
  Affiche l'aide.

**Exemple :**

`npm run mock -- -o c:\%userprofile%\Documents\Civilnet_Payroll.pdf -n 6 -p "[2, 4]"`

## Support

Pour toute assistance, vous pouvez utiliser le système de ticketing du dépôt Github du projet (issues).

## Contribution

Les contributions sont les bienvenues. Vous pouvez les soumettre sous la forme de pull requests dans le dépôt Github du projet.

Avant que votre pull request ne soit acceptée, il faudra notamment ajouter des tests d'intégrations aux nouvelles fonctionnalités et que l'ensemble des tests statiques et automatiques passent, pour ne pas introduire de régressions.

## Licence

Ce logiciel est soumis à la licence [CeCILL-C](./LICENSE.txt)
