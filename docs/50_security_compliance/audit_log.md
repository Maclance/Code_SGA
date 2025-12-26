# audit_log.md — Journal d'Audit

**Version** : 1.0  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-25  
**Rôle rédacteur** : Sécurité / Multi-tenant

---

## 1) Objectifs du Journal d'Audit

### 1.1 Finalités

| Finalité | Description |
|----------|-------------|
| **Traçabilité** | Reconstituer qui a fait quoi, quand |
| **Conformité** | Répondre aux exigences réglementaires (formation pro, RGPD) |
| **Sécurité** | Détecter et investiguer les incidents |
| **Support** | Diagnostiquer les problèmes utilisateurs |

### 1.2 Principes

| Principe | Description |
|----------|-------------|
| **Exhaustivité** | Toutes les actions sensibles sont loguées |
| **Immuabilité** | Les logs ne peuvent pas être modifiés/supprimés par les utilisateurs |
| **Horodatage fiable** | Timestamp serveur UTC |
| **Isolation tenant** | Chaque tenant ne voit que ses propres logs |

---

## 2) Événements à Journaliser

### 2.1 Catégories d'Événements

| Catégorie | Code | Description |
|-----------|------|-------------|
| **AUTH** | `auth.*` | Authentification et sessions |
| **USER** | `user.*` | Gestion des utilisateurs |
| **TENANT** | `tenant.*` | Gestion des tenants |
| **SESSION** | `session.*` | Gestion des sessions de jeu |
| **GAME** | `game.*` | Actions de jeu |
| **EXPORT** | `export.*` | Exports de données |
| **SECURITY** | `security.*` | Événements de sécurité |
| **ADMIN** | `admin.*` | Actions administratives |

### 2.2 Événements Détaillés (MVP)

#### Authentification (AUTH)

| Événement | Description | Données loguées |
|-----------|-------------|-----------------|
| `auth.login_success` | Connexion réussie | user_id, method, ip |
| `auth.login_failure` | Échec de connexion | email, reason, ip |
| `auth.logout` | Déconnexion | user_id |
| `auth.token_refresh` | Renouvellement token | user_id |
| `auth.password_reset_request` | Demande reset mot de passe | email |
| `auth.password_reset_complete` | Reset effectué | user_id |
| `auth.mfa_enabled` | MFA activé [V1+] | user_id |

#### Utilisateurs (USER)

| Événement | Description | Données loguées |
|-----------|-------------|-----------------|
| `user.created` | Utilisateur créé | user_id, role, by |
| `user.updated` | Utilisateur modifié | user_id, changes, by |
| `user.deleted` | Utilisateur supprimé | user_id, by |
| `user.role_changed` | Rôle modifié | user_id, old_role, new_role, by |
| `user.invited` | Invitation envoyée | email, role, by |

#### Sessions de Jeu (SESSION)

| Événement | Description | Données loguées |
|-----------|-------------|-----------------|
| `session.created` | Session créée | session_id, config, by |
| `session.configured` | Session paramétrée | session_id, changes, by |
| `session.launched` | Session démarrée | session_id, by |
| `session.finished` | Session terminée | session_id, reason |
| `session.deleted` | Session supprimée | session_id, by |
| `session.participant_joined` | Participant rejoint | session_id, user_id |
| `session.participant_left` | Participant quitté | session_id, user_id |

#### Jeu (GAME)

| Événement | Description | Données loguées |
|-----------|-------------|-----------------|
| `game.company_selected` | Compagnie choisie | session_id, user_id, company_id |
| `game.decision_submitted` | Décision soumise | session_id, user_id, turn, decision_hash |
| `game.turn_resolved` | Tour résolu | session_id, turn |

> **Note** : Les décisions détaillées ne sont PAS loguées dans l'audit (données volumineuses). Seul un hash est conservé pour traçabilité.

#### Exports (EXPORT)

| Événement | Description | Données loguées |
|-----------|-------------|-----------------|
| `export.requested` | Export demandé | export_type, filters, by |
| `export.generated` | Export généré | export_id, format, size |
| `export.downloaded` | Export téléchargé | export_id, by |

#### Sécurité (SECURITY)

| Événement | Description | Données loguées |
|-----------|-------------|-----------------|
| `security.access_denied` | Accès refusé | user_id, action, resource |
| `security.cross_tenant_attempt` | Tentative cross-tenant | user_id, target_tenant_id |
| `security.rate_limit_exceeded` | Rate limit dépassé | user_id, endpoint |
| `security.suspicious_activity` | Activité suspecte | user_id, type, details |

---

## 3) Format des Entrées

### 3.1 Structure d'une Entrée de Log

```json
{
  "id": "uuid",
  "timestamp": "2025-12-25T22:58:00.000Z",
  "event_type": "session.created",
  "category": "SESSION",
  "actor": {
    "user_id": "uuid",
    "role": "formateur",
    "ip": "192.168.1.1",
    "user_agent": "Mozilla/5.0..."
  },
  "tenant_id": "uuid",
  "resource": {
    "type": "session",
    "id": "uuid"
  },
  "data": {
    "config": { "difficulty": "intermediate", "speed": "medium" }
  },
  "result": "success | failure",
  "error_code": null
}
```

### 3.2 Schéma Base de Données

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  
  -- Actor
  actor_user_id UUID REFERENCES users(id),
  actor_role VARCHAR(50),
  actor_ip INET,
  actor_user_agent TEXT,
  
  -- Tenant (pour isolation)
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Resource
  resource_type VARCHAR(50),
  resource_id UUID,
  
  -- Details
  data JSONB DEFAULT '{}',
  result VARCHAR(20) NOT NULL DEFAULT 'success',
  error_code VARCHAR(50),
  
  -- Index pour recherche
  CONSTRAINT check_result CHECK (result IN ('success', 'failure'))
);

-- Index pour performance
CREATE INDEX idx_audit_tenant_timestamp ON audit_logs(tenant_id, timestamp DESC);
CREATE INDEX idx_audit_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_actor ON audit_logs(actor_user_id);

-- RLS pour isolation
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_audit_isolation ON audit_logs
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

## 4) Rétention et Archivage

### 4.1 Politique de Rétention

| Type de données | Durée | Justification |
|-----------------|-------|---------------|
| Logs AUTH (connexion) | 12 mois | Sécurité |
| Logs SESSION/GAME | 36 mois | Traçabilité formation |
| Logs SECURITY | 60 mois | Conformité |
| Logs EXPORT | 24 mois | RGPD |

### 4.2 Archivage

| Phase | Durée | Stockage |
|-------|-------|----------|
| **Online** | 0-6 mois | PostgreSQL (requêtable) |
| **Nearline** | 6-24 mois | Cold storage compressé |
| **Archive** | 24+ mois | Backup chiffré, accès exceptionnel |

### 4.3 Suppression

> [!CAUTION]
> Les logs NE DOIVENT PAS être supprimés avant la fin de la période de rétention, sauf obligation légale (droit à l'effacement RGPD pour les données personnelles).

Processus de purge :
1. Job planifié mensuel
2. Sélection des logs > période de rétention
3. Anonymisation des données personnelles (ou suppression si applicable)
4. Archivage compressé avant suppression

---

## 5) Accès et Consultation

### 5.1 Qui Peut Voir Quoi

| Rôle | Accès aux logs |
|------|---------------|
| **Super Admin** | Tous les logs (table séparée `super_admin_audit_logs`) |
| **Admin Tenant** | Tous les logs de son tenant |
| **Formateur** | Logs de ses sessions uniquement |
| **Joueur** | Aucun accès direct (via debrief personnel) |

### 5.2 Interface de Consultation

| Fonctionnalité | MVP | V1+ |
|----------------|:---:|:---:|
| Liste paginée | ✓ | ✓ |
| Filtres (date, événement, utilisateur) | ✓ | ✓ |
| Recherche texte | ✗ | ✓ |
| Export CSV | ✓ | ✓ |
| Alertes automatiques | ✗ | ✓ |
| Dashboard analytics | ✗ | ✓ |

---

## 6) Intégrité et Non-Répudiation

### 6.1 Garanties d'Intégrité

| Mécanisme | Description |
|-----------|-------------|
| **Append-only** | Les logs ne sont jamais modifiés, uniquement ajoutés |
| **Checksums** | Hash des entrées pour détecter corruption |
| **Timestamp serveur** | Horodatage côté serveur, pas client |
| **Pas de suppression utilisateur** | Aucun endpoint de suppression exposé |

### 6.2 Non-Répudiation

| Élément | Garantie |
|---------|----------|
| `actor_user_id` | Identité vérifiée via JWT |
| `actor_ip` | IP source de la requête |
| `timestamp` | Horodatage UTC du serveur |
| `data` | Snapshot des données au moment de l'action |

---

## 7) Décisions / Risques / Checklist

### 7.1 Décisions

| ID | Décision | Justification |
|----|----------|---------------|
| AL-01 | Logs en BDD relationnelle | Requêtabilité, simplicité MVP |
| AL-02 | Hash des décisions (pas contenu) | Performance, confidentialité |
| AL-03 | Rétention 36 mois par défaut | Équilibre traçabilité/stockage |
| AL-04 | Super Admin logs séparés | Isolation renforcée |

### 7.2 Risques

| ID | Risque | Mitigation |
|----|--------|------------|
| R-AL-01 | Volume de logs excessif | Archivage, retention policy |
| R-AL-02 | Performance requêtes | Index, partitioning par date |
| R-AL-03 | Données sensibles dans logs | Revue des champs loggés, pas de secrets |

### 7.3 Checklist MVP

- [ ] Table `audit_logs` créée avec RLS
- [ ] Service de logging centralisé
- [ ] Événements AUTH, SESSION, SECURITY implémentés
- [ ] Interface consultation Admin Tenant
- [ ] Export CSV des logs
- [ ] Job de purge/archivage planifié

---

## 8) Impacts Dev

> [!IMPORTANT]
> **Où appliquer ces règles dans le code**

### 8.1 Architecture Logging

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Code                        │
│                 (Controllers, Services)                      │
├─────────────────────────────────────────────────────────────┤
│                    Audit Service                             │
│              (Interface centralisée)                         │
├─────────────────────────────────────────────────────────────┤
│                    Audit Logger                              │
│         (Formatage, validation, écriture)                    │
├─────────────────────────────────────────────────────────────┤
│                    PostgreSQL                                │
│              (audit_logs + RLS)                              │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Points d'Implémentation

| Composant | Fichier(s) suggéré(s) | Responsabilité |
|-----------|----------------------|----------------|
| Audit Service | `services/audit.service.ts` | Interface centralisée |
| Event Types | `types/audit-events.ts` | Enum des événements |
| Auth Hooks | `hooks/auth.hooks.ts` | Logging auth automatique |
| Middleware | `middleware/audit.middleware.ts` | Logging requêtes |
| Admin UI | `pages/admin/audit-logs.tsx` | Interface consultation |

### 8.3 Pattern d'Implémentation

```typescript
// services/audit.service.ts
class AuditService {
  async log(event: AuditEvent): Promise<void> {
    const entry = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      event_type: event.type,
      category: this.getCategory(event.type),
      actor_user_id: event.actor.userId,
      actor_role: event.actor.role,
      actor_ip: event.actor.ip,
      tenant_id: event.tenantId,
      resource_type: event.resource?.type,
      resource_id: event.resource?.id,
      data: event.data,
      result: event.result || 'success',
    };
    
    await db.audit_logs.insert(entry);
  }
  
  // Helpers typés pour chaque catégorie
  async logAuth(type: AuthEventType, actor: Actor, data?: object) {
    await this.log({ type: `auth.${type}`, actor, data });
  }
  
  async logSession(type: SessionEventType, actor: Actor, sessionId: string, data?: object) {
    await this.log({ 
      type: `session.${type}`, 
      actor, 
      resource: { type: 'session', id: sessionId },
      data 
    });
  }
}
```

### 8.4 Intégration dans le Code Métier

```typescript
// Exemple : Création de session
async createSession(config: SessionConfig, user: User): Promise<Session> {
  const session = await this.sessionRepo.create(config, user.tenantId);
  
  // Audit log
  await this.auditService.logSession('created', {
    userId: user.id,
    role: user.role,
    ip: user.currentIp,
    tenantId: user.tenantId,
  }, session.id, { config });
  
  return session;
}
```

### 8.5 Événements à Instrumenter par Module

| Module | Événements |
|--------|------------|
| Auth | `login_success`, `login_failure`, `logout`, `password_reset_*` |
| Users | `created`, `updated`, `deleted`, `role_changed` |
| Sessions | `created`, `launched`, `finished`, `participant_*` |
| Security | `access_denied` (via RBAC middleware) |

---

*Document rédigé selon PRD §13. Référence : [glossary.md](../00_product/glossary.md) §2 (Journal d'audit).*
