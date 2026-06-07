# US11 - Paramétrer un satellite pour la simulation orbitale

## État de validation

**US11 validée côté backend et frontend.**

Le paramétrage orbital d’un satellite est opérationnel.  
Les paramètres orbitaux peuvent être consultés et modifiés via le formulaire de modification du satellite.

Les valeurs sont persistées en base de données dans l’entité `Satellite`.

---

## Objectif de l’US

Permettre à un administrateur ou à un opérateur de renseigner ou modifier les paramètres orbitaux d’un satellite afin de préparer les futures simulations orbitales.

Les paramètres concernés sont :

- la masse du satellite ;
- l’altitude orbitale initiale ;
- l’inclinaison orbitale ;
- l’excentricité.

---

## Choix d’implémentation

Les paramètres orbitaux étaient déjà présents dans l’entité `Satellite` depuis l’US06 :

- `massKg` ;
- `altitudeKm` ;
- `inclinationDeg` ;
- `eccentricity`.

Une première approche consistait à créer un DTO dédié `OrbitParamsUpdateRequest` et un endpoint spécifique :

```http
PUT /api/satellites/{id}/orbit-params
```

Après analyse, cette approche a été abandonnée car elle dupliquait une logique déjà couverte par la modification d’un satellite.

Le choix final du MVP est donc d’enrichir et de valider le DTO existant `SatelliteUpdateRequest`, puis d’utiliser l’endpoint existant :

```http
PUT /api/satellites/{id}
```

Ce choix évite :

- de recoder une logique déjà existante ;
- d’exposer un endpoint supplémentaire pour une action déjà couverte ;
- d’ajouter de la complexité inutile côté backend ;
- d’ajouter une interface redondante côté frontend.

Côté frontend, le paramétrage orbital est intégré au formulaire de modification du satellite.

---

## Endpoint testé

| Méthode | Endpoint | Description | Rôles autorisés |
|---|---|---|---|
| `PUT` | `/api/satellites/{id}` | Modifier un satellite et ses paramètres orbitaux | ADMIN, OPERATEUR |

Le rôle `LECTEUR` dispose uniquement d’un accès en consultation.

---

## Champs validés

| Champ | Règle | État |
|---|---|---|
| `massKg` | Obligatoire, supérieur à `0` | PASS |
| `altitudeKm` | Obligatoire, supérieur à `0` | PASS |
| `inclinationDeg` | Obligatoire, entre `0` et `180` | PASS |
| `eccentricity` | Obligatoire, supérieur ou égal à `0` | PASS |

---

## Règles métier couvertes

| Référence | Règle | État |
|---|---|---|
| RG-ORB-01 | Les paramètres orbitaux sont stockés dans `Satellite` | PASS |
| RG-ORB-02 | Les paramètres orbitaux peuvent être modifiés pour un satellite actif | PASS |
| RG-ORB-03 | Un satellite inactif ne peut plus être modifié | PASS |
| RG-ORB-04 | Les valeurs numériques sont validées côté backend | PASS |
| RG-ORB-05 | Les valeurs numériques sont validées côté frontend | PASS |
| RG-ORB-06 | Le rôle LECTEUR ne peut pas modifier les paramètres | PASS |
| RG-ORB-07 | Une mission clôturée rend les satellites consultables en lecture seule côté UI | PASS |
| RG-ORB-08 | Aucun endpoint redondant n’est exposé pour les paramètres orbitaux | PASS |

---

## Tests unitaires - SatelliteService

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US11-T01 | Modifier un satellite actif avec des paramètres orbitaux valides | Données mises à jour | PASS |
| US11-T02 | Modifier les paramètres `massKg`, `altitudeKm`, `inclinationDeg`, `eccentricity` | Valeurs persistées dans la réponse | PASS |
| US11-T03 | Modifier un satellite inactif | Modification refusée | PASS |
| US11-T04 | Modifier un satellite inexistant | Erreur `Satellite introuvable` | PASS |

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/satellite/service/impl/SatelliteServiceImplTest.java
```

---

## Tests d’intégration API / sécurité

Les règles d’accès sont couvertes par les tests d’intégration existants de la gestion des satellites.

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US11-T05 | ADMIN modifie un satellite actif | `200 OK` | PASS |
| US11-T06 | OPERATEUR modifie un satellite actif | `200 OK` | PASS |
| US11-T07 | LECTEUR tente de modifier un satellite | `403 Forbidden` | PASS |
| US11-T08 | Modification sans token | `401 Unauthorized` | PASS |
| US11-T09 | Modification d’un satellite inexistant | `404 Not Found` | PASS |
| US11-T10 | Modification d’un satellite inactif | `400 Bad Request` | PASS |
| US11-T11 | Payload invalide | `400 Bad Request` | PASS |

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/security/SatelliteAuthorizationIntegrationTest.java
```

---

## Tests Postman réalisés

| Scénario | Endpoint | Résultat attendu | État |
|---|---|---|---|
| Modifier un satellite actif | `PUT /api/satellites/{id}` | `200 OK` | PASS |
| Modifier un satellite inactif | `PUT /api/satellites/{id}` | `400 Bad Request` | PASS |
| Modifier avec un rôle LECTEUR | `PUT /api/satellites/{id}` | `403 Forbidden` | PASS |
| Modifier avec des valeurs invalides | `PUT /api/satellites/{id}` | `400 Bad Request` | PASS |

---

## Tests frontend réalisés

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US11-T12 | Afficher les paramètres orbitaux dans la liste des satellites | Valeurs visibles | PASS |
| US11-T13 | Modifier les paramètres orbitaux via le formulaire satellite | Valeurs mises à jour | PASS |
| US11-T14 | Saisir une masse invalide | Erreur de validation | PASS |
| US11-T15 | Saisir une altitude invalide | Erreur de validation | PASS |
| US11-T16 | Saisir une inclinaison invalide | Erreur de validation | PASS |
| US11-T17 | Saisir une excentricité invalide | Erreur de validation | PASS |
| US11-T18 | Satellite inactif | Formulaire de modification indisponible | PASS |
| US11-T19 | Mission clôturée | Modification indisponible côté UI | PASS |
| US11-T20 | Rôle LECTEUR | Consultation uniquement | PASS |
| US11-T21 | Compilation frontend | Build Angular OK | PASS |

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
Tests run: 114, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS côté backend
Application bundle generation complete côté frontend
```

Warnings frontend constatés mais non bloquants :

```text
src/app/incidents/mission-incident-list/mission-incident-list.component.css exceeded maximum budget
src/app/missions/mission-detail/mission-detail.component.css exceeded maximum budget
4 rules skipped due to selector errors
```

---

## Limites MVP

Les paramètres dérivés, comme la période orbitale ou la vitesse orbitale, ne sont pas encore calculés automatiquement.

Les paramètres utilisés pour une simulation seront figés au moment du lancement de la simulation dans les futures US liées au moteur de simulation.

La gestion de plusieurs jeux de paramètres orbitaux pour un même satellite est hors périmètre.

---

## Documentation réalisée

| Élément | État |
|---|---|
| Documentation des tests backend | Réalisée |
| Documentation des tests frontend | Réalisée |
| Choix d’implémentation documenté | Réalisée |
| README mis à jour | Réalisée |

---

## Conclusion

L’US11 est validée côté backend et frontend.

Le paramétrage orbital est intégré à la modification existante du satellite.  
Cette approche évite d’exposer un endpoint redondant tout en répondant aux besoins fonctionnels de l’US11.

Les rôles ADMIN et OPERATEUR peuvent modifier les paramètres orbitaux d’un satellite actif.  
Le rôle LECTEUR conserve un accès en consultation uniquement.