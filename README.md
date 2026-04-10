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

* Node.js (version LTS recommandée)
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
