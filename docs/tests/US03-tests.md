# US03 - Gestion des rôles RBAC

## Objectif de validation

Vérifier que l'application différencie correctement les rôles `ADMIN`, `OPERATEUR` et `LECTEUR`, aussi bien pour les actions autorisées par l'API que pour l'affichage côté interface.

## Matrice de droits de référence

| Action | ADMIN | OPERATEUR | LECTEUR |
|---|---:|---:|---:|
| Consulter les ressources opérationnelles | Oui | Oui | Oui |
| Créer ou modifier une ressource opérationnelle | Oui | Oui | Non |
| Clôturer une mission | Oui | Oui | Non |
| Administrer les utilisateurs | Oui | Non | Non |

## Cas de test backend utilisés pour valider les rôles

| ID | Type | Scénario | Résultat attendu | État |
|---|---|---|---|---|
| US03-T01 | Intégration API | Authentifier ADMIN puis créer une mission | Création autorisée | PASS |
| US03-T02 | Intégration API | Authentifier OPERATEUR puis créer une mission | Création autorisée | PASS |
| US03-T03 | Intégration API | Authentifier LECTEUR puis consulter les missions | Consultation autorisée | PASS |
| US03-T04 | Sécurité API | Authentifier LECTEUR puis créer une mission | `403 Forbidden` | PASS |
| US03-T05 | Sécurité API | Authentifier LECTEUR puis modifier une mission | `403 Forbidden` | PASS |

## Validations UI réalisées manuellement

| ID | Rôle | Scénario | Résultat attendu | État |
|---|---|---|---|---|
| US03-T06 | ADMIN | Afficher le dashboard | Actions opérationnelles et bloc administration visibles | PASS |
| US03-T07 | OPERATEUR | Afficher le dashboard | Actions opérationnelles visibles ; bloc administration absent | PASS |
| US03-T08 | LECTEUR | Afficher le dashboard | Affichage en lecture seule ; actions d'écriture absentes | PASS |

## Test automatisé associé

```text
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

## Limite actuelle

Les tests automatisés vérifient les autorisations obtenues avec chaque compte. Ils ne vérifient pas encore directement le contenu interne du claim `role` dans le JWT.

## Conclusion

**US03 validée pour les droits effectivement utilisés par l'application.**
