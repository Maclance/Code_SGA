# Instrumentation Plan — AssurManager

> **Source of Truth** pour le tracking analytics.
> Dernière mise à jour : 2025-12-26

---

## 1) Philosophie

> **Tracker pour améliorer, pas pour surveiller.**

Les événements servent à :
1. Mesurer l'engagement produit
2. Améliorer l'expérience pédagogique
3. Debugger les problèmes
4. Monitorer la santé technique

---

## 2) Conventions

### Naming

```
<domain>.<object>.<action>
```

| Element | Convention | Exemple |
|---------|------------|---------|
| Domain | `auth`, `session`, `game`, `admin`, `system` | `session.started` |
| Object | Entité concernée | `decision`, `event`, `turn` |
| Action | Verbe passé | `started`, `submitted`, `viewed` |

### Propriétés obligatoires

Chaque événement inclut automatiquement :

```json
{
  "event_id": "evt_abc123",
  "timestamp": "2025-12-26T12:00:00Z",
  "tenant_id": "uuid",
  "user_id": "uuid | null",
  "session_id": "uuid | null",
  "engine_version": "1.2.0"
}
```

---

## 3) Catalogue d'événements

### 3.1 Authentification

| Event | Trigger | Propriétés |
|-------|---------|------------|
| `auth.login.succeeded` | Login réussi | `provider`, `method` |
| `auth.login.failed` | Login échoué | `provider`, `reason` |
| `auth.logout` | Déconnexion | `duration_seconds` |
| `auth.token.refreshed` | Token rafraîchi | - |
| `auth.password.reset` | Reset password | `initiated_by` |

---

### 3.2 Sessions

| Event | Trigger | Propriétés |
|-------|---------|------------|
| `session.created` | Création session | `difficulty`, `speed`, `products[]`, `duration_turns` |
| `session.updated` | Modif paramètres | `changes{}` |
| `session.started` | Lancement | `participants_count`, `companies_selected[]` |
| `session.paused` | Pause (facilitateur) | `by_user_id` |
| `session.resumed` | Reprise | `pause_duration_seconds` |
| `session.ended` | Fin normale | `final_turn`, `completion_rate` |
| `session.abandoned` | Abandon | `last_turn`, `reason` |

---

### 3.3 Participation

| Event | Trigger | Propriétés |
|-------|---------|------------|
| `session.joined` | Joueur rejoint | `role`, `invite_code_used` |
| `session.left` | Joueur quitte | `turn_at_exit` |
| `participant.company.selected` | Choix compagnie | `company_id`, `selection_duration_seconds` |
| `participant.company.locked` | Verrouillage | `company_id` |

---

### 3.4 Gameplay (In-Session)

| Event | Trigger | Propriétés |
|-------|---------|------------|
| `game.turn.started` | Début de tour | `turn_number`, `indices_snapshot{}` |
| `game.cockpit.viewed` | Ouverture cockpit | `time_on_page_seconds`, `sections_viewed[]` |
| `game.events.viewed` | Lecture événements | `events_count`, `read_duration_seconds` |
| `game.levers.viewed` | Ouverture décisions | `available_levers_count` |
| `game.decision.submitted` | Soumission décisions | `turn_number`, `decisions_count`, `budget_used`, `time_to_decide_seconds` |
| `game.turn.resolved` | Résolution moteur | `turn_number`, `indices_delta{}`, `events_triggered[]` |
| `game.market.viewed` | Vue marché | `time_on_page_seconds` |
| `game.alert.displayed` | Affichage alerte | `alert_type`, `alert_code` |
| `game.alert.dismissed` | Fermeture alerte | `alert_code`, `action_taken` |

---

### 3.5 Débrief & Scores

| Event | Trigger | Propriétés |
|-------|---------|------------|
| `game.debrief.opened` | Ouverture débrief | `final_score`, `rank`, `badges[]` |
| `game.debrief.section.viewed` | Section consultée | `section_id`, `duration_seconds` |
| `game.export.pdf.requested` | Demande export PDF | - |
| `game.export.pdf.downloaded` | Téléchargement PDF | `file_size_bytes` |
| `game.scoreboard.viewed` | Vue classement | `own_rank` |

---

### 3.6 Administration

| Event | Trigger | Propriétés |
|-------|---------|------------|
| `admin.user.invited` | Invitation | `invitee_email`, `role` |
| `admin.user.role.changed` | Changement rôle | `user_id`, `old_role`, `new_role` |
| `admin.user.suspended` | Suspension | `user_id`, `reason` |
| `admin.session.deleted` | Suppression session | `session_id` |
| `admin.audit.viewed` | Consultation audit | `filters{}` |
| `admin.kpi.viewed` | Consultation KPIs | `date_range`, `metrics[]` |

---

### 3.7 Système

| Event | Trigger | Propriétés |
|-------|---------|------------|
| `system.error` | Erreur applicative | `error_code`, `error_message`, `stack_trace`, `context{}` |
| `system.performance.slow` | Requête lente (>3s) | `endpoint`, `duration_ms`, `user_id` |
| `system.engine.calculation` | Calcul moteur | `session_id`, `turn_number`, `calculation_time_ms` |

---

## 4) Propriétés détaillées

### 4.1 game.decision.submitted

```json
{
  "event": "game.decision.submitted",
  "properties": {
    "turn_number": 5,
    "decisions_count": 8,
    "decisions": [
      { "lever_id": "L-PROD-01", "product_id": "auto", "value": 5 },
      { "lever_id": "L-RH-01", "product_id": null, "value": { "sinistres": 10 } }
    ],
    "budget_used": 350000,
    "budget_total": 500000,
    "time_to_decide_seconds": 185,
    "changes_from_previous": 3
  }
}
```

### 4.2 game.turn.resolved

```json
{
  "event": "game.turn.resolved",
  "properties": {
    "turn_number": 5,
    "indices_before": { "iac": 70, "ipqo": 65, "irf": 80 },
    "indices_after": { "iac": 72, "ipqo": 63, "irf": 82 },
    "indices_delta": { "iac": 2, "ipqo": -2, "irf": 2 },
    "events_triggered": ["EVT-CLIMAT-01"],
    "alerts_generated": ["RH_OVERLOAD"],
    "calculation_time_ms": 45
  }
}
```

### 4.3 session.ended

```json
{
  "event": "session.ended",
  "properties": {
    "final_turn": 12,
    "duration_minutes": 180,
    "participants_count": 15,
    "participants_completed": 14,
    "completion_rate": 0.93,
    "avg_score": 680,
    "winner_company": "axa"
  }
}
```

---

## 5) Entonnoirs (Funnels)

### 5.1 Onboarding Session

```
session.created
    ↓
participant.company.selected (×N)
    ↓
session.started
    ↓
game.turn.started (turn 1)
    ↓
game.decision.submitted (turn 1)
```

**KPI** : Taux conversion création → premier tour soumis

### 5.2 Complétion Partie

```
session.started
    ↓
game.decision.submitted (par tour)
    ↓
session.ended
    ↓
game.debrief.opened
    ↓
game.export.pdf.downloaded
```

**KPI** : Taux complétion, taux débrief consulté

---

## 6) Cohortes recommandées

| Cohorte | Définition |
|---------|------------|
| `new_users` | Première session < 7 jours |
| `power_users` | > 5 sessions complétées |
| `trainers` | Rôle formateur |
| `dropouts` | Session abandonnée sans complétion |
| `by_difficulty` | Segmentation Novice/Intermédiaire/Expert |
| `by_tenant` | Par organisation |

---

## 7) Implémentation

### 7.1 Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Client (React)  │────▶│   API Server     │────▶│   Analytics DB   │
│                  │     │                  │     │   (+ Supabase)   │
│  - UI events     │     │  - Enrich        │     └──────────────────┘
│  - Timing        │     │  - Validate      │              │
└──────────────────┘     │  - Store         │              ▼
                         └──────────────────┘     ┌──────────────────┐
                                                  │  Dashboard BI    │
                                                  │   (Metabase)     │
                                                  └──────────────────┘
```

### 7.2 SDK Client

```typescript
// Utilisation côté React
import { track } from '@/lib/analytics';

track('game.decision.submitted', {
  turn_number: currentTurn,
  decisions_count: decisions.length,
  budget_used: budgetAllocated,
  time_to_decide_seconds: Math.floor((Date.now() - turnStartTime) / 1000)
});
```

### 7.3 Stockage

| Option | MVP | V1+ |
|--------|-----|-----|
| Table `analytics_events` (Supabase) | ✅ | ✅ |
| Export vers data warehouse | ❌ | ✅ |
| Real-time streaming | ❌ | ✅ |

---

## 8) Privacy & RGPD

| Règle | Implémentation |
|-------|----------------|
| Minimisation | Ne tracker que le nécessaire |
| Pseudonymisation | user_id UUID, pas d'email dans events |
| Rétention | 24 mois max, puis agrégation |
| Droit d'accès | Export user_id → tous ses events |
| Droit suppression | Suppression/anonymisation possible |

---

## 9) Décisions actées

| ID | Décision | Date |
|----|----------|------|
| INST-001 | Naming domain.object.action | 2025-12 |
| INST-002 | Stockage Supabase MVP | 2025-12 |
| INST-003 | Pas de tracking PII | 2025-12 |
| INST-004 | Rétention 24 mois | 2025-12 |

---

## 10) Checklist MVP

- [ ] Table `analytics_events` créée
- [ ] SDK client implémenté
- [ ] Events auth.* trackés
- [ ] Events session.* trackés
- [ ] Events game.decision.submitted tracké
- [ ] Events game.debrief.opened tracké
- [ ] Dashboard admin basique (compteurs)
