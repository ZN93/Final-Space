# Final Space

## Description

**Final Space** est une application de supervision de missions spatiales.

Le projet met en place un socle complet composé de :

* un front-end Angular ;
* un back-end Spring Boot ;
* une authentification JWT ;
* une gestion des rôles RBAC ;
* une gestion des missions opérationnelles.

Une mission représente un contexte opérationnel permettant d’organiser le suivi des satellites, simulations, alertes, incidents et données de télémétrie.

---

## Structure du projet

Le projet est organisé en deux parties :

* **frontend** : application Angular ;
* **backend** : API Spring Boot.

---

## Prérequis

* Node.js
* Angular CLI
* Java 17
* Maven

---

## Lancement du backend

Se placer dans le dossier backend :

```bash
cd backend
```

Lancer l’application :

```bash
./mvnw spring-boot:run
```

Le serveur démarre sur :

```text
http://localhost:8080
```

Endpoint de vérification :

```http
GET /api/health
```

Cet endpoint est protégé : il nécessite un token JWT valide.

---

## Lancement du frontend

Se placer dans le dossier frontend :

```bash
cd frontend
```

Installer les dépendances :

```bash
npm install
```

Lancer l’application :

```bash
ng serve
```

Le front démarre sur :

```text
http://localhost:4200
```

---

## Authentification JWT

Le projet utilise une authentification basée sur JWT.

### Endpoint de connexion

```http
POST /auth/login
```

### Payload

```json
{
  "email": "admin@finalspace.com",
  "password": "admin123"
}
```

### Réponse

```json
{
  "token": "jwt_token"
}
```

Les endpoints protégés nécessitent ensuite l’en-tête suivant :

```http
Authorization: Bearer <token>
```

---

## Comptes de test

| Rôle | Email | Mot de passe |
|---|---|---|
| ADMIN | `admin@finalspace.com` | `admin123` |
| OPERATEUR | `operator@finalspace.com` | `operator123` |
| LECTEUR | `reader@finalspace.com` | `reader123` |

---

## RBAC - Gestion des rôles

L’application utilise un système RBAC (Role-Based Access Control).

| Rôle | Description |
|---|---|
| ADMIN | Accès complet aux fonctionnalités |
| OPERATEUR | Accès aux fonctionnalités opérationnelles |
| LECTEUR | Accès en lecture seule |

---

## Restrictions backend

| Ressource / Endpoint | Méthode | ADMIN | OPERATEUR | LECTEUR |
|---|---|---:|---:|---:|
| `/api/users/**` | Toutes | Oui | Non | Non |
| `/api/dashboard/**` | GET | Oui | Oui | Oui |
| `/api/missions/**` | GET | Oui | Oui | Oui |
| `/api/missions/**` | POST, PUT, PATCH, DELETE | Oui | Oui | Non |
| `/api/satellites/**` | GET | Oui | Oui | Oui |
| `/api/satellites/**` | POST, PUT, PATCH, DELETE | Oui | Oui | Non |
| `/api/simulations/**` | GET | Oui | Oui | Oui |
| `/api/simulations/**` | POST, PUT, PATCH, DELETE | Oui | Oui | Non |
| `/api/telemetry/**` | GET | Oui | Oui | Oui |
| `/api/telemetry/**` | POST, PUT, PATCH, DELETE | Oui | Oui | Non |
| `/api/alerts/**` | GET | Oui | Oui | Oui |
| `/api/alerts/**` | POST, PUT, PATCH, DELETE | Oui | Oui | Non |
| `/api/incidents/**` | GET | Oui | Oui | Oui |
| `/api/incidents/**` | POST, PUT, PATCH, DELETE | Oui | Oui | Non |
| `/api/reports/**` | GET | Oui | Oui | Oui |
| `/api/reports/**` | POST, PUT, PATCH, DELETE | Oui | Oui | Non |

---

## Gestion des erreurs

| Cas | Réponse |
|---|---|
| Token absent ou invalide | `401 Unauthorized` |
| Token valide mais rôle insuffisant | `403 Forbidden` |
| Données invalides | `400 Bad Request` |
| Ressource introuvable | `404 Not Found` |

---

## Comportement frontend

Le frontend Angular implémente :

* un écran de connexion ;
* le stockage du JWT dans `localStorage` ;
* un `HttpInterceptor` pour ajouter automatiquement le token ;
* un `AuthGuard` pour protéger les routes ;
* une page `forbidden` pour les accès interdits ;
* un header global de navigation ;
* une adaptation de l’interface selon le rôle utilisateur.

| Rôle | Comportement UI |
|---|---|
| ADMIN | Accès administration, opérations et lecture |
| OPERATEUR | Accès opérations et lecture |
| LECTEUR | Accès lecture seule |

---

## Gestion des missions

L’application permet de créer, consulter, modifier et clôturer des missions.

Une mission représente un contexte opérationnel regroupant les ressources liées au suivi spatial : satellites, simulations, alertes, incidents et télémétrie.

### Champs principaux

| Champ | Description |
|---|---|
| `id` | Identifiant technique de la mission |
| `name` | Nom de la mission, obligatoire |
| `description` | Description optionnelle |
| `status` | Statut de la mission |
| `createdAt` | Date de création |
| `closedAt` | Date de clôture, vide si la mission est active |

### Statuts disponibles

| Statut | Description |
|---|---|
| `ACTIVE` | Mission utilisable pour les opérations |
| `CLOTUREE` | Mission clôturée, consultable mais non modifiable |

---

### Endpoints Missions

Tous les endpoints missions nécessitent un token JWT.

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `POST` | `/api/missions` | Créer une mission | ADMIN, OPERATEUR |
| `GET` | `/api/missions` | Lister les missions | ADMIN, OPERATEUR, LECTEUR |
| `GET` | `/api/missions/{id}` | Consulter le détail d’une mission | ADMIN, OPERATEUR, LECTEUR |
| `PUT` | `/api/missions/{id}` | Modifier une mission active | ADMIN, OPERATEUR |
| `POST` | `/api/missions/{id}/close` | Clôturer une mission | ADMIN, OPERATEUR |

---

### Exemple de création d’une mission

```http
POST /api/missions
Authorization: Bearer <token>
Content-Type: application/json
```

Payload :

```json
{
  "name": "Mission Artemis",
  "description": "Mission lunaire"
}
```

Réponse :

```json
{
  "id": 1,
  "name": "Mission Artemis",
  "description": "Mission lunaire",
  "status": "ACTIVE",
  "createdAt": "2026-06-06T11:53:00",
  "closedAt": null
}
```

---

### Exemple de modification d’une mission

```http
PUT /api/missions/1
Authorization: Bearer <token>
Content-Type: application/json
```

Payload :

```json
{
  "name": "Mission Artemis II",
  "description": "Mission lunaire mise à jour"
}
```

---

### Exemple de clôture d’une mission

```http
POST /api/missions/1/close
Authorization: Bearer <token>
```

Réponse :

```json
{
  "id": 1,
  "name": "Mission Artemis II",
  "description": "Mission lunaire mise à jour",
  "status": "CLOTUREE",
  "createdAt": "2026-06-06T11:53:00",
  "closedAt": "2026-06-06T12:15:00"
}
```

---

### Règles métier Missions

| Règle | Description |
|---|---|
| Nom obligatoire | Une mission doit avoir un nom non vide |
| Description optionnelle | Une mission peut être créée sans description |
| Création | Une mission créée possède automatiquement le statut `ACTIVE` |
| Modification | Seules les missions actives peuvent être modifiées |
| Clôture | La clôture passe le statut à `CLOTUREE` et renseigne `closedAt` |
| Suppression | La suppression physique n’est pas autorisée |
| Mission clôturée | Une mission clôturée reste consultable mais devient en lecture seule |

---

## Gestion des satellites

L’application permet de créer, consulter, modifier et désactiver des satellites rattachés à une mission.

Un satellite est un objet opérationnel associé à une mission. Il sert de support aux futures fonctionnalités de simulation orbitale, de télémétrie et de suivi d’incidents.

### Champs principaux

| Champ | Description |
|---|---|
| `id` | Identifiant technique du satellite |
| `name` | Nom du satellite, obligatoire |
| `status` | Statut du satellite |
| `massKg` | Masse du satellite en kilogrammes |
| `altitudeKm` | Altitude orbitale initiale en kilomètres |
| `inclinationDeg` | Inclinaison orbitale en degrés |
| `eccentricity` | Excentricité orbitale |
| `createdAt` | Date de création |
| `updatedAt` | Date de dernière mise à jour |
| `missionId` | Identifiant de la mission associée |
| `missionName` | Nom de la mission associée |

### Statuts disponibles

| Statut | Description |
|---|---|
| `ACTIF` | Satellite utilisable pour les opérations |
| `INACTIF` | Satellite désactivé, consultable mais non modifiable |

---

### Endpoints Satellites

Tous les endpoints satellites nécessitent un token JWT.

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `POST` | `/api/missions/{missionId}/satellites` | Créer un satellite dans une mission | ADMIN, OPERATEUR |
| `GET` | `/api/missions/{missionId}/satellites` | Lister les satellites d’une mission | ADMIN, OPERATEUR, LECTEUR |
| `GET` | `/api/satellites/{id}` | Consulter le détail d’un satellite | ADMIN, OPERATEUR, LECTEUR |
| `PUT` | `/api/satellites/{id}` | Modifier un satellite actif | ADMIN, OPERATEUR |
| `POST` | `/api/satellites/{id}/disable` | Désactiver un satellite | ADMIN, OPERATEUR |

---

### Exemple de création d’un satellite

```http
POST /api/missions/4/satellites
Authorization: Bearer <token>
Content-Type: application/json
```

Payload :

```json
{
  "name": "LunaSat-01",
  "massKg": 850,
  "altitudeKm": 400,
  "inclinationDeg": 51.6,
  "eccentricity": 0.001
}
```

Réponse :

```json
{
  "id": 1,
  "name": "LunaSat-01",
  "status": "ACTIF",
  "massKg": 850,
  "altitudeKm": 400,
  "inclinationDeg": 51.6,
  "eccentricity": 0.001,
  "createdAt": "2026-06-06T13:41:00",
  "updatedAt": "2026-06-06T13:41:00",
  "missionId": 4,
  "missionName": "Mission to the MOOOOON"
}
```

---

### Exemple de modification d’un satellite

```http
PUT /api/satellites/1
Authorization: Bearer <token>
Content-Type: application/json
```

Payload :

```json
{
  "name": "LunaSat-01 Updated",
  "massKg": 900,
  "altitudeKm": 420,
  "inclinationDeg": 52,
  "eccentricity": 0.002
}
```

---

### Exemple de désactivation d’un satellite

```http
POST /api/satellites/1/disable
Authorization: Bearer <token>
```

Réponse :

```json
{
  "id": 1,
  "name": "LunaSat-01 Updated",
  "status": "INACTIF",
  "massKg": 900,
  "altitudeKm": 420,
  "inclinationDeg": 52,
  "eccentricity": 0.002,
  "createdAt": "2026-06-06T13:41:00",
  "updatedAt": "2026-06-06T14:10:00",
  "missionId": 4,
  "missionName": "Mission to the MOOOOON"
}
```

---

### Règles métier Satellites

| Règle | Description |
|---|---|
| Mission obligatoire | Un satellite doit être rattaché à une mission |
| Mission unique | Un satellite appartient à une seule mission |
| Mission active | Un satellite ne peut être créé que dans une mission active |
| Mission clôturée | Une mission clôturée refuse la création de satellites |
| Création | Un satellite créé possède automatiquement le statut `ACTIF` |
| Modification | Seuls les satellites actifs peuvent être modifiés |
| Désactivation | La désactivation passe le statut à `INACTIF` |
| Suppression | La suppression physique n’est pas autorisée |
| Satellite inactif | Un satellite inactif reste consultable mais devient en lecture seule |

---

## Paramétrage orbital des satellites

L’application permet de renseigner et de modifier les paramètres orbitaux d’un satellite afin de préparer les futures simulations orbitales.

Les paramètres orbitaux sont stockés directement dans l’entité `Satellite`, car ils font déjà partie des informations fonctionnelles du satellite depuis l’US06.

### Choix d’implémentation

L’US11 prévoyait initialement la création d’un endpoint dédié de type :

```http
PUT /api/satellites/{id}/orbit-params
```

Après analyse, ce choix a été abandonné pour le MVP, car il introduisait une redondance avec l’endpoint existant de modification d’un satellite :

```http
PUT /api/satellites/{id}
```

Les paramètres orbitaux étant déjà présents dans `SatelliteUpdateRequest`, il est plus cohérent de les valider et de les modifier via l’endpoint existant plutôt que d’exposer un endpoint supplémentaire pour une opération déjà couverte.

Ce choix permet :

- de réduire la duplication de code ;
- d’éviter un endpoint redondant ;
- de conserver une API plus simple ;
- de limiter la complexité côté frontend ;
- de rester cohérent avec le modèle `Satellite` existant.

---

## Simulation orbitale

L’application permet de lancer une simulation d’orbite à partir des paramètres orbitaux enregistrés sur un satellite.

La simulation repose sur un moteur de calcul simplifié à deux corps.  
Elle permet d’estimer des résultats orbitaux exploitables dans le cadre du MVP :

- période orbitale ;
- vitesse orbitale moyenne ;
- forme de l’orbite ;
- paramètres figés utilisés lors du lancement ;
- représentation 2D simplifiée de la trajectoire.

Chaque lancement crée un nouveau run de simulation persisté en base de données.

---

### Choix d’implémentation

Une page détail satellite dédiée a été ajoutée afin de centraliser les actions liées à un satellite :

```http
/satellites/{id}
```

Cette page permet :

- de consulter les informations du satellite ;
- de modifier ses paramètres orbitaux ;
- de désactiver le satellite ;
- de lancer une simulation d’orbite ;
- d’afficher les résultats de la dernière simulation lancée.

Ce choix est plus propre que l’ajout d’un simple bouton dans le tableau des satellites d’une mission, car il prépare les futures évolutions :

- historique des simulations ;
- détail d’un run de simulation ;
- visualisations orbitales plus avancées ;
- séparation claire entre la mission et le satellite.

---

### Endpoint de lancement

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `POST` | `/api/satellites/{id}/simulations/orbit` | Lancer une simulation orbitale pour un satellite | ADMIN, OPERATEUR |

Le rôle `LECTEUR` peut consulter les informations satellite mais ne peut pas lancer de simulation.

---

### Exemple de lancement

```http
POST /api/satellites/3/simulations/orbit
Authorization: Bearer <token>
```

Réponse :

```json
{
  "id": 14,
  "missionId": 4,
  "missionName": "Mission to the MOOOOON",
  "satelliteId": 3,
  "satelliteName": "LunaSat-03",
  "type": "ORBIT",
  "status": "SUCCESS",
  "inputMassKg": 850.0,
  "inputAltitudeKm": 500.0,
  "inputInclinationDeg": 95.0,
  "inputEccentricity": 0.4,
  "orbitalPeriodMinutes": 94.47,
  "averageVelocityKmS": 7.62,
  "orbitShape": "ELLIPTIQUE",
  "plotDataJson": "[...]",
  "createdAt": "2026-06-09T16:41:00",
  "createdBy": "admin@finalspace.com"
}
```

---

### Données persistées

Les simulations sont enregistrées dans l’entité `SimulationRun`.

| Champ | Description |
|---|---|
| `id` | Identifiant du run de simulation |
| `missionId` | Mission associée |
| `satelliteId` | Satellite simulé |
| `type` | Type de simulation, actuellement `ORBIT` |
| `status` | Statut du run, actuellement `SUCCESS` ou `FAILED` |
| `inputMassKg` | Masse figée utilisée lors du lancement |
| `inputAltitudeKm` | Altitude figée utilisée lors du lancement |
| `inputInclinationDeg` | Inclinaison figée utilisée lors du lancement |
| `inputEccentricity` | Excentricité figée utilisée lors du lancement |
| `orbitalPeriodMinutes` | Période orbitale calculée |
| `averageVelocityKmS` | Vitesse orbitale moyenne calculée |
| `orbitShape` | Forme de l’orbite |
| `plotDataJson` | Données de visualisation 2D simplifiée |
| `createdAt` | Date de lancement |
| `createdBy` | Utilisateur ayant lancé la simulation |

---

### Règles métier

| Règle | Description |
|---|---|
| Satellite actif | Une simulation ne peut être lancée que sur un satellite `ACTIF` |
| Mission active | Une simulation ne peut pas être lancée si la mission est clôturée |
| Paramètres valides | Les paramètres orbitaux doivent être cohérents |
| Paramètres figés | Les paramètres utilisés sont copiés dans le run au moment du lancement |
| Nouveau run | Chaque lancement crée une nouvelle simulation |
| Consultation | Le résultat est affiché après lancement |
| Sécurité | Seuls ADMIN et OPERATEUR peuvent lancer une simulation |

---

### Résultats affichés côté frontend

La page détail satellite affiche après lancement :

- le statut du run ;
- le type de simulation ;
- la forme orbitale ;
- la période orbitale ;
- la vitesse moyenne ;
- l’utilisateur ayant lancé la simulation ;
- la date de lancement ;
- les paramètres figés utilisés ;
- une visualisation 2D simplifiée de l’orbite.

---

### Limites actuelles

La simulation reste volontairement simplifiée.

Le MVP ne couvre pas encore :

- les perturbations orbitales avancées ;
- les solveurs numériques complexes ;
- les simulations multi-satellites ;
- les constellations ;
- l’historique complet des simulations côté UI ;
- le détail d’un run de simulation accessible par URL.

Une évolution future pourra extraire le moteur de calcul dans un service dédié ou utiliser une bibliothèque spécialisée de mécanique orbitale.

---

## Manœuvre de transfert de Hohmann

L’application permet de lancer une manœuvre de transfert de Hohmann depuis la page détail d’un satellite actif.

Le transfert de Hohmann est une manœuvre orbitale analytique simplifiée permettant de passer d’une orbite circulaire à une autre en deux impulsions, dans le cadre d’un modèle à deux corps.

Cette fonctionnalité permet d’estimer :

- le Δv de départ ;
- le Δv d’arrivée ;
- le Δv total ;
- la durée estimée du transfert ;
- l’orbite initiale ;
- l’orbite cible ;
- l’arc de transfert.

Chaque manœuvre crée un nouveau run de simulation persisté en base de données avec le type `HOHMANN`.

---

### Choix d’implémentation

La manœuvre de Hohmann réutilise l’entité `SimulationRun`, déjà introduite pour les simulations orbitales.

Le champ `type` permet de distinguer les différents types de simulations :

```text
ORBIT
HOHMANN
```

Ce choix évite de créer une entité dédiée pour chaque type de simulation et permet de conserver une logique commune :

- satellite associé ;
- mission associée ;
- auteur du lancement ;
- date de création ;
- statut du run ;
- paramètres figés ;
- résultats calculés ;
- données de visualisation.

Les champs spécifiques au transfert de Hohmann sont optionnels et renseignés uniquement lorsque le run est de type `HOHMANN`.

---

### Endpoint de lancement

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `POST` | `/api/satellites/{id}/simulations/hohmann` | Lancer une manœuvre de transfert de Hohmann | ADMIN, OPERATEUR |

Le rôle `LECTEUR` peut consulter les données accessibles mais ne peut pas lancer de manœuvre.

---

### Exemple de requête

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

Réponse :

```json
{
  "id": 21,
  "missionId": 4,
  "missionName": "Mission to the MOOOOON",
  "satelliteId": 3,
  "satelliteName": "LunaSat-03",
  "type": "HOHMANN",
  "status": "SUCCESS",
  "inputMassKg": 850.0,
  "inputAltitudeKm": 500.0,
  "inputInclinationDeg": 95.0,
  "inputEccentricity": 0.4,
  "orbitalPeriodMinutes": null,
  "averageVelocityKmS": null,
  "orbitShape": null,
  "targetAltitudeKm": 800.0,
  "deltaV1MS": 80.93,
  "deltaV2MS": 80.07,
  "deltaVTotalMS": 161.0,
  "transferTimeMinutes": 48.79,
  "plotDataJson": "{...}",
  "createdAt": "2026-06-14T20:21:00",
  "createdBy": "admin@finalspace.com"
}
```

---

### Données persistées

Les manœuvres de Hohmann sont enregistrées dans la table des runs de simulation.

| Champ | Description |
|---|---|
| `id` | Identifiant du run de simulation |
| `missionId` | Mission associée |
| `satelliteId` | Satellite simulé |
| `type` | Type de simulation, ici `HOHMANN` |
| `status` | Statut du run, actuellement `SUCCESS` ou `FAILED` |
| `inputMassKg` | Masse figée utilisée lors du lancement |
| `inputAltitudeKm` | Altitude initiale figée au lancement |
| `inputInclinationDeg` | Inclinaison figée au lancement |
| `inputEccentricity` | Excentricité figée au lancement |
| `targetAltitudeKm` | Altitude cible saisie par l’utilisateur |
| `deltaV1MS` | Δv de la première impulsion en m/s |
| `deltaV2MS` | Δv de la seconde impulsion en m/s |
| `deltaVTotalMS` | Δv total de la manœuvre en m/s |
| `transferTimeMinutes` | Durée estimée du transfert en minutes |
| `plotDataJson` | Données de visualisation 2D simplifiée |
| `createdAt` | Date de lancement |
| `createdBy` | Utilisateur ayant lancé la manœuvre |

---

### Règles métier

| Règle | Description |
|---|---|
| Satellite actif | Une manœuvre ne peut être lancée que sur un satellite `ACTIF` |
| Mission active | Une manœuvre ne peut pas être lancée si la mission est clôturée |
| Altitude cible obligatoire | L’altitude cible doit être renseignée |
| Altitude cible positive | L’altitude cible doit être strictement supérieure à 0 |
| Altitude cible différente | L’altitude cible doit être différente de l’altitude initiale |
| Paramètres figés | Les paramètres utilisés sont copiés dans le run au moment du lancement |
| Nouveau run | Chaque lancement crée une nouvelle simulation |
| Sécurité | Seuls ADMIN et OPERATEUR peuvent lancer une manœuvre |

---

### Résultats affichés côté frontend

La page détail satellite affiche après lancement :

- le statut du run ;
- le type de simulation ;
- l’altitude initiale ;
- l’altitude cible ;
- le Δv de départ ;
- le Δv d’arrivée ;
- le Δv total ;
- la durée estimée du transfert ;
- l’utilisateur ayant lancé la manœuvre ;
- la date de lancement ;
- les paramètres figés utilisés ;
- une visualisation 2D simplifiée du transfert.

---

### Visualisation 2D

La visualisation de Hohmann représente de manière schématique :

- l’orbite initiale ;
- l’orbite cible ;
- l’arc de transfert ;
- la Terre au centre du repère.

Cette visualisation reste volontairement simplifiée et ne cherche pas à reproduire une simulation physique complète.

---

### Limites actuelles

La manœuvre de Hohmann reste volontairement simplifiée.

Le MVP ne couvre pas encore :

- les manœuvres bi-elliptiques ;
- les changements de plan orbital ;
- les perturbations physiques ;
- les trajectoires multi-corps ;
- l’optimisation avancée de trajectoire ;
- l’historique complet des simulations côté UI ;
- le détail d’un run de simulation accessible par URL.

Une évolution future pourra isoler le moteur de calcul dans un service dédié ou utiliser une bibliothèque spécialisée de mécanique orbitale.

---

### Paramètres orbitaux disponibles

| Champ | Description | Validation |
|---|---|---|
| `massKg` | Masse du satellite en kilogrammes | Obligatoire, supérieure à `0` |
| `altitudeKm` | Altitude orbitale initiale en kilomètres | Obligatoire, supérieure à `0` |
| `inclinationDeg` | Inclinaison orbitale en degrés | Obligatoire, entre `0` et `180` |
| `eccentricity` | Excentricité orbitale | Obligatoire, supérieure ou égale à `0` |

---

### Endpoint utilisé

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `PUT` | `/api/satellites/{id}` | Modifier un satellite et ses paramètres orbitaux | ADMIN, OPERATEUR |

Le rôle `LECTEUR` peut consulter les paramètres orbitaux mais ne peut pas les modifier.

---

### Exemple de mise à jour des paramètres orbitaux

```http
PUT /api/satellites/2
Authorization: Bearer <token>
Content-Type: application/json
```

Payload :

```json
{
  "name": "LunaSat-01 Updated",
  "massKg": 900.0,
  "altitudeKm": 420.0,
  "inclinationDeg": 52.0,
  "eccentricity": 0.002
}
```

Réponse :

```json
{
  "id": 2,
  "name": "LunaSat-01 Updated",
  "status": "ACTIF",
  "massKg": 900.0,
  "altitudeKm": 420.0,
  "inclinationDeg": 52.0,
  "eccentricity": 0.002,
  "createdAt": "2026-06-06T13:51:17.733464",
  "updatedAt": "2026-06-07T16:41:28.339819",
  "missionId": 4,
  "missionName": "Mission to the MOOOOON"
}
```

---

### Règles métier

| Règle | Description |
|---|---|
| Satellite actif | Les paramètres orbitaux peuvent être modifiés uniquement si le satellite est `ACTIF` |
| Satellite inactif | Un satellite `INACTIF` est en lecture seule |
| Mission clôturée | Les satellites d’une mission clôturée restent consultables mais ne sont plus modifiables côté UI |
| Valeurs numériques | Les paramètres doivent respecter les bornes définies |
| Simulation future | Les paramètres seront utilisés comme base d’entrée pour les futures simulations orbitales |

---

### Comportement frontend

Le frontend Angular permet de consulter les paramètres orbitaux dans la liste des satellites rattachés à une mission.

La modification des paramètres orbitaux est intégrée au formulaire existant de modification du satellite afin d’éviter un formulaire redondant.

| Rôle | Comportement UI |
|---|---|
| ADMIN | Peut modifier les paramètres orbitaux d’un satellite actif |
| OPERATEUR | Peut modifier les paramètres orbitaux d’un satellite actif |
| LECTEUR | Consultation uniquement |

La modification est masquée ou rendue indisponible lorsque :

- le satellite est `INACTIF` ;
- la mission est `CLOTUREE` ;
- l’utilisateur possède uniquement le rôle `LECTEUR`.

---

## Historique des simulations

L’application permet de consulter l’historique des simulations associées à un satellite.

Chaque simulation correspond à un lancement de calcul effectué depuis l’application :

- simulation orbitale simple ;
- manœuvre de transfert de Hohmann.

L’historique permet de retrouver les simulations déjà lancées, d’identifier leur type, de consulter leurs résultats principaux et d’accéder au détail complet d’une simulation.

---

### Objectif fonctionnel

L’objectif de cette fonctionnalité est de permettre à un utilisateur authentifié de consulter les simulations déjà réalisées sur un satellite.

Une simulation conserve :

- le satellite concerné ;
- la mission associée ;
- le type de simulation ;
- le statut du run ;
- la date de lancement ;
- l’utilisateur ayant lancé la simulation ;
- les paramètres utilisés au moment du lancement ;
- les résultats calculés ;
- les données de visualisation.

Les simulations sont conservées sans limitation de durée et ne sont pas modifiables depuis l’application.

---

### Types de simulations historisées

| Type | Description |
|---|---|
| `ORBIT` | Simulation orbitale simple à partir des paramètres orbitaux du satellite |
| `HOHMANN` | Manœuvre de transfert de Hohmann vers une altitude cible |

---

### Endpoints API

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `GET` | `/api/satellites/{id}/simulations` | Consulter l’historique des simulations d’un satellite | ADMIN, OPERATEUR, LECTEUR |
| `GET` | `/api/simulations/{id}` | Consulter le détail complet d’une simulation | ADMIN, OPERATEUR, LECTEUR |

Les utilisateurs doivent être authentifiés pour consulter l’historique ou le détail d’une simulation.

---

### Exemple de requête - Historique d’un satellite

```http
GET /api/satellites/3/simulations
Authorization: Bearer <token>
```

Exemple de réponse :

```json
[
  {
    "id": 21,
    "missionId": 4,
    "missionName": "Mission to the MOOOOON",
    "satelliteId": 3,
    "satelliteName": "LunaSat-03",
    "type": "HOHMANN",
    "status": "SUCCESS",
    "createdAt": "2026-06-09T23:26:44.438922",
    "createdBy": "admin@finalspace.com",
    "inputAltitudeKm": 500.0,
    "targetAltitudeKm": 800.0,
    "orbitalPeriodMinutes": null,
    "averageVelocityKmS": null,
    "orbitShape": null,
    "deltaVTotalMS": 161.0,
    "transferTimeMinutes": 48.79
  }
]
```

Les simulations sont retournées par ordre chronologique décroissant, de la plus récente à la plus ancienne.

---

### Exemple de requête - Détail d’une simulation

```http
GET /api/simulations/21
Authorization: Bearer <token>
```

Exemple de réponse :

```json
{
  "id": 21,
  "missionId": 4,
  "missionName": "Mission to the MOOOOON",
  "satelliteId": 3,
  "satelliteName": "LunaSat-03",
  "type": "HOHMANN",
  "status": "SUCCESS",
  "inputMassKg": 850.0,
  "inputAltitudeKm": 500.0,
  "inputInclinationDeg": 95.0,
  "inputEccentricity": 0.4,
  "orbitalPeriodMinutes": null,
  "averageVelocityKmS": null,
  "orbitShape": null,
  "targetAltitudeKm": 800.0,
  "deltaV1MS": 80.93,
  "deltaV2MS": 80.07,
  "deltaVTotalMS": 161.0,
  "transferTimeMinutes": 48.79,
  "plotDataJson": "{...}",
  "createdAt": "2026-06-09T23:26:44.438922",
  "createdBy": "admin@finalspace.com"
}
```

---

### Données affichées dans l’historique

La page détail d’un satellite affiche une section `Historique des simulations`.

Cette section présente les informations suivantes :

| Colonne | Description |
|---|---|
| Date | Date de lancement de la simulation |
| Type | Type de simulation : orbite ou Hohmann |
| Statut | Statut du run |
| Auteur | Utilisateur ayant lancé la simulation |
| Résumé | Résultat synthétique selon le type de simulation |
| Action | Accès au détail de la simulation |

Pour une simulation `ORBIT`, le résumé affiche notamment :

- la période orbitale ;
- la vitesse moyenne ;
- la forme de l’orbite.

Pour une simulation `HOHMANN`, le résumé affiche notamment :

- le Δv total ;
- la durée estimée du transfert.

---

### Page détail d’une simulation

L’application propose une page dédiée au détail d’une simulation :

```text
/simulations/{id}
```

Cette page affiche :

- le type de simulation ;
- le statut ;
- la mission associée ;
- le satellite concerné ;
- la date de lancement ;
- l’auteur ;
- les paramètres figés utilisés au lancement ;
- les résultats calculés ;
- une visualisation 2D simplifiée ;
- les données techniques de visualisation.

Pour une simulation orbitale, la page affiche les résultats orbitaux.

Pour une manœuvre de Hohmann, la page affiche les résultats de transfert :

- Δv départ ;
- Δv arrivée ;
- Δv total ;
- durée estimée du transfert ;
- orbite initiale ;
- orbite cible ;
- arc de transfert.

---

### Règles métier

| Règle | Description |
|---|---|
| Conservation | Les simulations sont conservées sans limitation de durée |
| Immutabilité | Les simulations ne peuvent pas être modifiées |
| Suppression interdite | Les simulations ne peuvent pas être supprimées depuis l’application |
| Consultation après clôture | Les simulations restent consultables même si la mission est clôturée |
| Consultation après désactivation | Les simulations restent consultables même si le satellite est inactif |
| Tri | Les simulations sont listées de la plus récente à la plus ancienne |
| Détail | Chaque simulation peut être consultée individuellement |
| Sécurité | ADMIN, OPERATEUR et LECTEUR peuvent consulter l’historique |
| Authentification | Un utilisateur non authentifié ne peut pas consulter l’historique |

---

### Choix d’implémentation

L’historique s’appuie sur l’entité `SimulationRun`.

Cette entité centralise les simulations de différents types grâce au champ `type`.

Les simulations orbitales et les manœuvres de Hohmann partagent donc une structure commune :

- identifiant du run ;
- mission associée ;
- satellite associé ;
- type ;
- statut ;
- auteur ;
- date de création ;
- paramètres figés ;
- résultats ;
- données de visualisation.

Deux DTO sont utilisés pour distinguer les besoins d’affichage :

| DTO | Utilisation |
|---|---|
| `SimulationListItemResponse` | Affichage de la liste des simulations |
| `SimulationDetailResponse` | Affichage du détail complet d’une simulation |

Ce découpage évite de retourner toutes les données techniques dans la liste, notamment le champ `plotDataJson`, qui peut être volumineux.

---

### Repository

Les requêtes principales utilisées sont :

```java
List<SimulationRun> findBySatelliteIdOrderByCreatedAtDesc(Long satelliteId);

List<SimulationRun> findByMissionIdOrderByCreatedAtDesc(Long missionId);
```

La requête utilisée pour l’affichage actuel est l’historique par satellite.

L’historique par mission est prévu dans le modèle mais n’est pas encore exposé côté interface utilisateur.

---

### Gestion des erreurs

| Cas | Réponse |
|---|---|
| Satellite introuvable | `404 Not Found` |
| Simulation introuvable | `404 Not Found` |
| Utilisateur non authentifié | `401 Unauthorized` |
| Utilisateur sans droit | `403 Forbidden` |

---

### Frontend

Côté frontend, l’historique est intégré à la page détail d’un satellite.

La page satellite charge automatiquement l’historique via :

```text
GET /api/satellites/{id}/simulations
```

Après le lancement d’une simulation orbitale ou d’une manœuvre de Hohmann, l’historique est rechargé automatiquement afin d’afficher le nouveau run.

Une page de détail est également disponible via :

```text
/simulations/{id}
```

Cette page appelle :

```text
GET /api/simulations/{id}
```

---

### États d’affichage

L’interface gère les états suivants :

| État | Description |
|---|---|
| Chargement | Affichage d’un message pendant le chargement |
| Vide | Message si aucune simulation n’existe pour le satellite |
| Erreur | Message si l’historique ou le détail ne peut pas être chargé |
| Succès | Affichage de la liste ou du détail |
| Accès refusé | Redirection vers la page `forbidden` en cas de 403 |

---

### Tests réalisés

Les tests backend couvrent :

- la récupération de l’historique d’un satellite ;
- le tri des simulations par date décroissante ;
- le cas d’un historique vide ;
- le cas d’un satellite introuvable ;
- la récupération du détail d’une simulation ;
- le cas d’une simulation introuvable ;
- l’accès ADMIN ;
- l’accès OPERATEUR ;
- l’accès LECTEUR ;
- le refus d’un utilisateur non authentifié.

Résultat d’exécution backend :

```text
Tests run: 168, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

Le build frontend a également été validé :

```text
Application bundle generation complete
```

---

### Validation fonctionnelle

La fonctionnalité a été validée manuellement dans le navigateur.

Cas validés :

- l’historique apparaît sur la page détail satellite ;
- les simulations sont affichées dans un tableau ;
- les simulations orbitales et Hohmann sont distinguées ;
- le résumé affiché dépend du type de simulation ;
- le lien `Voir détail` ouvre la page de détail ;
- la page détail affiche les paramètres et les résultats ;
- l’accès à l’historique fonctionne avec le rôle `LECTEUR`.

---

### Limites actuelles

La fonctionnalité ne couvre pas encore :

- l’historique global d’une mission côté interface ;
- la comparaison avancée entre plusieurs simulations ;
- la pagination ;
- le filtrage par type ;
- l’export des résultats ;
- le rejeu d’une simulation existante ;
- la duplication d’une simulation.

Ces points sont prévus hors périmètre de l’US14 ou dans des user stories futures.

---

### Perspectives d’évolution

Évolutions possibles :

- ajouter un historique par mission ;
- ajouter une pagination côté backend et frontend ;
- ajouter des filtres par type de simulation ;
- ajouter une comparaison visuelle entre plusieurs simulations ;
- ajouter l’export CSV/PDF ;
- ajouter une page dédiée à l’ensemble des simulations d’une mission.

---

## Import de données de télémétrie CSV

L’application permet d’importer des données de télémétrie au format CSV pour un satellite actif.

Les données de télémétrie représentent des mesures temporelles associées à un satellite et à une mission. Elles seront utilisées ensuite pour la visualisation, l’analyse et la détection d’anomalies.

Cette fonctionnalité introduit l’utilisation d’une base de données non relationnelle dans le projet.

---

### Stockage NoSQL avec MongoDB

Les données métier principales restent stockées dans PostgreSQL :

- utilisateurs ;
- missions ;
- satellites ;
- simulations ;
- alertes ;
- incidents.

Les données de télémétrie sont stockées dans MongoDB, dans une collection dédiée :

```text
telemetry_points
```

Ce choix permet de séparer les données relationnelles classiques des données temporelles potentiellement volumineuses.

MongoDB est utilisé pour stocker des documents de télémétrie de manière flexible.

---

### Document MongoDB

Chaque point de télémétrie est stocké sous forme de document MongoDB.

Structure d’un document :

```json
{
  "id": "...",
  "missionId": 4,
  "satelliteId": 3,
  "timestamp": "2026-01-01T10:00:00Z",
  "metric": "temperature",
  "value": 42.5,
  "sourceImportId": "uuid",
  "createdAt": "2026-06-21T11:28:30Z"
}
```

Un index composé est ajouté sur :

```text
satelliteId, metric, timestamp
```

Cet index prépare les usages futurs de visualisation par satellite, métrique et période temporelle.

---

### Format CSV attendu

Le fichier CSV doit contenir un header obligatoire avec les colonnes suivantes :

```csv
timestamp,metric,value
```

Exemple de fichier valide :

```csv
timestamp,metric,value
2026-01-01T10:00:00Z,temperature,42.5
2026-01-01T10:00:00Z,battery,78
```

Les règles de validation sont les suivantes :

| Colonne | Règle |
|---|---|
| `timestamp` | Date au format ISO-8601 |
| `metric` | Nom de métrique non vide |
| `value` | Valeur numérique |

Le séparateur attendu est la virgule.

---

### Endpoint API

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `POST` | `/api/missions/{missionId}/satellites/{satelliteId}/telemetry/import` | Importer un fichier CSV de télémétrie | ADMIN, OPERATEUR |

Le rôle `LECTEUR` ne peut pas importer de données de télémétrie.

---

### Exemple de requête

```http
POST /api/missions/4/satellites/3/telemetry/import
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Body :

```text
file = telemetry-valid.csv
```

Réponse en cas de succès :

```json
{
  "importId": "a8c9129a-2002-491a-a61a-7ddf4fe3373c",
  "importedCount": 2,
  "errorCount": 0,
  "errors": []
}
```

---

### Gestion des erreurs CSV

Si le fichier CSV est invalide, l’import est refusé.

Aucune donnée partielle n’est conservée.

Exemple de réponse en erreur :

```json
{
  "importId": null,
  "importedCount": 0,
  "errorCount": 3,
  "errors": [
    {
      "line": 3,
      "message": "Timestamp invalide. Format attendu : ISO-8601, exemple 2026-01-01T10:00:00Z"
    },
    {
      "line": 4,
      "message": "La métrique est obligatoire"
    },
    {
      "line": 5,
      "message": "La valeur doit être numérique"
    }
  ]
}
```

---

### Règles métier

| Règle | Description |
|---|---|
| Satellite actif | L’import est autorisé uniquement sur un satellite `ACTIF` |
| Mission active | L’import est refusé si la mission est clôturée |
| Satellite rattaché à la mission | Le satellite doit appartenir à la mission indiquée |
| Format CSV obligatoire | Le fichier doit être au format `.csv` |
| Header obligatoire | Le header doit être exactement `timestamp,metric,value` |
| Timestamp valide | Le timestamp doit être parsable au format ISO-8601 |
| Métrique obligatoire | Le champ `metric` ne doit pas être vide |
| Valeur numérique | Le champ `value` doit être numérique |
| Aucune donnée partielle | Si une ligne est invalide, aucune ligne n’est persistée |
| Sécurité | ADMIN et OPERATEUR peuvent importer, LECTEUR est refusé |

---

### Frontend

L’import CSV est disponible depuis la page détail d’un satellite.

La section d’import permet :

- de sélectionner un fichier CSV ;
- d’afficher le format attendu ;
- de lancer l’import ;
- d’afficher un message de succès ;
- d’afficher les erreurs ligne par ligne si le CSV est invalide.

La section est disponible uniquement pour les rôles ADMIN et OPERATEUR sur un satellite actif.

Pour un utilisateur LECTEUR, l’import n’est pas autorisé.

---

### Tests réalisés

Les tests backend couvrent :

- l’import d’un CSV valide ;
- la persistance des points de télémétrie dans MongoDB ;
- le rejet d’un header invalide ;
- le rejet d’un timestamp invalide ;
- le rejet d’une métrique vide ;
- le rejet d’une valeur non numérique ;
- le support d’un header CSV avec BOM UTF-8 ;
- le rejet d’un fichier vide ;
- le rejet d’un fichier non CSV ;
- le rejet d’un satellite inexistant ;
- le rejet d’un satellite inactif ;
- le rejet d’une mission clôturée ;
- le rejet d’un satellite qui n’appartient pas à la mission indiquée ;
- les accès ADMIN, OPERATEUR, LECTEUR et non authentifié.

Résultat backend :

```text
Tests run: 180, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

Le build frontend a également été validé :

```text
Application bundle generation complete
```

---

### Validation fonctionnelle

La fonctionnalité a été validée manuellement dans Postman et dans le navigateur.

Cas validés :

- import CSV valide ;
- stockage des documents dans MongoDB ;
- vérification des documents dans la collection `telemetry_points` ;
- import CSV invalide avec retour des erreurs ligne par ligne ;
- absence de persistance partielle en cas d’erreur ;
- affichage de l’interface d’import côté frontend ;
- message de succès après import ;
- affichage des erreurs CSV côté frontend ;
- accès refusé pour le rôle LECTEUR.

---

### Limites actuelles

L’US15 ne couvre pas encore :

- la visualisation graphique des données de télémétrie ;
- la détection automatique d’anomalies ;
- la consultation détaillée des points de télémétrie ;
- la pagination des données importées ;
- la suppression de points de télémétrie ;
- la mise à jour de points existants ;
- l’import de formats autres que CSV ;
- l’import en temps réel.

Ces éléments sont prévus dans des user stories futures.

---

### Perspectives d’évolution

Évolutions possibles :

- ajouter des graphiques par métrique ;
- afficher les données de télémétrie sur une période donnée ;
- détecter les anomalies à partir de seuils configurables ;
- ajouter un historique des imports ;
- ajouter un détail d’import par `sourceImportId` ;
- ajouter l’export des données importées.

---

## Visualisation des données de télémétrie

L’application permet de visualiser les données de télémétrie importées sous forme de graphiques temporels.

Cette fonctionnalité permet d’analyser l’évolution des métriques d’un satellite dans le temps, comme par exemple :

* la température ;
* le niveau de batterie ;
* la vitesse ;
* toute autre métrique importée via CSV.

Les données affichées proviennent de MongoDB, dans la collection `telemetry_points`.

---

### Objectif

La visualisation de télémétrie permet à un utilisateur authentifié de consulter les mesures associées à un satellite et d’observer leur évolution dans le temps.

Les graphiques sont en lecture seule.

---

### Endpoints API

| Méthode | Endpoint                                          | Description                                           | Rôles autorisés           |
| ------- | ------------------------------------------------- | ----------------------------------------------------- | ------------------------- |
| `GET`   | `/api/satellites/{satelliteId}/telemetry/metrics` | Récupérer les métriques disponibles pour un satellite | ADMIN, OPERATEUR, LECTEUR |
| `GET`   | `/api/satellites/{satelliteId}/telemetry`         | Récupérer les points de télémétrie filtrés            | ADMIN, OPERATEUR, LECTEUR |

---

### Paramètres de recherche

Endpoint :

`GET /api/satellites/{satelliteId}/telemetry`

| Paramètre | Obligatoire | Description                                                            |
| --------- | ----------- | ---------------------------------------------------------------------- |
| `metric`  | Oui         | Métrique à afficher. Peut être répétée pour afficher plusieurs courbes |
| `from`    | Non         | Date de début au format ISO-8601                                       |
| `to`      | Non         | Date de fin au format ISO-8601                                         |
| `limit`   | Non         | Nombre maximum de points retournés                                     |

Exemple :

`GET /api/satellites/3/telemetry?metric=temperature&metric=battery&limit=5000`

---

### Réponse API

Exemple de réponse :

```json
{
  "satelliteId": 3,
  "metrics": [
    "temperature",
    "battery"
  ],
  "count": 4,
  "points": [
    {
      "timestamp": "2026-01-01T10:00:00Z",
      "metric": "temperature",
      "value": 40.0
    },
    {
      "timestamp": "2026-01-01T10:05:00Z",
      "metric": "temperature",
      "value": 42.5
    },
    {
      "timestamp": "2026-01-01T10:00:00Z",
      "metric": "battery",
      "value": 80.0
    },
    {
      "timestamp": "2026-01-01T10:05:00Z",
      "metric": "battery",
      "value": 78.0
    }
  ]
}
```

---

### Règles métier

| Règle                         | Description                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| Données existantes uniquement | Seules les données de télémétrie déjà importées sont affichées                                  |
| Métrique obligatoire          | Au moins une métrique doit être sélectionnée                                                    |
| Tri chronologique             | Les points sont retournés dans l’ordre chronologique                                            |
| Filtre période                | Les paramètres `from` et `to` permettent de filtrer sur une période                             |
| Limitation de volume          | Le nombre de points retournés est limité                                                        |
| Lecture seule                 | Les graphiques ne modifient aucune donnée                                                       |
| Consultation après clôture    | Les données restent consultables même si la mission est clôturée ou si le satellite est inactif |
| Sécurité                      | ADMIN, OPERATEUR et LECTEUR peuvent consulter                                                   |

---

### Frontend

La page détail satellite affiche une section de visualisation de télémétrie.

Cette section permet :

* d’afficher les métriques disponibles ;
* de sélectionner une ou plusieurs métriques ;
* de filtrer par période ;
* de rafraîchir les données à la demande ;
* d’afficher les données sous forme de courbes temporelles ;
* d’afficher les états vide, chargement et erreur.

Les graphiques utilisent :

* l’axe horizontal pour le temps ;
* l’axe vertical pour la valeur de la métrique ;
* une courbe par métrique sélectionnée.

---

### Tests réalisés

Les tests backend couvrent :

* la récupération des métriques disponibles ;
* la lecture des données pour une métrique ;
* la lecture de plusieurs métriques ;
* le filtrage par période ;
* le tri chronologique ;
* la limitation du nombre de points ;
* le rejet d’une requête sans métrique ;
* le rejet d’une période invalide ;
* le rejet d’un satellite inexistant ;
* l’accès ADMIN ;
* l’accès OPERATEUR ;
* l’accès LECTEUR ;
* le refus d’un utilisateur non authentifié.

Résultat backend :

```text
Tests run: 196, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

Le build frontend a également été validé :

```text
Application bundle generation complete
```

---

### Validation fonctionnelle

La fonctionnalité a été validée dans le navigateur avec un fichier CSV de démonstration contenant 15 points de télémétrie.

Cas validés :

* import de données de télémétrie ;
* détection automatique des métriques disponibles ;
* affichage des métriques `battery`, `speed`, `temperature` ;
* affichage d’une courbe par métrique ;
* affichage de plusieurs métriques en même temps ;
* filtrage par période ;
* rafraîchissement manuel ;
* consultation en lecture seule.

---

### Limites actuelles

L’US16 ne couvre pas encore :

* la visualisation temps réel ;
* l’analyse statistique avancée ;
* la personnalisation avancée des graphiques ;
* les axes indépendants par métrique ;
* la normalisation automatique des courbes ;
* le zoom sur une période ;
* l’export du graphique.

Lorsque des métriques ont des ordres de grandeur très différents, par exemple `speed` autour de 7600 et `temperature` autour de 40, la courbe de plus grande valeur peut écraser visuellement les autres courbes.

---

### Perspectives d’évolution

Évolutions possibles :

* ajouter un axe vertical par métrique ;
* normaliser les courbes pour comparer les tendances ;
* ajouter un zoom temporel ;
* afficher les valeurs min, max et moyenne ;
* ajouter des seuils visuels ;
* préparer la détection d’anomalies ;
* ajouter un export CSV ou PDF des données affichées.

---

## Détection automatique des anomalies de télémétrie

L’application permet de détecter automatiquement des anomalies dans les données de télémétrie importées.

Cette fonctionnalité analyse les points de télémétrie stockés dans MongoDB et applique des règles simples et déterministes afin d’identifier des comportements inhabituels.

Les anomalies sont stockées dans MongoDB dans la collection :

`telemetry_anomalies`

---

### Objectif

La détection d’anomalies permet d’identifier automatiquement des valeurs ou évolutions suspectes dans les données de télémétrie d’un satellite.

La détection peut être exécutée :

* automatiquement après un import CSV de télémétrie ;
* manuellement depuis l’interface utilisateur ;
* manuellement via l’API.

Les données de télémétrie ne sont pas modifiées par la détection.

---

### Types d’anomalies supportés

| Type        | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| `THRESHOLD` | Valeur supérieure ou inférieure à un seuil défini             |
| `VARIATION` | Variation brutale entre deux points consécutifs               |
| `MISSING`   | Absence de données sur une période supérieure au seuil défini |

---

### Sévérités

| Sévérité  | Description                                          |
| --------- | ---------------------------------------------------- |
| `FAIBLE`  | Anomalie informative, par exemple données manquantes |
| `MOYENNE` | Anomalie significative nécessitant une attention     |
| `ELEVEE`  | Anomalie critique ou fortement suspecte              |

---

### Règles de détection MVP

Les règles sont définies de manière statique dans le backend.

| Métrique                      | Règle              | Sévérité  |
| ----------------------------- | ------------------ | --------- |
| `temperature > 60`            | Seuil d’alerte     | `MOYENNE` |
| `temperature > 80`            | Seuil critique     | `ELEVEE`  |
| `battery < 40`                | Seuil d’alerte     | `MOYENNE` |
| `battery < 20`                | Seuil critique     | `ELEVEE`  |
| `speed > 7800`                | Seuil d’alerte     | `MOYENNE` |
| `speed > 8000`                | Seuil critique     | `ELEVEE`  |
| variation `temperature > 10`  | Variation brutale  | `MOYENNE` |
| variation `battery > 15`      | Variation brutale  | `MOYENNE` |
| variation `speed > 150`       | Variation brutale  | `MOYENNE` |
| écart temporel `> 10 minutes` | Données manquantes | `FAIBLE`  |

---

### Document MongoDB

Chaque anomalie est stockée sous forme de document MongoDB.

Champs principaux :

* `missionId`
* `satelliteId`
* `metric`
* `type`
* `severity`
* `timestamp`
* `value`
* `previousValue`
* `previousTimestamp`
* `ruleName`
* `thresholdUsed`
* `message`
* `createdAt`

Une contrainte de déduplication est appliquée sur :

`satelliteId`, `metric`, `timestamp`, `type`, `ruleName`

Cette clé évite de créer plusieurs fois la même anomalie pour un même point de télémétrie.

---

### Endpoints API

| Méthode | Endpoint                                         | Description                       | Rôles autorisés           |
| ------- | ------------------------------------------------ | --------------------------------- | ------------------------- |
| `POST`  | `/api/satellites/{satelliteId}/anomalies/detect` | Lancer la détection d’anomalies   | ADMIN, OPERATEUR, LECTEUR |
| `GET`   | `/api/satellites/{satelliteId}/anomalies`        | Consulter les anomalies détectées | ADMIN, OPERATEUR, LECTEUR |

---

### Paramètres

| Paramètre | Obligatoire                                             | Description                           |
| --------- | ------------------------------------------------------- | ------------------------------------- |
| `metric`  | Non pour la consultation, obligatoire pour la détection | Une ou plusieurs métriques à analyser |
| `from`    | Non                                                     | Date de début au format ISO-8601      |
| `to`      | Non                                                     | Date de fin au format ISO-8601        |

Exemple :

`POST /api/satellites/3/anomalies/detect?metric=temperature&metric=battery&metric=speed`

---

### Réponse de détection

Exemple de réponse :

{
"satelliteId": 3,
"detectedCount": 12,
"savedCount": 12,
"anomalies": [
{
"id": "...",
"missionId": 4,
"satelliteId": 3,
"metric": "temperature",
"type": "THRESHOLD",
"severity": "ELEVEE",
"timestamp": "2026-01-01T10:10:00Z",
"value": 85.0,
"previousValue": null,
"previousTimestamp": null,
"ruleName": "threshold_temperature_critical_max",
"thresholdUsed": 80.0,
"message": "Valeur supérieure au seuil critique"
}
]
}

---

### Règles métier

| Règle                  | Description                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| Détection automatique  | Les anomalies sont détectées automatiquement après un import CSV valide |
| Détection manuelle     | Un utilisateur autorisé peut relancer la détection                      |
| Données non modifiées  | La détection ne modifie pas les points de télémétrie                    |
| Anomalies enregistrées | Les anomalies détectées sont persistées dans MongoDB                    |
| Déduplication          | Une même anomalie ne peut pas être enregistrée plusieurs fois           |
| Consultation           | Les anomalies sont consultables depuis l’API et l’interface             |
| Lecture autorisée      | ADMIN, OPERATEUR et LECTEUR peuvent consulter les anomalies             |
| Reproductibilité       | Pour un même jeu de données, les règles produisent les mêmes anomalies  |

---

### Frontend

La page détail satellite affiche une section `Anomalies détectées`.

Cette section permet :

* de consulter les anomalies existantes ;
* de relancer une détection à la demande ;
* de filtrer par métrique ;
* de filtrer par période ;
* d’afficher les types d’anomalies ;
* d’afficher les sévérités ;
* d’afficher les valeurs détectées ;
* d’afficher les messages associés aux règles déclenchées.

Les anomalies sont affichées dans un tableau en lecture seule.

---

### Tests réalisés

Les tests backend couvrent :

* la création automatique d’anomalies après import CSV ;
* la consultation des anomalies ;
* la détection manuelle ;
* la déduplication des anomalies ;
* la non-création de doublons lors d’une deuxième détection ;
* les règles de seuil ;
* les règles de variation ;
* les règles de données manquantes ;
* l’accès authentifié aux endpoints.

Le frontend a été validé manuellement dans le navigateur :

* affichage du tableau d’anomalies ;
* affichage des badges de type ;
* affichage des badges de sévérité ;
* filtrage par métrique ;
* relance de la détection ;
* message indiquant le nombre d’anomalies détectées et enregistrées.

---

### Limites actuelles

L’US17 ne couvre pas :

* la détection par machine learning ;
* l’apprentissage automatique ;
* la configuration dynamique des règles ;
* la priorisation automatique avancée ;
* la correction automatique des anomalies ;
* la création d’incidents à partir des anomalies.

---

### Perspectives d’évolution

Évolutions possibles :

* externaliser les règles dans une configuration YAML ;
* ajouter une interface d’administration des seuils ;
* générer automatiquement des alertes à partir des anomalies ;
* créer des incidents depuis les anomalies critiques ;
* afficher les anomalies directement sur les graphiques de télémétrie ;
* ajouter des statistiques par métrique ;
* ajouter des exports CSV/PDF des anomalies.


---

## Génération automatique d’alertes à partir des anomalies

L’application génère automatiquement des alertes mission à partir des anomalies de télémétrie détectées.

Cette fonctionnalité permet de transformer une anomalie technique détectée sur les données de télémétrie en alerte opérationnelle visible dans le module Mission Control.

Les anomalies sont stockées dans MongoDB, tandis que les alertes sont stockées en base SQL afin de rester intégrées au module existant de gestion des alertes.

---

### Objectif

Lorsqu’une anomalie est détectée, le système crée automatiquement une alerte associée à la mission et au satellite concernés.

L’alerte permet d’informer les utilisateurs qu’une situation nécessite une attention particulière.

Les alertes générées sont consultables depuis la liste des alertes d’une mission.

---

### Principe de fonctionnement

Flux de traitement :

```text
Import CSV télémétrie
        ↓
Détection d’anomalies
        ↓
Persistance des anomalies dans MongoDB
        ↓
Génération automatique d’alertes SQL
        ↓
Affichage dans les alertes de mission
```

---

### Données stockées dans une alerte

Une alerte générée depuis une anomalie contient :

- mission associée ;
- satellite concerné ;
- métrique impactée ;
- type d’alerte ;
- gravité ;
- statut ;
- message ;
- identifiant de l’anomalie d’origine ;
- valeur de télémétrie détectée ;
- timestamp de télémétrie ;
- date de création.

---

### Champs ajoutés à l’entité Alert

Les champs suivants ont été ajoutés à l’entité `Alert` :

| Champ | Description |
|---|---|
| `anomalyId` | Identifiant MongoDB de l’anomalie d’origine |
| `telemetryValue` | Valeur de télémétrie ayant déclenché l’anomalie |
| `telemetryTimestamp` | Date du point de télémétrie concerné |

Un index unique est appliqué sur `anomaly_id` afin d’éviter la création de doublons.

---

### Types d’alertes générées

Les types d’alertes sont dérivés du type d’anomalie.

| Anomalie | Type d’alerte |
|---|---|
| `THRESHOLD` | `ANOMALY_THRESHOLD` |
| `VARIATION` | `ANOMALY_VARIATION` |
| `MISSING` | `ANOMALY_MISSING` |

---

### Statut des alertes

Une alerte générée automatiquement est créée avec le statut :

```text
ACTIVE
```

Elle peut ensuite être acquittée via le mécanisme existant d’acquittement des alertes.

---

### Règles métier

| Règle | Description |
|---|---|
| Création automatique | Une alerte est créée après détection d’une anomalie |
| Une anomalie, une alerte | Une anomalie génère au maximum une alerte |
| Statut par défaut | Une alerte générée est créée avec le statut `ACTIVE` |
| Pas de suppression automatique | Les alertes ne sont pas supprimées automatiquement |
| Déduplication | Une alerte ne peut pas être créée deux fois pour la même anomalie |
| Consultation | Les alertes sont visibles depuis la liste des alertes mission |
| Acquittement | Les alertes peuvent être acquittées via le mécanisme existant |

---

### Endpoint utilisé

Les alertes générées sont consultables via l’endpoint existant :

```http
GET /api/missions/{missionId}/alerts
```

Avec filtre optionnel :

```http
GET /api/missions/{missionId}/alerts?status=ACTIVE
```

---

### Exemple de réponse

```json
{
  "id": 1,
  "missionId": 4,
  "missionName": "Mission Luna",
  "satelliteId": 3,
  "satelliteName": "LunaSat-03",
  "metric": "speed",
  "type": "ANOMALY_THRESHOLD",
  "severity": "ELEVEE",
  "status": "ACTIVE",
  "message": "Anomalie THRESHOLD détectée sur la métrique speed avec la valeur 8050.0.",
  "anomalyId": "65f...",
  "telemetryValue": 8050.0,
  "telemetryTimestamp": "2026-01-01T10:10:00Z",
  "createdAt": "2026-07-05T22:54:00",
  "ackAt": null,
  "ackBy": null
}
```

---

### Correction importante

La génération d’alertes ne repose pas uniquement sur les nouvelles anomalies créées.

Le système récupère les anomalies détectées déjà persistées afin de créer les alertes même lorsque les anomalies existaient déjà en MongoDB mais qu’aucune alerte SQL n’avait encore été créée.

Cela corrige le cas suivant :

```text
Anomalies déjà existantes
        ↓
Redétection
        ↓
savedCount = 0
        ↓
Aucune alerte créée
```

Après correction :

```text
Anomalies déjà existantes
        ↓
Redétection
        ↓
savedCount = 0
        ↓
Alertes créées si absentes
```

---

### Tests réalisés

Les tests backend vérifient :

- la création d’alertes après détection d’anomalies ;
- la liaison alerte / mission ;
- la liaison alerte / satellite ;
- la cohérence des champs `metric`, `type`, `severity`, `value`, `timestamp` ;
- le statut `ACTIVE` par défaut ;
- l’absence de doublons lors d’une redétection ;
- la consultation des alertes via l’endpoint mission.

Résultat :

```text
200 tests PASS
BUILD SUCCESS
```

---

### Validation manuelle

Validation réalisée avec Postman :

```http
GET /api/missions/4/alerts?status=ACTIVE
```

Résultat : les alertes générées depuis les anomalies sont bien retournées.

Validation réalisée dans le navigateur :

- page alertes mission accessible ;
- alertes visibles ;
- types `ANOMALY_THRESHOLD`, `ANOMALY_VARIATION`, `ANOMALY_MISSING` affichés ;
- gravités affichées ;
- statut `ACTIVE` affiché ;
- bouton d’acquittement disponible.

---

### Hors périmètre

L’US18 ne couvre pas :

- notification email ;
- notification SMS ;
- notification push ;
- escalade automatique ;
- fusion d’alertes similaires ;
- corrélation avancée ;
- création automatique d’incidents.


---

## Exporter les résultats de simulation CSV / PDF

L’application permet d’exporter les résultats d’une simulation orbitale ou d’un transfert de Hohmann.

Les exports sont générés à la demande depuis le détail d’une simulation et ne modifient pas les données en base.

Deux formats sont disponibles :

- `CSV` : destiné à l’analyse de données ou à l’exploitation externe ;
- `PDF` : destiné au partage ou à l’archivage sous forme de rapport lisible.

---

### Objectif

Permettre à un utilisateur autorisé d’exporter les paramètres et résultats d’une simulation enregistrée.

L’export reflète les données persistées de la simulation sélectionnée.

---

### Types de simulations supportés

| Type | Description |
|---|---|
| `ORBIT` | Simulation orbitale |
| `HOHMANN` | Manœuvre de transfert de Hohmann |

---

### Endpoints API

| Méthode | Endpoint | Format | Rôles autorisés |
|---|---|---|---|
| `GET` | `/api/simulations/{id}/export/csv` | CSV | ADMIN, OPERATEUR, LECTEUR |
| `GET` | `/api/simulations/{id}/export/pdf` | PDF | ADMIN, OPERATEUR, LECTEUR |

---

### Export CSV

Le fichier CSV utilise un format à colonnes fixes.

Colonnes exportées :

```text
simulationId;missionId;missionName;satelliteId;satelliteName;type;status;createdAt;createdBy;inputMassKg;inputAltitudeKm;inputInclinationDeg;inputEccentricity;targetAltitudeKm;orbitalPeriodMinutes;averageVelocityKmS;orbitShape;deltaV1MS;deltaV2MS;deltaVTotalMS;transferTimeMinutes
```

Le séparateur utilisé est `;` afin d’assurer une ouverture correcte dans Excel en environnement français.

Le fichier est encodé en UTF-8 avec BOM pour préserver les caractères accentués.

---

### Exemple CSV ORBIT

```csv
simulationId;missionId;missionName;satelliteId;satelliteName;type;status;createdAt;createdBy;inputMassKg;inputAltitudeKm;inputInclinationDeg;inputEccentricity;targetAltitudeKm;orbitalPeriodMinutes;averageVelocityKmS;orbitShape;deltaV1MS;deltaV2MS;deltaVTotalMS;transferTimeMinutes
24;4;Mission to the MOOOOON;3;LunaSat-03;ORBIT;SUCCESS;2026-07-06T00:56:57.705593;admin@finalspace.com;850.0;500.0;95.0;0.4;;94.47;7.62;ELLIPTIQUE;;;;
```

---

### Exemple CSV HOHMANN

```csv
simulationId;missionId;missionName;satelliteId;satelliteName;type;status;createdAt;createdBy;inputMassKg;inputAltitudeKm;inputInclinationDeg;inputEccentricity;targetAltitudeKm;orbitalPeriodMinutes;averageVelocityKmS;orbitShape;deltaV1MS;deltaV2MS;deltaVTotalMS;transferTimeMinutes
25;4;Mission to the MOOOOON;3;LunaSat-03;HOHMANN;SUCCESS;2026-07-06T01:05:00;admin@finalspace.com;850.0;500.0;95.0;0.4;1200.0;;;;123.4;121.8;245.2;52.7
```

---

### Export PDF

Le PDF est généré avec OpenPDF `2.0.4`.

Le rapport contient :

- un titre ;
- la date de génération ;
- les métadonnées de la simulation ;
- un tableau des paramètres d’entrée ;
- un tableau des résultats calculés ;
- un pied de page indiquant que le rapport est généré automatiquement.

---

### Contenu du PDF

#### Métadonnées

- identifiant de simulation ;
- mission ;
- satellite ;
- type ;
- statut ;
- date de création ;
- auteur.

#### Paramètres

- masse ;
- altitude initiale ;
- inclinaison ;
- excentricité ;
- altitude cible pour les simulations `HOHMANN`.

#### Résultats ORBIT

- période orbitale ;
- vitesse moyenne ;
- forme de l’orbite.

#### Résultats HOHMANN

- delta V1 ;
- delta V2 ;
- delta V total ;
- durée du transfert.

---

### Frontend

La page détail simulation affiche une section `Exports`.

Elle propose deux boutons :

- `Exporter CSV`
- `Exporter PDF`

Le téléchargement est déclenché directement depuis le navigateur.

Les erreurs `403` et `404` sont gérées côté interface.

---

### Règles métier

| Règle | Description |
|---|---|
| Export à la demande | L’export est lancé uniquement par action utilisateur |
| Simulation ciblée | Chaque export correspond à une simulation précise |
| Données persistées | L’export utilise les données enregistrées en base |
| Aucune modification | L’export ne modifie pas la base de données |
| Format CSV unique | Les simulations ORBIT et HOHMANN partagent les mêmes colonnes |
| Format PDF standardisé | Un modèle PDF unique est utilisé |
| Accès lecteur | Le rôle LECTEUR peut exporter une simulation |

---

### Tests réalisés

Les tests backend vérifient :

- export CSV non vide ;
- export PDF non vide ;
- fichier PDF valide ;
- headers `Content-Type` ;
- headers `Content-Disposition` ;
- export CSV pour simulation `ORBIT` ;
- export CSV pour simulation `HOHMANN` ;
- export PDF pour simulation `ORBIT` ;
- export PDF pour simulation `HOHMANN` ;
- accès autorisé pour `LECTEUR`.

Validation manuelle :

- téléchargement CSV depuis le navigateur ;
- téléchargement PDF depuis le navigateur ;
- ouverture correcte du CSV dans Excel ;
- ouverture correcte du PDF ;
- test avec un compte LECTEUR.

---

### Hors périmètre

L’US19 ne couvre pas :

- personnalisation du modèle PDF ;
- export multi-simulations ;
- envoi automatique par email ;
- archivage automatique des exports ;
- génération planifiée des rapports.

---

## US20 - Générer un rapport de mission PDF

L’application permet de générer un rapport PDF complet pour une mission existante.

Le rapport est généré à la demande par l’utilisateur et ne modifie pas les données en base. Il fournit une synthèse exploitable de l’état courant de la mission, destinée à l’analyse, au partage ou à l’archivage.

---

### Objectif

Permettre à un utilisateur autorisé de produire un rapport de mission regroupant les informations essentielles d’une mission et de ses activités associées.

Le rapport couvre :

- les informations générales de la mission ;
- les satellites associés ;
- les simulations réalisées ;
- les alertes générées ;
- les incidents ouverts, en cours ou clôturés ;
- une conclusion automatique basée sur l’état courant de la mission.

---

### Endpoint API

| Méthode | Endpoint | Format | Rôles autorisés |
|---|---|---|---|
| `GET` | `/api/missions/{missionId}/report/pdf` | PDF | ADMIN, OPERATEUR, LECTEUR |

---

### Nom du fichier généré

Le fichier téléchargé utilise le format suivant :

```text
mission-report-<id>.pdf
```

Exemple :

```text
mission-report-4.pdf
```

---

### Contenu du rapport PDF

Le rapport contient les sections suivantes :

| Section | Contenu |
|---|---|
| Métadonnées du rapport | Date de génération, auteur, identifiant mission |
| Informations mission | Nom, description, statut, date de création, date de clôture |
| KPI globaux | Nombre de satellites, simulations, alertes et incidents |
| Satellites associés | Liste des satellites avec statut et paramètres orbitaux |
| Synthèse simulations | Nombre total, nombre ORBIT, nombre HOHMANN |
| Dernières simulations | Dernières simulations enregistrées avec résultat principal |
| Synthèse alertes | Nombre total, actives, acquittées, répartition par gravité |
| Dernières alertes | Type, gravité, statut, satellite, métrique, message |
| Synthèse incidents | Nombre total, ouverts, en cours, clôturés, répartition par gravité |
| Derniers incidents | Titre, gravité, statut, satellite, dates |
| Conclusion automatique | Résumé de l’état courant de la mission |

---

### Règles métier

| Règle | Description |
|---|---|
| Génération à la demande | Le rapport est généré uniquement suite à une action utilisateur |
| Données courantes | Le rapport reflète l’état des données au moment de la génération |
| Aucune modification | La génération ne modifie pas les données en base |
| Modèle unique | Le rapport utilise un format PDF standardisé |
| Mission ciblée | Chaque rapport concerne une seule mission |
| Accès lecteur | Le rôle LECTEUR peut générer un rapport |

---

### Frontend

La page détail mission propose un bouton :

```text
Générer rapport PDF
```

Le clic déclenche le téléchargement du rapport PDF depuis le navigateur.

Les erreurs sont gérées côté interface :

- `403` : redirection vers la page forbidden ;
- `404` : affichage du message `Mission introuvable` ;
- autre erreur : affichage d’un message d’échec de génération.

---

### Sécurité

Les rôles autorisés à générer un rapport sont :

- ADMIN ;
- OPERATEUR ;
- LECTEUR.

Un utilisateur non authentifié ou non autorisé ne peut pas générer le rapport.

---

### Tests réalisés

Les tests backend vérifient :

- génération du rapport PDF par un ADMIN ;
- génération du rapport PDF par un LECTEUR ;
- refus d’un utilisateur non connecté ;
- erreur 404 si la mission n’existe pas ;
- `Content-Type: application/pdf` ;
- `Content-Disposition` avec le nom `mission-report-<id>.pdf` ;
- PDF non vide ;
- signature PDF commençant par `%PDF`.

Validation manuelle réalisée :

- génération depuis Postman ;
- téléchargement depuis le navigateur ;
- ouverture correcte du PDF ;
- cohérence du rapport avec les données mission ;
- validation du bouton depuis la page détail mission.

---

### Hors périmètre

L’US20 ne couvre pas :

- personnalisation avancée du modèle PDF ;
- génération automatique périodique ;
- export Word ;
- export multi-formats ;
- envoi automatique par email ;
- archivage automatique du rapport ;
- signature numérique du PDF.

---

## US21 - Exporter un rapport de télémétrie CSV/PDF

L’application permet d’exporter un rapport de télémétrie pour un satellite existant.

Le rapport est généré à la demande par l’utilisateur et ne modifie pas les données en base. Il permet d’analyser, partager ou archiver les mesures de télémétrie associées à un satellite et à sa mission.

---

### Objectif

Permettre à un utilisateur autorisé d’exporter les données de télémétrie d’un satellite, avec les anomalies et alertes associées.

Le rapport peut être généré en deux formats :

- CSV pour l’exploitation externe des données ;
- PDF pour le partage, l’analyse ou l’archivage.

---

### Endpoints API

| Méthode | Endpoint | Format | Rôles autorisés |
|---|---|---|---|
| `GET` | `/api/satellites/{satelliteId}/telemetry/report/csv` | CSV | ADMIN, OPERATEUR, LECTEUR |
| `GET` | `/api/satellites/{satelliteId}/telemetry/report/pdf` | PDF | ADMIN, OPERATEUR, LECTEUR |

---

### Paramètres disponibles

| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `metric` | `string` | Oui | Métrique à exporter. Peut être répétée pour exporter plusieurs métriques |
| `from` | `Instant` | Non | Date de début de la période |
| `to` | `Instant` | Non | Date de fin de la période |

Exemple multi-métriques :

```http
GET /api/satellites/3/telemetry/report/csv?metric=temperature&metric=battery
```

Exemple avec période :

```http
GET /api/satellites/3/telemetry/report/pdf?metric=temperature&from=2026-01-01T10:00:00Z&to=2026-01-01T11:00:00Z
```

---

### Noms des fichiers générés

CSV :

```text
telemetry-report-<satelliteId>.csv
```

PDF :

```text
telemetry-report-<satelliteId>.pdf
```

---

### Contenu du rapport CSV

Le fichier CSV contient les colonnes suivantes :

```text
missionId;missionName;satelliteId;satelliteName;timestamp;metric;value;anomalyFlag;anomalyType;anomalySeverity;anomalyMessage
```

| Colonne | Description |
|---|---|
| `missionId` | Identifiant de la mission |
| `missionName` | Nom de la mission |
| `satelliteId` | Identifiant du satellite |
| `satelliteName` | Nom du satellite |
| `timestamp` | Date et heure de la mesure |
| `metric` | Métrique mesurée |
| `value` | Valeur mesurée |
| `anomalyFlag` | Indique si une anomalie est associée au point |
| `anomalyType` | Type d’anomalie détectée |
| `anomalySeverity` | Gravité de l’anomalie |
| `anomalyMessage` | Message descriptif de l’anomalie |

Le fichier CSV utilise :

- encodage UTF-8 avec BOM ;
- séparateur `;` ;
- fin de ligne CRLF.

---

### Contenu du rapport PDF

Le rapport PDF contient les sections suivantes :

| Section | Contenu |
|---|---|
| Métadonnées du rapport | Date de génération, auteur, identifiant satellite |
| Informations générales | Mission, satellite, statut, paramètres orbitaux |
| Périmètre du rapport | Métriques, période, nombre de points, anomalies et alertes |
| Synthèse des métriques | Nombre de points, minimum, maximum et moyenne par métrique |
| Synthèse des anomalies | Nombre total, répartition par type et gravité |
| Dernières anomalies | Liste des anomalies principales |
| Alertes associées | Synthèse des alertes liées aux données analysées |
| Derniers points de télémétrie | Extrait des derniers points inclus |
| Conclusion automatique | Synthèse de l’état des données exportées |

---

### Règles métier

| Règle | Description |
|---|---|
| Génération à la demande | L’export est lancé uniquement suite à une action utilisateur |
| Données existantes | Les données exportées sont celles présentes en base |
| Aucune modification | L’export n’altère pas les données de télémétrie |
| Format standardisé | Le PDF utilise un modèle unique |
| Export satellite | L’export concerne un seul satellite |
| Export multi-métriques | Plusieurs métriques peuvent être exportées en une demande |
| Période optionnelle | `from` et `to` permettent de filtrer les données |
| Limite de volumétrie | L’export est limité à 10 000 points de télémétrie |

---

### Frontend

La page détail satellite propose deux boutons dans la section télémétrie :

```text
Exporter CSV
Exporter PDF
```

L’utilisateur peut :

- sélectionner une ou plusieurs métriques ;
- définir une période optionnelle ;
- exporter les données affichées en CSV ;
- exporter un rapport synthétique en PDF.

Les erreurs sont gérées côté interface :

- `403` : redirection vers la page forbidden ;
- `404` : affichage du message `Satellite introuvable` ;
- `400` : affichage du message `Filtres invalides pour le rapport de télémétrie` ;
- autre erreur : affichage d’un message d’échec de génération.

---

### Sécurité

Les rôles autorisés à exporter un rapport de télémétrie sont :

- ADMIN ;
- OPERATEUR ;
- LECTEUR.

Un utilisateur non authentifié ou non autorisé ne peut pas générer le rapport.

---

### Tests réalisés

Les tests d’intégration JUnit / Spring Boot / MockMvc vérifient :

- génération du rapport CSV par un ADMIN ;
- génération du rapport CSV par un LECTEUR ;
- génération du rapport PDF par un ADMIN ;
- génération du rapport PDF par un LECTEUR ;
- filtrage par métrique ;
- filtrage par période ;
- erreur 404 si le satellite n’existe pas ;
- erreur 400 si aucune métrique n’est fournie ;
- erreur 400 si la période est invalide ;
- refus d’un utilisateur non connecté ;
- présence des headers de téléchargement ;
- fichier CSV non vide ;
- fichier PDF non vide ;
- signature PDF commençant par `%PDF`.

Validation manuelle réalisée :

- export CSV depuis Postman ;
- export PDF depuis Postman ;
- export CSV depuis le navigateur ;
- export PDF depuis le navigateur ;
- vérification du contenu CSV ;
- ouverture correcte du PDF ;
- vérification du build frontend.

---

### Commandes de validation

Backend :

```bash
./mvnw test
```

Frontend :

```bash
npm run build
```

---

### Hors périmètre

L’US21 ne couvre pas :

- personnalisation avancée du contenu du rapport ;
- export multi-satellites en une seule opération ;
- génération automatique planifiée ;
- envoi automatique par email ;
- archivage automatique du rapport ;
- signature numérique du PDF.

---

## Dashboard mission

L’application permet de consulter un dashboard synthétique pour une mission.

Le dashboard affiche les informations principales de la mission ainsi que les indicateurs disponibles dans le MVP.

Les indicateurs liés aux satellites sont calculés depuis les données en base.  
Les indicateurs liés aux alertes, incidents, simulations et imports de télémétrie sont présents mais restent à zéro ou vides tant que les modules correspondants ne sont pas implémentés.

### Endpoint Dashboard

Tous les rôles authentifiés peuvent consulter le dashboard d’une mission.

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `GET` | `/api/missions/{id}/dashboard` | Consulter le dashboard d’une mission | ADMIN, OPERATEUR, LECTEUR |

---

### Exemple de consultation du dashboard

```http
GET /api/missions/4/dashboard
Authorization: Bearer <token>
```

Réponse :

```json
{
  "missionId": 4,
  "missionName": "Mission to the MOOOOON",
  "missionStatus": "ACTIVE",
  "totalSatellites": 5,
  "activeSatellites": 3,
  "inactiveSatellites": 2,
  "activeAlerts": 0,
  "acknowledgedAlerts": 0,
  "openIncidents": 0,
  "inProgressIncidents": 0,
  "closedIncidents": 0,
  "lastSimulations": [],
  "lastTelemetryImports": []
}
```

---

### Indicateurs affichés

| Indicateur | Source | État MVP |
|---|---|---|
| Nom de la mission | Mission | Disponible |
| Statut de la mission | Mission | Disponible |
| Nombre total de satellites | Satellites | Disponible |
| Nombre de satellites actifs | Satellites | Disponible |
| Nombre de satellites inactifs | Satellites | Disponible |
| Alertes actives | Futur module Alertes | Valeur temporaire à `0` |
| Alertes acquittées | Futur module Alertes | Valeur temporaire à `0` |
| Incidents ouverts | Futur module Incidents | Valeur temporaire à `0` |
| Incidents en cours | Futur module Incidents | Valeur temporaire à `0` |
| Incidents clôturés | Futur module Incidents | Valeur temporaire à `0` |
| Dernières simulations | Futur module Simulations | Liste vide temporaire |
| Derniers imports télémétrie | Futur module Télémétrie | Liste vide temporaire |

---

### Comportement frontend Dashboard

Le frontend Angular permet :

- d’accéder au dashboard depuis le détail d’une mission ;
- d’afficher les KPI sous forme de cartes ;
- de consulter le dashboard avec les rôles ADMIN, OPERATEUR et LECTEUR ;
- de consulter le dashboard même si la mission est clôturée ;
- de rafraîchir manuellement les données ;
- de revenir vers le détail de la mission.

---

## Gestion des alertes

L’application permet de consulter les alertes associées à une mission.

Une alerte représente une situation nécessitant une attention particulière.  
Dans le MVP actuel, la consultation des alertes est opérationnelle, mais leur génération automatique sera traitée dans les futures fonctionnalités liées à la télémétrie et à la détection d’anomalies.

### Champs principaux

| Champ | Description |
|---|---|
| `id` | Identifiant technique de l’alerte |
| `missionId` | Identifiant de la mission associée |
| `missionName` | Nom de la mission associée |
| `satelliteId` | Identifiant du satellite concerné, optionnel |
| `satelliteName` | Nom du satellite concerné, optionnel |
| `metric` | Métrique ou source ayant déclenché l’alerte |
| `type` | Type d’alerte |
| `severity` | Gravité de l’alerte |
| `status` | Statut de l’alerte |
| `message` | Message descriptif |
| `createdAt` | Date de création |
| `ackAt` | Date d’acquittement, si applicable |
| `ackBy` | Utilisateur ayant acquitté l’alerte, si applicable |

### Statuts disponibles

| Statut | Description |
|---|---|
| `ACTIVE` | Alerte active nécessitant une attention |
| `ACQUITTEE` | Alerte acquittée |

### Gravités disponibles

| Gravité | Description |
|---|---|
| `FAIBLE` | Alerte de faible gravité |
| `MOYENNE` | Alerte de gravité moyenne |
| `ELEVEE` | Alerte de gravité élevée |

---

### Endpoint Alertes

Tous les rôles authentifiés peuvent consulter les alertes d’une mission.

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `GET` | `/api/missions/{missionId}/alerts` | Lister les alertes d’une mission | ADMIN, OPERATEUR, LECTEUR |
| `POST` | `/api/alerts/{alertId}/ack` | Acquitter une alerte active | ADMIN, OPERATEUR |

Paramètre optionnel :

| Paramètre | Valeurs | Description |
|---|---|---|
| `status` | `ACTIVE`, `ACQUITTEE` | Filtrer les alertes par statut |

---

### Exemple de consultation des alertes

```http
GET /api/missions/4/alerts
Authorization: Bearer <token>
```

Réponse :

```json
[
  {
    "id": 1,
    "missionId": 4,
    "missionName": "Mission Artemis",
    "satelliteId": 10,
    "satelliteName": "LunaSat-01",
    "metric": "temperature",
    "type": "THERMAL_ANOMALY",
    "severity": "ELEVEE",
    "status": "ACTIVE",
    "message": "Température satellite supérieure au seuil",
    "createdAt": "2026-06-07T00:02:00",
    "ackAt": null,
    "ackBy": null
  }
]
```

---

### Exemple d’acquittement d’une alerte

```http
POST /api/alerts/1/ack
Authorization: Bearer <token>
```

Réponse :

```json
{
  "id": 1,
  "missionId": 4,
  "missionName": "Mission Artemis",
  "satelliteId": 10,
  "satelliteName": "LunaSat-01",
  "metric": "temperature",
  "type": "THERMAL_ANOMALY",
  "severity": "ELEVEE",
  "status": "ACQUITTEE",
  "message": "Température satellite supérieure au seuil",
  "createdAt": "2026-06-07T00:02:00",
  "ackAt": "2026-06-07T12:55:00",
  "ackBy": "admin@finalspace.com"
}
```

---

### Règles métier d’acquittement

| Règle | Description |
|---|---|
| Alerte active | Seules les alertes `ACTIVE` peuvent être acquittées |
| Changement de statut | L’acquittement passe le statut à `ACQUITTEE` |
| Traçabilité | La date `ackAt` et l’utilisateur `ackBy` sont enregistrés |
| Ré-acquittement | Une alerte déjà acquittée ne peut pas être réacquittée |
| Lecteur | Le rôle LECTEUR ne peut pas acquitter une alerte |
| Incident | L’acquittement ne crée pas automatiquement d’incident |

---

### Exemple avec filtre par statut

```http
GET /api/missions/4/alerts?status=ACTIVE
Authorization: Bearer <token>
```

Réponse possible si aucune alerte active n’existe :

```json
[]
```

---

### Règles métier Alertes

| Règle | Description |
|---|---|
| Mission obligatoire | Une alerte est rattachée à une mission |
| Satellite optionnel | Une alerte peut être rattachée à un satellite ou à la mission globalement |
| Consultation | Les alertes sont consultables par ADMIN, OPERATEUR et LECTEUR |
| Filtrage | Les alertes peuvent être filtrées par statut |
| Tri | Les alertes sont retournées par date de création décroissante |
| Suppression | La suppression d’une alerte est hors périmètre |
| Modification | La modification manuelle d’une alerte est hors périmètre |
| Génération automatique | La génération automatique dépendra des futures US de télémétrie et d’anomalies |

---

### Comportement frontend Alertes

Le frontend Angular permet :

- d’accéder à la liste des alertes depuis une mission ;
- d’accéder à la liste des alertes depuis le dashboard mission ;
- d’afficher les alertes dans un tableau responsive ;
- de distinguer les alertes actives et acquittées ;
- de distinguer les niveaux de gravité ;
- de filtrer les alertes par statut ;
- de rafraîchir manuellement la liste ;
- de gérer les états loading, erreur et liste vide.

| Rôle | Comportement UI |
|---|---|
| ADMIN | Peut consulter les alertes |
| OPERATEUR | Peut consulter les alertes |
| LECTEUR | Peut consulter les alertes |

---

## Gestion des incidents

L’application permet de créer, consulter, modifier, suivre et clôturer des incidents opérationnels rattachés à une mission.

Un incident représente un problème opérationnel nécessitant un suivi dans le temps.  
Il peut être créé manuellement ou être lié à une alerte existante.

Dans le MVP actuel, le suivi des commentaires est simplifié avec un champ `notes`.

### Champs principaux

| Champ | Description |
|---|---|
| `id` | Identifiant technique de l’incident |
| `missionId` | Identifiant de la mission associée |
| `missionName` | Nom de la mission associée |
| `satelliteId` | Identifiant du satellite concerné, optionnel |
| `satelliteName` | Nom du satellite concerné, optionnel |
| `alertId` | Identifiant de l’alerte liée, optionnel |
| `title` | Titre de l’incident |
| `description` | Description détaillée |
| `notes` | Notes de suivi MVP |
| `severity` | Gravité de l’incident |
| `status` | Statut de l’incident |
| `createdAt` | Date de création |
| `updatedAt` | Date de dernière mise à jour |
| `closedAt` | Date de clôture, si applicable |
| `createdBy` | Utilisateur ayant créé l’incident |

### Statuts disponibles

| Statut | Description |
|---|---|
| `OUVERT` | Incident créé, non encore traité |
| `EN_COURS` | Incident en cours de traitement |
| `CLOTURE` | Incident clôturé, consultable en lecture seule |

### Gravités disponibles

| Gravité | Description |
|---|---|
| `FAIBLE` | Incident de faible gravité |
| `MOYENNE` | Incident de gravité moyenne |
| `ELEVEE` | Incident de gravité élevée |

---

### Endpoints Incidents

Tous les endpoints incidents nécessitent un token JWT.

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `POST` | `/api/missions/{missionId}/incidents` | Créer un incident dans une mission | ADMIN, OPERATEUR |
| `GET` | `/api/missions/{missionId}/incidents` | Lister les incidents d’une mission | ADMIN, OPERATEUR, LECTEUR |
| `GET` | `/api/incidents/{id}` | Consulter le détail d’un incident | ADMIN, OPERATEUR, LECTEUR |
| `PUT` | `/api/incidents/{id}` | Modifier un incident non clôturé | ADMIN, OPERATEUR |
| `POST` | `/api/incidents/{id}/status` | Changer le statut d’un incident | ADMIN, OPERATEUR |
| `POST` | `/api/incidents/{id}/close` | Clôturer explicitement un incident | ADMIN, OPERATEUR |

Paramètre optionnel pour la liste :

| Paramètre | Valeurs | Description |
|---|---|---|
| `status` | `OUVERT`, `EN_COURS`, `CLOTURE` | Filtrer les incidents par statut |

---

### Exemple de création d’un incident

```http
POST /api/missions/4/incidents
Authorization: Bearer <token>
Content-Type: application/json
```

Payload :

```json
{
  "satelliteId": null,
  "alertId": null,
  "title": "Incident de télémétrie",
  "description": "Anomalie détectée sur les données de température.",
  "notes": "Analyse initiale en cours.",
  "severity": "MOYENNE"
}
```

Réponse :

```json
{
  "id": 1,
  "missionId": 4,
  "missionName": "Mission Artemis",
  "satelliteId": null,
  "satelliteName": null,
  "alertId": null,
  "title": "Incident de télémétrie",
  "description": "Anomalie détectée sur les données de température.",
  "notes": "Analyse initiale en cours.",
  "severity": "MOYENNE",
  "status": "OUVERT",
  "createdAt": "2026-06-07T14:10:00",
  "updatedAt": "2026-06-07T14:10:00",
  "closedAt": null,
  "createdBy": "admin@finalspace.com"
}
```

---

### Exemple de création d’un incident lié à une alerte

```http
POST /api/missions/4/incidents
Authorization: Bearer <token>
Content-Type: application/json
```

Payload :

```json
{
  "satelliteId": 10,
  "alertId": 1,
  "title": "Incident thermique",
  "description": "Incident créé depuis une alerte de température élevée.",
  "notes": "Vérification du satellite en cours.",
  "severity": "ELEVEE"
}
```

---

### Exemple de modification d’un incident

```http
PUT /api/incidents/1
Authorization: Bearer <token>
Content-Type: application/json
```

Payload :

```json
{
  "title": "Incident thermique mis à jour",
  "description": "Analyse approfondie de l’anomalie thermique.",
  "notes": "Contrôle des capteurs en cours.",
  "severity": "ELEVEE"
}
```

Réponse :

```json
{
  "id": 1,
  "missionId": 4,
  "missionName": "Mission Artemis",
  "satelliteId": 10,
  "satelliteName": "LunaSat-01",
  "alertId": 1,
  "title": "Incident thermique mis à jour",
  "description": "Analyse approfondie de l’anomalie thermique.",
  "notes": "Contrôle des capteurs en cours.",
  "severity": "ELEVEE",
  "status": "OUVERT",
  "createdAt": "2026-06-07T14:10:00",
  "updatedAt": "2026-06-07T14:25:00",
  "closedAt": null,
  "createdBy": "admin@finalspace.com"
}
```

---

### Exemple de changement de statut

```http
POST /api/incidents/1/status
Authorization: Bearer <token>
Content-Type: application/json
```

Payload :

```json
{
  "status": "EN_COURS"
}
```

---

### Exemple de clôture d’un incident

```http
POST /api/incidents/1/close
Authorization: Bearer <token>
```

Réponse :

```json
{
  "id": 1,
  "missionId": 4,
  "missionName": "Mission Artemis",
  "satelliteId": 10,
  "satelliteName": "LunaSat-01",
  "alertId": 1,
  "title": "Incident thermique mis à jour",
  "description": "Analyse approfondie de l’anomalie thermique.",
  "notes": "Contrôle terminé.",
  "severity": "ELEVEE",
  "status": "CLOTURE",
  "createdAt": "2026-06-07T14:10:00",
  "updatedAt": "2026-06-07T14:45:00",
  "closedAt": "2026-06-07T14:45:00",
  "createdBy": "admin@finalspace.com"
}
```

---

### Règles métier Incidents

| Règle | Description |
|---|---|
| Mission obligatoire | Un incident doit être rattaché à une mission |
| Mission active | Un incident ne peut être créé que dans une mission active |
| Mission clôturée | Les incidents restent consultables mais ne sont plus modifiables |
| Satellite optionnel | Un incident peut être rattaché à un satellite |
| Cohérence satellite | Le satellite doit appartenir à la mission de l’incident |
| Alerte optionnelle | Un incident peut être lié à une alerte |
| Cohérence alerte | L’alerte doit appartenir à la mission de l’incident |
| Création | Un incident créé possède automatiquement le statut `OUVERT` |
| Transitions statut | `OUVERT` → `EN_COURS` → `CLOTURE` |
| Clôture directe | Un incident `OUVERT` peut être clôturé directement |
| Incident clôturé | Un incident clôturé est consultable en lecture seule |
| Suppression | La suppression physique d’un incident n’est pas autorisée |

---

### Comportement frontend Incidents

Le frontend Angular permet :

- d’accéder à la liste des incidents depuis une mission ;
- d’accéder à la liste des incidents depuis le dashboard mission ;
- de lister les incidents d’une mission active ou clôturée ;
- de filtrer les incidents par statut ;
- de créer un incident sur une mission active ;
- de modifier un incident non clôturé ;
- de passer un incident `OUVERT` à `EN_COURS` ;
- de clôturer un incident ;
- d’afficher les incidents clôturés en lecture seule ;
- d’afficher les incidents d’une mission clôturée en lecture seule ;
- de masquer les actions interdites pour le rôle LECTEUR.

| Rôle | Comportement UI |
|---|---|
| ADMIN | Peut créer, modifier, changer le statut, clôturer et consulter |
| OPERATEUR | Peut créer, modifier, changer le statut, clôturer et consulter |
| LECTEUR | Peut uniquement consulter |

---

## Tests

Le projet contient des tests automatisés côté backend.

### Tests backend

Commande :

```bash
cd backend
./mvnw clean test
```

Les tests couvrent notamment :

- l’authentification ;
- la santé de l’application ;
- les règles RBAC ;
- la gestion des missions ;
- la gestion des satellites ;
- la consultation des alertes ;
- l’acquittement des alertes ;
- les règles d’autorisation liées à l’acquittement ;
- les filtres d’alertes par statut ;
- les règles métier liées aux missions clôturées ;
- les règles métier liées aux satellites inactifs;
- le moteur de calcul orbital simplifié ;
- le lancement d’une simulation orbitale ;
- la persistance des runs de simulation ;
- les règles d’accès ADMIN / OPERATEUR / LECTEUR ;
- le refus de simulation sur satellite inactif ou mission clôturée.

### Tests frontend

Commande :

```bash
cd frontend
npm run build
```

Le build Angular permet de valider que l’application frontend compile correctement.

---

## Intégration continue

Le projet utilise GitHub Actions avec un workflow CI minimal.

La CI vérifie :

- la compilation et les tests backend ;
- la compilation frontend.

Workflow :

```text
.github/workflows/ci.yml
```

---

## État du projet

À ce stade :

- frontend opérationnel ;
- backend opérationnel ;
- authentification JWT opérationnelle ;
- RBAC opérationnel ;
- gestion des missions opérationnelle ;
- gestion des satellites opérationnelle ;
- consultation des alertes opérationnelle ;
- acquittement des alertes opérationnel ;
- gestion des incidents opérationnelle ;
- tests backend en place ;
- CI GitHub Actions en place.

---

## Fonctionnalités réalisées

| Fonctionnalité | État |
|---|---|
| Authentification JWT | Réalisée |
| Gestion des rôles RBAC | Réalisée |
| Protection des routes frontend | Réalisée |
| Gestion des missions | Réalisée |
| Gestion des satellites | Réalisée |
| Consultation des alertes | Réalisée |
| Acquittement des alertes | Réalisée |
| Gestion des incidents | Réalisée |
| Simulation orbitale | Réalisée |
| Tests backend | Réalisés |
| CI minimale | Réalisée |

---

## Prochaines étapes

Les prochaines fonctionnalités métier prévues sont :

- gestion des simulations orbitales ;
- import et analyse de télémétrie ;
- détection d’anomalies ;
- génération automatique d’alertes ;
- gestion des incidents ;
- simulation orbitale opérationnelle ;
- page détail satellite ajoutée ;
- génération de rapports.
