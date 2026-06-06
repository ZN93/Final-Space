# US02 - Authentification JWT

## Objectif de validation

Vérifier qu'un utilisateur peut s'authentifier avec des identifiants valides, obtenir un token JWT et être refusé lorsque les informations transmises sont invalides.

## Endpoint concerné

```http
POST /auth/login
```

## Données de test

| Rôle | Email | Mot de passe |
|---|---|---|
| ADMIN | `admin@finalspace.com` | `admin123` |
| OPERATEUR | `operator@finalspace.com` | `operator123` |
| LECTEUR | `reader@finalspace.com` | `reader123` |

## Cas de test automatisés backend

| ID | Type | Scénario | Résultat attendu | État |
|---|---|---|---|---|
| US02-T01 | Intégration API | Connexion avec `admin@finalspace.com` et `admin123` | `200 OK` et champ `token` non vide | PASS |
| US02-T02 | Intégration API | Connexion avec un mot de passe invalide | `401 Unauthorized` | PASS |
| US02-T03 | Validation API | Connexion avec un email vide | `400 Bad Request` | PASS |

## Validations frontend déjà effectuées manuellement

| ID | Type | Scénario | Résultat attendu | État |
|---|---|---|---|---|
| US02-T04 | Manuel UI | Connexion avec un compte valide | Affichage du dashboard après authentification | PASS |
| US02-T05 | Manuel UI | Vérification du token après connexion | JWT stocké dans `localStorage` | PASS |
| US02-T06 | Manuel UI | Déconnexion depuis le dashboard | Suppression du token et retour à l'écran de connexion | PASS |

## Test automatisé associé

```text
backend/src/test/java/com/finalspace/backend/auth/AuthIntegrationTest.java
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

**US02 validée.** L'authentification JWT fonctionne côté API et le parcours de connexion/déconnexion a été vérifié manuellement côté frontend.
