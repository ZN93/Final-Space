# US05 - Créer et gérer des missions

## État de validation

## État de validation

**US05 validée côté backend et frontend.**

Le parcours complet de gestion des missions a été testé manuellement depuis l’interface Angular avec les rôles ADMIN, OPERATEUR et LECTEUR.

## Objectif de validation

Vérifier la gestion métier des missions :

- création ;
- consultation ;
- modification ;
- clôture logique ;
- impossibilité de modifier une mission clôturée ;
- application des droits d'accès par rôle.

## Endpoints implémentés

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `POST` | `/api/missions` | Créer une mission | ADMIN, OPERATEUR |
| `GET` | `/api/missions` | Lister les missions | ADMIN, OPERATEUR, LECTEUR |
| `GET` | `/api/missions/{id}` | Consulter une mission | ADMIN, OPERATEUR, LECTEUR |
| `PUT` | `/api/missions/{id}` | Modifier une mission active | ADMIN, OPERATEUR |
| `POST` | `/api/missions/{id}/close` | Clôturer une mission | ADMIN, OPERATEUR |

## Règles métier couvertes

| Référence | Règle |
|---|---|
| RG-MIS-01 | Une mission créée est initialisée avec le statut `ACTIVE` |
| RG-MIS-02 | Le nom et la description d'une mission active peuvent être modifiés |
| RG-MIS-03 | Une mission clôturée ne peut pas être modifiée |
| RG-MIS-04 | La clôture renseigne le statut `CLOTUREE` et la date de clôture |
| RG-MIS-05 | La suppression physique n'est pas utilisée ; la clôture est logique |
| RG-MIS-06 | ADMIN et OPERATEUR peuvent créer et modifier une mission |
| RG-MIS-07 | LECTEUR accède uniquement à la consultation |

## Cas de test unitaires automatisés - Service Mission

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US05-T01 | Créer une mission valide | Mission créée avec statut `ACTIVE` et date de création | PASS |
| US05-T02 | Lister les missions | Liste de réponses retournée | PASS |
| US05-T03 | Rechercher une mission existante | Mission retournée | PASS |
| US05-T04 | Rechercher une mission inexistante | `ResourceNotFoundException` levée | PASS |
| US05-T05 | Modifier une mission active | Nom et description mis à jour | PASS |
| US05-T06 | Modifier une mission clôturée | `BusinessException` levée | PASS |
| US05-T07 | Clôturer une mission active | Statut `CLOTUREE` et `closedAt` renseigné | PASS |
| US05-T08 | Clôturer une mission déjà clôturée | Aucune sauvegarde supplémentaire inutile | PASS |

## Cas de test d'intégration/sécurité automatisés

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US05-T09 | ADMIN crée une mission par API | `201 Created` | PASS |
| US05-T10 | OPERATEUR crée une mission par API | `201 Created` | PASS |
| US05-T11 | LECTEUR tente de créer une mission | `403 Forbidden` | PASS |
| US05-T12 | LECTEUR consulte les missions | `200 OK` | PASS |
| US05-T13 | LECTEUR tente de modifier une mission | `403 Forbidden` | PASS |

## Vérifications API manuelles déjà réalisées

| ID | Scénario Postman | Résultat attendu | État |
|---|---|---|---|
| US05-T14 | Création d'une mission avec rôle autorisé | Mission créée et visible via API | PASS |
| US05-T15 | Modification d'une mission active | Modification acceptée | PASS |
| US05-T16 | Clôture d'une mission | Mission retournée au statut `CLOTUREE` | PASS |
| US05-T17 | Tentative de modification d'une mission clôturée | `400 Bad Request` avec message métier | PASS |

## Classes de tests automatisés associées

```text
backend/src/test/java/com/finalspace/backend/mission/service/impl/MissionServiceImplTest.java
backend/src/test/java/com/finalspace/backend/security/MissionAuthorizationIntegrationTest.java
```

## Exécution automatisée

Commande exécutée localement le 03/06/2026 :

```bash
./mvnw clean test
```

Résultat global du backend :

```text
Tests run: 21, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

> La validation GitHub Actions de ces nouveaux tests sera obtenue après commit, push et exécution du workflow CI.

## Tests fonctionnels UI réalisés

Les tests fonctionnels UI ont été validés manuellement le 06/06/2026.

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US05-T18 | Créer une mission depuis l'interface Angular | Mission enregistrée et affichée dans la liste | PASS |
| US05-T19 | Afficher la liste des missions | Missions existantes consultables | PASS |
| US05-T20 | Modifier une mission active depuis l'interface | Informations mises à jour | PASS |
| US05-T21 | Clôturer une mission depuis l'interface après confirmation | Statut `CLOTUREE` affiché | PASS |
| US05-T22 | Consulter une mission clôturée | Page en lecture seule | PASS |
| US05-T23 | Se connecter en tant que LECTEUR | Boutons création, modification et clôture absents | PASS |
| US05-T24 | Accéder à `/missions/create` en tant que LECTEUR | Redirection vers la page `forbidden` | PASS |
| US05-T25 | Accéder aux routes missions sans authentification | Redirection vers la page de connexion | PASS |
| US05-T26 | Naviguer via le header global | Dashboard, Missions et Logout accessibles sans modifier l’URL | PASS |

## Documentation réalisée

| Élément | État |
|---|---|
| Documentation des tests backend | Réalisée |
| Documentation des tests frontend | Réalisée |
| Endpoints mission dans le README | Réalisée |
| Exemples de payload mission dans le README | Réalisée |
| Compte rendu de validation UI | Réalisé |

## Conclusion

L’US05 est validée.

Le backend permet la création, la consultation, la modification et la clôture logique des missions.  
Le frontend permet le parcours complet utilisateur : liste, création, détail, modification et clôture.  
Les règles de sécurité sont respectées : ADMIN et OPERATEUR peuvent gérer les missions, tandis que LECTEUR dispose uniquement d’un accès en consultation.

La mission clôturée reste consultable mais devient non modifiable.