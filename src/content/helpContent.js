// Contenu de l'overlay pédagogique, par page.
// Texte identique à F3F_PIT_Guide_de_bord.pdf (validé page par page).
// Clé = valeur de activePage passée à <HelpOverlay />.

export const HELP_CONTENT = {
  pilote: {
    title: 'Pilotage',
    subtitle: 'Cockpit principal — écran terrain',
    lines: [
      'Nom du planeur, vent instantané (m/s), planeur actif.',
      "ρ (densité de l'air) : corrige la masse selon l'altitude du site.",
      "Si l'air est moins dense en altitude, tu as moins de portance à vitesse égale.",
      'Au centre (Barographe) : tes soutes Gauche/Droite (clé ou aile) en direct — Avant / Centrale / Arrière. Le ballast s\'ajuste pour atteindre la masse finale cible.',
      'Bandeau récap : nom de la pente active (exemple : Saint Ferriol).',
      'Stabilité : te dit si tu peux faire confiance à la masse calculée ici — plus le %, plus ce site donne des conditions régulières d\'un vol à l\'autre.',
      'Charge alaire (g/dm²) : le poids du planeur rapporté à sa surface portante.',
      'Écart CG actuel vs cible : le centre de gravité, point d\'application de la résultante des forces — l\'équilibre avant/arrière du planeur.',
      "Bas de page : masse finale, altitude, Offset (un ajustement manuel en grammes, en plus du calcul automatique), réglage du nez — flèches ▼▲ pour ajuster Vent, Masse finale, Nez ou Offset ; vent et masse finale sont liés dans les deux sens via la courbe de calcul Poly4.",
      "Raccourcis : PLANEUR pour changer de modèle | MATRICE pour l'édition complète.",
    ],
  },
  matrice: {
    title: 'Matrice',
    subtitle: 'Optimisation ballast — simulateur',
    lines: [
      'Prédicteur IQA : compare la masse visée selon la météo à la masse réelle obtenue par la config actuelle.',
      "Bibliothèque : jusqu'à 20 configurations numérotées, sauvegardées par toi pour un même planeur (* marque la config réellement montée).",
      'Slider tactile : le doigt déplace un bloc par soute, avec feedback masse/CG en temps réel. Choix des matériaux (laiton, plomb, tungstène).',
      "Centrage : visualisation en temps réel via l'« Alignement Cible Météo » et la barre d'écart CG.",
      "Actions : +Config pour enregistrer | APPLIQUER IDÉALE pour charger la config prédite.",
    ],
  },
  soute: {
    title: 'Soute',
    subtitle: 'Atelier & fiche modèle — configuration',
    lines: [
      'Fiche complète de ton modèle actif ou en création.',
      'Masse vide, CG cible / surface.',
      "Masse ADN à 8 m/s : la masse (ou charge alaire) de référence que tu choisis pour ce modèle, comparée à ta référence (exemple : à 8 m/s je vole à 3100g).",
      "Liste des soutes (Avant Clé, Centrale Clé, Arrière Aile...) : renseigne pour chacune sa distance depuis le Bord d'Attaque jusqu'à l'axe de la soute — exemple : Distance BA 80mm, position CG -22 (le signe − vers l'avant).",
      'Sa capacité en nombre de blocs par côté, et son stock de matériaux disponibles (laiton, plomb, tungstène...) — réglages et suppression accessibles.',
      'En bas, les Nez Slots ajustent ton CG selon les conditions (+Nez pour gros temps, -Nez pour petit temps), indépendamment du ballast de soute.',
      'PLANEUR pour changer de modèle actif.',
      'Dupliquer/Exporter/Supprimer pour gérer la fiche du modèle.',
    ],
  },
  poly4: {
    title: 'Poly4',
    subtitle: 'Moteur de calcul — physique & ballast',
    lines: [
      "Top pente : géolocalisation du site, masse de vol recommandée, altitude.",
      "ρ (densité de l'air) : corrige la masse selon l'altitude du site — l'air est moins dense en altitude, donc moins de portance à vitesse égale.",
      "Stabilité : te dit si tu peux faire confiance à la masse calculée ici — plus le %, plus ce site donne des conditions régulières d'un vol à l'autre.",
      "R : classe ce site par rapport à tous ceux déjà mesurés (proche de 100% = un des sites les plus réguliers connus).",
      'Graphique F3F : courbe calibrée (P4 adapt) comparée à des références alternatives (Aéromod, Dense, Léger). Point rouge « Finale » positionné au vent actuel.',
      "K PENTE (kManualOverride) : ton propre réglage manuel — si tu sens que la masse calculée ne colle pas à ce site précis, tu ajustes ce coefficient toi-même et il prend le dessus sur le calcul automatique tant qu'il reste actif. Réglages via Vent, Offset et les flèches ▼▲.",
      'Validation : APPLIQUER pour verrouiller la pente active et recalculer.',
    ],
  },
  station: {
    title: 'Station',
    subtitle: 'Centre météo — télémétrie',
    lines: [
      'Anémomètre ESP32 : boutons CONNECT / DEMO / STOP.',
      "Rose des vents tri-source : fusion AROME (prévisions), Pioupiou (balise locale la plus pertinente) et ESP live dès connexion (avec écart Δ à l'orientation de la pente).",
      "Planning 10h-17h : grille horaire affichant l'état du vent (Faible, Moyenne, Bonne...).",
      'Mesures live : courbes temporelles, valeurs instantanées, turbulence et suivi IQA.',
    ],
  },
  chrono: {
    title: 'Chrono',
    subtitle: 'Compétition F3XVault — live match',
    lines: [
      'Connexion : identifiants F3XVault (email + mot de passe) pour importer les événements officiels.',
      'Sélection : concours (ex. Championnat de France), site/pente concerné et pilote ciblé.',
      'Minuteur : START / STOP pour chronométrer tes manches.',
      "Vues : Rounds (détail manche par manche) | Classement (général live, recherche d'un concurrent).",
      "Clôture : bouton Clôturer session (site) en fin d'épreuve.",
    ],
  },
};
