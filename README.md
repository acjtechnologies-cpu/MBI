# F3F PIT ✈️🏁

> *Ton pit lane. Tes données. Ta décision.*

## Accès à l'application

🚀 **[Ouvrir F3F PIT](https://acjtechnologies-cpu.github.io/MBI)**

> Optimisé pour smartphone 6.5" — utilisable directement en bord de pente, sans installation.

## Pourquoi F3F PIT existe

Quand un constructeur commercialise un planeur F3F, il livre une fiche technique
sérieuse. Masse à vide, surface alaire, positions de centrage, débattements
conseillés. Il propose en option un kit de lest — quelques blocs de laiton ou de
tungstène calibrés, usinés pour s'insérer dans les logements prévus. Ce kit est
pensé pour respecter le centrage. C'est propre, c'est cohérent, c'est livrable
dans une boîte.

Et là s'arrête la documentation.

Il faut comprendre ce qu'est un constructeur F3F. Ce n'est pas une grosse
entreprise. C'est presque toujours un artisan — un passionné qui conçoit,
fabrique, concourt et partage. Sa fierté n'est pas dans un catalogue marketing,
elle est dans un podium, dans la légèreté d'une aile sortie de son atelier, dans
le retour d'un pilote qui vient lui dire que le planeur vole comme jamais. Le
circuit F3F est une petite niche, et ses constructeurs en sont à la fois les
pourvoyeurs et les acteurs. Ils connaissent les pentes. Ils savent, dans leurs
mains , que la charge ne se décide pas de la même façon à
7 m/s et à 12 m/s. Ils portent en eux une courbe de chargement — implicite,
intuitive, construite vol après vol.

Mais cette connaissance ne sort pas dans la documentation. Non par rétention, mais
parce que la formaliser demande un effort d'abstraction qui n'est pas toujours dans l'ADN
d'un pilote-artisan. Son métier c'est de sentir l'air, pas d'écrire des fonctions.
Jusqu'ici, très peu de personnes dans ce milieu avaient pris le temps — ni
peut-être les outils — de traduire cette expertise tacite en quelque chose
d'exploitable par tous.

## Ce que fait F3F PIT

F3F PIT n'est pas né dans un laboratoire. Il n'a pas été conçu par un
mathématicien ou un ingénieur de bureau. Il est né d'un pilote passionné — pas
mathématicien, mais accro à la compréhension de ce qui se passe vraiment en bord
de pente — qui a utilisé l'intelligence artificielle comme outil de formalisation.
L'IA a permis de transformer une intuition de pilote en une fonction mathématique
exploitable : la courbe **Poly4**, cœur du moteur de calcul **MBI** (Master
Ballast Interactif), ajustée sur des points de calibration réels, corrigée par la
densité de l'air, modulée par le profil de la pente et par le rendement historique
du pilote.

Ce qui se transmettait autrefois à l’oral dans le paddock — cette expérience accumulée vol après vol dans les meilleures têtes du circuit — peut aujourd’hui être rendu accessible en quelques secondes sur un smartphone au bord de la pente. L’algorithme ne remplace ni le ressenti, ni le jugement du pilote ; il sert de point de départ cohérent, une base de décision construite à partir de cette intelligence empirique que les pilotes expérimentés portent depuis toujours dans leurs pouces.

F3F PIT ne prétend pas dépasser l'expertise des grands pilotes-constructeurs. Il
prétend la rendre accessible — à ceux qui n'ont pas encore dix ans de circuit dans
les pouces, à ceux qui changent de planeur, à ceux qui découvrent une nouvelle
pente. C'est une démocratisation du savoir tacite, rendue possible par la rencontre
entre l'expérience d'un pilote et la puissance de formalisation de l'IA.

---

## Moteur MBI — Concepts clés

| Concept | Rôle |
|---|---|
| **Poly4** | Courbe masse optimale en fonction de la vitesse vent |
| **IRP** | Indice Rendement Pente — énergie dynamique du site |
| **IQA** | Indice Qualité Air — qualité instantanée du flux |
| **α** | Coefficient de rendement historique pilote |
| **K_pente** | Correction d'énergie selon le site — réf. Saint Ferriol CdF 2024 |
| **ρ/ρ₀** | Correction de densité air (altitude, densité) |

---

## Stack

React · Vite · Zustand · Dexie.js · ESP32-C3 · WebSocket

---

© Jo — ACJ Technologies · 2026 · F3F pilot & maker
