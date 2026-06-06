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