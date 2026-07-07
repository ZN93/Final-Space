# US21 - Exporter un rapport de télémétrie CSV/PDF

## État de validation

US21 validée côté backend et frontend.

L’application permet à un utilisateur autorisé d’exporter un rapport de télémétrie associé à un satellite existant.

Le rapport peut être généré en CSV ou en PDF.

---

## Objectif de l’US

Permettre à un utilisateur d’analyser, partager ou archiver les données mesurées d’un satellite.

Le rapport de télémétrie fournit une vue synthétique ou détaillée des données mesurées, avec les anomalies et alertes associées.

---

## Dépendances

| User Story | Description | État |
|---|---|---|
| US15 | Import de télémétrie CSV | Validée |
| US16 | Visualisation de la télémétrie | Validée |
| US17 | Détection d’anomalies | Validée |
| US18 | Génération d’alertes depuis anomalies | Validée |
| US21 | Export rapport télémétrie CSV/PDF | Validée |

---

## Endpoints testés

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/satellites/{satelliteId}/telemetry/report/csv` | Export du rapport de télémétrie en CSV |
| `GET` | `/api/satellites/{satelliteId}/telemetry/report/pdf` | Export du rapport de télémétrie en PDF |

---

## Paramètres testés

| Paramètre | Type | Obligatoire | Exemple |
|---|---|---|---|
| `metric` | `string` | Oui | `temperature` |
| `metric` répété | `string[]` | Non | `metric=temperature&metric=battery` |
| `from` | `Instant` | Non | `2026-01-01T10:00:00Z` |
| `to` | `Instant` | Non | `2026-01-01T11:00:00Z` |

---

## Headers attendus

### CSV

| Header | Valeur attendue |
|---|---|
| `Content-Type` | `text/csv` |
| `Content-Disposition` | `attachment; filename="telemetry-report-<satelliteId>.csv"` |

### PDF

| Header | Valeur attendue |
|---|---|
| `Content-Type` | `application/pdf` |
| `Content-Disposition` | `attachment; filename="telemetry-report-<satelliteId>.pdf"` |

---

## Rôles testés

| Rôle | Résultat attendu | État |
|---|---|---|
| ADMIN | Export autorisé | PASS |
| OPERATEUR | Export autorisé | PASS |
| LECTEUR | Export autorisé | PASS |
| Non connecté | Accès refusé | PASS |

---

## Contenu attendu du CSV

Le fichier CSV contient les colonnes suivantes :

```text
missionId;missionName;satelliteId;satelliteName;timestamp;metric;value;anomalyFlag;anomalyType;anomalySeverity;anomalyMessage
```

Chaque ligne représente un point de télémétrie exporté.

Les anomalies associées sont indiquées par :

- `anomalyFlag` ;
- `anomalyType` ;
- `anomalySeverity` ;
- `anomalyMessage`.

---

## Contenu attendu du PDF

Le rapport PDF contient les sections suivantes :

- métadonnées du rapport ;
- informations générales mission / satellite ;
- période couverte ;
- métriques analysées ;
- synthèse des métriques ;
- statistiques par métrique ;
- synthèse des anomalies ;
- dernières anomalies ;
- synthèse des alertes associées ;
- derniers points de télémétrie ;
- conclusion automatique.

---

## Détail du contenu PDF

### Métadonnées du rapport

- date de génération ;
- utilisateur ayant généré le rapport ;
- identifiant du satellite.

### Informations générales

- mission associée ;
- statut de la mission ;
- satellite concerné ;
- statut du satellite ;
- masse ;
- altitude ;
- inclinaison ;
- excentricité.

### Périmètre du rapport

- métriques analysées ;
- date de début si fournie ;
- date de fin si fournie ;
- nombre de points exportés ;
- nombre d’anomalies associées ;
- nombre d’alertes associées.

### Synthèse des métriques

Pour chaque métrique :

- nombre de points ;
- valeur minimale ;
- valeur maximale ;
- valeur moyenne.

### Synthèse des anomalies

Le rapport indique :

- nombre total d’anomalies ;
- nombre d’anomalies de type `THRESHOLD` ;
- nombre d’anomalies de type `VARIATION` ;
- nombre d’anomalies de type `MISSING` ;
- nombre d’anomalies de gravité faible ;
- nombre d’anomalies de gravité moyenne ;
- nombre d’anomalies de gravité élevée.

### Alertes associées

Le rapport indique :

- nombre total d’alertes ;
- nombre d’alertes actives ;
- nombre d’alertes acquittées ;
- répartition par gravité.

### Conclusion automatique

Le rapport se termine par une synthèse textuelle indiquant :

- le satellite concerné ;
- le nombre de points analysés ;
- le nombre de métriques ;
- le nombre d’anomalies ;
- le nombre d’anomalies de gravité élevée ;
- le nombre d’alertes actives.

---

## Tests backend réalisés

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US21-T01 | Export CSV avec rôle ADMIN | CSV retourné | PASS |
| US21-T02 | Export CSV avec rôle LECTEUR | CSV retourné | PASS |
| US21-T03 | Export PDF avec rôle ADMIN | PDF retourné | PASS |
| US21-T04 | Export PDF avec rôle LECTEUR | PDF retourné | PASS |
| US21-T05 | Export CSV multi-métriques | Les métriques demandées sont présentes | PASS |
| US21-T06 | Filtrage CSV par métrique | Seule la métrique demandée est exportée | PASS |
| US21-T07 | Filtrage CSV par période | Seuls les points de la période sont exportés | PASS |
| US21-T08 | Satellite inexistant | Erreur 404 | PASS |
| US21-T09 | Métrique absente | Erreur 400 | PASS |
| US21-T10 | Période invalide `from > to` | Erreur 400 | PASS |
| US21-T11 | Utilisateur non connecté | Accès refusé | PASS |
| US21-T12 | Vérification Content-Type CSV | `text/csv` | PASS |
| US21-T13 | Vérification Content-Type PDF | `application/pdf` | PASS |
| US21-T14 | Vérification Content-Disposition CSV | `telemetry-report-<id>.csv` | PASS |
| US21-T15 | Vérification Content-Disposition PDF | `telemetry-report-<id>.pdf` | PASS |
| US21-T16 | CSV non vide | Taille supérieure à 0 | PASS |
| US21-T17 | PDF non vide | Taille supérieure à 0 | PASS |
| US21-T18 | Signature PDF | Le fichier commence par `%PDF` | PASS |
| US21-T19 | Anomalie incluse dans CSV | `anomalyFlag=true` et type présent | PASS |
| US21-T20 | Alerte associée prise en compte dans PDF | Synthèse alertes générée | PASS |

---

## Tests frontend réalisés

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US21-T21 | Affichage page détail satellite | Page chargée | PASS |
| US21-T22 | Affichage section télémétrie | Section visible | PASS |
| US21-T23 | Sélection d’une métrique | Métrique sélectionnée | PASS |
| US21-T24 | Sélection de plusieurs métriques | Plusieurs métriques sélectionnées | PASS |
| US21-T25 | Sélection d’une période | `from` et `to` pris en compte | PASS |
| US21-T26 | Clic sur `Exporter CSV` | Téléchargement CSV lancé | PASS |
| US21-T27 | Clic sur `Exporter PDF` | Téléchargement PDF lancé | PASS |
| US21-T28 | Nom fichier CSV | `telemetry-report-<satelliteId>.csv` | PASS |
| US21-T29 | Nom fichier PDF | `telemetry-report-<satelliteId>.pdf` | PASS |
| US21-T30 | Fichier CSV téléchargé | Fichier ouvrable | PASS |
| US21-T31 | Fichier PDF téléchargé | Fichier ouvrable | PASS |
| US21-T32 | Erreur 403 | Redirection forbidden | PASS |
| US21-T33 | Erreur 404 | Message `Satellite introuvable` | PASS |
| US21-T34 | Erreur 400 | Message filtres invalides | PASS |
| US21-T35 | Build frontend | Build OK | PASS |

---

## Tests Postman automatisés réalisés

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US21-P01 | Export CSV | Status 200 | PASS |
| US21-P02 | Export CSV | Header `text/csv` | PASS |
| US21-P03 | Export CSV | Header `Content-Disposition` correct | PASS |
| US21-P04 | Export CSV | Body non vide | PASS |
| US21-P05 | Export CSV | Colonnes attendues présentes | PASS |
| US21-P06 | Export CSV | Au moins une ligne de données | PASS |
| US21-P07 | Export PDF | Status 200 | PASS |
| US21-P08 | Export PDF | Header `application/pdf` | PASS |
| US21-P09 | Export PDF | Header `Content-Disposition` correct | PASS |
| US21-P10 | Export PDF | Réponse non vide | PASS |
| US21-P11 | Satellite inexistant | Erreur 404 | PASS |
| US21-P12 | Métrique manquante | Erreur 400 | PASS |
| US21-P13 | Période invalide | Erreur 400 | PASS |
| US21-P14 | Requête sans token | Accès refusé | PASS |

---

## Commandes de validation

Backend :

```bash
./mvnw test
```

Résultat attendu :

```text
BUILD SUCCESS
```

Frontend :

```bash
npm run build
```

Résultat attendu :

```text
Application bundle generation complete
```

---

## Validation Postman

Endpoint CSV validé :

```http
GET /api/satellites/{satelliteId}/telemetry/report/csv?metric=temperature&metric=battery
```

Endpoint PDF validé :

```http
GET /api/satellites/{satelliteId}/telemetry/report/pdf?metric=temperature&metric=battery
```

Cas validés :

- export CSV avec utilisateur autorisé ;
- export PDF avec utilisateur autorisé ;
- export multi-métriques ;
- export avec période ;
- satellite inexistant ;
- métrique absente ;
- période invalide ;
- utilisateur non connecté.

Résultat :

```text
PASS
```

---

## Validation navigateur

La génération des rapports a été validée depuis la page détail satellite.

Étapes réalisées :

1. ouverture d’un satellite existant ;
2. sélection d’une ou plusieurs métriques ;
3. sélection optionnelle d’une période ;
4. clic sur `Exporter CSV` ;
5. téléchargement du fichier CSV ;
6. ouverture et vérification du CSV ;
7. clic sur `Exporter PDF` ;
8. téléchargement du fichier PDF ;
9. ouverture et vérification du PDF.

Résultat :

```text
PASS
```

---

## Fichiers principaux modifiés

| Fichier | Rôle |
|---|---|
| `TelemetryReportService.java` | Interface du service d’export |
| `TelemetryReportServiceImpl.java` | Génération des rapports CSV et PDF |
| `TelemetryReportController.java` | Endpoints d’export CSV/PDF |
| `TelemetryReportAuthorizationIntegrationTest.java` | Tests d’intégration JUnit / MockMvc |
| `telemetry.service.ts` | Appels HTTP vers les endpoints d’export |
| `satellite-detail.component.ts` | Logique de téléchargement CSV/PDF |
| `satellite-detail.component.html` | Boutons `Exporter CSV` et `Exporter PDF` |
| `satellite-detail.component.css` | Ajustements visuels |
| `README.md` | Documentation fonctionnelle |
| `docs/tests/US21-tests.md` | Documentation de validation |

---

## Règles métier validées

| Règle | Validation |
|---|---|
| Rapport généré à la demande | PASS |
| Données issues de la base | PASS |
| Aucune modification des données de télémétrie | PASS |
| Export CSV disponible | PASS |
| Export PDF disponible | PASS |
| Modèle PDF standardisé | PASS |
| Export par ADMIN | PASS |
| Export par OPERATEUR | PASS |
| Export par LECTEUR | PASS |
| Refus utilisateur non connecté | PASS |
| Filtrage par métrique | PASS |
| Filtrage multi-métriques | PASS |
| Filtrage par période | PASS |
| Anomalies incluses | PASS |
| Alertes associées prises en compte | PASS |
| Erreur 404 si satellite inexistant | PASS |
| Erreur 400 si métrique absente | PASS |
| Erreur 400 si période invalide | PASS |

---

## Hors périmètre

L’US21 ne couvre pas :

- personnalisation avancée du contenu du rapport ;
- export multi-satellites en une seule opération ;
- génération automatique planifiée ;
- envoi automatique du rapport par email ;
- archivage automatique du rapport ;
- signature numérique du PDF ;
- génération de graphiques dans le PDF.

---

## Conclusion

L’US21 est validée.

Un utilisateur autorisé peut exporter un rapport de télémétrie en CSV ou en PDF depuis la page détail satellite.

Le rapport contient les données mesurées, les métriques sélectionnées, la période optionnelle, les anomalies détectées, les alertes associées et une synthèse exploitable.