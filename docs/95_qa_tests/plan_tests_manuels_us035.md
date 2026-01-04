# Plan de Contrôle Manuel - US-035 (Options & Niveaux Progressifs)

Ce plan de test vise à valider manuellement l'intégration des options (mutually exclusive) et des niveaux progressifs dans l'interface de jeu.

## 1. Préparation

- **Lancer l'application** : `npm run dev`
- **Accéder au jeu** : Démarrer nouvelle partie (`/game/new`) ou charger une partie existante.
- **Accéder à l'écran Décisions** : Onglet "Actions" ou "Décisions".

## 2. Scénarios de Test

### Scénario A : Levier à Options (ex: "Niveau de prime")

| ID | Action | Résultat Attendu | Statut |
|----|--------|------------------|--------|
| A1 | Localiser levier "Niveau de prime" | Levier visible dans catégorie "Tarification" | [ ] |
| A2 | Cliquer sur le levier | Une liste d'options (ex: Agressif, Marché, Premium) s'affiche sous la carte | [ ] |
| A3 | Sélectionner "Agressif" | - L'option devient bleue/sélectionnée<br>- Le coût/impact prévisualisé se met à jour (si implémenté)<br>- Le levier est marqué "Sélectionné" | [ ] |
| A4 | Changer pour "Premium" | La sélection bascule sur "Premium" (exclusif, une seule sélection possible) | [ ] |

### Scénario B : Levier Progressif (ex: "Lutte anti-fraude")

| ID | Action | Résultat Attendu | Statut |
|----|--------|------------------|--------|
| B1 | Localiser levier "Lutte anti-fraude" (ou similaire progressif) | Levier visible avec indicateur de niveaux (N1, N2, N3) si implémenté, ou au clic | [ ] |
| B2 | Cliquer pour voir les niveaux | Composant `ProgressiveLevel` affiche N1, N2, N3 | [ ] |
| B3 | Vérifier état initial | - N1 : Disponible (blanc)<br>- N2 : Verrouillé (gris, cadenas)<br>- N3 : Verrouillé (gris, cadenas) | [ ] |
| B4 | Tenter de sélectionner N2 | Impossible (bouton désactivé) | [ ] |
| B5 | Survoler N2 (Tooltip) | Tooltip affiche "Prérequis manquant : Levier X niveau N1 requis" | [ ] |
| B6 | Sélectionner N1 | - N1 devient vert (Acquis/Sélectionné)<br>- Coût déduit du budget tour | [ ] |
| B7 | Valider le tour (simulé) | Au tour suivant (T+1), N1 est considéré "Acquis" | [ ] |
| B8 | Vérifier N2 au T+1 | N2 devient Disponible (blanc) car N1 est acquis | [ ] |

### Scénario C : Interactions & Contraintes

| ID | Action | Résultat Attendu | Statut |
|----|--------|------------------|--------|
| C1 | Désélectionner un levier | Le coût est remboursé au budget tour | [ ] |
| C2 | Vérifier impacts | Les impacts prévus (ex: +IPP) sont cohérents avec l'option choisie | [ ] |

## 3. Rapport d'anomalies

*(Remplir ici si bugs trouvés)*

- [ ] ...
