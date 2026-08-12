/* ══════════════════════════════════════════════════════════════════
   Sindal — mise en mouvement du site.

   Quatre comportements, aucun indispensable à la lecture : apparition au
   défilement, état de l'en-tête, lien de navigation actif, et signalement
   du morceau en cours d'écoute.

   ⚠ Le drapeau `js` est posé en TOUT PREMIER. C'est lui qui active, côté
   CSS, les états de départ (opacité 0, décalage). Sans lui — script
   bloqué, erreur avant cette ligne, navigateur sans JavaScript — la page
   reste entièrement lisible et immobile. L'inverse (masquer d'abord,
   révéler par script) laisse une page blanche à la moindre panne.
   ══════════════════════════════════════════════════════════════════ */
document.documentElement.classList.add("js");

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 1. Apparition au défilement ───────────────────────────────── */
  var revealed = document.querySelectorAll("[data-reveal]");

  /* Décalage en cascade à l'intérieur d'un même groupe : les enfants d'une
     grille arrivent l'un après l'autre, pas tous d'un bloc. L'index est
     posé en variable CSS, le retard se calcule dans la feuille de style. */
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty("--i", i);
    });
  });

  if (reduced || !("IntersectionObserver" in window)) {
    /* Pas d'observateur, ou l'utilisateur refuse le mouvement : tout est
       marqué visible d'emblée. */
    revealed.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);   // une seule fois : pas d'aller-retour au défilement
      });
    }, {
      /* Marge basse négative : l'élément se déclenche quand il est
         franchement entré, pas au premier pixel — sinon l'animation est
         déjà finie quand le regard y arrive. */
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.05
    });

    revealed.forEach(function (el) { observer.observe(el); });

    /* ⚠ FILET, pas une redondance. L'observateur ne révèle que ce qu'il voit
       PASSER. Arrivée directe sur une ancre (`…/#sons`, un lien partagé, un
       signet), la page saute à destination avant que l'observation ne soit
       en place : la section visée reste alors invisible, et le visiteur
       tombe sur du vide. Mesuré : sur `index.html#sons`, 2 éléments révélés
       sur 35, aucun dans la section demandée.

       On force donc l'apparition de tout ce qui est déjà atteint — au-dessus
       ou dans l'écran — au chargement complet et à chaque changement
       d'ancre. Ce qui reste en dessous continue de passer par
       l'observateur. */
    var revealReached = function () {
      var limit = window.innerHeight * 1.05;
      revealed.forEach(function (el) {
        if (el.classList.contains("is-in")) return;
        if (el.getBoundingClientRect().top < limit) {
          el.classList.add("is-in");
          observer.unobserve(el);
        }
      });
    };

    window.addEventListener("load", revealReached);
    window.addEventListener("hashchange", function () {
      window.setTimeout(revealReached, 80);   // après le saut, pas pendant
    });
  }

  /* ── 2. En-tête : posé sur le héros, ou barre détachée ──────────── */
  var header = document.querySelector("header.site");
  if (header) {
    var ticking = false;
    var apply = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    };
    /* `passive: true` + rAF : le défilement ne doit jamais attendre ce
       calcul, sinon la page devient poisseuse sur mobile. */
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(apply);
    }, { passive: true });
    apply();
  }

  /* ── 3. Lien de navigation de la section lue ────────────────────── */
  var links = {};
  document.querySelectorAll('.nav nav a[href^="#"]').forEach(function (a) {
    links[a.getAttribute("href").slice(1)] = a;
  });

  var sections = Object.keys(links)
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    /* Bande de détection étroite au tiers haut de l'écran : sans elle,
       deux sections sont « visibles » en même temps et le surlignage
       clignote entre les deux. */
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Object.keys(links).forEach(function (id) {
          links[id].classList.toggle("is-active", id === entry.target.id);
        });
      });
    }, { rootMargin: "-30% 0px -60% 0px" });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ── 4. Morceau en cours d'écoute ───────────────────────────────── */
  var players = Array.prototype.slice.call(document.querySelectorAll(".track audio"));

  players.forEach(function (audio) {
    var card = audio.closest(".track");

    audio.addEventListener("play", function () {
      /* Un seul morceau à la fois. Deux pièces superposées ne donnent
         aucune idée de ce que fait l'application ; et l'utilisateur qui
         clique sur la suivante veut l'entendre, pas la mélanger. */
      players.forEach(function (other) { if (other !== audio) other.pause(); });
      if (card) card.classList.add("is-playing");
    });

    ["pause", "ended"].forEach(function (evt) {
      audio.addEventListener(evt, function () {
        if (card) card.classList.remove("is-playing");
      });
    });
  });
})();

/* ── Sélecteur de langue ────────────────────────────────────────────
   La valeur de chaque option EST le chemin de la page équivalente. Pas
   de redirection automatique selon la langue du navigateur : elle
   contrarie qui a choisi, et brouille l'indexation (chaque version a sa
   propre URL, annoncée par les balises `hreflang`). */
(function () {
  var select = document.querySelector("select.lang");
  if (!select) return;
  select.addEventListener("change", function () {
    if (select.value) window.location.href = select.value;
  });
})();
