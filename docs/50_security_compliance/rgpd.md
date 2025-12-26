# rgpd.md — Conformité RGPD

**Version** : 1.0  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-25  
**Rôle rédacteur** : Sécurité / Multi-tenant

---

## 1) Contexte Réglementaire

### 1.1 Champ d'Application

AssurManager traite des **données personnelles** d'utilisateurs situés dans l'UE, soumises au RGPD (Règlement 2016/679).

| Acteur | Rôle RGPD |
|--------|-----------|
| **Éditeur AssurManager** | Sous-traitant (data processor) |
| **Client (Tenant)** | Responsable de traitement (data controller) |
| **Utilisateur final** | Personne concernée (data subject) |

### 1.2 Principes Fondamentaux

| Principe | Application dans AssurManager |
|----------|------------------------------|
| **Licéité** | Contrat de service + consentement utilisateur |
| **Limitation des finalités** | Formation/simulation uniquement |
| **Minimisation** | Collecte du strict nécessaire |
| **Exactitude** | Possibilité de rectification |
| **Limitation de conservation** | Durées définies et appliquées |
| **Intégrité et confidentialité** | Chiffrement, isolation, audit |

---

## 2) Inventaire des Données Personnelles

### 2.1 Données Collectées

| Catégorie | Données | Base légale | Finalité | Durée conservation |
|-----------|---------|-------------|----------|-------------------|
| **Identité** | Nom, prénom | Contrat | Identification | Durée relation + 3 ans |
| **Contact** | Email | Contrat | Communication, auth | Durée relation + 3 ans |
| **Authentification** | Hash mot de passe | Contrat | Sécurité accès | Durée relation |
| **Connexion** | IP, User-Agent | Intérêt légitime | Sécurité, audit | 12 mois |
| **Jeu** | Décisions, scores | Contrat | Formation | 36 mois |
| **Audit** | Actions utilisateur | Intérêt légitime | Traçabilité | 36-60 mois |

### 2.2 Données NON Collectées

> [!IMPORTANT]
> AssurManager **ne collecte pas** de données sensibles (article 9 RGPD).

| Type | Statut |
|------|--------|
| Données de santé | ✗ Non collectées |
| Opinions politiques | ✗ Non collectées |
| Données biométriques | ✗ Non collectées |
| Origine ethnique | ✗ Non collectées |

### 2.3 Données Techniques (Non Personnelles en Isolation)

| Donnée | Nature | Notes |
|--------|--------|-------|
| `tenant_id` | Identifiant technique | Pas de donnée personnelle |
| `session_id` | Identifiant technique | Lié à des users mais anonymisable |
| `game_state` | Données de jeu | Pseudonymisables |

---

## 3) Droits des Personnes

### 3.1 Résumé des Droits

| Droit | Article RGPD | Délai réponse | Implémentation |
|-------|-------------|---------------|----------------|
| **Accès** | Art. 15 | 1 mois | Export JSON/PDF |
| **Rectification** | Art. 16 | 1 mois | Interface profil |
| **Effacement** | Art. 17 | 1 mois | Avec restrictions |
| **Limitation** | Art. 18 | 1 mois | Flag sur compte |
| **Portabilité** | Art. 20 | 1 mois | Export structuré |
| **Opposition** | Art. 21 | Immédiat | Désactivation compte |

### 3.2 Droit d'Accès (Art. 15)

L'utilisateur peut demander une copie de toutes ses données.

**Données incluses dans l'export :**
- Profil (nom, email, rôle)
- Historique de connexion (dernier mois)
- Sessions auxquelles il a participé
- Décisions et scores
- Debriefs personnels

**Format :** JSON structuré + PDF lisible

### 3.3 Droit de Rectification (Art. 16)

| Donnée | Modifiable par l'utilisateur | Via Admin |
|--------|:----------------------------:|:---------:|
| Nom/Prénom | ✓ | ✓ |
| Email | ✓ (avec vérification) | ✓ |
| Mot de passe | ✓ | - |
| Rôle | ✗ | ✓ |

### 3.4 Droit à l'Effacement (Art. 17)

> [!WARNING]
> **Restrictions légitimes** à l'effacement :
> - Données nécessaires à la traçabilité formation (obligation légale client)
> - Logs de sécurité (intérêt légitime)

**Processus d'effacement :**

1. Vérification identité (email de confirmation)
2. Période de grâce 30 jours (réversible)
3. Anonymisation des données de jeu :
   - `user_id` → `DELETED_USER_xxxx`
   - Nom/email → supprimés
   - Décisions/scores → conservés anonymisés
4. Suppression physique des données identifiantes
5. Conservation des logs anonymisés (traçabilité)

### 3.5 Droit à la Portabilité (Art. 20)

Export des données dans un format :
- Structuré (JSON)
- Lisible par machine
- Couramment utilisé

**Endpoint MVP :** `GET /api/me/export`

### 3.6 Droit d'Opposition (Art. 21)

L'utilisateur peut demander l'arrêt du traitement :
- Désactivation du compte (soft delete)
- Arrêt des communications
- Exclusion des statistiques

---

## 4) Durées de Conservation

### 4.1 Tableau de Conservation

| Donnée | Durée active | Après fin relation | Total max |
|--------|-------------|-------------------|-----------|
| Profil utilisateur | Durée relation | 3 ans | Variable |
| Données de jeu | Durée relation | 3 ans | Variable |
| Logs connexion | 12 mois glissants | - | 12 mois |
| Logs audit | 36 mois | - | 60 mois (sécurité) |
| Exports générés | 6 mois | - | 6 mois |

### 4.2 Suppression Automatique

| Type | Job | Fréquence |
|------|-----|-----------|
| Comptes inactifs > 2 ans | `cleanup_inactive_users` | Mensuel |
| Logs anciens | `purge_old_logs` | Mensuel |
| Exports expirés | `cleanup_exports` | Hebdomadaire |

---

## 5) Mesures Techniques

### 5.1 Chiffrement

| Couche | Méthode | Notes |
|--------|---------|-------|
| **Transport** | TLS 1.3 | HTTPS obligatoire |
| **Stockage** | AES-256 (at rest) | Via Supabase/cloud provider |
| **Mots de passe** | bcrypt (cost 12) | Jamais stockés en clair |
| **Tokens** | JWT signé (RS256) | Clés rotées régulièrement |

### 5.2 Pseudonymisation

Les données de jeu peuvent être **pseudonymisées** pour analyse :

```
Données originales:
{ user_id: "abc-123", name: "Jean Dupont", decision: {...} }

Données pseudonymisées:
{ player_id: "P_7f3a2", decision: {...} }
```

### 5.3 Isolation

Voir [multi_tenant_isolation.md](./multi_tenant_isolation.md) :
- Row-Level Security
- tenant_id obligatoire
- Pas d'accès cross-tenant

---

## 6) Sous-Traitance et Transferts

### 6.1 Sous-Traitants

| Sous-traitant | Service | Localisation | Garanties |
|---------------|---------|-------------|-----------|
| **Supabase** | BDD, Auth | UE (Frankfurt) | DPA, ISO 27001 |
| **Vercel** | Hébergement | UE prioritaire | DPA, SOC 2 |
| **SendGrid** (optionnel) | Emails | USA | SCCs, DPA |

### 6.2 Transferts Hors UE

> [!CAUTION]
> En cas de sous-traitant USA, vérifier :
> - Clauses Contractuelles Types (SCCs)
> - Mesures supplémentaires (chiffrement, pseudonymisation)

---

## 7) Procédures

### 7.1 Réponse aux Demandes

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Demande    │────▶│  Vérification│────▶│  Traitement  │
│  utilisateur │     │   identité   │     │   + Réponse  │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
   Email/Form          Email confirm         Export/Modif
```

**Délai :** 1 mois max (extensible à 3 mois si complexe)

### 7.2 Notification de Violation

En cas de violation de données :

| Étape | Délai | Action |
|-------|-------|--------|
| Détection | T0 | Identification, containment |
| Analyse | T0+24h | Évaluation impact, personnes affectées |
| Notification CNIL | T0+72h | Si risque pour droits et libertés |
| Notification personnes | "Meilleurs délais" | Si risque élevé |

---

## 8) Décisions / Risques / Checklist

### 8.1 Décisions

| ID | Décision | Justification |
|----|----------|---------------|
| RGPD-01 | Anonymisation vs suppression | Conservation valeur pédagogique |
| RGPD-02 | Sous-traitants UE prioritaires | Simplification transferts |
| RGPD-03 | Export JSON + PDF | Accessibilité + machine-readable |
| RGPD-04 | Période de grâce 30j | Éviter suppressions accidentelles |

### 8.2 Risques

| ID | Risque | Mitigation |
|----|--------|------------|
| R-RGPD-01 | Demande d'effacement massive | Processus automatisé |
| R-RGPD-02 | Sous-traitant non conforme | Due diligence, DPA |
| R-RGPD-03 | Violation de données | Plan réponse incident |

### 8.3 Checklist MVP

- [ ] Page mentions légales / politique confidentialité
- [ ] Endpoint export données personnelles
- [ ] Interface modification profil
- [ ] Processus d'effacement (avec anonymisation)
- [ ] DPA avec sous-traitants
- [ ] Registre des traitements (interne)

---

## 9) Impacts Dev

> [!IMPORTANT]
> **Où appliquer ces règles dans le code**

### 9.1 Points d'Implémentation

| Fonctionnalité | Fichier(s) suggéré(s) | Priorité |
|----------------|----------------------|----------|
| Export données | `services/gdpr.service.ts` | MVP |
| Modification profil | `pages/profile.tsx` | MVP |
| Suppression compte | `services/gdpr.service.ts` | MVP |
| Anonymisation | `jobs/anonymize-user.ts` | MVP |
| Purge automatique | `jobs/gdpr-cleanup.ts` | MVP |
| Mentions légales | `pages/legal.tsx` | MVP |

### 9.2 Pattern Export Données

```typescript
// services/gdpr.service.ts
class GDPRService {
  async exportUserData(userId: string): Promise<UserDataExport> {
    const user = await this.userRepo.findById(userId);
    const sessions = await this.sessionRepo.findByParticipant(userId);
    const decisions = await this.decisionRepo.findByUser(userId);
    const logins = await this.auditRepo.findByActor(userId, { 
      event_type: 'auth.login_success',
      limit: 100 
    });
    
    return {
      profile: {
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
      sessions: sessions.map(s => ({
        id: s.id,
        name: s.name,
        date: s.created_at,
        role: s.participant_role,
      })),
      decisions_count: decisions.length,
      recent_logins: logins.map(l => ({
        date: l.timestamp,
        ip: l.actor_ip,
      })),
      exported_at: new Date().toISOString(),
    };
  }
}
```

### 9.3 Pattern Anonymisation

```typescript
// jobs/anonymize-user.ts
async function anonymizeUser(userId: string): Promise<void> {
  const anonId = `DELETED_USER_${generateShortId()}`;
  
  // 1. Anonymiser les références
  await db.decisions.update(
    { user_id: userId },
    { user_id: null, anonymous_id: anonId }
  );
  
  await db.session_participants.update(
    { user_id: userId },
    { user_id: null, anonymous_id: anonId }
  );
  
  // 2. Supprimer les données identifiantes
  await db.users.delete({ id: userId });
  
  // 3. Logger l'anonymisation (sans données personnelles)
  await auditService.log({
    type: 'user.anonymized',
    actor: { system: true },
    data: { anonymous_id: anonId },
  });
}
```

### 9.4 Endpoints API RGPD

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/me/export` | GET | Export données personnelles (JSON) |
| `/api/me/export/pdf` | GET | Export PDF lisible |
| `/api/me` | PATCH | Modification profil |
| `/api/me` | DELETE | Demande de suppression |
| `/api/me/deletion/confirm` | POST | Confirmation suppression |
| `/api/me/deletion/cancel` | POST | Annulation (pendant grâce) |

### 9.5 Base de Données

```sql
-- Table pour gérer les suppressions
CREATE TABLE deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  grace_period_ends TIMESTAMPTZ, -- +30 jours
  status VARCHAR(20) DEFAULT 'pending', -- pending, cancelled, completed
  completed_at TIMESTAMPTZ
);

-- Champ pour anonymisation
ALTER TABLE decisions ADD COLUMN anonymous_id VARCHAR(50);
ALTER TABLE session_participants ADD COLUMN anonymous_id VARCHAR(50);
```

---

## 10) Documents Légaux Requis

### 10.1 À Fournir (MVP)

| Document | Localisation | Responsable |
|----------|--------------|-------------|
| Politique de confidentialité | `/legal/privacy` | Juridique |
| Conditions d'utilisation | `/legal/terms` | Juridique |
| Politique cookies | `/legal/cookies` | Juridique |
| DPA clients | Contrat B2B | Commercial |

### 10.2 À Maintenir (Interne)

| Document | Responsable |
|----------|-------------|
| Registre des traitements | DPO / Juridique |
| Analyse d'impact (AIPD) | DPO (si nécessaire) |
| Procédures de réponse | Sécurité |

---

*Document rédigé selon PRD §13 et RGPD. Référence : [glossary.md](../00_product/glossary.md) §2.*
