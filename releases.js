/* ══════════════════════════════════════════════════════════════════
   Sindal — accès aux releases GitHub, partagé par index.html et
   telecharger.html.

   ⚠ SINDAL_REPO est le SEUL endroit du site où le dépôt public est
   nommé. Toutes les URL de téléchargement en découlent. Le nom vivait
   auparavant à quatre endroits : en changer un seul suffisait à laisser
   des liens morts sur la page.

   Les noms de paquets ne sont JAMAIS écrits en dur : Velopack les
   compose (identifiant + plateforme + version), et un nom figé donnerait
   des boutons morts à la première release qui en change.

   Repli assumé partout : sans réponse de l'API (hors ligne, quota,
   dépôt injoignable), on garde un lien vers la page des releases. Un
   bouton qui ouvre la liste vaut mieux qu'un bouton qui téléchargerait
   un 404.
   ══════════════════════════════════════════════════════════════════ */
var SINDAL_REPO = "sindal-app/sindal-app.github.io";

var SindalReleases = (function () {
  var API = "https://api.github.com/repos/" + SINDAL_REPO + "/releases";
  var WEB = "https://github.com/" + SINDAL_REPO + "/releases";

  /** Reconnaissance des paquets par EXTENSION, pas par nom exact. */
  function windowsAsset(rel) {
    return (rel.assets || []).filter(function (a) { return /setup.*\.exe$/i.test(a.name); })[0];
  }
  function macAsset(rel) {
    return (rel.assets || []).filter(function (a) { return /\.pkg$/i.test(a.name); })[0];
  }

  /* Langue lue sur la page elle-même (`<html lang>`) : un seul exemplaire de
     ce fichier sert les pages FR et EN, et aucun appelant n'a à penser à
     passer un paramètre de langue. */
  var EN = (document.documentElement.lang || "fr").toLowerCase().indexOf("en") === 0;

  function size(bytes) {
    var n = (bytes / 1048576).toFixed(1);
    return EN ? n + " MB" : n.replace(".", ",") + " Mo";
  }

  function version(rel) {
    return (rel.tag_name || "").replace(/^v/, "");
  }

  function date(rel) {
    return rel.published_at
      ? new Date(rel.published_at).toLocaleDateString(EN ? "en-GB" : "fr-FR",
          { day: "numeric", month: "long", year: "numeric" })
      : null;
  }

  /* Un `fetch` qui échoue vite plutôt que jamais : sans borne, une requête qui
     pend laisse la page sur « Chargement… » indéfiniment, et l'utilisateur n'a
     même pas le lien de repli. 8 s, puis on rend la main au `.catch`. */
  function fetchJson(url) {
    var timeout = new Promise(function (_, reject) {
      setTimeout(function () { reject("timeout"); }, 8000);
    });
    var request = fetch(url, { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); });

    return Promise.race([request, timeout]);
  }

  /** Toutes les releases publiées, brouillons exclus, plus récente d'abord. */
  function fetchAll() {
    return fetchJson(API + "?per_page=30").then(function (list) {
      return (list || []).filter(function (rel) { return !rel.draft; });
    });
  }

  function fetchLatest() {
    return fetchJson(API + "/latest");
  }

  return {
    repo: SINDAL_REPO,
    webUrl: WEB,
    latestUrl: WEB + "/latest",
    fetchAll: fetchAll,
    fetchLatest: fetchLatest,
    windowsAsset: windowsAsset,
    macAsset: macAsset,
    size: size,
    version: version,
    date: date
  };
})();
