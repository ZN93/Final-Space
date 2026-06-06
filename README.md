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

Une mission représente un contexte opérationnel regroupant les futures ressources liées au suivi spatial : satellites, simulations, alertes, incidents et télémétrie.

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
| ACTIVE | Mission utilisable pour les opérations |
| CLOTUREE | Mission clôturée, consultable mais non modifiable |

---

### Endpoints Missions

Tous les endpoints missions nécessitent un token JWT.

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| POST | `/api/missions` | Créer une mission | ADMIN, OPERATEUR |
| GET | `/api/missions` | Lister les missions | ADMIN, OPERATEUR, LECTEUR |
| GET | `/api/missions/{id}` | Consulter le détail d’une mission | ADMIN, OPERATEUR, LECTEUR |
| PUT | `/api/missions/{id}` | Modifier une mission active | ADMIN, OPERATEUR |
| POST | `/api/missions/{id}/close` | Clôturer une mission | ADMIN, OPERATEUR |

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

Réponse :

```json
{
  "id": 1,
  "name": "Mission Artemis II",
  "description": "Mission lunaire mise à jour",
  "status": "ACTIVE",
  "createdAt": "2026-06-06T11:53:00",
  "closedAt": null
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

### Comportement frontend Missions

Le frontend Angular permet :

* l’affichage de la liste des missions ;
* la création d’une mission ;
* la consultation du détail d’une mission ;
* la modification d’une mission active ;
* la clôture d’une mission avec confirmation ;
* l’affichage en lecture seule d’une mission clôturée ;
* le masquage des actions interdites pour le rôle LECTEUR ;
* la navigation via un header global.

| Rôle | Comportement UI |
|---|---|
| ADMIN | Peut créer, modifier, clôturer et consulter |
| OPERATEUR | Peut créer, modifier, clôturer et consulter |
| LECTEUR | Peut uniquement consulter |

---

## Tests

Le projet dispose de tests backend automatisés couvrant les premières user stories.

Commande :

```bash
cd backend
./mvnw clean test
```

Résultat validé :

```text
Tests run: 21, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

Les tests couvrent notamment :

* le démarrage du contexte Spring ;
* l’authentification JWT ;
* la protection des endpoints ;
* les règles RBAC ;
* les règles métier de gestion des missions.

La documentation détaillée des tests est disponible dans :

```text
docs/tests/
```

---

## Intégration continue

Le projet utilise GitHub Actions pour vérifier automatiquement :

* le build backend ;
* l’exécution des tests backend ;
* le build frontend Angular.

La CI doit être verte avant intégration dans `main`.

---

## Logging

Le backend utilise **Log4j2** pour la gestion des logs.

Un log est généré à chaque appel de l’endpoint `/api/health`, permettant de vérifier le bon fonctionnement du système de journalisation.

---

## État du projet

À ce stade :

* frontend opérationnel ;
* backend opérationnel ;
* authentification JWT opérationnelle ;
* RBAC opérationnel ;
* gestion des missions terminée ;
* tests backend automatisés en place ;
* CI minimale opérationnelle.

---

## Prochaine étape

Implémentation des fonctionnalités métier suivantes :

* gestion des satellites ;
* dashboard enrichi ;
* gestion des incidents ;
* alertes ;
* télémétrie.
