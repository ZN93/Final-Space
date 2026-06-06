# US06 - Créer et gérer des satellites rattachés à une mission

## État de validation

**Backend validé. Frontend restant à réaliser.**

Les endpoints API de gestion des satellites ont été testés manuellement avec Postman et automatiquement avec JUnit / MockMvc.

---

## Objectif de l’US

Permettre aux administrateurs et opérateurs de créer et gérer des satellites rattachés à une mission.

Un satellite est obligatoirement associé à une mission existante et active.  
Un satellite inactif reste consultable mais ne peut plus être modifié.

---

## Règles métier couvertes

| Référence | Règle | État |
|---|---|---|
| RG-SAT-01 | Un satellite est obligatoirement rattaché à une mission | PASS |
| RG-SAT-02 | Un satellite ne peut appartenir qu’à une seule mission | PASS |
| RG-SAT-03 | Un satellite ne peut être créé que dans une mission active | PASS |
| RG-SAT-04 | Une mission clôturée refuse la création de satellites | PASS |
| RG-SAT-05 | Un satellite créé possède le statut `ACTIF` | PASS |
| RG-SAT-06 | Un satellite `INACTIF` ne peut plus être modifié | PASS |
| RG-SAT-07 | La suppression physique n’est pas autorisée | PASS |
| RG-SAT-08 | La désactivation est logique via le statut `INACTIF` | PASS |

---

## Endpoints testés

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `POST` | `/api/missions/{missionId}/satellites` | Créer un satellite dans une mission | ADMIN, OPERATEUR |
| `GET` | `/api/missions/{missionId}/satellites` | Lister les satellites d’une mission | ADMIN, OPERATEUR, LECTEUR |
| `GET` | `/api/satellites/{id}` | Consulter le détail d’un satellite | ADMIN, OPERATEUR, LECTEUR |
| `PUT` | `/api/satellites/{id}` | Modifier un satellite actif | ADMIN, OPERATEUR |
| `POST` | `/api/satellites/{id}/disable` | Désactiver un satellite | ADMIN, OPERATEUR |

---

## Tests unitaires - SatelliteService

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US06-T01 | Créer un satellite dans une mission active | Satellite créé avec statut `ACTIF` | PASS |
| US06-T02 | Créer un satellite dans une mission inexistante | Erreur `Mission introuvable` | PASS |
| US06-T03 | Créer un satellite dans une mission clôturée | Erreur métier | PASS |
| US06-T04 | Lister les satellites d’une mission existante | Liste retournée | PASS |
| US06-T05 | Lister les satellites d’une mission inexistante | Erreur `Mission introuvable` | PASS |
| US06-T06 | Consulter un satellite existant | Satellite retourné | PASS |
| US06-T07 | Consulter un satellite inexistant | Erreur `Satellite introuvable` | PASS |
| US06-T08 | Modifier un satellite actif | Données mises à jour | PASS |
| US06-T09 | Modifier un satellite inactif | Modification refusée | PASS |
| US06-T10 | Désactiver un satellite actif | Statut `INACTIF` | PASS |
| US06-T11 | Désactiver un satellite déjà inactif | Aucun enregistrement inutile | PASS |

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/satellite/service/impl/SatelliteServiceImplTest.java