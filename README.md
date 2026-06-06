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
| Tests backend | Réalisés |
| CI minimale | Réalisée |

---

## Prochaines étapes

Les prochaines fonctionnalités métier prévues sont :

- gestion des simulations orbitales ;
- import et analyse de télémétrie ;
- gestion des alertes ;
- gestion des incidents ;
- génération de rapports.