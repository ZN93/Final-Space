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
- les règles métier liées aux satellites inactifs.

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
- génération de rapports.