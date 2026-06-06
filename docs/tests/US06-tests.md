# US06 - Créer et gérer des satellites rattachés à une mission

### État de validation

**US06 validée côté backend et frontend.**

Les endpoints API de gestion des satellites ont été testés manuellement avec Postman et automatiquement avec JUnit / MockMvc.

Le parcours frontend a également été validé manuellement depuis l’interface Angular avec les rôles ADMIN, OPERATEUR et LECTEUR.

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
```

---

## Tests d’intégration API / sécurité

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US06-T12 | ADMIN crée un satellite dans une mission active | `201 Created` | PASS |
| US06-T13 | OPERATEUR crée un satellite dans une mission active | `201 Created` | PASS |
| US06-T14 | LECTEUR tente de créer un satellite | `403 Forbidden` | PASS |
| US06-T15 | LECTEUR liste les satellites d’une mission | `200 OK` | PASS |
| US06-T16 | LECTEUR consulte le détail d’un satellite | `200 OK` | PASS |
| US06-T17 | LECTEUR tente de modifier un satellite | `403 Forbidden` | PASS |
| US06-T18 | LECTEUR tente de désactiver un satellite | `403 Forbidden` | PASS |
| US06-T19 | Création dans une mission clôturée | `400 Bad Request` | PASS |
| US06-T20 | ADMIN modifie un satellite actif | `200 OK` | PASS |
| US06-T21 | ADMIN désactive un satellite | `200 OK` | PASS |
| US06-T22 | ADMIN tente de modifier un satellite inactif | `400 Bad Request` | PASS |

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/security/SatelliteAuthorizationIntegrationTest.java
```

---

## Tests manuels Postman réalisés

| Rôle | Scénario | Résultat attendu | État |
|---|---|---|---|
| ADMIN | Créer un satellite dans une mission active | `201 Created` | PASS |
| ADMIN | Créer un satellite dans une mission clôturée | `400 Bad Request` | PASS |
| ADMIN | Lister les satellites d’une mission | `200 OK` | PASS |
| ADMIN | Consulter le détail d’un satellite | `200 OK` | PASS |
| ADMIN | Modifier un satellite actif | `200 OK` | PASS |
| ADMIN | Désactiver un satellite | `200 OK` | PASS |
| ADMIN | Modifier un satellite inactif | `400 Bad Request` | PASS |
| OPERATEUR | Créer, consulter, modifier et désactiver un satellite | Actions autorisées | PASS |
| LECTEUR | Consulter les satellites | `200 OK` | PASS |
| LECTEUR | Créer, modifier ou désactiver un satellite | `403 Forbidden` | PASS |

---

## Tests frontend réalisés

Les tests fonctionnels UI ont été validés manuellement avec les rôles ADMIN, OPERATEUR et LECTEUR.

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US06-T23 | Afficher les satellites dans le détail d’une mission | Liste visible dans la page mission | PASS |
| US06-T24 | Créer un satellite depuis une mission active | Satellite affiché dans la liste | PASS |
| US06-T25 | Modifier un satellite actif | Données mises à jour | PASS |
| US06-T26 | Désactiver un satellite | Statut `INACTIF` affiché | PASS |
| US06-T27 | Consulter un satellite inactif | Affichage en lecture seule | PASS |
| US06-T28 | Se connecter en LECTEUR | Actions créer, modifier et désactiver masquées | PASS |
| US06-T29 | Ouvrir une mission clôturée | Création de satellite impossible | PASS |
| US06-T30 | Vérifier la navigation via le détail mission | Satellites accessibles depuis la mission | PASS |

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
BUILD SUCCESS côté backend
Application bundle generation complete côté frontend
```

Un warning Angular est présent sur le budget CSS du composant `mission-detail`, mais il n’est pas bloquant pour le MVP.

---

## Documentation réalisée

| Élément | État |
|---|---|
| Documentation des tests backend | Réalisée |
| Documentation des tests frontend | Réalisée |
| Endpoints satellites dans le README | Réalisée |
| Exemples de payload satellites dans le README | Réalisée |
| Compte rendu de validation UI | Réalisé |

---

## Conclusion

L’US06 est validée côté backend et frontend.

Le backend permet la création, la consultation, la modification et la désactivation logique des satellites.  
Le frontend permet de gérer les satellites directement depuis le détail d’une mission.  
Les règles métier sont respectées : un satellite doit être rattaché à une mission active, un satellite inactif reste consultable mais ne peut plus être modifié, et les droits d’accès sont conformes aux rôles ADMIN, OPERATEUR et LECTEUR.

La documentation README a été mise à jour avec les endpoints satellites et les exemples de payload.