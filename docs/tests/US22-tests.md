# US22 - Dockeriser l’application

## État de validation

US22 validée.

L’application Final Space est dockerisée avec :

- frontend Angular servi par Nginx ;
- backend Spring Boot ;
- PostgreSQL ;
- MongoDB ;
- volumes persistants ;
- configuration par variables d’environnement ;
- orchestration via Docker Compose.

---

## Objectif de l’US

Permettre de lancer l’application complète dans un environnement reproductible avec une seule commande.

Commande cible :

```bash
docker compose up --build
```

---

## Périmètre validé

| Composant | État |
|---|---|
| Frontend Angular | Dockerisé |
| Backend Spring Boot | Dockerisé |
| PostgreSQL | Dockerisé |
| MongoDB | Dockerisé |
| Volumes persistants | Configurés |
| Réseau Docker | Configuré |
| Variables d’environnement | Externalisées |
| Nginx reverse proxy | Configuré |
| Documentation de lancement | Rédigée |

---

## Architecture validée

```text
Navigateur
   |
   | http://localhost
   v
frontend / nginx
   |
   | /api et /auth
   v
backend / Spring Boot
   |
   | JDBC
   v
PostgreSQL

backend / Spring Boot
   |
   | MongoDB URI
   v
MongoDB
```

---

## Services Docker Compose

| Service | Image | Rôle | Port |
|---|---|---|---|
| `frontend` | `finalspace-frontend:local` | Interface web Angular servie par Nginx | `80` |
| `backend` | `finalspace-backend:local` | API Spring Boot | `8080` |
| `postgres` | `postgres:17` | Base de données relationnelle | `5432` |
| `mongodb` | `mongo:7` | Base MongoDB télémétrie/anomalies | `27017` |

---

## Volumes Docker

| Volume | Service associé | Données persistées |
|---|---|---|
| `postgres_data` | PostgreSQL | Données métier |
| `mongodb_data` | MongoDB | Télémétrie et anomalies |

---

## Réseau Docker

Les services communiquent via le réseau :

```text
finalspace-network
```

Le backend se connecte aux bases via les noms de services Docker :

```text
postgres
mongodb
```

---

## Configuration externalisée

Les variables sensibles et configurables sont externalisées via `.env`.

Un fichier d’exemple est fourni :

```text
.env.example
```

Le fichier `.env` n’est pas versionné.

---

## Variables principales testées

| Variable | Description |
|---|---|
| `POSTGRES_DB` | Nom de la base PostgreSQL |
| `POSTGRES_USER` | Utilisateur PostgreSQL |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL |
| `MONGO_INITDB_ROOT_USERNAME` | Utilisateur MongoDB |
| `MONGO_INITDB_ROOT_PASSWORD` | Mot de passe MongoDB |
| `MONGO_DATABASE` | Base MongoDB |
| `BACKEND_PORT` | Port local du backend |
| `FRONTEND_PORT` | Port local du frontend |
| `JWT_SECRET` | Secret JWT |
| `JWT_EXPIRATION` | Durée de validité JWT |
| `CORS_ALLOWED_ORIGINS` | Origines CORS autorisées |

---

## Fichiers principaux

| Fichier | Rôle |
|---|---|
| `docker-compose.yml` | Orchestration des conteneurs |
| `.env.example` | Exemple de configuration locale |
| `backend/Dockerfile` | Build et runtime du backend |
| `backend/.dockerignore` | Nettoyage du contexte Docker backend |
| `frontend/Dockerfile` | Build Angular et runtime Nginx |
| `frontend/.dockerignore` | Nettoyage du contexte Docker frontend |
| `frontend/nginx.conf` | Configuration Nginx et proxy API |
| `frontend/proxy.conf.json` | Proxy local Angular |
| `application.properties` | Variables d’environnement backend |
| `SecurityConfig.java` | CORS configurable |

---

## Tests de build réalisés

| ID | Scénario | Commande | Résultat |
|---|---|---|---|
| US22-T01 | Tests backend | `./mvnw test` | PASS |
| US22-T02 | Build frontend | `npm run build` | PASS |
| US22-T03 | Build Docker complet | `docker compose up --build` | PASS |
| US22-T04 | Validation configuration Compose | `docker compose config` | PASS |

---

## Tests de démarrage Docker

| ID | Service | Résultat attendu | Résultat |
|---|---|---|---|
| US22-T05 | PostgreSQL | Conteneur démarré | PASS |
| US22-T06 | PostgreSQL | Healthcheck healthy | PASS |
| US22-T07 | MongoDB | Conteneur démarré | PASS |
| US22-T08 | MongoDB | Healthcheck healthy | PASS |
| US22-T09 | Backend | Conteneur démarré | PASS |
| US22-T10 | Frontend | Conteneur démarré | PASS |

Commande utilisée :

```bash
docker compose ps
```

Résultat validé :

```text
finalspace-backend    Up
finalspace-frontend   Up
finalspace-mongodb    Up healthy
finalspace-postgres   Up healthy
```

---

## Tests de connectivité backend

| ID | Scénario | Résultat attendu | Résultat |
|---|---|---|---|
| US22-T11 | Connexion backend à PostgreSQL | Connexion JDBC OK | PASS |
| US22-T12 | Connexion backend à MongoDB | MongoClient connecté | PASS |
| US22-T13 | Démarrage Spring Boot | Application démarrée sur 8080 | PASS |
| US22-T14 | Initialisation JPA | EntityManagerFactory initialisé | PASS |
| US22-T15 | Initialisation sécurité JWT | Filtre JWT chargé | PASS |

Les logs backend confirment :

- démarrage Spring Boot ;
- connexion PostgreSQL via `jdbc:postgresql://postgres:5432/finalspace` ;
- connexion MongoDB via `mongodb:27017` ;
- démarrage Tomcat sur le port `8080`.

---

## Tests frontend / Nginx

| ID | Scénario | Résultat attendu | Résultat |
|---|---|---|---|
| US22-T16 | Accès navigateur | `http://localhost` accessible | PASS |
| US22-T17 | Chargement Angular | Fichiers JS/CSS servis | PASS |
| US22-T18 | Proxy `/auth` | Login transmis au backend | PASS |
| US22-T19 | Proxy `/api` | Appels API transmis au backend | PASS |
| US22-T20 | Navigation SPA | Routes Angular accessibles | PASS |

Les logs frontend confirment :

- démarrage Nginx ;
- service des fichiers Angular ;
- appels `/auth/login` ;
- appels `/api/missions` ;
- appels `/api/satellites` ;
- appels `/api/satellites/{id}/telemetry/metrics` ;
- appels `/api/satellites/{id}/anomalies`.

---

## Tests fonctionnels navigateur

| ID | Scénario | Résultat attendu | Résultat |
|---|---|---|---|
| US22-T21 | Ouverture du frontend | Page chargée | PASS |
| US22-T22 | Connexion utilisateur | Login OK | PASS |
| US22-T23 | Consultation missions | Missions affichées | PASS |
| US22-T24 | Consultation détail mission | Détail mission affiché | PASS |
| US22-T25 | Consultation satellites | Satellites affichés | PASS |
| US22-T26 | Consultation détail satellite | Détail satellite affiché | PASS |
| US22-T27 | Chargement métriques télémétrie | Métriques affichées | PASS |
| US22-T28 | Chargement anomalies | Anomalies affichées | PASS |
| US22-T29 | Export rapport CSV/PDF | Téléchargement fonctionnel | PASS |
| US22-T30 | Rapport mission PDF | Téléchargement fonctionnel | PASS |

---

## Test de persistance

Objectif : vérifier que les données ne sont pas perdues après arrêt et redémarrage simple.

Étapes :

1. lancer l’application :

```bash
docker compose up --build
```

2. créer ou vérifier des données depuis l’interface ;

3. arrêter les conteneurs :

```bash
docker compose down
```

4. relancer :

```bash
docker compose up
```

5. vérifier que les données sont toujours présentes.

Résultat :

```text
PASS
```

Les volumes Docker assurent la persistance de PostgreSQL et MongoDB.

---

## Test de reset complet

Commande :

```bash
docker compose down -v
```

Résultat attendu :

- conteneurs arrêtés ;
- volumes supprimés ;
- données supprimées ;
- environnement réinitialisé au prochain lancement.

Résultat :

```text
PASS
```

---

## Tests de sécurité et configuration

| ID | Scénario | Résultat attendu | Résultat |
|---|---|---|---|
| US22-T31 | Secrets externalisés | `.env` utilisé | PASS |
| US22-T32 | `.env` ignoré par Git | Pas de secrets versionnés | PASS |
| US22-T33 | `.env.example` présent | Configuration documentée | PASS |
| US22-T34 | CORS configurable | Variable `CORS_ALLOWED_ORIGINS` utilisée | PASS |
| US22-T35 | Appels frontend relatifs | Pas d’URL `localhost:8080` hardcodée | PASS |

---

## Critères d’acceptation

| Critère | Validation |
|---|---|
| L’application démarre via une seule commande | PASS |
| Le front-end est accessible via navigateur | PASS |
| Le back-end expose ses endpoints API | PASS |
| PostgreSQL est accessible et persistant | PASS |
| MongoDB est accessible et persistant | PASS |
| Les données restent après redémarrage | PASS |
| Chaque composant possède son Dockerfile | PASS |
| Les variables sensibles sont externalisées | PASS |
| Docker Compose orchestre tous les services | PASS |
| Le README décrit la procédure de lancement | PASS |

---

## Commandes validées

Créer le fichier `.env` :

```bash
cp .env.example .env
```

Sous PowerShell :

```powershell
copy .env.example .env
```

Valider la configuration Docker Compose :

```bash
docker compose config
```

Lancer l’application :

```bash
docker compose up --build
```

Voir l’état des conteneurs :

```bash
docker compose ps
```

Voir les logs :

```bash
docker compose logs
```

Arrêter sans supprimer les données :

```bash
docker compose down
```

Réinitialiser complètement :

```bash
docker compose down -v
```

---

## Résultat Docker Compose validé

```text
finalspace-backend    running
finalspace-frontend   running
finalspace-mongodb    healthy
finalspace-postgres   healthy
```

---

## URLs validées

| Élément | URL |
|---|---|
| Frontend | `http://localhost` |
| Backend | `http://localhost:8080` |
| API via Nginx | `http://localhost/api/...` |
| Auth via Nginx | `http://localhost/auth/login` |
| PostgreSQL | `localhost:5432` |
| MongoDB | `localhost:27017` |

---

## Hors périmètre

L’US22 ne couvre pas :

- déploiement sur un cloud spécifique ;
- Kubernetes ;
- haute disponibilité ;
- scalabilité automatique ;
- registry Docker distante ;
- CI/CD complète de déploiement ;
- monitoring avancé ;
- gestion de secrets en coffre-fort ;
- HTTPS en production.

---

## Conclusion

L’US22 est validée.

L’application Final Space est entièrement dockerisée.

Elle peut être lancée via Docker Compose avec le frontend, le backend, PostgreSQL et MongoDB.

Les services communiquent correctement, les données sont persistées par volumes Docker et l’interface est accessible depuis le navigateur.