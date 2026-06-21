# US14 - Consulter l’historique des simulations

## État de validation

**US14 validée côté backend et frontend.**

L’application permet de consulter l’historique des simulations associées à un satellite.

L’utilisateur peut :

- consulter la liste des simulations d’un satellite ;
- identifier le type de simulation réalisée ;
- visualiser les résultats synthétiques ;
- accéder au détail complet d’une simulation ;
- consulter les paramètres figés utilisés lors du lancement ;
- consulter les résultats calculés ;
- consulter une visualisation 2D simplifiée.

---

## Objectif de l’US

Permettre à un utilisateur authentifié de consulter l’historique des simulations afin de retrouver, analyser et comparer les résultats des simulations effectuées sur un satellite.

Les simulations concernées sont :

- les simulations orbitales simples ;
- les manœuvres de transfert de Hohmann.

---

## Dépendances

| User Story | Description | État |
|---|---|---|
| US12 | Lancer une simulation d’orbite | Validée |
| US13 | Lancer une manœuvre de transfert de Hohmann | Validée |

L’US14 s’appuie sur les runs de simulation déjà persistés par les US12 et US13.

---

## Choix d’implémentation

L’historique repose sur l’entité `SimulationRun`.

Cette entité conserve les informations communes aux différents types de simulation :

- mission associée ;
- satellite associé ;
- type de simulation ;
- statut ;
- paramètres figés ;
- résultats calculés ;
- données de visualisation ;
- date de lancement ;
- auteur.

Le champ `type` permet de distinguer les simulations :

```text
ORBIT
HOHMANN
```

Deux DTO ont été ajoutés pour séparer les besoins d’affichage :

| DTO | Utilisation |
|---|---|
| `SimulationListItemResponse` | Affichage de la liste des simulations |
| `SimulationDetailResponse` | Affichage du détail complet d’une simulation |

Ce découpage évite de renvoyer les données techniques lourdes, notamment `plotDataJson`, dans la liste.

---

## Endpoints ajoutés

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `GET` | `/api/satellites/{id}/simulations` | Consulter l’historique des simulations d’un satellite | ADMIN, OPERATEUR, LECTEUR |
| `GET` | `/api/simulations/{id}` | Consulter le détail complet d’une simulation | ADMIN, OPERATEUR, LECTEUR |

---

## Règles métier couvertes

| Référence | Règle | État |
|---|---|---|
| RG-HIST-01 | Les simulations sont conservées sans limitation de durée | PASS |
| RG-HIST-02 | Les simulations ne peuvent pas être modifiées | PASS |
| RG-HIST-03 | Les simulations ne peuvent pas être supprimées | PASS |
| RG-HIST-04 | Les simulations restent consultables même si la mission est clôturée | PASS |
| RG-HIST-05 | Les simulations restent consultables même si le satellite est inactif | PASS |
| RG-HIST-06 | L’historique est trié par date décroissante | PASS |
| RG-HIST-07 | Le détail d’une simulation est consultable | PASS |
| RG-HIST-08 | ADMIN peut consulter l’historique | PASS |
| RG-HIST-09 | OPERATEUR peut consulter l’historique | PASS |
| RG-HIST-10 | LECTEUR peut consulter l’historique | PASS |
| RG-HIST-11 | Un utilisateur non authentifié est refusé | PASS |

---

## Données affichées dans la liste

La liste des simulations affiche les informations suivantes :

| Champ | Description | État |
|---|---|---|
| `id` | Identifiant de la simulation | PASS |
| `missionId` | Identifiant de la mission associée | PASS |
| `missionName` | Nom de la mission associée | PASS |
| `satelliteId` | Identifiant du satellite associé | PASS |
| `satelliteName` | Nom du satellite associé | PASS |
| `type` | Type de simulation | PASS |
| `status` | Statut de la simulation | PASS |
| `createdAt` | Date de lancement | PASS |
| `createdBy` | Auteur du lancement | PASS |
| `inputAltitudeKm` | Altitude initiale utilisée | PASS |
| `targetAltitudeKm` | Altitude cible pour Hohmann | PASS |
| `orbitalPeriodMinutes` | Période orbitale pour ORBIT | PASS |
| `averageVelocityKmS` | Vitesse moyenne pour ORBIT | PASS |
| `orbitShape` | Forme de l’orbite pour ORBIT | PASS |
| `deltaVTotalMS` | Δv total pour HOHMANN | PASS |
| `transferTimeMinutes` | Durée du transfert pour HOHMANN | PASS |

---

## Données affichées dans le détail

Le détail d’une simulation affiche les informations suivantes :

| Champ | Description | État |
|---|---|---|
| `id` | Identifiant de la simulation | PASS |
| `missionId` | Identifiant de la mission associée | PASS |
| `missionName` | Nom de la mission associée | PASS |
| `satelliteId` | Identifiant du satellite associé | PASS |
| `satelliteName` | Nom du satellite associé | PASS |
| `type` | Type de simulation | PASS |
| `status` | Statut du run | PASS |
| `inputMassKg` | Masse figée au lancement | PASS |
| `inputAltitudeKm` | Altitude initiale figée | PASS |
| `inputInclinationDeg` | Inclinaison figée | PASS |
| `inputEccentricity` | Excentricité figée | PASS |
| `orbitalPeriodMinutes` | Période orbitale | PASS |
| `averageVelocityKmS` | Vitesse moyenne | PASS |
| `orbitShape` | Forme de l’orbite | PASS |
| `targetAltitudeKm` | Altitude cible Hohmann | PASS |
| `deltaV1MS` | Δv départ | PASS |
| `deltaV2MS` | Δv arrivée | PASS |
| `deltaVTotalMS` | Δv total | PASS |
| `transferTimeMinutes` | Durée estimée | PASS |
| `plotDataJson` | Données de visualisation | PASS |
| `createdAt` | Date de lancement | PASS |
| `createdBy` | Auteur | PASS |

---

## Tests unitaires - SimulationHistoryServiceImplTest

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/simulation/service/impl/SimulationHistoryServiceImplTest.java
```

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US14-T01 | Récupérer l’historique d’un satellite avec plusieurs simulations | Liste retournée avec les runs | PASS |
| US14-T02 | Vérifier le tri par date décroissante | Simulation la plus récente en premier | PASS |
| US14-T03 | Récupérer l’historique d’un satellite sans simulation | Liste vide retournée | PASS |
| US14-T04 | Récupérer l’historique d’un satellite inexistant | Erreur `Satellite introuvable` | PASS |
| US14-T05 | Récupérer le détail d’une simulation | Détail complet retourné | PASS |
| US14-T06 | Récupérer une simulation inexistante | Erreur `Simulation introuvable` | PASS |

---

## Tests d’intégration API / sécurité

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/security/SimulationAuthorizationIntegrationTest.java
```

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US14-T07 | ADMIN consulte l’historique d’un satellite | `200 OK` | PASS |
| US14-T08 | LECTEUR consulte l’historique d’un satellite | `200 OK` | PASS |
| US14-T09 | Historique demandé pour satellite inexistant | `404 Not Found` | PASS |
| US14-T10 | Historique demandé sans token | `401 Unauthorized` | PASS |
| US14-T11 | ADMIN consulte le détail d’une simulation | `200 OK` | PASS |
| US14-T12 | LECTEUR consulte le détail d’une simulation | `200 OK` | PASS |
| US14-T13 | Détail demandé pour simulation inexistante | `404 Not Found` | PASS |
| US14-T14 | Détail demandé sans token | `401 Unauthorized` | PASS |

---

## Tests Postman réalisés

| Scénario | Endpoint | Résultat attendu | État |
|---|---|---|---|
| Consulter l’historique d’un satellite | `GET /api/satellites/{id}/simulations` | Liste des simulations | PASS |
| Consulter le détail d’une simulation Hohmann | `GET /api/simulations/{id}` | Détail complet | PASS |
| Vérifier les champs Hohmann | `GET /api/simulations/{id}` | Δv, durée, altitude cible | PASS |
| Vérifier les paramètres figés | `GET /api/simulations/{id}` | masse, altitude, inclinaison, excentricité | PASS |
| Vérifier `plotDataJson` | `GET /api/simulations/{id}` | Données de visualisation présentes | PASS |

---

## Tests frontend réalisés

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US14-T15 | Afficher l’historique sur la page détail satellite | Tableau visible | PASS |
| US14-T16 | Afficher une simulation ORBIT dans le tableau | Type et résumé orbitaux visibles | PASS |
| US14-T17 | Afficher une simulation HOHMANN dans le tableau | Type et résumé Hohmann visibles | PASS |
| US14-T18 | Afficher les colonnes date, type, statut, auteur, résumé | Colonnes visibles | PASS |
| US14-T19 | Cliquer sur `Voir détail` | Navigation vers `/simulations/{id}` | PASS |
| US14-T20 | Afficher le détail d’une simulation | Page détail visible | PASS |
| US14-T21 | Afficher les paramètres figés | Paramètres visibles | PASS |
| US14-T22 | Afficher les résultats calculés | Résultats visibles | PASS |
| US14-T23 | Afficher la visualisation 2D | Visualisation visible | PASS |
| US14-T24 | Consulter l’historique avec le rôle LECTEUR | Accès autorisé | PASS |
| US14-T25 | Consulter le détail avec le rôle LECTEUR | Accès autorisé | PASS |
| US14-T26 | Historique vide | Message d’état vide affiché | PASS |
| US14-T27 | Erreur de chargement | Message d’erreur affiché | PASS |
| US14-T28 | Build Angular | Build OK | PASS |

---

## Résultat d’exécution automatisée

Commande exécutée côté backend :

```bash
./mvnw clean test
```

Résultat :

```text
Tests run: 168, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

Commande exécutée côté frontend :

```bash
npm run build
```

Résultat :

```text
Application bundle generation complete
```

---

## Validation navigateur

La fonctionnalité a été testée manuellement dans le navigateur.

Cas validés :

- l’historique des simulations apparaît sur la page détail satellite ;
- les simulations sont affichées dans un tableau ;
- les simulations sont bien distinguées par type ;
- le résumé affiché dépend du type de simulation ;
- le clic sur `Voir détail` ouvre la page détail ;
- la page détail affiche les paramètres et les résultats ;
- la page détail affiche une visualisation 2D ;
- le rôle `LECTEUR` peut consulter l’historique ;
- le rôle `LECTEUR` peut consulter le détail d’une simulation.

---

## Sécurité

| Rôle | Historique satellite | Détail simulation |
|---|---|---|
| ADMIN | Autorisé | Autorisé |
| OPERATEUR | Autorisé | Autorisé |
| LECTEUR | Autorisé | Autorisé |
| Non authentifié | Refusé | Refusé |

---

## Hors périmètre

Les éléments suivants ne sont pas couverts par l’US14 :

- suppression des simulations ;
- modification des simulations ;
- comparaison avancée entre plusieurs simulations ;
- rejeu d’une simulation existante ;
- duplication d’une simulation existante ;
- export CSV/PDF ;
- pagination ;
- filtrage avancé ;
- historique global par mission côté interface.

---

## Limites actuelles

La fonctionnalité actuelle ne propose pas encore :

- de pagination ;
- de filtre par type de simulation ;
- de recherche dans l’historique ;
- de comparaison graphique ;
- d’export des résultats ;
- de page historique mission dédiée.

---

## Perspectives d’évolution

Évolutions possibles :

- ajouter un historique des simulations au niveau mission ;
- ajouter une pagination côté backend et frontend ;
- ajouter des filtres par type de simulation ;
- ajouter une comparaison entre simulations ;
- ajouter l’export CSV/PDF ;
- améliorer la visualisation 2D ;
- ajouter une visualisation 3D simplifiée ;
- ajouter des graphiques comparatifs entre plusieurs runs.

---

## Conclusion

L’US14 est terminée.

L’application permet désormais de consulter l’historique des simulations d’un satellite et d’accéder au détail complet d’une simulation.

Les simulations orbitales et les manœuvres de Hohmann sont historisées, consultables et affichées côté frontend.

Les droits d’accès sont respectés pour les rôles ADMIN, OPERATEUR et LECTEUR.

Les tests backend passent avec succès et le build frontend est validé.