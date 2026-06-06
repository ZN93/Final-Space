# US07 - Consulter un dashboard de mission

## État de validation

**US07 validée côté backend et frontend.**

Le dashboard mission permet d’afficher une vue synthétique d’une mission avec les indicateurs disponibles dans le MVP.

Les indicateurs liés aux satellites sont calculés depuis les données en base.  
Les indicateurs liés aux alertes, incidents, simulations et imports de télémétrie sont présents dans la réponse mais restent à zéro ou vides tant que les modules correspondants ne sont pas implémentés.

---

## Objectif de l’US

Permettre à un utilisateur authentifié de consulter un dashboard de mission afin d’avoir une vue synthétique de son état opérationnel.

Le dashboard est accessible pour les rôles ADMIN, OPERATEUR et LECTEUR.

---

## Endpoint testé

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `GET` | `/api/missions/{id}/dashboard` | Consulter le dashboard d’une mission | ADMIN, OPERATEUR, LECTEUR |

---

## Données affichées

| Indicateur | Source | État |
|---|---|---|
| Nom de la mission | Mission | PASS |
| Statut de la mission | Mission | PASS |
| Nombre total de satellites | SatelliteRepository | PASS |
| Nombre de satellites actifs | SatelliteRepository | PASS |
| Nombre de satellites inactifs | SatelliteRepository | PASS |
| Alertes actives | Valeur MVP temporaire | PASS |
| Alertes acquittées | Valeur MVP temporaire | PASS |
| Incidents ouverts | Valeur MVP temporaire | PASS |
| Incidents en cours | Valeur MVP temporaire | PASS |
| Incidents clôturés | Valeur MVP temporaire | PASS |
| Dernières simulations | Liste vide MVP | PASS |
| Derniers imports télémétrie | Liste vide MVP | PASS |

---

## Tests unitaires - MissionDashboardService

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US07-T01 | Consulter le dashboard d’une mission active | KPI mission et satellites retournés | PASS |
| US07-T02 | Consulter le dashboard d’une mission clôturée | Dashboard consultable | PASS |
| US07-T03 | Consulter le dashboard d’une mission inexistante | Erreur `Mission introuvable` | PASS |

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/dashboard/service/impl/MissionDashboardServiceImplTest.java
```

---

## Tests d’intégration API / sécurité

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US07-T04 | ADMIN consulte le dashboard | `200 OK` | PASS |
| US07-T05 | OPERATEUR consulte le dashboard | `200 OK` | PASS |
| US07-T06 | LECTEUR consulte le dashboard | `200 OK` | PASS |
| US07-T07 | Utilisateur sans token consulte le dashboard | `401 Unauthorized` | PASS |
| US07-T08 | Dashboard d’une mission inexistante | `404 Not Found` | PASS |
| US07-T09 | Dashboard d’une mission clôturée | `200 OK` | PASS |

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/security/MissionDashboardAuthorizationIntegrationTest.java
```

---

## Tests frontend réalisés

Les tests fonctionnels UI ont été validés manuellement avec les rôles ADMIN, OPERATEUR et LECTEUR.

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US07-T10 | Accéder au dashboard depuis le détail mission | Page dashboard affichée | PASS |
| US07-T11 | Afficher les KPI satellites | Total, actifs et inactifs cohérents | PASS |
| US07-T12 | Afficher les KPI alertes/incidents | Valeurs MVP à zéro visibles | PASS |
| US07-T13 | Afficher les dernières activités | Sections simulations et télémétrie visibles | PASS |
| US07-T14 | Rafraîchir le dashboard | Données rechargées | PASS |
| US07-T15 | Revenir au détail mission | Navigation fonctionnelle | PASS |
| US07-T16 | LECTEUR consulte le dashboard | Accès autorisé en lecture | PASS |
| US07-T17 | Consulter le dashboard d’une mission clôturée | Dashboard consultable avec statut `CLOTUREE` | PASS |
| US07-T18 | Accéder sans authentification | Redirection vers login | PASS |

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

---

## Documentation réalisée

| Élément | État |
|---|---|
| Documentation des tests backend | Réalisée |
| Documentation des tests frontend | Réalisée |
| Endpoint dashboard dans le README | Réalisée |
| Exemple de réponse dashboard dans le README | Réalisée |

---

## Conclusion

L’US07 est validée côté backend et frontend.

Le dashboard mission est accessible aux rôles ADMIN, OPERATEUR et LECTEUR.  
Il affiche les informations générales de la mission, les KPI satellites et les sections d’activité prévues pour les futurs modules.

Le dashboard reste consultable même si la mission est clôturée.

Les indicateurs liés aux alertes, incidents, simulations et imports de télémétrie sont présents dans la réponse mais restent temporairement à zéro ou vides dans le cadre du MVP, car les modules correspondants ne sont pas encore implémentés.