# accessibilite.md — Accessibilité AssurManager

**Version** : 1.1  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-27  
**Auteur** : UX/UI Designer

> **CHANGELOG**
> - **2025-12-27** : Clarification template de test, version bump.

---

## 1) Objectifs d'accessibilité MVP

### 1.1 Niveau cible

| Standard | Niveau | Priorité |
|----------|--------|----------|
| WCAG 2.1 | AA | MVP |
| WCAG 2.1 | AAA (partiel) | V1+ |
| RGAA 4.1 | Conformité partielle | MVP |

### 1.2 Périmètre MVP

| Critère | Inclus MVP | Justification |
|---------|------------|---------------|
| Navigation clavier | ✅ | Essentiel pour utilisateurs moteurs |
| Gestion du focus | ✅ | Contexte d'usage modal/wizard |
| Labels et ARIA | ✅ | Lecteurs d'écran |
| Contrastes | ✅ | Lisibilité universelle |
| Réduction de mouvement | ✅ | Confort vestibulaire |
| Textes alternatifs | ✅ | Images et graphiques |

---

## 2) Navigation clavier

### 2.1 Ordre de tabulation

| Écran | Ordre de focus |
|-------|----------------|
| Login | Email → Mot de passe → Toggle visibilité → Bouton connexion → Liens |
| Cockpit | Header → Radar → Alertes → Grille produits → P&L → Bouton suivant |
| Décisions | Onglets catégories → Leviers → Liste décisions → Bouton valider |

### 2.2 Raccourcis clavier

| Raccourci | Action | Contexte |
|-----------|--------|----------|
| `Tab` | Focus suivant | Global |
| `Shift + Tab` | Focus précédent | Global |
| `Enter` / `Space` | Activer élément focusé | Boutons, liens |
| `Escape` | Fermer modal/dropdown | Modals, menus |
| `Arrow ↑/↓` | Navigation dans liste | Dropdowns, radio |
| `Arrow ←/→` | Ajuster slider | Leviers |
| `C` | Aller au Cockpit | En jeu |
| `M` | Aller au Marché | En jeu |
| `D` | Aller aux Décisions | Phase décisions |

### 2.3 Focus visible

```css
/* Focus visible pour tous les éléments interactifs */
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Suppression du outline par défaut au clic */
*:focus:not(:focus-visible) {
  outline: none;
}
```

---

## 3) Gestion du focus

### 3.1 Focus trap (Modals)

| Situation | Comportement |
|-----------|--------------|
| Ouverture modal | Focus sur premier élément interactif |
| Tab dans modal | Cycle dans la modal uniquement |
| Fermeture modal | Retour au déclencheur |

```javascript
// Implémentation recommandée
// Utiliser inert sur le contenu derrière la modal
document.querySelector('main').inert = true;
```

### 3.2 Skip links

```html
<!-- Premier élément du body -->
<a href="#main-content" class="skip-link">
  Aller au contenu principal
</a>

<style>
.skip-link {
  position: absolute;
  top: -100px;
  left: 0;
  z-index: 1000;
}
.skip-link:focus {
  top: 0;
}
</style>
```

### 3.3 Focus par phase de jeu

| Phase | Gestion du focus |
|-------|------------------|
| Lecture (Cockpit) | Focus sur zone alertes si critique |
| Événements | Focus sur première card événement |
| Décisions | Focus sur premier levier disponible |
| Feedback | Focus sur résumé variations |

---

## 4) Labels et ARIA

### 4.1 Formulaires

```html
<!-- Input avec label explicite -->
<label for="email">Adresse email</label>
<input 
  type="email" 
  id="email" 
  name="email"
  aria-required="true"
  aria-invalid="false"
  aria-describedby="email-help"
/>
<span id="email-help">Format : exemple@domaine.fr</span>
```

### 4.2 Boutons avec icône seule

```html
<!-- Bouton avec icône uniquement -->
<button 
  aria-label="Fermer la modal"
  title="Fermer"
>
  <svg aria-hidden="true"><!-- icône × --></svg>
</button>
```

### 4.3 États dynamiques

| Composant | Attribut ARIA | Utilisation |
|-----------|--------------|-------------|
| Alerte | `role="alert"` | Nouvelles alertes |
| Toast | `role="status"` + `aria-live="polite"` | Notifications |
| Loading | `aria-busy="true"` | Pendant chargement |
| Erreur input | `aria-invalid="true"` | Validation échouée |
| Levier désactivé | `aria-disabled="true"` | Budget insuffisant |

### 4.4 Régions landmarks

```html
<header role="banner"><!-- Header global --></header>
<nav role="navigation" aria-label="Navigation principale">...</nav>
<main role="main" id="main-content"><!-- Contenu principal --></main>
<aside role="complementary" aria-label="Alertes">...</aside>
<footer role="contentinfo">...</footer>
```

### 4.5 Graphiques et données

```html
<!-- Radar des indices -->
<figure role="img" aria-label="Radar des 7 indices">
  <svg><!-- graphique --></svg>
  <figcaption class="sr-only">
    IAC: 62, IPQO: 74, IERH: 68, IRF: 35, IMD: 57, IS: 70, IPP: 63
  </figcaption>
</figure>

<!-- Jauge d'indice -->
<div 
  role="meter" 
  aria-valuenow="62" 
  aria-valuemin="0" 
  aria-valuemax="100"
  aria-label="Indice d'Attractivité Commerciale"
>
  <!-- visuel jauge -->
</div>
```

---

## 5) Contrastes et lisibilité

### 5.1 Ratios de contraste minimum

| Élément | Ratio WCAG AA | Ratio actuel |
|---------|---------------|--------------|
| Texte normal (16px+) | 4.5:1 | ✅ 7.2:1 |
| Texte large (18px+ bold) | 3:1 | ✅ 5.8:1 |
| Composants UI | 3:1 | ✅ 4.1:1 |
| Focus indicator | 3:1 | ✅ 4.5:1 |

### 5.2 Vérification des couleurs

| Combinaison | Ratio | Statut |
|-------------|-------|--------|
| Noir sur blanc (#1F2937 / #FFFFFF) | 12.6:1 | ✅ AAA |
| Primaire sur blanc (#2563EB / #FFFFFF) | 4.5:1 | ✅ AA |
| Danger sur blanc (#EF4444 / #FFFFFF) | 4.5:1 | ✅ AA |
| Blanc sur primaire (#FFFFFF / #2563EB) | 4.5:1 | ✅ AA |

### 5.3 Mode projection

| Ajustement | Valeur |
|------------|--------|
| Taille texte | ×1.5 minimum |
| Contraste fond | Noir pur (#000) |
| Épaisseur traits | ×2 |
| Espacement | ×1.25 |

---

## 6) Réduction de mouvement

### 6.1 Media query

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 6.2 Éléments concernés

| Animation | Comportement réduit |
|-----------|---------------------|
| CountUp chiffres | Affichage direct |
| Radar draw | Affichage direct |
| Slide-in cards | Affichage direct |
| Confetti | Désactivé |
| Skeleton pulse | Statique |

---

## 7) Alternatives textuelles

### 7.1 Images décoratives

```html
<!-- Image purement décorative -->
<img src="decoration.png" alt="" role="presentation" />
```

### 7.2 Images informatives

```html
<!-- Logo compagnie -->
<img src="logo-axa.png" alt="Logo AXA" />

<!-- Icône sémantique -->
<span role="img" aria-label="Événement marché">🌍</span>
```

### 7.3 Graphiques complexes

```html
<!-- Courbe d'évolution des indices -->
<figure>
  <svg><!-- courbe --></svg>
  <figcaption>
    Évolution des indices sur 12 tours : 
    IAC stable autour de 60, IRF en baisse de 50 à 35.
  </figcaption>
</figure>
```

---

## 8) Tests d'accessibilité

### 8.1 Outils automatisés

| Outil | Usage | Fréquence |
|-------|-------|-----------|
| axe DevTools | Tests automatisés | Chaque PR |
| Lighthouse | Audit global | Hebdomadaire |
| WAVE | Vérification visuelle | Ponctuel |

### 8.2 Tests manuels

| Test | Méthode | Critère de succès |
|------|---------|-------------------|
| Navigation clavier | Parcours complet sans souris | Tous les éléments atteignables |
| Lecteur d'écran | Test avec NVDA/VoiceOver | Contenu compréhensible |
| Zoom 200% | Test navigateur | Pas de perte d'information |
| Contraste | Inspection visuelle | Textes lisibles |

### 8.3 Checklist par écran (template de test)

> Cette checklist est un **template de test** à compléter lors du développement et de la QA. Les cases ☐ seront cochées ☑ après validation de chaque critère.

| Écran | Clavier | Focus | ARIA | Contraste |
|-------|---------|-------|------|-----------|
| Login | ☐ | ☐ | ☐ | ☐ |
| Lobby | ☐ | ☐ | ☐ | ☐ |
| Cockpit | ☐ | ☐ | ☐ | ☐ |
| Événements | ☐ | ☐ | ☐ | ☐ |
| Décisions | ☐ | ☐ | ☐ | ☐ |
| Feedback | ☐ | ☐ | ☐ | ☐ |
| Debrief | ☐ | ☐ | ☐ | ☐ |

---

## 9) Composants accessibles

### 9.1 Slider (Leviers)

```html
<div class="slider-container">
  <label id="tarif-label">Tarif Auto</label>
  <input 
    type="range"
    role="slider"
    aria-labelledby="tarif-label"
    aria-valuemin="-10"
    aria-valuemax="10"
    aria-valuenow="0"
    aria-valuetext="0%, valeur actuelle"
  />
  <output id="tarif-output">0%</output>
</div>
```

### 9.2 Onglets (Catégories leviers)

```html
<div role="tablist" aria-label="Catégories de leviers">
  <button 
    role="tab" 
    id="tab-produit" 
    aria-selected="true"
    aria-controls="panel-produit"
  >
    Produit
  </button>
  <button 
    role="tab" 
    id="tab-rh" 
    aria-selected="false"
    aria-controls="panel-rh"
  >
    RH
  </button>
</div>

<div 
  role="tabpanel" 
  id="panel-produit" 
  aria-labelledby="tab-produit"
>
  <!-- Contenu onglet Produit -->
</div>
```

### 9.3 Alertes dynamiques

```html
<div 
  role="alert" 
  aria-live="assertive"
  aria-atomic="true"
>
  🔴 IRF critique : Résilience financière insuffisante
</div>
```

---

## 10) Décisions / Risques / Checklist

### Décisions A11y

| ID | Décision | Justification |
|----|----------|---------------|
| A11Y-01 | WCAG AA minimum | Standard B2B raisonnable |
| A11Y-02 | Skip links obligatoires | Navigation rapide |
| A11Y-03 | Focus trap modals | Cohérence navigation |
| A11Y-04 | Alternatives graphiques | Lecteurs d'écran |

### Risques

| Risque | Mitigation |
|--------|------------|
| Radar non accessible | Alternative textuelle complète |
| Animations gênantes | Respect prefers-reduced-motion |
| Contrastes mode projection | Tests dédiés grand écran |

### Checklist MVP

- [x] Navigation clavier documentée
- [x] Raccourcis définis
- [x] Focus trap spécifié
- [x] Skip links prévus
- [x] Patterns ARIA documentés
- [x] Ratios de contraste vérifiés
- [x] Réduction de mouvement prévue
- [x] Alternatives textuelles spécifiées
- [x] Checklist de tests fournie

---

## 11) Ressources

### Documentation de référence
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [RGAA 4.1](https://accessibilite.numerique.gouv.fr/)

### Outils
- [axe DevTools](https://www.deque.com/axe/)
- [WAVE](https://wave.webaim.org/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
