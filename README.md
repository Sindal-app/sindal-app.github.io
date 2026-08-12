# Site vitrine Sindal

Source de la page publique. Le dépôt Sindal reste **privé** ; seul le contenu de
ce dossier part sur un dépôt public.

```
site/
├── index.html         accueil : arguments, échantillons, démo, banques de sons
├── telecharger.html   dernière version + sélecteur de toutes les versions
├── legal.html         mentions légales, CLUF, licences tierces
├── style.css          jetons recopiés de Sindal/Theme/Tokens.axaml
├── releases.js        accès à l'API GitHub — contient la SEULE constante de dépôt
├── .nojekyll          désactive le traitement Jekyll de GitHub Pages
├── img/
│   ├── logo.png       512×512, produit par `tools/IconGen -png` (MÊME source que
│   │                  le .ico Windows, le .icns macOS, le splash et l'en-tête)
│   └── app-creer.png  capture de l'onglet Création
└── audio/             4 pièces générées par Sindal, encodées en AAC 128 kbit/s
```

---

## Marche à suivre — mise en ligne

### 1. Créer l'organisation

GitHub → menu du profil → **Your organizations** → **New organization** → plan
**Free**.

- Nom : `sindal-app` (vérifié libre ; `sindal` seul est déjà pris par un autre
  compte, et le namespace comptes/organisations est commun).
- Tu restes propriétaire (*owner*) avec ton compte `Pancho45`.

### 2. Créer le dépôt du site

Dans l'organisation → **New repository**.

- Nom : **`sindal-app.github.io`** — exactement ça, c'est le nom qui déclenche la
  page « utilisateur/organisation ».
- Visibilité : **Public** (obligatoire : Pages sur dépôt privé est payant).
- Ne rien cocher (pas de README, pas de `.gitignore`) : le dossier a déjà tout.

### 3. Publier le contenu

Copier le **contenu** de `site/` à la racine du dépôt — pas le dossier lui-même.
`index.html` doit se trouver à la racine.

⚠ Ne pas oublier `.nojekyll` : c'est un fichier caché, un glisser-déposer depuis
l'explorateur Windows peut le laisser derrière. Sans lui GitHub passe le site à
Jekyll, qui ignore tout dossier commençant par `_`.

### 4. Activer Pages

Dépôt → **Settings** → **Pages** :

- Source : **Deploy from a branch**
- Branche : `main`, dossier `/ (root)` → **Save**

Au bout d'une minute le site répond sur **`https://sindal-app.github.io/`**.
HTTPS est automatique.

### 5. Publier une version (à refaire à chaque release)

Le pipeline continue de publier dans le dépôt privé. Tu recopies ensuite les
paquets sur le dépôt public :

1. Dépôt **privé** → **Releases** → la version voulue → télécharger les fichiers
   joints (tu es authentifié, donc ils sont accessibles).
2. Dépôt **public** → **Releases** → **Draft a new release**.
3. Tag : **le même numéro** que la version, ex. `v1.0.7` — coche *Create new tag
   on publish*.
4. Titre : `Sindal 1.0.7`. Le corps du message devient les notes de version
   affichées sur `telecharger.html`.
5. Glisser les fichiers dans la zone *Attach binaries*.
6. **Publish release.**

Rien à modifier sur le site : les boutons lisent l'API et se remplissent seuls.

#### Quels fichiers glisser

| Objectif | Fichiers |
|---|---|
| Téléchargement seul | `…Setup.exe` et le `.pkg` |
| Téléchargement **et** mise à jour automatique | **tout** le contenu de `build/Releases` : nupkg *full* **et** *delta*, `releases.win.json`, `RELEASES`, `Setup.exe` |

Sans les nupkg ni l'index, l'application ne verra jamais de nouvelle version. Et
sauter une version troue la chaîne de deltas : les clients restés loin en arrière
retéléchargeront tout.

La mise à jour automatique suppose en plus que `UpdateService.FeedUrl` vise le
dépôt public — sinon l'application interroge un flux privé, qui lui répond 404.

---

## Changer de dépôt

Le nom du dépôt public n'est écrit qu'à **un seul endroit** : la constante
`SINDAL_REPO`, en tête de `releases.js`. Toutes les URL de téléchargement en
découlent, y compris les liens de repli des deux pages.

## Boutons de téléchargement

Rien n'est codé en dur. Au chargement, les pages interrogent
`https://api.github.com/repos/<REPO>/releases` et remplissent les boutons avec
l'URL réelle des paquets, leur taille et le numéro de version. Velopack compose
le nom des fichiers (identifiant + plateforme + version) : le figer dans le HTML
donnerait des boutons morts à la première release qui en change.

Trois répliers, dans cet ordre : requête bornée à 8 s (une requête qui pend
laisserait la page sur « Chargement… » sans même offrir de lien), puis message
d'erreur explicite, puis lien vers la page des releases GitHub — toujours valide.

## Le logo

`img/logo.png` est produit par `tools/IconGen -png <fichier> 512`, **la même
source** que le `.ico` Windows, le `.icns` macOS, l'écran de démarrage et
l'en-tête de l'application (`tools/IconGen/Logo.xaml`, qui reproduit le dessin
des deux fenêtres). C'est ce qui garantit une marque identique partout.

⚠ `Sindal/Assets/logo.svg` est un dessin **différent** (240×240, notes éparses,
étincelles, mot « SINDAL » incrusté, couleurs hors jetons). Il n'est référencé
nulle part dans l'application ni dans le build. Ne pas s'en servir comme logo :
c'est ce qui avait mis une autre marque sur le site.

## Regénérer les échantillons audio

Un harnais jetable appelle `MusicPieceGenerator`, rend le MIDI par la SoundFont
livrée (`Sindal/Assets/GeneralUser-GS.sf2`), écrit un WAV par `WavWriter`, puis
encode en AAC via Media Foundation. L'encodage n'a lieu que sur le poste de
développement — rien n'est ajouté à l'application, et la contrainte de licence
qui avait fait abandonner le MP3 côté produit ne s'applique pas ici.

Chaque pièce a un `progressionSeed` **et** un `performanceSeed` fixes : relancer
le harnais redonne exactement les mêmes fichiers.
