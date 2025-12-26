# glossary.md — AssurManager : Le Défi IARD

> **CHANGELOG**
> - **2025-12-26** : Ajout de 15+ nouveaux termes IARD (appétit au risque, posture de souscription, anti-sélection, gestion de crise, médiation, dispositif de contrôle, concentration apporteur, etc.)

Objectif : fournir un **vocabulaire de référence** (métier IARD + termes du jeu) avec des définitions **non ambiguës** pour limiter les erreurs d’interprétation.

> Convention : lorsqu’un terme a un sens **métier** et un sens **jeu**, les deux sont précisés.

---

## 1) Conventions de lecture

- **Tour** : unité de temps du jeu. Sa durée dépend de la **vitesse** (Année / Trimestre / Mois).
- **Indice** : score normalisé (ex. 0–100) représentant un état systémique (attractivité, qualité, résilience…).
- **P&L pédagogique** : compte de résultat **cohérent pour apprendre**, pas une reproduction fidèle de comptabilité assureur.
- **Comparabilité** : on ne compare des scores/indices **que** si les paramètres de session (vitesse, difficulté, produits, scénario) et la version moteur (**engine_version**) sont identiques.

---

## 2) Entités & périmètre (SaaS)

### AssurManager
Plateforme SaaS B2B de simulation/serious game. L’utilisateur pilote une compagnie IARD sur un marché français à 18 acteurs, via une boucle par tours : **cockpit → événements → décisions → résolution → feedback/debrief**.

### Tenant
Organisation cliente (entreprise, école, université) isolée des autres (multi-tenant). Les données de jeu, utilisateurs, sessions, paramètres et exports sont **scopés** au tenant.

### Multi-tenant
Architecture où plusieurs organisations partagent l’application, avec **isolation stricte** des données et droits.

### RBAC (Role-Based Access Control)
Gestion des droits basée sur des rôles (ex. Admin Tenant, Formateur, Joueur…).

### Journal d’audit
Trace horodatée des actions sensibles (création session, paramétrage, exports, changements de rôles…). Utilisé pour la traçabilité en environnement réglementé.

### engine_version
Identifiant de version du moteur de simulation. Sert à assurer la traçabilité des résultats (un même input peut produire des outputs différents si le moteur évolue).

---

## 3) Termes métier IARD (France)

### IARD
« Incendie, Accidents et Risques Divers » : biens et responsabilité (non-vie, hors santé individuelle). Couvre notamment **Auto** et **MRH**.

### Auto
Produit d’assurance automobile (responsabilité civile obligatoire + garanties optionnelles). En jeu : produit avec dynamique propre (acquisition, sinistralité, coûts).

### MRH
Multirisque Habitation : assurance habitation (dommages au logement, responsabilité civile, etc.). En jeu : produit avec dynamique propre et sensibilité accrue aux événements climatiques.

### PJ (Protection Juridique)
Produit couvrant frais et assistance juridique. Dans le PRD : produit potentiel de portefeuille, généralement activé en V1+ si modèle dédié.

### GAV (Garantie des Accidents de la Vie)
Produit couvrant accidents du quotidien. Dans le PRD : produit potentiel de portefeuille, généralement activé en V1+.

### Portefeuille
Ensemble des contrats gérés par une compagnie. En jeu : le portefeuille est suivi **par produit** et agrégé au niveau compagnie.

### Contrat
Unité de couverture souscrite par un client. En jeu : c’est l’unité de base du portefeuille (compte dans les volumes et influence les primes et sinistres).

### Prime
Montant payé par le client (souvent annuel) en échange de la couverture. En jeu : variable clé de revenus, pilotée via le levier **Tarification**.

### Tarification
Détermination du niveau de prime et (selon difficulté) de la segmentation. En jeu : influence l’attractivité commerciale, la rentabilité et la qualité du portefeuille.

### Franchise
Part des dommages restant à la charge de l’assuré. En jeu : levier qui arbitre attractivité vs coût sinistres.

### Garantie / Couverture
Étendue des protections (options, exclusions, niveaux). En jeu : levier qui arbitre attractivité vs coût/risque.

### Acquisition
Entrées dans le portefeuille (nouveaux contrats) sur une période. En jeu : dépend de l’attractivité, du prix, de la distribution et du marketing.

### Résiliation
Sorties du portefeuille (perte de contrats). En jeu : dépend de la satisfaction, de la sinistralité vécue, du niveau de service et du positionnement prix.

### Sinistre
Événement dommageable ouvrant droit à indemnisation selon le contrat.

### Fréquence (de sinistres)
Probabilité qu’un sinistre survienne pour un contrat sur une période.

### Sévérité (de sinistres)
Coût moyen d’un sinistre (montant payé par la compagnie). Sensible à l’inflation, aux coûts de réparation, à la fraude, etc.

### Stock de sinistres
Ensemble des sinistres **ouverts/non clôturés**. En jeu : indicateur de charge et de performance opérationnelle.

### Flux entrées/sorties sinistres
- Entrées : nouveaux sinistres déclarés.
- Sorties : sinistres clôturés.
En jeu : permet d’observer l’écoulement du stock (capacité vs charge).

### Délais de gestion
Temps moyen pour traiter/clôturer un sinistre. En jeu : peut être modélisé explicitement ou via des proxys (qualité op, backlog, satisfaction).

### Fraude
Déclarations ou comportements visant un gain indu. En jeu : levier **progressif** (N1/N2/N3) qui réduit les coûts et améliore la performance, avec effets retard.

### Recours
Récupération auprès d’un tiers responsable (ou de son assureur) d’une partie des montants payés. En jeu : améliore la performance P&L via récupération de coûts.

### Réseau agréé
Réseau de prestataires partenaires (ex. réparateurs) avec conditions négociées (prix, qualité, délais). En jeu : levier qui arbitre coûts vs satisfaction.

### Gré à gré
Prestataire choisi hors réseau agréé. En jeu : peut augmenter coûts/variabilité mais parfois améliorer satisfaction (selon hypothèses moteur).

### Gestion déléguée / externalisation
Sous-traitance d’une partie de la gestion (sinistres, prestations, relation client). En jeu : levier **Prestataires/partenaires** (SLA, bonus-malus, coûts unitaires, capacité).

### SLA (Service Level Agreement)
Engagement contractuel de service (délais, qualité). En jeu : paramètre de performance et de satisfaction ; peut avoir un coût.

### Réassurance
Assurance de l’assureur : transfert d’une partie des risques à un réassureur. En jeu : améliore la **résilience financière** mais coûte (prime de réassurance).

### Traité de réassurance
Cadre contractuel de réassurance (types et niveaux). En jeu : paramétrable selon version/difficulté.

### Provisions
Montants mis de côté pour payer des engagements futurs (sinistres à payer). En jeu : levier « Provisions » pouvant être prudent/agressif avec impacts court terme et risques futurs.

### Fonds propres / capital
Ressources financières de l’entreprise absorbant les pertes. En jeu : contrainte partagée entre produits et composante de la résilience.

### Solvabilité (concept)
Capacité à honorer ses engagements. En jeu : représentée via l’indice de résilience (IRF) et des alertes/contraintes en difficulté élevée.

### Ratio combiné (proxy)
En assurance dommages : (sinistres + frais) / primes. Dans le jeu : on parle souvent d’un **proxy** pédagogique plutôt qu’un calcul réglementaire exact.

### Inflation
Hausse générale des coûts (réparation, pièces, main d’œuvre, frais). En jeu : événement marché pouvant dégrader la sinistralité et/ou les frais.

### Choc climatique
Épisode météo extrême impactant la fréquence et/ou la sévérité des sinistres (souvent MRH, parfois Auto). En jeu : événement marché avec intensité variable.

### Conformité
Respect des exigences légales/réglementaires (RGPD, contrôles, sanctions, etc.). En jeu : contrainte structurante pouvant générer des événements, coûts, ou pénalités.

### IBNR (Incurred But Not Reported)
Sinistres survenus mais non encore déclarés. Composante essentielle des provisions techniques (PSNEM). En jeu : agrégé dans le « stock de sinistres » pour simplification pédagogique.

### S/P (Sinistres sur Primes)
Ratio sinistres / primes acquises. Composante principale du ratio combiné (avant frais). En jeu : proxy de rentabilité technique.

### Primes acquises
Fraction de prime correspondant à la période de couverture échue. Différent des primes collectées (encaissées). En jeu : simplification → primes acquises = primes collectées.

### Cat Nat (Catastrophe Naturelle)
Régime légal français des catastrophes naturelles (loi 1982). Couverture obligatoire, réassurance via CCR (Caisse Centrale de Réassurance). En jeu : inclus dans les « chocs climatiques » sans distinction tarifaire spécifique.

---

## 3bis) Nouveaux Termes IARD (Compléments)

### Appétit au risque (Risk Appetite)
Niveau de risque qu'une compagnie est prête à accepter pour atteindre ses objectifs. En jeu : se traduit par la posture de souscription et les règles de sélection.

### Posture de souscription (Underwriting Posture)
Politique d'acceptation ou de refus des risques présentés. En jeu : levier LEV-UND-01 (Permissive → Sélective). Affecte le volume et la qualité du portefeuille.

### Anti-sélection (Adverse Selection)
Phénomène où un assureur attire une proportion anormale de "mauvais risques" (clients à sinistralité élevée). En jeu : se matérialise quand prix bas + posture permissive, mesuré par ADVERSE_SEL_RISK.

### CAT Modeling (Modélisation CAT)
Techniques de modélisation des risques catastrophiques pour estimer l'exposition et calibrer la réassurance. En jeu : simplifié en probabilités d'événements + intensité + mitigation.

### Gestion de crise
Organisation mise en place pour gérer un afflux exceptionnel (CatNat, panne, incident majeur). En jeu : levier LEV-CRISE-01, affecte OPS_SURGE_CAP.

### Surge capacity
Capacité à absorber un pic d'activité exceptionnel (sinistres, appels, tâches). En jeu : indice OPS_SURGE_CAP, piloté par le plan de crise et les effectifs.

### Backlog sinistres
Stock de dossiers en attente de traitement, au-delà de la capacité normale. En jeu : indice BACKLOG_DAYS, génère frustration client et pression régulateur.

### Médiation
Processus de résolution amiable des litiges assureur-assuré, souvent via un médiateur indépendant. En jeu : levier LEV-CLI-02, réduit LITIGATION_RISK.

### Transaction
Accord amiable pour clore un litige, évitant une procédure judiciaire. En jeu : partie de la politique d'indemnisation, réduit les coûts juridiques.

### Contentieux
Procédure judiciaire entre l'assureur et un assuré ou tiers. En jeu : mesuré par LITIGATION_RISK et LEGAL_COST_RATIO.

### Dispositif de contrôle interne
Organisation des contrôles permanents (conformité, risques, qualité) au sein de l'entreprise. En jeu : levier LEV-CONF-02, affecte CTRL_MATURITY et la vulnérabilité aux audits.

### Audit délégataire
Contrôle d'un partenaire à qui la gestion est déléguée (courtier gestionnaire, plateforme affinitaire). En jeu : levier LEV-CONF-03, améliore FRAUD_PROC_ROB et CHAN_QUALITY.

### Concentration apporteur
Dépendance d'une compagnie à un petit nombre de distributeurs pour son chiffre d'affaires. En jeu : indice DISTRIB_CONC_RISK. > 50% = dépendance élevée, risque de rupture.

### Qualité portefeuille par canal
Performance technique (S/P) des contrats selon leur source de distribution (digital, agents, courtiers, affinitaires). En jeu : indice CHAN_QUALITY.

### Température réputationnelle
Indicateur de la pression médiatique et de la confiance publique. En jeu : indice REP_TEMP, influence IAC et déclenche l'attention régulateur.

### Pression régulateur (Regulator_Heat)
Indicateur de tension avec le régulateur (ACPR). Augmente en cas de backlog élevé, plaintes collectives, manquements conformité. En jeu : seuil critique → risque d'injonction ou sanction. Décroît lentement si les mesures correctives sont prises.

### Taux de réclamations (Complaints_Rate)
Proportion de clients exprimant une insatisfaction formelle (réclamation écrite, saisine médiateur). En jeu : driver de satisfaction, de NPS et de risque contentieux. Influencé par la politique d'indemnisation et le service client.

---

## 4) Termes « entreprise » (transverses)

### Organisation
Choix de structure (centralisée, déléguée, mixte). En jeu : peut influencer IPQO, coûts, réactivité.

### Capacité
Ressources disponibles pour absorber la charge (effectifs, prestataires, SI). En jeu : si charge > capacité, la qualité baisse et les coûts augmentent (selon moteur).

### Charge
Volume de travail (ex. sinistres à traiter) généré par l’activité. En jeu : dépend du portefeuille et de la sinistralité.

### Dette IT
Accumulation de choix SI sous-optimaux (stabilité, sécurité, maintenabilité). En jeu : inertie négative si sous-investissement IT/Data.

### Maturité Data
Capacité à exploiter la donnée (qualité, gouvernance, outillage) pour piloter et industrialiser des cas d’usage. En jeu : mesurée via IMD.

### Cas d’usage IA
Automatisation/optimisation via IA (triage sinistres, fraude…). En jeu : accessible selon maturité data et difficulté ; implique coût, effet retard, et gouvernance.

### Réputation / satisfaction (proxy)
Perception client (NPS, satisfaction). En jeu : influence la rétention et l’attractivité, souvent via effets retard.

---

## 5) Termes du jeu (game design)

### Session
Partie paramétrée (vitesse, difficulté, durée, produits, scénario, pondérations). Peut être solo ou multijoueur.

### Produit (au sens jeu)
Un « domaine d’assurance » (Auto, MRH, PJ, GAV…) sélectionné pour la session. Chaque produit a : portefeuille, sinistralité, leviers, et indicateurs.

### Portefeuille multi-produits
Conception où la compagnie pilote **1+ produits** dans une session. Les ressources (budget, effectifs, IT/Data, capital) sont en partie **communes** et font l’objet d’arbitrages.

### Tour
Unité de progression. À chaque tour : lecture cockpit → événements → décisions → résolution → feedback.

### Vitesse de jeu
Correspondance tour/temps :
- Rapide : 1 tour = 1 année
- Moyenne : 1 tour = 1 trimestre
- Lente : 1 tour = 1 mois
La vitesse modifie la granularité des décisions, la variance des événements et les effets retard.

### Difficulté
Niveau de complexité actionnable (Novice / Intermédiaire / Expert / Survie). Plus la difficulté augmente :
- plus il y a de leviers,
- plus ils sont granulaires,
- plus les interactions/contraintes sont strictes,
- plus l’explainability est nécessaire.

### Surface de décision
Ensemble des leviers accessibles à un joueur à un moment donné (dépend de la difficulté et éventuellement de prérequis).

### Levier
Décision actionnable par le joueur (tarification, distribution, RH, IT/Data, sinistres, réassurance…). Peut être **macro** (novice) ou **fin** (expert).

### Budget de tour
Ressource allouable aux leviers sur un tour. Sert à matérialiser l’arbitrage et la rareté.

### Persistance
Caractère durable d’une décision (elle continue d’agir sur plusieurs tours).

### Inertie
Résistance au changement : certains effets ne se corrigent pas immédiatement (RH, IT/Data, réputation). Dans le jeu, l’inertie augmente le coût de rattrapage.

### Effet retard (lag)
Décalage entre une décision et son effet principal (ex. IT/Data, prévention). Paramétré en nombre de tours (lié à la vitesse).

### Progressif (N1/N2/N3)
Levier déployable par paliers (ex. lutte fraude) :
- N1 : quick wins → effet rapide, plafonné
- N2 : industrialisation → effet plus fort, inertie
- N3 : data/IA → effet maximal, coût élevé, effet retard

### Cockpit / Dashboard
Écran principal de pilotage. Affiche indices, P&L et indicateurs opérationnels **par produit et agrégés** (contrats, primes, sinistres, effectifs…).

### News Flash
Présentation narrative d’un événement (marché ou compagnie) avec impacts et durée.

### Événement marché (systémique)
Choc qui affecte tout le marché (climat, inflation, réglementation, disrupteur, mutation du parc). L’impact peut varier selon la stratégie de chaque compagnie.

### Événement compagnie (idiosyncratique)
Choc ciblant une seule compagnie (cyberattaque, panne SI, crise RH, incident prestataire, litige/sanction). Souvent conditionné par les vulnérabilités (ex. maturité SI).

### Concurrence / IA concurrente
Modèle de comportement des autres acteurs du marché. En MVP : IA plutôt « réactive » (prix/parts). En versions ultérieures : IA plus stratégique.

### Civ-like
Référence au gameplay de type civilisation : marché fermé, choix d’un acteur, progression sur plusieurs tours, compétition entre acteurs.

### Tower defense
Métaphore de vagues de menaces externes que le joueur doit contrer via des « défenses » (réassurance, prévention, RH, IT/Data, fraude…).

### Solo
Mode de jeu : un joueur contre l’IA.

### Multijoueur
Mode de jeu : plusieurs joueurs dans une session synchrone. Décision individuelle ou par équipe.

### Séminaire (grand groupe)
Mode d’usage événementiel (200+). Gouvernance par rôles, équipes, droits et rythme de tour. **Aucun plafond fonctionnel** n’est codé ; les limites sont techniques/contractuelles.

### Équipe
Groupe de participants jouant ensemble une compagnie/stratégie. Selon configuration : vote, consolidation ou arbitre (chef d’équipe).

### Facilitateur / formateur
Rôle animé : crée/paramètre la session, accompagne, peut orchestrer la progression et le débrief.

### Observateur
Participant qui suit la session sans prendre de décisions (mode séminaire). Peut avoir accès aux dashboards et aux résultats.

### Chef d’équipe
Rôle optionnel en séminaire : consolide les propositions/votes et valide la décision finale de l’équipe.

### Résolution (du tour)
Étape où le moteur calcule les impacts des décisions et événements sur les indices, le portefeuille et le P&L.

### Explainability (« pourquoi ça bouge »)
Mécanisme pédagogique qui explique les variations (ex. top drivers : décisions/événements/effets retard). La profondeur dépend de la version.

### Feedback
Retour immédiat de fin de tour : alertes, évolutions d’indices, impacts P&L, contraintes à venir.

### Debrief (court / final)
Analyse pédagogique : décisions clés, impacts immédiats/différés, biais de pilotage, recommandations de progression.

### Scoring
Score global de partie calculé à partir d’une combinaison pondérée des indices (pondérations dépendantes du mode/difficulté/scénario).

### Mode survie
Variante de difficulté : vagues d’événements rapprochées + budget contraint + pénalités accrues ; objectif principal = survivre X tours.

---

## 6) Indices du moteur (définitions)

> Tous les indices sont **normalisés** (ex. 0–100). Ils représentent des états systémiques, pas des métriques réglementaires.

### IAC — Indice Attractivité Commerciale
Mesure la capacité à attirer et conserver des clients (prix/offre/distribution/satisfaction). Peut monter vite, mais peut dégrader la rentabilité si la qualité du portefeuille baisse.

### IPQO — Indice Performance & Qualité Opérationnelle
Mesure la qualité de fonctionnement (capacité vs charge, stabilité de la gestion, efficacité process, qualité prestataires). IPQO bas se traduit par coûts plus élevés, délais, insatisfaction.

### IERH — Indice Équilibre RH
Mesure la santé RH (effectifs, compétences, turnover, climat social, capacité). Impacte IPQO avec **effets retard**.

### IRF — Indice Résilience Financière
Mesure la capacité à absorber les chocs (capital/protection réassurance/provisions prudentielles). Souvent antagoniste du P&L court terme (la protection a un coût).

### IMD — Indice Maturité Data
Mesure la capacité data (qualité, gouvernance, outillage, automatisation). Effets souvent retardés ; prérequis pour des leviers avancés (IA, industrialisation fraude).

### IS — Indice de Sincérité
Mesure le « boni/mali » lié à la sincérité des choix (ex. provisionnement agressif, court-termisme). Un IS bas peut augmenter les risques futurs et pénaliser la confiance/contrainte.

### IPP — Indice Performance P&L
Mesure la performance économique globale (pédagogique). Résulte d’un équilibre primes, sinistres, frais, réassurance, placements… et des arbitrages multi-produits.

---

## 7) Rôles & permissions (référence)

- **Super Admin (éditeur)** : admin global de la plateforme.
- **Admin Tenant** : admin côté client (rôles, paramètres, contenus autorisés).
- **Formateur** : crée/paramètre des sessions, suit les résultats, anime le débrief.
- **Joueur** : prend des décisions.
- **Observateur** : suit sans décider (séminaire).
- **Chef d’équipe** : consolide/arbitre pour une équipe (séminaire).

---

## 8) Notes anti-malentendus (à garder en tête)

- « **Illimité** » (participants) = pas de limite **fonctionnelle** codée. Les limites peuvent exister via SLA/infra.
- « **Réalisme** » = cohérence causale + ordre de grandeur pédagogique, **pas** une simulation actuarielle.
- Un terme peut être **proxy** : ex. ratio combiné ou satisfaction peuvent être représentés via des indices/alertes plutôt que des calculs industriels.

