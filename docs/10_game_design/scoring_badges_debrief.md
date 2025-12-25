# scoring_badges_debrief.md — Scoring, Badges et Débrief

**Version** : 1.0  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-25

---

## 1) Vue d'ensemble

Ce document spécifie les mécaniques de scoring, badges et débrief d'AssurManager dans le cadre du **MVP**.

---

## 2) Scoring

### 2.1 Score Global

| Attribut | Valeur |
|----------|--------|
| **Input** | 7 indices finaux + pondérations + objectifs scénario |
| **Output** | Score numérique 0-1000 |
| **Limites** | Pondérations fixes par difficulté en MVP |
| **Feedback joueur** | Score affiché + décomposition par indice |

**Formule** :
```
Score_Global = Σ (Indice_i × Poids_i) × 10 + Bonus_Objectifs

Contrainte : Σ Poids_i = 1.0
```

### 2.2 Pondérations par Difficulté (MVP)

| Indice | Novice | Intermédiaire |
|--------|--------|---------------|
| IAC | 15% | 15% |
| IPQO | 20% | 18% |
| IERH | 10% | 12% |
| IRF | 20% | 18% |
| IMD | 10% | 12% |
| IS | 5% | 10% |
| IPP | 20% | 15% |

### 2.3 Bonus Objectifs Scénario

MVP (scénario Standard) :
- Survie complète (pas de game over) : +50 pts
- Croissance portefeuille > 10% : +30 pts
- IPP > 60 au dernier tour : +20 pts

**Dépendances simulation** : Lecture indices finaux, calcul croissance portefeuille.

### 2.4 Score Pédagogique (complémentaire)

| Attribut | Valeur |
|----------|--------|
| **Input** | Historique complet + décisions + événements |
| **Output** | Score 0-500 mesurant l'apprentissage |
| **Limites** | Complémentaire au score performance |
| **Feedback joueur** | Affichage séparé : "Score Performance" + "Score Apprentissage" |

**Composantes** :

| Composante | Mesure | Points max |
|------------|--------|------------|
| Progression | Δ indices (fin vs début) | 0-150 |
| Équilibre | Écart-type des 7 indices final (inversé) | 0-100 |
| Anticipation | Réactions pertinentes aux événements | 0-100 |
| Effets retard | Décisions tenant compte des délais | 0-100 |
| Engagement | Exploration tooltips, aides | 0-50 |

**Formule** :
```
Score_Pédagogique = Progression + Équilibre + Anticipation + Effets_Retard + Engagement

Score_Final_Affiché = Score_Performance (70%) + Score_Pédagogique norm. (30%)
```

**Dépendances simulation** : Historique complet, traçabilité décisions, compteur interactions UI.

---

## 3) Badges [SIMPLIFIÉ MVP]

### 3.1 Système de Badges

| Attribut | Valeur |
|----------|--------|
| **Input** | Historique de la partie |
| **Output** | 0-N badges attribués |
| **Limites** | ~10 badges en MVP |
| **Feedback joueur** | Badges affichés au debrief avec descriptions |

### 3.2 Catalogue Badges MVP

| Badge | Condition | Type |
|-------|-----------|------|
| 🏆 Survivant | Terminer sans game over | Progression |
| 📈 Croissance | Portefeuille +20% | Performance |
| 💰 Rentable | IPP ≥ 70 au dernier tour | Performance |
| 🛡️ Résilient | IRF jamais < 40 | Qualité |
| ⚡ Efficace | IPQO moyen ≥ 65 | Qualité |
| 🔍 Détective | Activation Fraude N1 | Décision |
| 🤝 Équilibré | Tous indices ≥ 50 | Stratégie |
| 📊 Data-driven | IMD ≥ 60 au dernier tour | Stratégie |
| 🌱 Prudent | IS jamais < 60 | Éthique |
| 🚀 Challenger | Parts de marché +5% | Compétition |

### 3.3 Affichage Badges

Chaque badge comprend :
- Icône (emoji MVP, graphique V1+)
- Nom court
- Description de la condition
- Date d'obtention

### 3.4 Badges Compétence (apprentissage)

| Badge | Compétence mesurée | Condition |
|-------|-------------------|----------|
| 🎓 Lecteur averti | Lecture cockpit | Consulter toutes les sections cockpit |
| 🔮 Visionnaire | Anticipation | 3+ décisions tenant compte des effets retard |
| ⚖️ Stratège équilibré | Vision systémique | Maintenir tous indices > 40 pendant 5+ tours |
| 🛠️ Réactif | Gestion de crise | Redresser un indice de < 35 à > 50 |
| 📈 Progressant | Amélioration | Score tour 12 > Score tour 6 de +100pts |

**Dépendances simulation** : Historique complet des états par tour, traçabilité décisions.

---

## 4) Debrief

### 4.1 Structure Debrief Fin de Partie

| Attribut | Valeur |
|----------|--------|
| **Input** | Historique complet de la partie |
| **Output** | Analyse pédagogique structurée |
| **Limites** | Niveau pédagogique, pas actuariel |
| **Feedback joueur** | Écran multi-sections + export PDF |

**Sections du debrief** :

#### 4.1.1 Résumé

- Score final + classement (si comparable)
- Durée effective (tours joués)
- Badges obtenus
- Graphique radar indices (début vs fin)

#### 4.1.2 Décisions Clés

| Attribut | Valeur |
|----------|--------|
| **Input** | Historique décisions + impacts calculés |
| **Output** | Top 5 décisions déterminantes |
| **Limites** | Priorisation par amplitude d'impact |
| **Feedback joueur** | Liste ordonnée avec explication d'impact |

**Format par décision** :
```
Tour T : [Décision]
→ Impact immédiat : [Description]
→ Impact différé : [Description si applicable]
→ Contribution au score : +/-X points
```

#### 4.1.3 Événements Marquants

- Liste des événements déclenchés
- Pour chaque : type (marché/compagnie), impact, réaction du joueur
- Événements non anticipés (vulnérabilités)

#### 4.1.4 Analyse des Biais

| Biais détecté | Indicateur | Feedback |
|---------------|------------|----------|
| Court-termisme | IS < 50 + provisionnement agressif | "Attention aux choix de court terme" |
| Sur-optimisation | 1 indice > 80, autres < 50 | "Équilibrer les priorités" |
| Négligence risque | IRF < 40 sans réassurance | "Anticiper les chocs" |
| Sous-investissement RH | IERH en baisse continue | "Les RH sont un investissement long terme" |
| Dette technologique | IMD en baisse continue | "Le SI est le socle de votre efficacité" |

#### 4.1.5 Évaluation des Compétences Acquises

| Attribut | Valeur |
|----------|--------|
| **Input** | Historique + objectifs pédagogiques du niveau |
| **Output** | Niveau atteint par compétence (0-3 étoiles) |
| **Limites** | 5 compétences évaluées en MVP |
| **Feedback joueur** | Radar compétences + message par compétence |

**Grille d'évaluation** :

| Compétence | ⭐ En cours | ⭐⭐ Acquis | ⭐⭐⭐ Maîtrisé |
|------------|-----------|---------|-------------|
| Arbitrage croissance/rentabilité | IAC ou IPP < 45 | IAC et IPP > 50 | IAC et IPP > 60, équilibrés |
| Gestion chaîne sinistres | IPQO < 50 | IPQO > 55 | IPQO > 65, stock contrôlé |
| Résilience financière | IRF < 45 | IRF > 50 | IRF > 60, réassurance active |
| Vision systémique | Sur-optimisation détectée | Indices équilibrés | Anticipation effets retard |
| Conformité | IS < 50 | IS > 55 | IS > 65, pas de sanction |

**Affichage** :
```
Compétences acquises :

✅ Arbitrage croissance/rentabilité : ⭐⭐⭐ Maîtrisé
   Vous avez maintenu un bon équilibre prix/volume.

⚠️ Vision systémique : ⭐ En cours
   Vous avez parfois négligé les effets de second ordre.

📈 Progression : +150 points entre T1 et T12
```

#### 4.1.6 Recommandations et Parcours

- 3 axes d'amélioration personnalisés (basés sur compétences < 2 étoiles)
- Suggestion de prochaine partie (compagnie, difficulté, focus)
- Parcours de progression :

### 4.2 Mécanique Debrief

| Attribut | Valeur |
|----------|--------|
| **Input** | game_state[] de tous les tours |
| **Output** | Rapport debrief structuré |
| **Limites** | Calcul asynchrone (peut prendre 2-3s) |
| **Feedback joueur** | Loader puis affichage progressif |

**Dépendances simulation** :
- Accès à l'historique complet (états par tour)
- Attribution des variations aux causes (traçabilité)
- Algorithme de détection des biais
- Calcul des top 5 décisions par impact

---

## 5) Export PDF (MVP)

### 5.1 Contenu Export

| Section | Contenu |
|---------|---------|
| En-tête | Logo, session, date, joueur |
| Résumé | Score, badges, radar indices |
| Courbes | Évolution des 7 indices par tour |
| P&L | Tableau synthétique (Primes, Sinistres, Frais, Résultat) |
| Événements | Top 5 événements marquants |
| Décisions | Top 5 décisions déterminantes |
| Recommandations | 3 axes d'amélioration |

### 5.2 Mécanique Export

| Attribut | Valeur |
|----------|--------|
| **Input** | Données debrief + paramètres session |
| **Output** | Fichier PDF téléchargeable |
| **Limites** | Format A4, ~4-6 pages |
| **Feedback joueur** | Bouton "Exporter PDF" + téléchargement |

**Dépendances simulation** : Mêmes données que le debrief web.

---

## 6) Explainability (MVP)

### 6.1 Top 3 Drivers

| Attribut | Valeur |
|----------|--------|
| **Input** | Variations d'indices tour à tour |
| **Output** | 3 causes principales par variation majeure |
| **Limites** | Niveau MVP = causes principales uniquement |
| **Feedback joueur** | Affichage "Pourquoi ça bouge ?" cliquable |

**Catégories de drivers** :
1. **Décision joueur** : "Vous avez choisi [X]"
2. **Événement** : "L'événement [Y] a provoqué..."
3. **Effet retard** : "Votre décision de il y a 2 tours..."

### 6.2 Timeline Relecture [OUT OF SCOPE MVP]

Prévue V1 : Navigation tour par tour, filtres, comparaison états.

---

## 7) Décisions / Risques / Checklist

### 7.1 Décisions

| ID | Décision | Justification |
|----|----------|---------------|
| SD-01 | Score 0-1000 | Lisible, comparable |
| SD-02 | ~10 badges MVP | Gamification légère |
| SD-03 | Top 5 décisions | Concentration pédagogique |
| SD-04 | 4 types de biais | Couverture des erreurs courantes |
| SD-05 | PDF 4-6 pages | Export actionnable |

### 7.2 Risques

| ID | Risque | Mitigation |
|----|--------|------------|
| R-09 | Scoring opaque | Décomposition visible |
| R-10 | Badges trop faciles | Calibrer conditions |
| R-11 | Debrief trop long | Sections collapsibles |
| R-12 | Biais mal détectés | Affiner algorithmes en V1 |

### 7.3 Checklist

- [ ] Calcul score avec pondérations par difficulté
- [ ] Système de badges (10 conditions)
- [ ] Écran debrief 5 sections
- [ ] Algorithme top 5 décisions
- [ ] Détection des 4 biais principaux
- [ ] Export PDF fonctionnel
- [ ] Top 3 drivers par variation d'indice

---

## 8) Dépendances vers la Simulation

### 8.1 Données Requises

| Donnée | Source | Utilisation |
|--------|--------|-------------|
| `game_state[t]` | Stockage par tour | Courbes, comparaisons |
| `decisions[t]` | Historique | Attribution impacts |
| `events[t]` | Historique | Timeline, drivers |
| `delayed_effects` | File d'attente | Explication effets retard |
| `market_state[t]` | Calcul IA | Parts de marché |

### 8.2 Traçabilité pour Debrief

Le moteur doit enregistrer pour chaque tour :
```
{
  turn: number,
  state_before: GameState,
  decisions: Decision[],
  events: Event[],
  delayed_effects_applied: Effect[],
  state_after: GameState,
  delta_indices: { [index]: { value: number, drivers: Driver[] } }
}
```

### 8.3 Algorithme Top 5 Décisions

```
Pour chaque décision D du jeu :
  impact_score = Σ |delta_indices attribuables à D|
  
Trier par impact_score décroissant
Retourner les 5 premières
```

---

*Scope MVP. [OUT OF SCOPE] = V1/V2.*
