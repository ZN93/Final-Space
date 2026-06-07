# US10 - Créer, mettre à jour et clôturer un incident

## État de validation

**US10 validée côté backend et frontend.**

La gestion des incidents est opérationnelle.  
L’application permet de créer, consulter, modifier, suivre et clôturer des incidents opérationnels rattachés à une mission.

Un incident peut être créé manuellement.  
Il peut également être lié à une alerte existante via le champ `alertId`.

Un incident clôturé reste consultable mais n’est plus modifiable.  
Les incidents d’une mission clôturée restent consultables mais passent en lecture seule.

---

## Objectif de l’US

Permettre à un administrateur ou à un opérateur de créer, suivre et clôturer un incident afin d’assurer le traitement et la traçabilité des problèmes opérationnels.

Les rôles ADMIN et OPERATEUR disposent des droits de création, modification, changement de statut et clôture.  
Le rôle LECTEUR dispose uniquement d’un accès en consultation.

---

## Endpoints testés

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `POST` | `/api/missions/{missionId}/incidents` | Créer un incident dans une mission | ADMIN, OPERATEUR |
| `GET` | `/api/missions/{missionId}/incidents` | Lister les incidents d’une mission | ADMIN, OPERATEUR, LECTEUR |
| `GET` | `/api/incidents/{id}` | Consulter le détail d’un incident | ADMIN, OPERATEUR, LECTEUR |
| `PUT` | `/api/incidents/{id}` | Modifier un incident non clôturé | ADMIN, OPERATEUR |
| `POST` | `/api/incidents/{id}/status` | Changer le statut d’un incident | ADMIN, OPERATEUR |
| `POST` | `/api/incidents/{id}/close` | Clôturer explicitement un incident | ADMIN, OPERATEUR |

Paramètre optionnel pour la liste :

| Paramètre | Valeurs | Description |
|---|---|---|
| `status` | `OUVERT`, `EN_COURS`, `CLOTURE` | Filtrer les incidents par statut |

---

## Données affichées

| Champ | Description | État |
|---|---|---|
| Titre | Titre de l’incident | PASS |
| Description | Description détaillée | PASS |
| Notes | Notes de suivi MVP | PASS |
| Mission | Mission associée | PASS |
| Satellite | Satellite concerné, optionnel | PASS |
| Alerte | Alerte liée, optionnelle | PASS |
| Gravité | `FAIBLE`, `MOYENNE`, `ELEVEE` | PASS |
| Statut | `OUVERT`, `EN_COURS`, `CLOTURE` | PASS |
| Date de création | Date/heure de création | PASS |
| Date de clôture | Date/heure de clôture si applicable | PASS |
| Auteur | Email de l’utilisateur créateur | PASS |

---

## Règles métier couvertes

| Référence | Règle | État |
|---|---|---|
| RG-INC-01 | Un incident est obligatoirement rattaché à une mission | PASS |
| RG-INC-02 | Un incident peut être lié à une alerte | PASS |
| RG-INC-03 | Un incident peut être lié à un satellite | PASS |
| RG-INC-04 | Le satellite doit appartenir à la mission | PASS |
| RG-INC-05 | L’alerte doit appartenir à la mission | PASS |
| RG-INC-06 | Un incident créé possède le statut `OUVERT` | PASS |
| RG-INC-07 | Un incident peut passer de `OUVERT` à `EN_COURS` | PASS |
| RG-INC-08 | Un incident peut passer de `EN_COURS` à `CLOTURE` | PASS |
| RG-INC-09 | Un incident peut être clôturé directement depuis `OUVERT` | PASS |
| RG-INC-10 | Une transition invalide est refusée | PASS |
| RG-INC-11 | Un incident clôturé est en lecture seule | PASS |
| RG-INC-12 | Une mission clôturée ne permet pas la création d’incident | PASS |
| RG-INC-13 | Les incidents d’une mission clôturée restent consultables | PASS |
| RG-INC-14 | Les incidents d’une mission clôturée ne sont plus modifiables | PASS |
| RG-INC-15 | La suppression physique d’un incident n’est pas autorisée | PASS |

---

## Tests unitaires - IncidentService

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US10-T01 | Créer un incident sur une mission active | Incident créé avec statut `OUVERT` | PASS |
| US10-T02 | Créer un incident sur une mission inexistante | Erreur `Mission introuvable` | PASS |
| US10-T03 | Créer un incident sur une mission clôturée | Création refusée | PASS |
| US10-T04 | Créer avec un satellite inexistant | Erreur `Satellite introuvable` | PASS |
| US10-T05 | Créer avec un satellite d’une autre mission | Création refusée | PASS |
| US10-T06 | Créer un incident lié à une alerte | Incident créé avec `alertId` | PASS |
| US10-T07 | Créer avec une alerte inexistante | Erreur `Alerte introuvable` | PASS |
| US10-T08 | Lister les incidents d’une mission | Liste retournée | PASS |
| US10-T09 | Filtrer les incidents par statut | Liste filtrée | PASS |
| US10-T10 | Lister les incidents d’une mission inexistante | Erreur `Mission introuvable` | PASS |
| US10-T11 | Consulter le détail d’un incident | Incident retourné | PASS |
| US10-T12 | Consulter un incident inexistant | Erreur `Incident introuvable` | PASS |
| US10-T13 | Modifier un incident ouvert | Données mises à jour | PASS |
| US10-T14 | Modifier un incident clôturé | Modification refusée | PASS |
| US10-T15 | Passer de `OUVERT` à `EN_COURS` | Statut mis à jour | PASS |
| US10-T16 | Passer de `EN_COURS` à `CLOTURE` | Statut clôturé et `closedAt` renseigné | PASS |
| US10-T17 | Clôturer directement un incident ouvert | Statut `CLOTURE` | PASS |
| US10-T18 | Tenter une transition invalide | Transition refusée | PASS |
| US10-T19 | Modifier le statut d’un incident clôturé | Modification refusée | PASS |
| US10-T20 | Modifier un incident dont la mission est clôturée | Modification refusée | PASS |
| US10-T21 | Changer le statut d’un incident dont la mission est clôturée | Modification refusée | PASS |

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/incident/service/impl/IncidentServiceImplTest.java
```

---

## Tests d’intégration API / sécurité

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US10-T22 | ADMIN crée un incident | `201 Created` | PASS |
| US10-T23 | OPERATEUR crée un incident | `201 Created` | PASS |
| US10-T24 | LECTEUR tente de créer un incident | `403 Forbidden` | PASS |
| US10-T25 | Création sans token | `401 Unauthorized` | PASS |
| US10-T26 | Création sur mission inconnue | `404 Not Found` | PASS |
| US10-T27 | Création sur mission clôturée | `400 Bad Request` | PASS |
| US10-T28 | ADMIN, OPERATEUR et LECTEUR listent les incidents | `200 OK` | PASS |
| US10-T29 | Filtrer les incidents par statut | `200 OK` | PASS |
| US10-T30 | ADMIN et LECTEUR consultent le détail | `200 OK` | PASS |
| US10-T31 | ADMIN modifie un incident | `200 OK` | PASS |
| US10-T32 | LECTEUR tente de modifier un incident | `403 Forbidden` | PASS |
| US10-T33 | ADMIN passe un incident en cours | `200 OK` | PASS |
| US10-T34 | LECTEUR tente de changer le statut | `403 Forbidden` | PASS |
| US10-T35 | ADMIN clôture un incident | `200 OK` | PASS |
| US10-T36 | Modifier un incident clôturé | `400 Bad Request` | PASS |
| US10-T37 | Modifier un incident dont la mission est clôturée | `400 Bad Request` | PASS |
| US10-T38 | Changer le statut d’un incident dont la mission est clôturée | `400 Bad Request` | PASS |
| US10-T39 | Clôturer un incident dont la mission est clôturée | `400 Bad Request` | PASS |

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/security/IncidentAuthorizationIntegrationTest.java
```

---

## Tests frontend réalisés

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US10-T40 | Accéder aux incidents depuis le détail mission | Page incidents affichée | PASS |
| US10-T41 | Accéder aux incidents depuis le dashboard mission | Page incidents affichée | PASS |
| US10-T42 | Lister les incidents d’une mission active | Liste affichée | PASS |
| US10-T43 | Lister les incidents d’une mission clôturée | Liste consultable | PASS |
| US10-T44 | Filtrer les incidents par statut | Filtre fonctionnel | PASS |
| US10-T45 | Créer un incident sur mission active | Incident créé et visible | PASS |
| US10-T46 | Masquer la création pour LECTEUR | Bouton absent | PASS |
| US10-T47 | Masquer la création sur mission clôturée | Bouton absent | PASS |
| US10-T48 | Modifier un incident ouvert | Formulaire d’édition fonctionnel | PASS |
| US10-T49 | Passer un incident ouvert en cours | Statut `EN_COURS` affiché | PASS |
| US10-T50 | Clôturer un incident | Statut `CLOTURE` affiché | PASS |
| US10-T51 | Incident clôturé en lecture seule | Actions absentes | PASS |
| US10-T52 | Incident d’une mission clôturée en lecture seule | Actions absentes | PASS |
| US10-T53 | LECTEUR consulte les incidents | Lecture seule | PASS |
| US10-T54 | États loading / vide / erreur | Gérés côté UI | PASS |
| US10-T55 | Compilation frontend | Build Angular OK | PASS |

---

## Résultat d’exécution automatisée

Commandes exécutées :

```bash
./mvnw clean test
```

```bash
npm run build
```

Résultats :

```text
Tests run: 113, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS côté backend
Application bundle generation complete côté frontend
```

Warnings frontend constatés mais non bloquants :

```text
src/app/incidents/mission-incident-list/mission-incident-list.component.css exceeded maximum budget
src/app/missions/mission-detail/mission-detail.component.css exceeded maximum budget
4 rules skipped due to selector errors
```

---

## Limites MVP

La gestion avancée des commentaires n’est pas implémentée dans une table séparée.  
Le MVP utilise un champ `notes` pour suivre les informations de traitement.

La suppression physique des incidents n’est pas implémentée.  
L’escalade automatique, l’assignation multi-utilisateurs et la gestion de SLA sont hors périmètre.

---

## Documentation réalisée

| Élément | État |
|---|---|
| Documentation des tests backend | Réalisée |
| Documentation des tests frontend | Réalisée |
| Endpoints incidents dans le README | Réalisée |
| Exemples de payload incidents dans le README | Réalisée |
| Limites MVP documentées | Réalisée |

---

## Conclusion

L’US10 est validée côté backend et frontend.

Les rôles ADMIN et OPERATEUR peuvent créer, modifier, suivre et clôturer un incident.  
Le rôle LECTEUR peut consulter les incidents uniquement.

Un incident clôturé est en lecture seule.  
Les incidents d’une mission clôturée restent consultables mais ne peuvent plus être modifiés.

La création, la modification, les transitions de statut et la clôture sont protégées par les règles métier et les règles RBAC.