# KPI Definitions — AssurManager

> **Source of Truth** pour les métriques et KPIs.
> Dernière mise à jour : 2025-12-26

---

## 1) Catégories de KPIs

| Catégorie | Usage | Audience |
|-----------|-------|----------|
| **Produit** | Santé du produit, engagement | Product, Engineering |
| **Pédagogique** | Efficacité formation | Trainers, Admin Tenant |
| **Business** | Valeur commerciale | Sales, Direction |
| **Technique** | Performance, fiabilité | Engineering |

---

## 2) KPIs Produit

### 2.1 Engagement

#### Sessions Started

| Élément | Valeur |
|---------|--------|
| **Formule** | `COUNT(session.started)` |
| **Fenêtre** | Jour / Semaine / Mois |
| **Segmentation** | Par tenant, difficulté, produits |
| **Source** | `analytics_events` |

#### Completion Rate

| Élément | Valeur |
|---------|--------|
| **Formule** | `COUNT(session.ended) / COUNT(session.started) × 100` |
| **Fenêtre** | Par cohorte de sessions |
| **Cible MVP** | ≥ 70% |
| **Alerte** | < 50% |

#### Average Session Duration

| Élément | Valeur |
|---------|--------|
| **Formule** | `AVG(session.ended.timestamp - session.started.timestamp)` |
| **Unité** | Minutes |
| **Segmentation** | Par difficulté, vitesse |

#### Time per Turn

| Élément | Valeur |
|---------|--------|
| **Formule** | `AVG(game.decision.submitted.time_to_decide_seconds)` |
| **Unité** | Secondes |
| **Cible** | 2-5 min selon difficulté |

---

### 2.2 Rétention

#### Sessions per User (30d)

| Élément | Valeur |
|---------|--------|
| **Formule** | `COUNT(session.started WHERE user_id = X) / COUNT(DISTINCT user_id)` |
| **Fenêtre** | 30 jours glissants |
| **Cible MVP** | ≥ 2 sessions/utilisateur |

#### Return Rate (7d)

| Élément | Valeur |
|---------|--------|
| **Formule** | `COUNT(users avec session J+1 à J+7) / COUNT(users avec session J) × 100` |
| **Fenêtre** | 7 jours après première session |
| **Cible** | ≥ 30% |

---

### 2.3 Feature Adoption

#### Debrief View Rate

| Élément | Valeur |
|---------|--------|
| **Formule** | `COUNT(game.debrief.opened) / COUNT(session.ended) × 100` |
| **Cible** | ≥ 80% |
| **Importance** | Critique pour valeur pédagogique |

#### PDF Export Rate

| Élément | Valeur |
|---------|--------|
| **Formule** | `COUNT(game.export.pdf.downloaded) / COUNT(session.ended) × 100` |
| **Cible** | ≥ 40% |

#### Market View Usage

| Élément | Valeur |
|---------|--------|
| **Formule** | `COUNT(game.market.viewed) / COUNT(game.turn.started) × 100` |
| **Insight** | Utilisation de la vue concurrentielle |

---

## 3) KPIs Pédagogiques

### 3.1 Progression

#### Average Final Score

| Élément | Valeur |
|---------|--------|
| **Formule** | `AVG(scoreboards.final_score)` |
| **Segmentation** | Par difficulté, tenant, cohorte |
| **Fenêtre** | Par semaine/mois |

#### Score Improvement Rate

| Élément | Valeur |
|---------|--------|
| **Formule** | `(Score Session N - Score Session N-1) / Score Session N-1 × 100` |
| **Condition** | Même utilisateur, même difficulté |
| **Cible** | Amélioration moyenne ≥ 10% |

#### Indices Balance Score

| Élément | Valeur |
|---------|--------|
| **Formule** | `StdDev(indices finaux) inversé normalisé` |
| **Objectif** | Mesurer l'équilibre vs sur-optimisation |
| **Interprétation** | Score élevé = indices équilibrés |

---

### 3.2 Biais détectés

#### Short-termism Rate

| Élément | Valeur |
|---------|--------|
| **Formule** | `COUNT(sessions avec biais "short_termism") / COUNT(sessions) × 100` |
| **Définition biais** | Sous-investissement IT/Data (IMD < 40 en fin) malgré budget |

#### Over-optimization Rate

| Élément | Valeur |
|---------|--------|
| **Formule** | `COUNT(sessions avec 1 indice > 90 ET 1 indice < 40)` |
| **Insight** | Joueurs qui sur-optimisent un axe |

---

### 3.3 Badges (Indicateurs de compétence)

| Badge | Critère |
|-------|---------|
| `resilient` | IRF ≥ 80 à au moins 80% des tours |
| `growth_master` | IAC ≥ 75 ET portefeuille +20% |
| `data_pioneer` | IMD ≥ 70 en fin de partie |
| `balanced` | Tous indices ≥ 50 à la fin |
| `survivor` | Mode survie complété |
| `champion` | Top 3 en session multijoueur |

---

## 4) KPIs Business

### 4.1 Adoption

#### Active Tenants (MAU)

| Élément | Valeur |
|---------|--------|
| **Formule** | `COUNT(DISTINCT tenant_id WHERE session.started dans les 30j)` |
| **Fenêtre** | Mensuel |

#### Active Users (MAU)

| Élément | Valeur |
|---------|--------|
| **Formule** | `COUNT(DISTINCT user_id WHERE session.started dans les 30j)` |
| **Segmentation** | Par tenant, rôle |

#### Sessions per Tenant (30d)

| Élément | Valeur |
|---------|--------|
| **Formule** | `COUNT(session.started) grouped by tenant_id` |
| **Fenêtre** | 30 jours glissants |
| **Usage** | Identifier tenants à risque churn |

---

### 4.2 Valeur

#### NPS (Net Promoter Score)

| Élément | Valeur |
|---------|--------|
| **Formule** | `(% Promoteurs - % Détracteurs)` |
| **Collection** | Survey post-session (optionnel) |
| **Fenêtre** | Trimestriel |

#### Feature Usage Index

| Élément | Valeur |
|---------|--------|
| **Formule** | Score composite : débrief + export + market + levers avancés |
| **Objectif** | Mesurer profondeur d'utilisation |

---

## 5) KPIs Techniques

### 5.1 Performance

#### Engine Calculation Time (P95)

| Élément | Valeur |
|---------|--------|
| **Formule** | `PERCENTILE(95, system.engine.calculation.calculation_time_ms)` |
| **Cible** | < 500ms |
| **Alerte** | > 1000ms |

#### API Latency (P95)

| Élément | Valeur |
|---------|--------|
| **Formule** | `PERCENTILE(95, request_duration_ms)` |
| **Cible** | < 300ms |
| **Alerte** | > 1000ms |

#### Error Rate

| Élément | Valeur |
|---------|--------|
| **Formule** | `COUNT(system.error) / COUNT(requests) × 100` |
| **Cible** | < 0.1% |
| **Alerte** | > 1% |

---

### 5.2 Fiabilité

#### Uptime

| Élément | Valeur |
|---------|--------|
| **Formule** | `(Total time - Downtime) / Total time × 100` |
| **Cible** | ≥ 99.5% |
| **Fenêtre** | Mensuel |

#### Session Crash Rate

| Élément | Valeur |
|---------|--------|
| **Formule** | `COUNT(session.abandoned WHERE reason = 'error') / COUNT(session.started) × 100` |
| **Cible** | < 0.5% |

---

## 6) Dashboards recommandés

### 6.1 Dashboard Admin Tenant

| Widget | KPIs |
|--------|------|
| Sessions ce mois | Sessions Started, Completion Rate |
| Utilisateurs actifs | Active Users (MAU) |
| Progression moyenne | Average Final Score, Score Improvement |
| Top performers | Classement, Badges |

### 6.2 Dashboard Formateur

| Widget | KPIs |
|--------|------|
| Mes sessions | Liste avec statut, participants |
| Engagement | Completion Rate, Time per Turn |
| Pédagogie | Debrief View Rate, Biais détectés |
| Exports | PDF Export Rate |

### 6.3 Dashboard Super Admin

| Widget | KPIs |
|--------|------|
| Santé globale | Active Tenants, Active Users |
| Performance | Engine Calculation Time, Error Rate |
| Adoption | Sessions per Tenant distribution |
| Alertes | Tenants inactifs, Erreurs critiques |

---

## 7) Alertes automatiques

| Alerte | Condition | Action |
|--------|-----------|--------|
| `low_completion` | Completion Rate < 50% (tenant) | Notification Admin Tenant |
| `performance_degraded` | P95 > 1000ms | Notification Engineering |
| `high_error_rate` | Error Rate > 1% | Incident Engineering |
| `inactive_tenant` | 0 sessions depuis 30j | Notification CS/Sales |

---

## 8) Formules SQL

### Completion Rate

```sql
SELECT 
  DATE_TRUNC('week', s.created_at) as week,
  COUNT(CASE WHEN s.status = 'ended' THEN 1 END)::FLOAT / 
  COUNT(*)::FLOAT * 100 as completion_rate
FROM game_sessions s
WHERE s.created_at > NOW() - INTERVAL '90 days'
GROUP BY 1
ORDER BY 1;
```

### Average Time per Turn

```sql
SELECT 
  p.session_id,
  AVG(
    EXTRACT(EPOCH FROM (td.created_at - t.started_at))
  ) as avg_decision_time_seconds
FROM turns t
JOIN turn_decisions td ON td.turn_id = t.id
GROUP BY p.session_id;
```

### Score Improvement

```sql
WITH ranked_sessions AS (
  SELECT 
    p.user_id,
    sb.final_score,
    ROW_NUMBER() OVER (PARTITION BY p.user_id ORDER BY s.ended_at) as session_num
  FROM scoreboards sb
  JOIN participants p ON p.id = sb.participant_id
  JOIN game_sessions s ON s.id = sb.session_id
)
SELECT 
  r1.user_id,
  (r2.final_score - r1.final_score) / r1.final_score * 100 as improvement_pct
FROM ranked_sessions r1
JOIN ranked_sessions r2 
  ON r1.user_id = r2.user_id 
  AND r2.session_num = r1.session_num + 1
WHERE r1.session_num = 1;
```

---

## 9) Décisions actées

| ID | Décision | Date |
|----|----------|------|
| KPI-001 | Fenêtre standard = 30 jours glissants | 2025-12 |
| KPI-002 | Cible Completion Rate ≥ 70% | 2025-12 |
| KPI-003 | P95 pour métriques performance | 2025-12 |
| KPI-004 | Alertes automatiques dès MVP | 2025-12 |

---

## 10) Checklist MVP

- [ ] KPIs produit de base trackés
- [ ] Dashboard admin tenant fonctionnel
- [ ] Alertes inactive_tenant actives
- [ ] Métriques performance loggées
- [ ] Export des KPIs (CSV minimum)
