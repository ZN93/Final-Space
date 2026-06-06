# US04 - Protection des endpoints API

## Objectif de validation

Vérifier que Spring Security et le filtre JWT appliquent les règles suivantes :

- seul l'endpoint de connexion est accessible publiquement ;
- une requête sans token ou avec un token invalide est rejetée en `401 Unauthorized` ;
- un utilisateur authentifié sans le rôle requis est rejeté en `403 Forbidden` ;
- les utilisateurs autorisés accèdent aux opérations prévues par la matrice RBAC.

## Règles de sécurité configurées

| Endpoint ou action | ADMIN | OPERATEUR | LECTEUR | Sans token |
|---|---:|---:|---:|---:|
| `POST /auth/login` | Public | Public | Public | Public |
| `GET /api/health` | Oui | Oui | Oui | Non |
| `GET /api/missions` | Oui | Oui | Oui | Non |
| `POST /api/missions` | Oui | Oui | Non | Non |
| `PUT /api/missions/{id}` | Oui | Oui | Non | Non |
| `POST /api/missions/{id}/close` | Oui | Oui | Non | Non |
| `/api/users/**` | Oui | Non | Non | Non |

## Cas de test automatisés

| ID | Classe | Scénario | Résultat attendu | État |
|---|---|---|---|---|
| US04-T01 | `MissionAuthorizationIntegrationTest` | `GET /api/missions` sans token | `401 Unauthorized` | PASS |
| US04-T02 | `MissionAuthorizationIntegrationTest` | `GET /api/missions` avec token invalide | `401 Unauthorized` | PASS |
| US04-T03 | `MissionAuthorizationIntegrationTest` | `POST /api/missions` avec ADMIN | `201 Created` | PASS |
| US04-T04 | `MissionAuthorizationIntegrationTest` | `POST /api/missions` avec OPERATEUR | `201 Created` | PASS |
| US04-T05 | `MissionAuthorizationIntegrationTest` | `POST /api/missions` avec LECTEUR | `403 Forbidden` | PASS |
| US04-T06 | `MissionAuthorizationIntegrationTest` | `GET /api/missions` avec LECTEUR | `200 OK` | PASS |
| US04-T07 | `MissionAuthorizationIntegrationTest` | `PUT /api/missions/{id}` avec LECTEUR | `403 Forbidden` | PASS |
| US04-T08 | `HealthControllerIntegrationTest` | `GET /api/health` sans token | `401 Unauthorized` | PASS |
| US04-T09 | `HealthControllerIntegrationTest` | `GET /api/health` avec JWT valide | `200 OK` | PASS |

## Tests manuels Postman réalisés pendant le développement

| Scénario | Résultat vérifié |
|---|---|
| Token valide avec rôle insuffisant sur une opération d'écriture | `403 Forbidden` |
| Token absent ou invalide sur un endpoint protégé | `401 Unauthorized` |
| ADMIN et OPERATEUR sur les actions opérationnelles testées | Accès autorisé |

## Classes de tests associées

```text
backend/src/test/java/com/finalspace/backend/security/MissionAuthorizationIntegrationTest.java
backend/src/test/java/com/finalspace/backend/controller/HealthControllerIntegrationTest.java
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

## Conclusion

**US04 validée côté backend.** Les codes `401` et `403` ainsi que les principaux droits de lecture et d'écriture sont couverts par des tests automatisés.
