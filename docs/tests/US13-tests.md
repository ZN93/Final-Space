# US13 - Lancer une manœuvre de transfert de Hohmann

## État de validation

**US13 validée côté backend et frontend.**

L’application permet de lancer une manœuvre de transfert de Hohmann depuis la page détail d’un satellite actif.

La manœuvre :

- récupère l’altitude initiale du satellite ;
- récupère l’altitude cible saisie par l’utilisateur ;
- exécute un calcul de transfert de Hohmann simplifié ;
- génère les résultats de Δv et de durée ;
- persiste un run de simulation de type `HOHMANN` ;
- retourne les résultats à l’utilisateur ;
- affiche une visualisation 2D simplifiée.

---

## Objectif de l’US

Permettre à un administrateur ou à un opérateur de lancer une manœuvre de transfert de Hohmann afin d’estimer le coût et les paramètres d’un changement d’orbite pour un satellite.

Les données utilisées sont :

- altitude orbitale initiale issue du satellite ;
- altitude orbitale cible saisie par l’utilisateur ;
- constantes physiques standards ;
- paramètres figés du satellite au moment du lancement.

---

## Choix d’implémentation

La manœuvre de Hohmann réutilise l’entité `SimulationRun`.

Le type de simulation permet de distinguer les runs :

```text
ORBIT
HOHMANN
```

Ce choix permet de conserver une structure commune pour les simulations tout en ajoutant des champs spécifiques à chaque type.

Pour Hohmann, les champs spécifiques sont :

- `targetAltitudeKm` ;
- `deltaV1MS` ;
- `deltaV2MS` ;
- `deltaVTotalMS` ;
- `transferTimeMinutes`.

Les champs spécifiques à la simulation orbitale simple restent `null` pour les runs de type `HOHMANN`.

---

## Endpoint testé

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `POST` | `/api/satellites/{id}/simulations/hohmann` | Lancer une manœuvre de Hohmann | ADMIN, OPERATEUR |

Le rôle `LECTEUR` ne peut pas lancer de manœuvre.

---

## Exemple de requête

```http
POST /api/satellites/3/simulations/hohmann
Authorization: Bearer <token>
Content-Type: application/json
```

Body :

```json
{
  "altitudeTargetKm": 800
}
```

---

## Modèle de données

| Champ | Description | État |
|---|---|---|
| `id` | Identifiant du run | PASS |
| `missionId` | Mission associée | PASS |
| `satelliteId` | Satellite simulé | PASS |
| `type` | Type de simulation, ici `HOHMANN` | PASS |
| `status` | Statut du run | PASS |
| `inputMassKg` | Masse figée au lancement | PASS |
| `inputAltitudeKm` | Altitude initiale figée au lancement | PASS |
| `inputInclinationDeg` | Inclinaison figée au lancement | PASS |
| `inputEccentricity` | Excentricité figée au lancement | PASS |
| `targetAltitudeKm` | Altitude cible saisie | PASS |
| `deltaV1MS` | Δv de départ en m/s | PASS |
| `deltaV2MS` | Δv d’arrivée en m/s | PASS |
| `deltaVTotalMS` | Δv total en m/s | PASS |
| `transferTimeMinutes` | Durée estimée du transfert | PASS |
| `plotDataJson` | Données de visualisation 2D | PASS |
| `createdAt` | Date de lancement | PASS |
| `createdBy` | Auteur de la manœuvre | PASS |

---

## Calculs réalisés

Le moteur de Hohmann utilise un modèle analytique simplifié à deux corps.

Les calculs réalisés sont :

| Calcul | Description | État |
|---|---|---|
| Rayon orbital initial | Rayon terrestre + altitude initiale | PASS |
| Rayon orbital cible | Rayon terrestre + altitude cible | PASS |
| Demi-grand axe de transfert | Moyenne des deux rayons orbitaux | PASS |
| Δv départ | Première impulsion de transfert | PASS |
| Δv arrivée | Seconde impulsion de circularisation | PASS |
| Δv total | Somme des deux impulsions | PASS |
| Durée de transfert | Demi-période de l’orbite de transfert | PASS |
| Visualisation | Orbite initiale, cible et arc de transfert | PASS |

---

## Règles métier couvertes

| Référence | Règle | État |
|---|---|---|
| RG-HOH-01 | Une manœuvre ne peut être lancée que sur un satellite actif | PASS |
| RG-HOH-02 | Une manœuvre ne peut pas être lancée sur une mission clôturée | PASS |
| RG-HOH-03 | L’altitude cible est obligatoire | PASS |
| RG-HOH-04 | L’altitude cible doit être strictement positive | PASS |
| RG-HOH-05 | L’altitude cible doit être différente de l’altitude initiale | PASS |
| RG-HOH-06 | Les paramètres utilisés sont figés au lancement | PASS |
| RG-HOH-07 | Chaque lancement crée un nouveau run | PASS |
| RG-HOH-08 | Le run est persisté en base de données | PASS |
| RG-HOH-09 | ADMIN et OPERATEUR peuvent lancer une manœuvre | PASS |
| RG-HOH-10 | LECTEUR ne peut pas lancer de manœuvre | PASS |
| RG-HOH-11 | Le résultat est affiché côté frontend | PASS |

---

## Tests unitaires - HohmannTransferService

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US13-T01 | Calculer un transfert vers une orbite plus haute | Δv et durée positifs | PASS |
| US13-T02 | Calculer un transfert vers une orbite plus basse | Δv et durée positifs | PASS |
| US13-T03 | Altitude initiale nulle | Erreur métier | PASS |
| US13-T04 | Altitude initiale négative | Erreur métier | PASS |
| US13-T05 | Altitude cible nulle | Erreur métier | PASS |
| US13-T06 | Altitude cible négative | Erreur métier | PASS |
| US13-T07 | Altitude cible identique à l’altitude initiale | Erreur métier | PASS |

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/simulation/service/impl/HohmannTransferServiceImplTest.java
```

---

## Tests unitaires - SimulationService

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US13-T08 | Lancer Hohmann sur satellite actif | Run `HOHMANN` créé | PASS |
| US13-T09 | Satellite inexistant | Erreur `Satellite introuvable` | PASS |
| US13-T10 | Satellite inactif | Manœuvre refusée | PASS |
| US13-T11 | Mission clôturée | Manœuvre refusée | PASS |
| US13-T12 | Altitude cible invalide | Erreur métier transmise | PASS |

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/simulation/service/impl/SimulationServiceImplHohmannTest.java
```

---

## Tests d’intégration API / sécurité

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US13-T13 | ADMIN lance une manœuvre de Hohmann | `201 Created` | PASS |
| US13-T14 | OPERATEUR lance une manœuvre de Hohmann | `201 Created` | PASS |
| US13-T15 | LECTEUR tente de lancer une manœuvre | `403 Forbidden` | PASS |
| US13-T16 | Lancement sans token | `401 Unauthorized` | PASS |
| US13-T17 | Satellite inactif | `400 Bad Request` | PASS |
| US13-T18 | Altitude cible identique à l’altitude initiale | `400 Bad Request` | PASS |
| US13-T19 | Altitude cible négative | `400 Bad Request` | PASS |

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/security/SimulationAuthorizationIntegrationTest.java
```

---

## Tests Postman réalisés

| Scénario | Endpoint | Résultat attendu | État |
|---|---|---|---|
| ADMIN lance Hohmann sur satellite actif | `POST /api/satellites/{id}/simulations/hohmann` | `201 Created` | PASS |
| OPERATEUR lance Hohmann sur satellite actif | `POST /api/satellites/{id}/simulations/hohmann` | `201 Created` | PASS |
| LECTEUR tente de lancer Hohmann | `POST /api/satellites/{id}/simulations/hohmann` | `403 Forbidden` | PASS |
| Satellite inactif | `POST /api/satellites/{id}/simulations/hohmann` | `400 Bad Request` | PASS |
| Altitude cible identique | `POST /api/satellites/{id}/simulations/hohmann` | `400 Bad Request` | PASS |
| Altitude cible négative | `POST /api/satellites/{id}/simulations/hohmann` | `400 Bad Request` | PASS |

---

## Tests frontend réalisés

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US13-T20 | Afficher la section Hohmann sur satellite actif | Section visible | PASS |
| US13-T21 | Saisir une altitude cible valide | Formulaire valide | PASS |
| US13-T22 | Lancer une manœuvre avec ADMIN | Résultat affiché | PASS |
| US13-T23 | Lancer une manœuvre avec OPERATEUR | Résultat affiché | PASS |
| US13-T24 | Accès LECTEUR | Formulaire absent | PASS |
| US13-T25 | Satellite inactif | Formulaire absent | PASS |
| US13-T26 | Altitude cible identique | Message d’erreur affiché | PASS |
| US13-T27 | Altitude cible négative | Message d’erreur affiché | PASS |
| US13-T28 | Afficher Δv départ | Valeur visible | PASS |
| US13-T29 | Afficher Δv arrivée | Valeur visible | PASS |
| US13-T30 | Afficher Δv total | Valeur visible | PASS |
| US13-T31 | Afficher durée estimée | Valeur visible | PASS |
| US13-T32 | Afficher visualisation 2D | Trajectoire affichée | PASS |
| US13-T33 | Compilation frontend | Build Angular OK | PASS |

---

## Résultat d’exécution automatisée

Commande exécutée côté backend :

```bash
./mvnw clean test
```

Résultat :

```text
Tests run: 155, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

Commande exécutée côté frontend :

```bash
npm run build
```

Résultat :

```text
Build Angular OK
```

---

## Validation fonctionnelle

L’US13 est validée côté backend et frontend.

Les cas suivants ont été confirmés :

- ADMIN peut lancer une manœuvre de Hohmann sur un satellite actif ;
- OPERATEUR peut lancer une manœuvre de Hohmann sur un satellite actif ;
- LECTEUR ne peut pas lancer de manœuvre ;
- un satellite inactif ne peut pas être utilisé pour lancer une manœuvre ;
- une altitude cible négative est refusée ;
- une altitude cible identique à l’altitude initiale est refusée ;
- les résultats sont persistés ;
- les résultats sont affichés dans l’interface ;
- la visualisation 2D est affichée sur la page détail satellite.

---

## Limites actuelles

La manœuvre de Hohmann reste simplifiée.

Le MVP ne couvre pas encore :

- les changements de plan orbital ;
- les manœuvres bi-elliptiques ;
- les perturbations gravitationnelles ;
- les trajectoires multi-corps ;
- l’optimisation de trajectoire ;
- les contraintes carburant ;
- l’historique complet des simulations côté UI ;
- une page détail de simulation accessible par URL.

---

## Perspectives d’évolution

Évolutions possibles :

- historique consultable des manœuvres ;
- détail d’un run de simulation ;
- export des résultats ;
- comparaison entre plusieurs manœuvres ;
- ajout d’un moteur de calcul spécialisé ;
- extraction du moteur de simulation dans un service dédié ;
- visualisation 2D/3D plus réaliste.

---

## Documentation réalisée

| Élément | État |
|---|---|
| Documentation des tests backend | Réalisée |
| Documentation des tests frontend | Réalisée |
| Documentation des choix d’architecture | Réalisée |
| README mis à jour | Réalisée |

---

## Conclusion

L’US13 est terminée.

Le lancement d’une manœuvre de transfert de Hohmann est disponible depuis la page détail satellite.

Le backend calcule, persiste et retourne les résultats.

Le frontend affiche les résultats, les paramètres figés et une visualisation 2D simplifiée.

Les droits d’accès et les règles métier sont respectés.