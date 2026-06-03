# US01 — Initialisation du projet

## Objectif de validation

Vérifier que le socle technique de l'application Final Space est opérationnel : démarrage du backend, endpoint de vérification et compilation du frontend.

## Périmètre testé

| Élément | Validation attendue |
|---|---|
| Backend Spring Boot | Le contexte applicatif démarre avec le profil de test |
| Endpoint health | L'endpoint répond correctement pour un utilisateur authentifié |
| Sécurité appliquée après US04 | L'endpoint health est inaccessible sans authentification |
| Frontend Angular | Le projet se compile dans la CI |
| Intégration continue | Les jobs backend et frontend s'exécutent dans GitHub Actions |

## Cas de test

| ID | Type | Scénario | Résultat attendu | État |
|---|---|---|---|---|
| US01-T01 | Intégration automatisée | Chargement du contexte Spring Boot avec le profil `test` | Le contexte démarre sans erreur | PASS |
| US01-T02 | Intégration automatisée | Appel `GET /api/health` sans token | `401 Unauthorized` conformément à la sécurité appliquée dans l'US04 | PASS |
| US01-T03 | Intégration automatisée | Connexion valide puis appel `GET /api/health` avec JWT | `200 OK` | PASS |
| US01-T04 | CI | Build backend | Compilation réussie | PASS sur le socle intégré |
| US01-T05 | CI | Build frontend Angular | Compilation réussie | PASS sur le socle intégré |

## Tests automatisés associés

| Classe de test | Couverture |
|---|---|
| `BackendApplicationTests` | Chargement du contexte Spring |
| `HealthControllerIntegrationTest` | Protection et disponibilité de `GET /api/health` |

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

**US01 validée.** L'endpoint de vérification est opérationnel et désormais protégé par JWT conformément aux règles de sécurité ajoutées dans l'US04.
