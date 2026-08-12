/* ══════════════════════════════════════════════════════════════════
   Sindal — générateur du site.

       node build.mjs

   Assemble `src/data.json` + `src/partials/` + `src/pages/` en six pages
   HTML à la racine du dépôt. Ces six fichiers sont COMMITTÉS : le
   déploiement reste un glisser-déposer, aucune chaîne d'outils n'est
   nécessaire pour publier.

   ⚠ NE JAMAIS ÉDITER LES FICHIERS GÉNÉRÉS. Ils portent un en-tête qui le
   rappelle, et la prochaine exécution écrase toute retouche faite là.
   Le contenu vit dans `src/`.

   Aucune dépendance : Node seul. Un `npm install` sur un site de six
   pages coûterait plus cher à maintenir que le moteur de gabarit de
   trente lignes qu'il remplacerait.
   ══════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, "src");

const data = JSON.parse(fs.readFileSync(path.join(SRC, "data.json"), "utf8"));

const read = (...p) => fs.readFileSync(path.join(SRC, ...p), "utf8");

/* Substitution simple `{{clé}}`. Une clé absente est signalée à la fin
   plutôt qu'écrite telle quelle dans la page : un `{{email}}` oublié
   s'afficherait au visiteur. */
const missing = new Set();

function fill(tpl, vars) {
  return tpl.replace(/\{\{([\w.]+)\}\}/g, (m, key) => {
    if (key in vars) return vars[key];
    missing.add(key);
    return m;
  });
}

/* ── Fragments dérivés de data.json ──────────────────────────────── */

const holder = (c) => (c.licence.startsWith("MIT") || c.licence.startsWith("Apache")
  ? `${c.licence} — © ${c.holder}`
  : `${c.licence} — © ${c.holder}`);

function thirdPartyRows(lang) {
  return data.thirdParty.map((c) => {
    const version = c.version ? ` ${c.version}` : "";
    const role = lang === "en" ? c.roleEn : c.roleFr;
    return `        <tr>
          <td><a href="${c.url}" rel="noopener">${c.name}</a>${version}</td>
          <td>${role}</td>
          <td>${holder(c)}</td>
        </tr>`;
  }).join("\n");
}

/* Pied de page : la liste courte regroupe les composants par licence,
   plutôt que d'en énumérer sept. */
function thirdPartyShort(lang) {
  const byLicence = new Map();
  for (const c of data.thirdParty) {
    const key = c.licence.startsWith("MIT") ? "MIT" : c.licence;
    if (!byLicence.has(key)) byLicence.set(key, []);
    byLicence.get(key).push(c.name);
  }
  return [...byLicence].map(([lic, names]) =>
    `\n          <li>${names.join(", ")} — ${lic}</li>`).join("") + "\n        ";
}

/* ── Gabarit de page ─────────────────────────────────────────────── */

const BANNER = (src) => `<!--
  ⚠ FICHIER GÉNÉRÉ — NE PAS ÉDITER.
  Source : src/${src} · fragments : src/partials/ · données : src/data.json
  Régénérer : node build.mjs
-->
`;

function buildPage(page) {
  const source = read("pages", page.src);

  // Le <style> de tête est remonté dans <head> ; le reste est le corps.
  const styleMatch = source.match(/^\s*<style>[\s\S]*?<\/style>\s*/);
  const style = styleMatch ? styleMatch[0].trim() : "";
  const body = styleMatch ? source.slice(styleMatch[0].length) : source;

  const lang = page.lang;
  const isEn = lang === "en";
  const partial = (name) => read("partials", `${name}-${lang}.html`);

  const vars = {
    rel: page.rel,
    /* Liens de section : vides sur l'accueil (ancres locales), préfixés
       du fichier ailleurs. */
    home: page.out.endsWith("index.html") ? "" : "index.html",
    altHref: page.rel + page.alt.replace(/^en\//, isEn ? "" : "en/"),
    curDownload: page.current === "download" ? ' aria-current="page"' : "",

    publisher: data.publisher,
    email: data.email,
    baseUrl: data.baseUrl,
    repo: data.repo,
    taglineFr: data.taglineFr,
    taglineEn: data.taglineEn,

    hostName: data.host.name,
    hostShort: data.host.shortName,
    hostAddress: `${data.host.address}, ${isEn ? data.host.countryEn : data.host.countryFr}`,
    hostUrl: data.host.url,

    thirdPartyRowsFr: thirdPartyRows("fr"),
    thirdPartyRowsEn: thirdPartyRows("en"),
    thirdPartyShortFr: thirdPartyShort("fr"),
    thirdPartyShortEn: thirdPartyShort("en"),
  };

  /* Les fragments sont remplis AVANT d'être injectés : ils contiennent
     eux aussi des jetons ({{email}}, {{publisher}}…). */
  const withPartials = body
    .replace("{{> header}}", () => fill(partial("header"), vars))
    .replace("{{> footer}}", () => fill(partial("footer"), vars));

  const frOut = isEn ? page.alt : page.out;
  const enOut = isEn ? page.out : page.alt;

  const head = [
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${page.title}</title>`,
    `<meta name="description" content="${page.description}">`,
    page.robots ? `<meta name="robots" content="${page.robots}">` : null,
    page.ogTitle ? `<meta property="og:title" content="${page.ogTitle}">` : null,
    page.ogDescription ? `<meta property="og:description" content="${page.ogDescription}">` : null,
    page.ogTitle ? `<meta property="og:type" content="website">` : null,
    `<link rel="icon" href="${page.rel}img/logo.png" sizes="any">`,
    `<link rel="alternate" hreflang="fr" href="${data.baseUrl}${frOut}">`,
    `<link rel="alternate" hreflang="en" href="${data.baseUrl}${enOut}">`,
    `<link rel="alternate" hreflang="x-default" href="${data.baseUrl}${frOut}">`,
    `<link rel="stylesheet" href="${page.rel}style.css">`,
  ].filter(Boolean).join("\n");

  const html = `${BANNER(page.src)}<!DOCTYPE html>
<html lang="${lang}">
<head>
${head}

${style}
</head>

<body>

${fill(withPartials, vars).trim()}

<script src="${page.rel}motion.js"></script>

</body>
</html>
`;

  const dest = path.join(ROOT, page.out);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
  return html.split("\n").length;
}

/* ── Exécution ───────────────────────────────────────────────────── */

console.log("Sindal — génération du site\n");
for (const page of data.pages) {
  const lines = buildPage(page);
  console.log(`  ${page.out.padEnd(22)} ${String(lines).padStart(4)} lignes`);
}

if (missing.size) {
  console.error(`\nJetons non résolus : ${[...missing].join(", ")}`);
  console.error("Ils seraient affichés tels quels au visiteur.");
  process.exit(1);
}

console.log(`\n${data.pages.length} pages écrites.`);
