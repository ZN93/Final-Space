# US08 - Consulter la liste des alertes d’une mission

## État de validation

**US08 validée côté backend et frontend.**

La consultation des alertes d’une mission est opérationnelle.  
Les alertes peuvent être listées par mission et filtrées par statut `ACTIVE` ou `ACQUITTEE`.

La génération automatique des alertes n’est pas incluse dans cette US. Elle dépendra des futures US liées à la télémétrie et à la détection d’anomalies.

---

## Objectif de l’US

Permettre à un utilisateur authentifié de consulter les alertes associées à une mission.

Les rôles ADMIN, OPERATEUR et LECTEUR disposent d’un accès en consultation.

---

## Endpoint testé

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `GET` | `/api/missions/{missionId}/alerts` | Lister les alertes d’une mission | ADMIN, OPERATEUR, LECTEUR |

Paramètre optionnel :

| Paramètre | Valeurs | Description |
|---|---|---|
| `status` | `ACTIVE`, `ACQUITTEE` | Filtrer les alertes par statut |

---

## Données affichées

| Champ | Description | État |
|---|---|---|
| Type | Type d’alerte | PASS |
| Gravité | `FAIBLE`, `MOYENNE`, `ELEVEE` | PASS |
| Satellite concerné | Satellite associé ou mission globale | PASS |
| Date de création | Date/heure de création de l’alerte | PASS |
| Statut | `ACTIVE` ou `ACQUITTEE` | PASS |
| Message | Description synthétique de l’alerte | PASS |

---

## Tests unitaires - AlertService

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US08-T01 | Lister toutes les alertes d’une mission | Liste retournée | PASS |
| US08-T02 | Filtrer les alertes actives | Seules les alertes `ACTIVE` sont retournées | PASS |
| US08-T03 | Filtrer les alertes acquittées | Seules les alertes `ACQUITTEE` sont retournées | PASS |
| US08-T04 | Lister une mission sans alerte | Liste vide retournée | PASS |
| US08-T05 | Lister les alertes d’une mission inexistante | Erreur `Mission introuvable` | PASS |
| US08-T06 | Mapper une alerte sans satellite | Champs satellite à `null` | PASS |

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/alert/service/impl/AlertServiceImplTest.java
```

---

## Tests d’intégration API / sécurité

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US08-T07 | ADMIN consulte les alertes d’une mission | `200 OK` | PASS |
| US08-T08 | OPERATEUR consulte les alertes d’une mission | `200 OK` | PASS |
| US08-T09 | LECTEUR consulte les alertes d’une mission | `200 OK` | PASS |
| US08-T10 | Utilisateur sans token consulte les alertes | `401 Unauthorized` | PASS |
| US08-T11 | Mission inexistante | `404 Not Found` | PASS |
| US08-T12 | Filtre `status=ACTIVE` | `200 OK` | PASS |
| US08-T13 | Filtre `status=ACQUITTEE` | `200 OK` | PASS |

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/security/AlertAuthorizationIntegrationTest.java
```

---

## Tests frontend réalisés

Les tests fonctionnels UI ont été validés manuellement avec les rôles ADMIN, OPERATEUR et LECTEUR.

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US08-T14 | Accéder à la page alertes depuis une mission | Page alertes affichée | PASS |
| US08-T15 | Accéder à la page alertes depuis le dashboard mission | Page alertes affichée | PASS |
| US08-T16 | Afficher une liste vide | Message “Aucune alerte trouvée pour cette mission” visible | PASS |
| US08-T17 | Filtrer sur toutes les alertes | Filtre `Toutes` fonctionnel | PASS |
| US08-T18 | Filtrer sur les alertes actives | Filtre `Actives` fonctionnel | PASS |
| US08-T19 | Filtrer sur les alertes acquittées | Filtre `Acquittées` fonctionnel | PASS |
| US08-T20 | Rafraîchir la liste | Rechargement de la liste | PASS |
| US08-T21 | Revenir au détail mission | Navigation fonctionnelle | PASS |
| US08-T22 | Aller au dashboard mission | Navigation fonctionnelle | PASS |
| US08-T23 | LECTEUR consulte les alertes | Accès autorisé en lecture | PASS |
| US08-T24 | Accéder sans authentification | Redirection vers la page de connexion | PASS |

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

À la date de validation, les tests backend passent avec le résultat suivant :

```text
Tests run: 65, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

---

## Limites MVP

La consultation des alertes est opérationnelle, mais les alertes ne sont pas encore générées automatiquement.

La génération automatique dépendra des futures fonctionnalités :

- import de télémétrie ;
- détection d’anomalies ;
- génération d’alertes à partir des anomalies.

Dans l’état actuel du MVP, une mission peut donc afficher une liste vide d’alertes, ce qui est un comportement valide.

---

## Documentation réalisée

| Élément | État |
|---|---|
| Documentation des tests backend | Réalisée |
| Documentation des tests frontend | Réalisée |
| Endpoint alertes dans le README | À faire |
| Exemple de réponse alertes dans le README | À faire |
| Limites MVP documentées | Réalisée |

---

## Conclusion

L’US08 est validée côté backend et frontend.

La liste des alertes d’une mission est consultable par ADMIN, OPERATEUR et LECTEUR.  
Les filtres par statut `ACTIVE` et `ACQUITTEE` sont disponibles.  
Les états loading, erreur et liste vide sont gérés côté frontend.  
Les accès sans authentification sont refusés.

La génération automatique des alertes reste hors périmètre de cette US et sera traitée dans les futures US liées à la télémétrie et à la détection d’anomalies.