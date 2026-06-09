# US12 - Lancer une simulation d’orbite

## État de validation

**US12 validée côté backend et frontend.**

L’application permet de lancer une simulation orbitale depuis la page détail d’un satellite actif.

La simulation :

- récupère les paramètres orbitaux du satellite ;
- exécute un calcul orbital simplifié ;
- génère des résultats exploitables ;
- persiste un run de simulation en base ;
- retourne les résultats à l’utilisateur ;
- affiche une visualisation 2D simplifiée.

---

## Objectif de l’US

Permettre à un administrateur ou à un opérateur de lancer une simulation orbitale afin d’analyser le comportement orbital d’un satellite à partir de ses paramètres.

Les paramètres utilisés sont :

- masse du satellite ;
- altitude orbitale initiale ;
- inclinaison orbitale ;
- excentricité.

Ces paramètres sont figés au moment du lancement de la simulation.

---

## Choix d’implémentation

Une page détail satellite dédiée a été créée :

```http
/satellites/{id}
```

Ce choix permet de centraliser les actions propres à un satellite :

- consultation du satellite ;
- modification des paramètres orbitaux ;
- désactivation du satellite ;
- lancement de simulation orbitale ;
- affichage du résultat.

Cette approche est plus propre qu’un simple bouton ajouté dans le tableau des satellites d’une mission, car elle prépare les futures évolutions :

- historique des simulations ;
- page détail d’un run de simulation ;
- visualisations orbitales enrichies ;
- séparation claire entre les responsabilités Mission, Satellite et Simulation.

---

## Endpoint testé

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `POST` | `/api/satellites/{id}/simulations/orbit` | Lancer une simulation orbitale | ADMIN, OPERATEUR |

Le rôle `LECTEUR` dispose uniquement d’un accès en consultation.

---

## Modèle de données

Une entité `SimulationRun` a été ajoutée afin de conserver chaque lancement de simulation.

| Champ | Description | État |
|---|---|---|
| `id` | Identifiant du run | PASS |
| `missionId` | Mission associée | PASS |
| `satelliteId` | Satellite simulé | PASS |
| `type` | Type de simulation, `ORBIT` | PASS |
| `status` | Statut du run, `SUCCESS` ou `FAILED` | PASS |
| `inputMassKg` | Masse figée au lancement | PASS |
| `inputAltitudeKm` | Altitude figée au lancement | PASS |
| `inputInclinationDeg` | Inclinaison figée au lancement | PASS |
| `inputEccentricity` | Excentricité figée au lancement | PASS |
| `orbitalPeriodMinutes` | Période orbitale calculée | PASS |
| `averageVelocityKmS` | Vitesse orbitale moyenne calculée | PASS |
| `orbitShape` | Forme de l’orbite | PASS |
| `plotDataJson` | Données de visualisation 2D | PASS |
| `createdAt` | Date de lancement | PASS |
| `createdBy` | Auteur de la simulation | PASS |

---

## Calculs réalisés

Le moteur de simulation utilise un modèle analytique simplifié à deux corps.

Les calculs réalisés sont :

| Calcul | Description | État |
|---|---|---|
| Période orbitale | Estimation de la durée d’un tour orbital | PASS |
| Vitesse moyenne | Estimation de la vitesse orbitale moyenne | PASS |
| Forme orbitale | `CIRCULAIRE` ou `ELLIPTIQUE` selon l’excentricité | PASS |
| Données de tracé | Points ou données permettant une visualisation 2D | PASS |

---

## Règles métier couvertes

| Référence | Règle | État |
|---|---|---|
| RG-SIM-01 | Une simulation ne peut être lancée que sur un satellite actif | PASS |
| RG-SIM-02 | Une simulation ne peut pas être lancée sur une mission clôturée | PASS |
| RG-SIM-03 | Les paramètres orbitaux doivent être valides | PASS |
| RG-SIM-04 | Les paramètres utilisés sont figés au moment du lancement | PASS |
| RG-SIM-05 | Chaque lancement crée un nouveau run | PASS |
| RG-SIM-06 | Le run est persisté en base de données | PASS |
| RG-SIM-07 | ADMIN et OPERATEUR peuvent lancer une simulation | PASS |
| RG-SIM-08 | LECTEUR ne peut pas lancer de simulation | PASS |
| RG-SIM-09 | Le résultat est affiché côté frontend | PASS |

---

## Tests unitaires - OrbitSimulationService

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US12-T01 | Calculer une orbite circulaire valide | Résultats positifs et forme `CIRCULAIRE` | PASS |
| US12-T02 | Calculer une orbite elliptique valide | Résultats positifs et forme `ELLIPTIQUE` | PASS |
| US12-T03 | Altitude invalide | Erreur métier | PASS |
| US12-T04 | Inclinaison invalide | Erreur métier | PASS |
| US12-T05 | Excentricité négative | Erreur métier | PASS |
| US12-T06 | Excentricité non supportée | Erreur métier | PASS |

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/simulation/service/impl/OrbitSimulationServiceImplTest.java
```

---

## Tests unitaires - SimulationService

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US12-T07 | Lancer une simulation sur satellite actif | Run créé et réponse retournée | PASS |
| US12-T08 | Satellite inexistant | Erreur `Satellite introuvable` | PASS |
| US12-T09 | Satellite inactif | Simulation refusée | PASS |
| US12-T10 | Mission clôturée | Simulation refusée | PASS |
| US12-T11 | Masse invalide | Simulation refusée | PASS |
| US12-T12 | Altitude invalide | Simulation refusée | PASS |
| US12-T13 | Inclinaison invalide | Simulation refusée | PASS |
| US12-T14 | Excentricité invalide | Simulation refusée | PASS |

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/simulation/service/impl/SimulationServiceImplTest.java
```

---

## Tests d’intégration API / sécurité

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US12-T15 | ADMIN lance une simulation orbitale | `201 Created` | PASS |
| US12-T16 | OPERATEUR lance une simulation orbitale | `201 Created` | PASS |
| US12-T17 | LECTEUR tente de lancer une simulation | `403 Forbidden` | PASS |
| US12-T18 | Lancement sans token | `401 Unauthorized` | PASS |
| US12-T19 | Satellite inexistant | `404 Not Found` | PASS |
| US12-T20 | Satellite inactif | `400 Bad Request` | PASS |
| US12-T21 | Satellite actif sur mission clôturée | `400 Bad Request` | PASS |
| US12-T22 | Vérifier le payload de résultat | Résultats calculés présents | PASS |
| US12-T23 | Vérifier la persistance du run | Run présent en base | PASS |

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/security/SimulationAuthorizationIntegrationTest.java
```

---

## Tests Postman réalisés

| Scénario | Endpoint | Résultat attendu | État |
|---|---|---|---|
| ADMIN lance une simulation sur satellite actif | `POST /api/satellites/{id}/simulations/orbit` | `201 Created` | PASS |
| OPERATEUR lance une simulation sur satellite actif | `POST /api/satellites/{id}/simulations/orbit` | `201 Created` | PASS |
| ADMIN lance sur satellite inactif | `POST /api/satellites/{id}/simulations/orbit` | `400 Bad Request` | PASS |
| OPERATEUR lance sur satellite inactif | `POST /api/satellites/{id}/simulations/orbit` | `400 Bad Request` | PASS |
| LECTEUR tente de lancer une simulation | `POST /api/satellites/{id}/simulations/orbit` | `403 Forbidden` | PASS |

---

## Tests frontend réalisés

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US12-T24 | Accéder à la page détail satellite | Page `/satellites/{id}` affichée | PASS |
| US12-T25 | Lancer une simulation avec ADMIN | Résultat affiché | PASS |
| US12-T26 | Lancer une simulation avec OPERATEUR | Résultat affiché | PASS |
| US12-T27 | Accès LECTEUR | Action de lancement absente | PASS |
| US12-T28 | Satellite inactif | Action de lancement absente | PASS |
| US12-T29 | Afficher la période orbitale | Valeur visible | PASS |
| US12-T30 | Afficher la vitesse moyenne | Valeur visible | PASS |
| US12-T31 | Afficher la forme orbitale | Valeur visible | PASS |
| US12-T32 | Afficher les paramètres figés | Valeurs visibles | PASS |
| US12-T33 | Afficher la date et l’auteur | Valeurs visibles | PASS |
| US12-T34 | Afficher la visualisation 2D | Trajectoire affichée | PASS |
| US12-T35 | Compilation frontend | Build Angular OK | PASS |

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
Tests run: 136, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS côté backend
Application bundle generation complete côté frontend
```

Warnings frontend constatés mais non bloquants :

```text
Budgets CSS dépassés sur certains composants
4 rules skipped due to selector errors
```

---

## Validation fonctionnelle

L’US12 est validée côté backend et frontend.

Les cas suivants ont été confirmés :

- ADMIN peut lancer une simulation sur un satellite actif ;
- OPERATEUR peut lancer une simulation sur un satellite actif ;
- LECTEUR ne peut pas lancer de simulation ;
- un satellite inactif ne peut pas être simulé ;
- une mission clôturée bloque le lancement ;
- les résultats sont persistés ;
- les résultats sont affichés dans l’interface ;
- la visualisation 2D est affichée sur la page détail satellite.

---

## Limites actuelles

La simulation reste simplifiée.

Le MVP ne couvre pas encore :

- les perturbations orbitales avancées ;
- les changements dynamiques de trajectoire ;
- les calculs multi-corps ;
- les constellations ;
- l’historique complet des simulations côté UI ;
- une page détail de simulation accessible par URL ;
- l’utilisation d’un moteur scientifique externe.

---

## Perspectives d’évolution

Pour une architecture plus avancée, le moteur de simulation pourra être isolé derrière un port applicatif ou extrait dans un service dédié.

Évolutions possibles :

- moteur de simulation spécialisé ;
- microservice de calcul orbital ;
- historique consultable des simulations ;
- détail d’un run de simulation ;
- visualisation 2D/3D plus réaliste ;
- export des résultats ;
- intégration d’une bibliothèque scientifique spécialisée.

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

L’US12 est terminée.

Le lancement de simulation orbitale est disponible depuis la page détail satellite.  
Le backend calcule, persiste et retourne les résultats.  
Le frontend affiche les résultats et une visualisation 2D simplifiée.  
Les droits d’accès et les règles métier sont respectés.