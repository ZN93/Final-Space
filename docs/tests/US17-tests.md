# US17 - Détecter automatiquement des anomalies par règles simples

## État de validation

**US17 validée côté backend et frontend.**

L’application permet de détecter automatiquement des anomalies dans les données de télémétrie importées.

Les anomalies sont stockées dans MongoDB dans la collection `telemetry_anomalies`.

---

## Objectif de l’US

Permettre au système d’identifier automatiquement des comportements inhabituels dans les données de télémétrie d’un satellite.

La détection repose sur des règles simples, déterministes et reproductibles.

---

## Dépendances

| User Story | Description                                    | État    |
| ---------- | ---------------------------------------------- | ------- |
| US15       | Import des données de télémétrie au format CSV | Validée |
| US16       | Visualisation des données de télémétrie        | Validée |
| US17       | Détection automatique des anomalies            | Validée |

---

## Stockage

Les anomalies sont stockées dans MongoDB.

Collection :

`telemetry_anomalies`

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

---

## Types d’anomalies

| Type        | Description                                            | État |
| ----------- | ------------------------------------------------------ | ---- |
| `THRESHOLD` | Valeur supérieure ou inférieure à un seuil             | PASS |
| `VARIATION` | Variation brutale entre deux points consécutifs        | PASS |
| `MISSING`   | Absence de données sur une période supérieure au seuil | PASS |

---

## Sévérités

| Sévérité  | Description            |
| --------- | ---------------------- |
| `FAIBLE`  | Anomalie informative   |
| `MOYENNE` | Anomalie significative |
| `ELEVEE`  | Anomalie critique      |

---

## Règles testées

| Métrique         | Règle                                 | Résultat attendu               | État |
| ---------------- | ------------------------------------- | ------------------------------ | ---- |
| `temperature`    | Valeur supérieure à 60                | Anomalie `THRESHOLD` `MOYENNE` | PASS |
| `temperature`    | Valeur supérieure à 80                | Anomalie `THRESHOLD` `ELEVEE`  | PASS |
| `battery`        | Valeur inférieure à 40                | Anomalie `THRESHOLD` `MOYENNE` | PASS |
| `battery`        | Valeur inférieure à 20                | Anomalie `THRESHOLD` `ELEVEE`  | PASS |
| `speed`          | Valeur supérieure à 7800              | Anomalie `THRESHOLD` `MOYENNE` | PASS |
| `speed`          | Valeur supérieure à 8000              | Anomalie `THRESHOLD` `ELEVEE`  | PASS |
| `temperature`    | Variation supérieure à 10             | Anomalie `VARIATION`           | PASS |
| `battery`        | Variation supérieure à 15             | Anomalie `VARIATION`           | PASS |
| `speed`          | Variation supérieure à 150            | Anomalie `VARIATION`           | PASS |
| Toutes métriques | Écart temporel supérieur à 10 minutes | Anomalie `MISSING`             | PASS |

---

## Endpoints testés

| Méthode | Endpoint                                         | Description             |
| ------- | ------------------------------------------------ | ----------------------- |
| `POST`  | `/api/satellites/{satelliteId}/anomalies/detect` | Détecter les anomalies  |
| `GET`   | `/api/satellites/{satelliteId}/anomalies`        | Consulter les anomalies |

---

## Tests backend réalisés

| ID       | Scénario                                        | Résultat attendu                                            | État |
| -------- | ----------------------------------------------- | ----------------------------------------------------------- | ---- |
| US17-T01 | Import d’un CSV contenant des valeurs anormales | Import accepté                                              | PASS |
| US17-T02 | Détection automatique après import CSV          | Anomalies créées en MongoDB                                 | PASS |
| US17-T03 | Consultation des anomalies                      | Liste d’anomalies retournée                                 | PASS |
| US17-T04 | Détection manuelle via endpoint                 | Détection exécutée                                          | PASS |
| US17-T05 | Deuxième détection sur les mêmes données        | Aucun doublon créé                                          | PASS |
| US17-T06 | Déduplication MongoDB                           | Même anomalie non réenregistrée                             | PASS |
| US17-T07 | Règle de seuil                                  | Anomalies `THRESHOLD` détectées                             | PASS |
| US17-T08 | Règle de variation                              | Anomalies `VARIATION` détectées                             | PASS |
| US17-T09 | Règle de données manquantes                     | Anomalies `MISSING` détectées                               | PASS |
| US17-T10 | Accès authentifié                               | Requêtes autorisées selon les règles de sécurité existantes | PASS |

---

## Tests frontend réalisés

| ID       | Scénario                              | Résultat attendu                                    | État |
| -------- | ------------------------------------- | --------------------------------------------------- | ---- |
| US17-T11 | Affichage de la section anomalies     | Section visible sur détail satellite                | PASS |
| US17-T12 | Consultation des anomalies existantes | Tableau affiché                                     | PASS |
| US17-T13 | Détection à la demande                | Message de succès affiché                           | PASS |
| US17-T14 | Déduplication visible côté UI         | `0 nouvelle anomalie` si déjà détectée              | PASS |
| US17-T15 | Filtre par métrique                   | Anomalies filtrées                                  | PASS |
| US17-T16 | Affichage des types                   | Badges `THRESHOLD`, `VARIATION`, `MISSING` affichés | PASS |
| US17-T17 | Affichage des sévérités               | Badges `FAIBLE`, `MOYENNE`, `ELEVEE` affichés       | PASS |
| US17-T18 | Build Angular                         | Build OK                                            | PASS |

---

## Données de test utilisées

Un fichier CSV contenant des anomalies a été utilisé.

Métriques :

* `temperature`
* `battery`
* `speed`

Cas inclus :

* température supérieure aux seuils ;
* batterie inférieure aux seuils ;
* vitesse supérieure aux seuils ;
* variations brutales ;
* trous temporels supérieurs à 10 minutes.

---

## Résultat attendu

Après import du CSV :

* les points de télémétrie sont enregistrés ;
* la détection automatique est déclenchée ;
* les anomalies sont enregistrées dans MongoDB ;
* la consultation des anomalies retourne les anomalies créées.

Après relance manuelle de la détection :

* les anomalies déjà présentes ne sont pas dupliquées ;
* `savedCount` vaut `0` si toutes les anomalies existent déjà.

---

## Résultat d’exécution automatisée

Commande backend :

`./mvnw test`

Résultat attendu :

`BUILD SUCCESS`

Commande frontend :

`npm run build`

Résultat attendu :

`Application bundle generation complete`

---

## Validation navigateur

La fonctionnalité a été validée depuis la page détail satellite.

Cas validés :

* import d’un fichier CSV avec anomalies ;
* affichage automatique des anomalies ;
* bouton `Détecter les anomalies` fonctionnel ;
* affichage du nombre d’anomalies ;
* affichage du type d’anomalie ;
* affichage de la sévérité ;
* affichage de la valeur ;
* affichage de la règle déclenchée ;
* filtrage par métrique ;
* consultation en lecture seule.

---

## Notes techniques

La détection utilise des règles statiques codées côté backend.

Le service de détection applique trois familles de règles :

* seuil ;
* variation ;
* données manquantes.

Les anomalies sont sauvegardées uniquement si elles n’existent pas déjà.

La clé de déduplication est basée sur :

`satelliteId`, `metric`, `timestamp`, `type`, `ruleName`

---

## Limites

L’US17 ne couvre pas :

* la détection par machine learning ;
* l’apprentissage automatique ;
* la configuration dynamique des règles ;
* la priorisation intelligente ;
* la création automatique d’incidents ;
* la génération automatique d’alertes métier ;
* l’affichage des anomalies directement sur les graphiques.

---

## Conclusion

L’US17 est terminée.

Le système détecte automatiquement des anomalies dans les données de télémétrie, les enregistre en base MongoDB et permet leur consultation depuis l’interface.
