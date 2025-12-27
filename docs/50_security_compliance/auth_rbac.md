# auth_rbac.md — Authentification et Contrôle d'Accès

**Version** : 1.0  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-25  
**Rôle rédacteur** : Sécurité / Multi-tenant

---

## 1) Principes Fondamentaux

### 1.1 Deny-by-Default (Politique Restrictive)

> [!IMPORTANT]
> **Toute action non explicitement autorisée est REFUSÉE.**

| Principe | Description |
|----------|-------------|
| **Refus par défaut** | Un utilisateur sans rôle ou permission explicite ne peut rien faire |
| **Moindre privilège** | Chaque rôle n'a que les permissions nécessaires à sa fonction |
| **Vérification systématique** | Chaque requête API vérifie `(role, action, resource, tenant_id)` |
| **Fail-secure** | En cas d'erreur d'évaluation, l'accès est refusé |

### 1.2 Hiérarchie des Rôles

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPER ADMIN (éditeur)                    │
│                      Scope : plateforme globale                 │
├─────────────────────────────────────────────────────────────────┤
│                         ADMIN TENANT                             │
│                       Scope : 1 tenant                          │
├───────────────────────────┬─────────────────────────────────────┤
│       FORMATEUR           │           CHEF D'ÉQUIPE [V1+]       │
│    Scope : ses sessions   │         Scope : son équipe          │
├───────────────────────────┼─────────────────────────────────────┤
│         JOUEUR            │           OBSERVATEUR [V1+]         │
│  Scope : sa participation │        Scope : lecture seule        │
└───────────────────────────┴─────────────────────────────────────┘
```

> **Pas d'héritage automatique** : un Admin Tenant n'hérite PAS des permissions Formateur. Les rôles sont **cumulables** si nécessaire.

---

## 2) Authentification

### 2.1 Mécanismes Supportés (MVP)

| Mécanisme | Usage | Priorité |
|-----------|-------|----------|
| **Email + Mot de passe** | Inscription/connexion standard | MVP |
| **OAuth2 / OIDC** | SSO entreprise (Google, Azure AD) | MVP recommandé |
| **Magic Link** | Connexion sans mot de passe | V1+ |
| **MFA (TOTP)** | Double authentification | V1+ |

### 2.2 Gestion des Sessions

| Paramètre | Valeur recommandée |
|-----------|-------------------|
| Durée session | 24h (configurable par tenant) |
| Refresh token | 7 jours max |
| Invalidation | Logout explicite, changement mot de passe, révocation admin |
| Stockage token | HttpOnly cookie (web), secure storage (mobile) |

### 2.3 Tokens JWT

Structure minimale du payload :

```json
{
  "sub": "user_uuid",
  "tenant_id": "tenant_uuid",
  "roles": ["player"],
  "session_id": "session_uuid | null",
  "iat": 1703545200,
  "exp": 1703631600
}
```

---

## 3) Matrice Rôles × Actions

> [!NOTE]
> ✓ = Autorisé | ✗ = Refusé | ○ = Conditionnel (voir notes)

### 3.1 Actions Plateforme (Super Admin uniquement)

| Action | Super Admin | Admin Tenant | Formateur | Joueur | Observateur | Chef d'équipe |
|--------|:-----------:|:------------:|:---------:|:------:|:-----------:|:-------------:|
| Créer tenant | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Supprimer tenant | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Gérer engine_version | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Voir logs globaux | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Configurer catalogue événements | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Voir métriques plateforme | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

### 3.2 Actions Tenant

| Action | Super Admin | Admin Tenant | Formateur | Joueur | Observateur | Chef d'équipe |
|--------|:-----------:|:------------:|:---------:|:------:|:-----------:|:-------------:|
| Inviter utilisateur tenant | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Supprimer utilisateur tenant | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Modifier rôle utilisateur | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Voir journal audit tenant | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Voir KPIs agrégés tenant | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Configurer paramètres tenant | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Exporter données tenant | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

### 3.3 Actions Session

| Action | Super Admin | Admin Tenant | Formateur | Joueur | Observateur | Chef d'équipe |
|--------|:-----------:|:------------:|:---------:|:------:|:-----------:|:-------------:|
| Créer session | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Paramétrer session | ✗ | ✓ | ○¹ | ✗ | ✗ | ✗ |
| Supprimer session | ✗ | ✓ | ○¹ | ✗ | ✗ | ✗ |
| Lancer session | ✗ | ✓ | ○¹ | ✗ | ✗ | ✗ |
| Inviter participants | ✗ | ✓ | ○¹ | ✗ | ✗ | ✗ |
| Rejoindre session (joueur) | ✗ | ✗ | ✗ | ○² | ✗ | ✗ |
| Rejoindre session (observateur) | ✗ | ○ | ○¹ | ✗ | ○² | ✗ |
| Voir résultats session | ✓ | ✓ | ○¹ | ○³ | ○² | ○⁴ |
| Exporter PDF session | ✗ | ✓ | ○¹ | ○³ | ✗ | ○⁴ |

**Notes :**
1. ○¹ : Uniquement ses propres sessions
2. ○² : Uniquement si invité à la session
3. ○³ : Uniquement son propre debrief/résultat
4. ○⁴ : Uniquement son équipe [V1+]

### 3.4 Actions Jeu (In-Session)

| Action | Super Admin | Admin Tenant | Formateur | Joueur | Observateur | Chef d'équipe |
|--------|:-----------:|:------------:|:---------:|:------:|:-----------:|:-------------:|
| Choisir compagnie | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| Soumettre décisions | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| Voir cockpit personnel | ✗ | ✗ | ✗ | ✓ | ○ | ✓ |
| Voir cockpit autres joueurs | ✗ | ✗ | ○¹ | ✗ | ✗ | ✗ |
| Voir vue marché | ✗ | ✗ | ○¹ | ✓ | ○ | ✓ |
| Voir classement | ✗ | ✗ | ○¹ | ✓ | ○ | ✓ |
| Proposer décision équipe | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Valider décision équipe | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |

### 3.5 Actions Facilitateur [V1+]

| Action | Super Admin | Admin Tenant | Formateur | Joueur | Observateur | Chef d'équipe |
|--------|:-----------:|:------------:|:---------:|:------:|:-----------:|:-------------:|
| Pause timer | ✗ | ✗ | ○¹ | ✗ | ✗ | ✗ |
| Accélérer timer | ✗ | ✗ | ○¹ | ✗ | ✗ | ✗ |
| Injecter événement | ✗ | ✗ | ○¹ | ✗ | ✗ | ✗ |
| Envoyer message global | ✗ | ✗ | ○¹ | ✗ | ✗ | ✗ |
| Créer équipes | ✗ | ✗ | ○¹ | ✗ | ✗ | ✗ |

---

## 4) Permissions Contextuelles

### 4.1 Contexte Tenant

Toute requête inclut implicitement `tenant_id` :

```
Permission = Role × Action × tenant_id
```

**Règle** : Un utilisateur ne peut JAMAIS accéder aux ressources d'un autre tenant.

### 4.2 Contexte Session

Pour les actions in-session :

```
Permission = Role × Action × tenant_id × session_id × (participant_status)
```

**Statuts participant** :
- `invited` : Invité mais pas encore rejoint
- `active` : Participant actif
- `eliminated` : Éliminé (game over)
- `left` : A quitté la session

### 4.3 Validations Requises

| Contexte | Validations |
|----------|-------------|
| Toute requête | `user.tenant_id == resource.tenant_id` |
| Requête session | + `user.id IN session.participants` |
| Action joueur | + `session.status == 'running'` |
| Action formateur | + `session.created_by == user.id OR user.role == 'admin_tenant'` |

---

## 5) Gestion des Erreurs d'Autorisation

| Code | Situation | Réponse |
|------|-----------|---------|
| `401` | Token absent/invalide/expiré | `{"error": "unauthorized", "message": "Authentication required"}` |
| `403` | Permission refusée | `{"error": "forbidden", "message": "Insufficient permissions"}` |
| `403` | Cross-tenant | `{"error": "forbidden", "message": "Resource not found"}` (masquer l'existence) |

> [!CAUTION]
> **Ne jamais révéler** qu'une ressource existe dans un autre tenant. Retourner `403` ou `404` de manière indistincte.

---

## 6) Décisions / Risques / Checklist

### 6.1 Décisions

| ID | Décision | Justification |
|----|----------|---------------|
| SEC-01 | Deny-by-default | Sécurité maximale |
| SEC-02 | Pas d'héritage de rôles | Éviter escalade implicite |
| SEC-03 | JWT avec tenant_id | Isolation garantie côté token |
| SEC-04 | Masquer existence cross-tenant | Éviter énumération |

### 6.2 Risques

| ID | Risque | Mitigation |
|----|--------|------------|
| R-SEC-01 | Escalade de privilèges | Tests RBAC exhaustifs, audit |
| R-SEC-02 | Token volé | Durée courte, refresh token, MFA |
| R-SEC-03 | Bypass validation tenant_id | Middleware centralisé obligatoire |

### 6.3 Checklist MVP

- [ ] Middleware d'authentification (vérification JWT)
- [ ] Middleware d'autorisation (RBAC)
- [ ] Injection automatique tenant_id depuis token
- [ ] Tests unitaires matrice RBAC (100% couverture)
- [ ] Tests d'intégration cross-tenant (refus)
- [ ] Logging des refus d'accès

---

## 7) Impacts Dev

> [!IMPORTANT]
> **Où appliquer ces règles dans le code**

### 7.1 Architecture Recommandée

```
┌─────────────────────────────────────────────────────────────┐
│                         API Gateway                          │
│              (Validation JWT, extraction tenant_id)          │
├─────────────────────────────────────────────────────────────┤
│                    Auth Middleware                           │
│              (Vérification token, refresh)                   │
├─────────────────────────────────────────────────────────────┤
│                    RBAC Middleware                           │
│         (Vérification role × action × resource)              │
├─────────────────────────────────────────────────────────────┤
│                   Tenant Middleware                          │
│           (Injection tenant_id dans context)                 │
├─────────────────────────────────────────────────────────────┤
│                    Route Handlers                            │
│        (Logique métier, tenant_id déjà validé)               │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Points d'Implémentation

| Composant | Fichier(s) suggéré(s) | Responsabilité |
|-----------|----------------------|----------------|
| Auth Middleware | `middleware/auth.ts` | Valider JWT, extraire user |
| RBAC Middleware | `middleware/rbac.ts` | Vérifier permissions via matrice |
| Tenant Guard | `middleware/tenant.ts` | Injecter et valider tenant_id |
| Permission Service | `services/permissions.ts` | Logique centralisée RBAC |
| RBAC Matrix | `config/rbac-matrix.ts` | Définition déclarative des permissions |

### 7.3 Pattern d'Implémentation

```typescript
// Exemple conceptuel - middleware RBAC
const rbacMiddleware = (requiredAction: Action) => {
  return (req, res, next) => {
    const { user } = req; // Injecté par auth middleware
    const resourceTenantId = extractTenantId(req);
    
    // 1. Vérifier tenant
    if (user.tenant_id !== resourceTenantId) {
      return res.status(403).json({ error: "forbidden" });
    }
    
    // 2. Vérifier permission (deny-by-default)
    if (!hasPermission(user.roles, requiredAction, req.context)) {
      auditLog("access_denied", { user, action: requiredAction });
      return res.status(403).json({ error: "forbidden" });
    }
    
    next();
  };
};
```

### 7.4 Base de Données

> **Note** : Noms de tables alignés sur `80_api_data/data_model.md` (source of truth).

| Table | Champ obligatoire | Contrainte |
|-------|-------------------|------------|
| `users` | `tenant_id` | FK + NOT NULL |
| `game_sessions` | `tenant_id` | FK + NOT NULL |
| `turns` | `tenant_id` | FK + NOT NULL (via session) |
| `audit_logs` | `tenant_id` | FK + NOT NULL |

**Row-Level Security (RLS)** recommandée sur PostgreSQL/Supabase :

```sql
-- Exemple politique RLS
CREATE POLICY tenant_isolation ON game_sessions
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

*Document rédigé selon les exigences PRD §10.3 et §13. Référence : [glossary.md](../00_product/glossary.md) §2 (RBAC).*
