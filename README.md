# Site vitrine Sindal

Dépôt **public** du site, servi par GitHub Pages sur `https://sindal-app.github.io/`.
Le code source de l'application vit dans un dépôt **privé** séparé ; seuls les
binaires publiés et cette vitrine sont publics.

```
.
├── index.html         accueil : arguments, morceaux, démo, banques de sons
├── telecharger.html   dernière version + sélecteur de toutes les versions
├── legal.html         mentions légales, CLUF, licences tierces
├── en/                version anglaise : index.html, download.html, legal.html
├── style.css          jetons recopiés de Theme/Tokens.axaml (design system de l'app)
├── releases.js        accès à l'API GitHub — contient la SEULE constante de dépôt
├── motion.js          apparitions au défilement, en-tête, section lue, lecteur actif
├── .nojekyll          désactive le traitement Jekyll de GitHub Pages
├── img/
│   ├── logo.png       512×512, produit par `tools/IconGen -png` côté dépôt privé
│   └── app-creer.png  capture de l'onglet Création
└── audio/             6 morceaux composés avec Sindal
```

⚠ **`.nojekyll` est un fichier caché.** Un glisser-déposer depuis l'explorateur
Windows le laisse derrière — c'est déjà arrivé une fois. Sans lui, GitHub passe
le site à Jekyll, qui ignore tout dossier commençant par `_`. Vérifier qu'il est
bien à la racine après toute recopie en masse.

---

## Publier une version (à refaire à chaque release)

Le pipeline du dépôt privé publie ses paquets là-bas. On les recopie ici, pour
qu'ils deviennent téléchargeables : **une release d'un dépôt privé renvoie 404 à
tout visiteur anonyme.**

1. Dépôt **privé** → Releases → la version voulue → télécharger les fichiers
   joints (on est authentifié, donc ils sont accessibles).
2. Ici → **Releases** → **Draft a new release**.
3. Tag : le même numéro que la version, ex. `v1.0.7` — cocher *Create new tag on
   publish*.
4. Titre : `Sindal 1.0.7`. Le corps du message devient les notes de version
   affichées sur `telecharger.html`.
5. Glisser les fichiers dans *Attach binaries*.
6. **Publish release.**

Rien à modifier dans le site : les boutons lisent l'API et se remplissent seuls.

### Quels fichiers joindre

| Objectif | Fichiers |
|---|---|
| Téléchargement seul | `…Setup.exe` et le `.pkg` |
| Téléchargement **et** mise à jour automatique | **tout** le contenu de `build/Releases` : nupkg *full* **et** *delta*, `releases.win.json`, `RELEASES`, `Setup.exe` |

Sans les nupkg ni l'index, l'application ne verra jamais de nouvelle version. Et
sauter une version troue la chaîne de deltas : les clients restés loin en arrière
retéléchargeront tout.

La mise à jour automatique suppose en plus que `UpdateService.FeedUrl`, côté
dépôt privé, vise CE dépôt — sinon l'application interroge un flux privé, qui lui
répond 404.

---

## Boutons de téléchargement

Rien n'est codé en dur. Au chargement, les pages interrogent
`https://api.github.com/repos/<REPO>/releases` et remplissent les boutons avec
l'URL réelle des paquets, leur taille et le numéro de version. Velopack compose
le nom des fichiers (identifiant + plateforme + version) : le figer dans le HTML
donnerait des boutons morts à la première release qui en change.

Trois replis, dans cet ordre : requête bornée à 8 s (une requête qui pend
laisserait la page sur « Chargement… » sans même offrir de lien), puis message
d'erreur explicite, puis lien vers la page des releases GitHub — toujours valide.

Le dépôt visé n'est nommé qu'à **un seul endroit** : la constante `SINDAL_REPO`,
en tête de `releases.js`.

## L'URL

`https://sindal-app.github.io/` suppose que ce dépôt appartienne à l'organisation
`sindal-app` **et** s'appelle exactement `sindal-app.github.io`. Sous un autre
propriétaire, le même dépôt devient une simple page de projet, servie à
`https://<proprio>.github.io/sindal-app.github.io/`.

Tous les liens du site sont **relatifs** : il fonctionne à n'importe quelle base
d'URL, sans retouche.

## Le logo

`img/logo.png` sort de `tools/IconGen -png <fichier> 512`, côté dépôt privé —
**la même source** que le `.ico` Windows, le `.icns` macOS, l'écran de démarrage
et l'en-tête de l'application. C'est ce qui garantit une marque identique
partout. Ne pas le remplacer par un dessin fait à part : c'est exactement comme
ça qu'une autre marque s'était retrouvée sur le site.

## Les morceaux

Six pièces composées avec Sindal — générées, puis retouchées dans l'application.
Cinq MP3 tels que produits, plus `symphonie.m4a` réencodé en AAC 128 kbit/s
depuis un WAV de 10,5 Mo, ramené à 0,96 Mo : un WAV de cette taille pénalise le
premier chargement de la page d'accueil.

Noms de fichiers en minuscules sans accent ni espace, volontairement : les
serveurs Pages sont sensibles à la casse et un nom accentué doit être
percent-encodé dans une URL. Le titre affiché vit dans `index.html`, pas dans le
nom du fichier.

## Deux langues

Français à la racine, anglais dans `en/`. **Pages séparées, pas de dictionnaire
JavaScript** : la langue est choisie avant le premier rendu (aucun clignotement),
chaque version a sa propre URL indexable, et tout reste lisible sans JavaScript.
Le prix à payer est la duplication du texte : une modification de contenu se
répercute dans les deux pages.

| Français | Anglais |
|---|---|
| `index.html` | `en/index.html` |
| `telecharger.html` | `en/download.html` |
| `legal.html` | `en/legal.html` |

Le sélecteur de l'en-tête porte, en **valeur d'option, le chemin de la page
équivalente** — c'est `motion.js` qui navigue. Une page ajoutée doit donc mettre
à jour son propre sélecteur, celui de son homologue, et les trois balises
`hreflang` de chaque tête.

**Aucune redirection automatique** selon la langue du navigateur : elle contrarie
qui a choisi, et brouille l'indexation.

⚠ La page légale anglaise porte une mention explicite : c'est une traduction de
confort, **la version française fait référence**. Ne pas la retirer — un CLUF
traduit qui divergerait du texte affiché par l'installateur serait un problème,
pas un détail.

## Mouvement

`motion.js` + le bloc MOUVEMENT de `style.css`. Quatre comportements : apparition
au défilement, état de l'en-tête, surlignage de la section lue, signalement du
morceau en écoute (un seul à la fois).

Trois règles tenues :

1. **`transform` et `opacity` uniquement.** Jamais une propriété de mise en page.
2. **Rien ne dépend du JavaScript pour être LISIBLE.** Les états masqués sont
   conditionnés à `html.js`, posé par le script dès sa première ligne : script
   bloqué, la page s'affiche entière et immobile.
3. **`prefers-reduced-motion` est respecté** — plus aucune mise en scène, tout
   visible d'emblée.

⚠ Le **filet** de `revealReached` n'est pas une redondance de l'observateur.
Celui-ci ne révèle que ce qu'il voit PASSER : sur une arrivée directe à une ancre
(`…/#sons`, lien partagé, signet), la section visée restait invisible. Mesuré
avant correctif : 2 éléments révélés sur 35.
