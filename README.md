# Final Space – Initialisation du projet

## Description

Ce projet correspond à la mise en place du socle technique de l’application **Final Space**, une plateforme de supervision de missions spatiales.

L’objectif de cette première étape est de disposer d’une base fonctionnelle permettant de lancer :

* un front-end Angular
* un back-end Spring Boot

Aucune logique métier n’est implémentée à ce stade.

---

## Structure du projet

Le projet est organisé en deux dépôts distincts :

* **frontend** : application Angular
* **backend** : API Spring Boot

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

Endpoint de test :

```text
http://localhost:8080/api/health
```

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

## Communication front / back

Le backend expose un endpoint de test :

```text
GET /api/health
```

Cet endpoint permet de vérifier le bon fonctionnement de l’API et la communication avec le frontend.

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

---

## Sécurité

Les endpoints protégés nécessitent un token JWT :

```http
Authorization: Bearer <token>
```

Exemple d’endpoint protégé :

```http
GET /api/secure/test
```

Sans token valide, l’API retourne :

```http
401 Unauthorized
```

---

## Compte de test

Utilisateur administrateur de développement :

```text
email: admin@finalspace.com
password: admin123
```

---

## Frontend Auth

Le frontend Angular implémente :

- écran de connexion
- stockage du JWT dans localStorage
- HttpInterceptor pour ajouter automatiquement le token
- AuthGuard pour protéger les routes
- déconnexion avec suppression du token

---

## Variables d’environnement

Le backend utilise une clé JWT configurable.

Exemple :

```properties
jwt.secret=changeThisSecretKey
jwt.expiration=3600000
```

---

## RBAC – Gestion des rôles

L’application utilise un système RBAC (Role-Based Access Control).

### Rôles disponibles

| Rôle | Description |
|---|---|
| ADMIN | Accès complet à toutes les fonctionnalités |
| OPERATEUR | Accès aux fonctionnalités opérationnelles |
| LECTEUR | Accès en lecture seule |

---

## Comptes de test

| Rôle | Email | Mot de passe |
|---|---|---|
| ADMIN | admin@finalspace.com | admin123 |
| OPERATEUR | operator@finalspace.com | operator123 |
| LECTEUR | reader@finalspace.com | reader123 |

---

## Restrictions backend

| Endpoint | Accès |
|---|---|
| GET /api/rbac/admin | ADMIN |
| GET /api/rbac/operator | ADMIN, OPERATEUR |
| GET /api/rbac/reader | ADMIN, OPERATEUR, LECTEUR |
| GET /api/auth/me | ADMIN, OPERATEUR, LECTEUR |

---

## Gestion des erreurs

| Cas | Réponse |
|---|---|
| Token absent ou invalide | 401 Unauthorized |
| Token valide mais rôle insuffisant | 403 Forbidden |

---

## Comportement frontend

Le frontend adapte automatiquement l’interface selon le rôle contenu dans le JWT :

- ADMIN :
    - accès administration
    - accès opérations
    - accès lecture

- OPERATEUR :
    - accès opérations
    - accès lecture

- LECTEUR :
    - accès lecture seule

---

## Logging

Le backend utilise **Log4j2** pour la gestion des logs.

Un log est généré à chaque appel de l’endpoint `/api/health`, permettant de vérifier le bon fonctionnement du système de journalisation.

---

## État du projet

À ce stade :

* Frontend opérationnel
* Backend opérationnel
* Communication API testée
* Structure du projet en place

---

## Prochaine étape

Implémentation des premières fonctionnalités métier :

* authentification
* gestion des missions
* gestion des satellites

---
