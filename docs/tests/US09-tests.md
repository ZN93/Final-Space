# US09 - Acquitter une alerte

## État de validation

**US09 validée côté backend et frontend.**

L’acquittement d’une alerte active est opérationnel côté API.  
Le frontend permet d’afficher un bouton d’acquittement sur les alertes actives pour les rôles autorisés.

Une alerte acquittée reste consultable, mais ne peut plus être réacquittée.

---

## Objectif de l’US

Permettre à un administrateur ou à un opérateur d’acquitter une alerte active afin d’indiquer qu’elle a été prise en charge.

L’acquittement enregistre :

- le nouveau statut `ACQUITTEE` ;
- la date d’acquittement `ackAt` ;
- l’utilisateur ayant acquitté l’alerte `ackBy`.

---

## Endpoint testé

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `POST` | `/api/alerts/{alertId}/ack` | Acquitter une alerte active | ADMIN, OPERATEUR |

---

## Règles métier couvertes

| Référence | Règle | État |
|---|---|---|
| RG-ACK-01 | Seules les alertes `ACTIVE` peuvent être acquittées | PASS |
| RG-ACK-02 | Une alerte acquittée passe au statut `ACQUITTEE` | PASS |
| RG-ACK-03 | La date d’acquittement est enregistrée dans `ackAt` | PASS |
| RG-ACK-04 | L’utilisateur ayant acquitté est enregistré dans `ackBy` | PASS |
| RG-ACK-05 | Une alerte déjà acquittée ne peut pas être réacquittée | PASS |
| RG-ACK-06 | L’acquittement ne crée pas automatiquement d’incident | PASS |

---

## Tests unitaires - AlertService

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US09-T01 | Acquitter une alerte active | Statut `ACQUITTEE`, `ackAt` et `ackBy` renseignés | PASS |
| US09-T02 | Acquitter une alerte inexistante | Erreur `Alerte introuvable` | PASS |
| US09-T03 | Acquitter une alerte déjà acquittée | Erreur métier `Alerte déjà acquittée` | PASS |

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/alert/service/impl/AlertServiceImplTest.java
```

---

## Tests d’intégration API / sécurité

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US09-T04 | ADMIN acquitte une alerte active | `200 OK` | PASS |
| US09-T05 | OPERATEUR acquitte une alerte active | `200 OK` | PASS |
| US09-T06 | LECTEUR tente d’acquitter une alerte | `403 Forbidden` | PASS |
| US09-T07 | Utilisateur sans token tente d’acquitter une alerte | `401 Unauthorized` | PASS |
| US09-T08 | Acquitter une alerte inexistante | `404 Not Found` | PASS |
| US09-T09 | Acquitter une alerte déjà acquittée | `400 Bad Request` | PASS |

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/security/AlertAcknowledgementAuthorizationIntegrationTest.java
```

---

## Tests Postman réalisés

| Rôle | Scénario | Résultat attendu | État |
|---|---|---|---|
| ADMIN | Appel de l’endpoint d’acquittement avec une alerte inexistante | `404 Not Found` | PASS |
| OPERATEUR | Appel de l’endpoint d’acquittement avec une alerte inexistante | `404 Not Found` | PASS |
| LECTEUR | Tentative d’acquittement | `403 Forbidden` | PASS |

Remarque : le retour `404` pour ADMIN et OPERATEUR confirme que l’endpoint est accessible aux rôles autorisés, mais que l’alerte testée n’existe pas en base locale.

---

## Tests frontend réalisés

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US09-T10 | Afficher le bouton `Acquitter` sur une alerte active | Bouton visible pour ADMIN / OPERATEUR | PASS |
| US09-T11 | Masquer le bouton pour LECTEUR | LECTEUR voit uniquement la consultation | PASS |
| US09-T12 | Masquer le bouton sur une alerte déjà acquittée | Alerte en lecture seule | PASS |
| US09-T13 | Confirmer l’acquittement | Confirmation affichée avant appel API | PASS |
| US09-T14 | Acquittement réussi | Message de succès et rechargement de la liste | PASS |
| US09-T15 | Erreur 403 | Redirection vers `/forbidden` | PASS |
| US09-T16 | Erreur 400 / 409 | Message “alerte déjà acquittée” | PASS |
| US09-T17 | Compilation frontend | Build Angular OK | PASS |

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
Tests run: 74, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS côté backend
Application bundle generation complete côté frontend
```

---

## Limites MVP

La génération automatique des alertes n’est pas encore implémentée.  
L’US09 traite uniquement l’acquittement d’une alerte existante.

La création automatique des alertes dépendra des futures fonctionnalités :

- import de télémétrie ;
- détection d’anomalies ;
- génération d’alertes à partir des anomalies.

---

## Documentation réalisée

| Élément | État |
|---|---|
| Documentation des tests backend | Réalisée |
| Documentation des tests frontend | Réalisée |
| Endpoint d’acquittement dans le README | À faire |
| Exemple de réponse d’acquittement dans le README | À faire |

---

## Conclusion

L’US09 est validée côté backend et frontend.

Les rôles ADMIN et OPERATEUR peuvent acquitter une alerte active.  
Le rôle LECTEUR conserve un accès en consultation uniquement.  
L’acquittement renseigne le statut, la date et l’utilisateur ayant pris en charge l’alerte.