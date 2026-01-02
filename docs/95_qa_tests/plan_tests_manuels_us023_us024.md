# Plan de Tests Manuels — Sprint 4 (US-023 & US-024)

Ce document décrit les scénarios de test manuel pour valider les fonctionnalités développées durant le Sprint 4 : les effets retard paramétrés et le système de persistance/compensation.

## 📋 Informations
- **Version App :** `0.1.0` (Dev)
- **Environnement :** Local (`npm run dev`)
- **Date :** 01/01/2026

## 🛠️ Prérequis
1. Lancer l'application : `npm run dev`
2. Accéder à `http://localhost:3000`
3. Ouvrir la console développeur (F12) pour surveiller les logs

---

## 🧪 Scénarios de Test

### 1. US-023 : Paramétrage des Délais & Vitesse
**Objectif :** Vérifier que le délai d'application d'une décision dépend de son domaine et de la vitesse de la partie.

| ID | Action | Résultat Attendu | Statut |
|----|--------|------------------|:------:|
| **1.1** | Créer une Nouvelle Session<br>• Difficulté : *Novice*<br>• Vitesse : *Moyenne* | Session créée, accès au Dashboard. | ⬜ |
| **1.2** | Prendre une décision **RH** (ex: Recrutement)<br>*Note : Délai base RH = 2 tours* | Feedback UI indique un effet dans **2 tours**. | ⬜ |
| **1.3** | Prendre une décision **IT** (ex: Refonte SI)<br>*Note : Délai base IT = 4 tours* | Feedback UI indique un effet dans **4 tours**. | ⬜ |
| **1.4** | Créer une Nouvelle Session<br>• Difficulté : *Novice*<br>• Vitesse : **Rapide** | Session créée. | ⬜ |
| **1.5** | Prendre une décision **RH** | Feedback UI indique un effet dans **1 tour**<br>*(2 tours / 2 = 1)*. | ⬜ |
| **1.6** | Prendre une décision **IT** | Feedback UI indique un effet dans **2 tours**<br>*(4 tours / 2 = 2)*. | ⬜ |

### 2. US-023 : Visualisation (Timeline)
**Objectif :** Vérifier que les effets futurs sont visibles et compréhensibles dans l'interface.

| ID | Action | Résultat Attendu | Statut |
|----|--------|------------------|:------:|
| **2.1** | Observer le panneau latéral/bas "Effets à venir" | Les décisions prises en 1.2/1.3 sont visibles sur une frise temporelle. | ⬜ |
| **2.2** | Survoler un indicateur d'effet | Une infobulle affiche :<br>• Nom de la décision<br>• Impact estimé<br>• Index ciblé | ⬜ |
| **2.3** | Passer le tour (Bouton "Tour Suivant") | Les effets avancent d'un cran vers "T0" (Maintenant). | ⬜ |

### 3. US-024 : Persistance & Décroissance
**Objectif :** Vérifier que les effets actifs perdurent dans le temps et s'atténuent (decay).

| ID | Action | Résultat Attendu | Statut |
|----|--------|------------------|:------:|
| **3.1** | Continuer jusqu'à ce qu'un effet s'applique (T0) | Notification ou Log console : "Effet appliqué". | ⬜ |
| **3.2** | Ouvrir le panneau "Historique des Effets" | L'effet apparaît avec le statut <span style="color:green">**Actif**</span>. | ⬜ |
| **3.3** | Noter la valeur courante (ex: +10 pts) | Valeur initiale affichée. | ⬜ |
| **3.4** | Passer 1 tour | La valeur a **diminué** (ex: ~8.0 pts pour decay 20%).<br>Le statut reste "Actif". | ⬜ |
| **3.5** | Passer plusieurs tours | La valeur continue de baisser à chaque tour (monotonie). | ⬜ |
| **3.6** | Attendre que la valeur passe sous 0.5 | Le statut passe à <span style="color:gray">**Épuisé**</span>. | ⬜ |

### 4. US-024 : Compensation (Rattrapage)
**Objectif :** Valider le mécanisme de compensation coûteuse des effets actifs.

| ID | Action | Résultat Attendu | Statut |
|----|--------|------------------|:------:|
| **4.1** | Identifier un effet **Actif** dans l'historique | Bouton "Compenser" visible avec un coût associé. | ⬜ |
| **4.2** | Noter le coût affiché (ex: 100 €) | Coût de base affiché (+0%). | ⬜ |
| **4.3** | Passer 2 tours sans compenser | Le coût a **augmenté** (ex: +40% → 140 €).<br>L'indicateur de coût montre une barre de progression. | ⬜ |
| **4.4** | Cliquer sur le bouton "Compenser" | • Coût déduit du budget (Log/UI)<br>• Statut devient <span style="color:blue">**Compensé**</span>.<br>• Valeur de l'effet passe à 0. | ⬜ |
| **4.5** | Passer 1 tour | L'effet reste "Compensé" (ne redevient pas actif).<br>Le coût ne change plus. | ⬜ |

## 🐞 Bugs Identifiés
*(Remplir si des problèmes sont trouvés)*

1. 
2. 

---
*Fin du plan de test.*
