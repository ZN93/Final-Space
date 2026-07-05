# US18 - Générer automatiquement des alertes à partir des anomalies

## État de validation

**US18 validée côté backend et navigateur.**

L’application génère automatiquement des alertes mission à partir des anomalies de télémétrie détectées.

---

## Objectif de l’US

Permettre au système de créer automatiquement une alerte lorsqu’une anomalie de télémétrie est détectée.

Une alerte représente un signal opérationnel visible dans le module Mission Control.

---

## Dépendances

| User Story | Description | État |
|---|---|---|
| US17 | Détection automatique des anomalies | Validée |
| US08 | Consultation des alertes mission | Validée |
| US09 | Acquittement des alertes | Validée |
| US18 | Génération automatique des alertes depuis anomalies | Validée |

---

## Architecture retenue

Les anomalies restent stockées dans MongoDB.

Les alertes sont stockées en SQL, dans la table `alerts`, afin de rester compatibles avec le module Mission Control existant.

Flux :

```text
TelemetryAnomaly MongoDB
        ↓
AnomalyAlertGenerationService
        ↓
Alert SQL
        ↓
GET /api/missions/{missionId}/alerts
```

---

## Champs ajoutés à Alert

| Champ | Type | Description |
|---|---|---|
| `anomalyId` | String | Identifiant MongoDB de l’anomalie |
| `telemetryValue` | Double | Valeur de télémétrie liée à l’anomalie |
| `telemetryTimestamp` | Instant | Timestamp du point de télémétrie concerné |

---

## Règles métier testées

| Règle | Résultat attendu | État |
|---|---|---|
| Une anomalie génère une alerte | Une alerte SQL est créée | PASS |
| Une alerte est liée à une mission | `mission_id` renseigné | PASS |
| Une alerte est liée à un satellite | `satellite_id` renseigné | PASS |
| Une alerte est créée ACTIVE | `status = ACTIVE` | PASS |
| Une anomalie génère au maximum une alerte | Pas de doublon | PASS |
| Une redétection ne duplique pas les alertes | Nombre d’alertes inchangé | PASS |
| Les alertes sont consultables par mission | Endpoint mission retourne les alertes | PASS |

---

## Types d’alertes générées

| Type d’anomalie | Type d’alerte attendu | État |
|---|---|---|
| `THRESHOLD` | `ANOMALY_THRESHOLD` | PASS |
| `VARIATION` | `ANOMALY_VARIATION` | PASS |
| `MISSING` | `ANOMALY_MISSING` | PASS |

---

## Sévérités

Les sévérités des anomalies sont reprises dans les alertes.

| Sévérité anomalie | Sévérité alerte | État |
|---|---|---|
| `FAIBLE` | `FAIBLE` | PASS |
| `MOYENNE` | `MOYENNE` | PASS |
| `ELEVEE` | `ELEVEE` | PASS |

---

## Tests backend réalisés

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US18-T01 | Import CSV contenant des anomalies | Import accepté | PASS |
| US18-T02 | Détection automatique des anomalies | Anomalies créées | PASS |
| US18-T03 | Génération automatique des alertes | Alertes SQL créées | PASS |
| US18-T04 | Vérification mission | Les alertes sont liées à la bonne mission | PASS |
| US18-T05 | Vérification satellite | Les alertes sont liées au bon satellite | PASS |
| US18-T06 | Vérification statut | Les alertes sont `ACTIVE` | PASS |
| US18-T07 | Vérification type | Les types commencent par `ANOMALY_` | PASS |
| US18-T08 | Vérification valeur | `telemetryValue` renseigné | PASS |
| US18-T09 | Vérification timestamp | `telemetryTimestamp` renseigné | PASS |
| US18-T10 | Redétection | Pas de doublon d’alertes | PASS |
| US18-T11 | Consultation mission alerts | Alertes retournées par mission | PASS |

---

## Commande de test backend

Commande exécutée :

```bash
./mvnw test
```

Résultat :

```text
200 tests PASS
BUILD SUCCESS
```

---

## Validation Postman

Endpoint testé :

```http
GET /api/missions/4/alerts?status=ACTIVE
```

Résultat attendu :

- liste non vide ;
- alertes avec statut `ACTIVE` ;
- types `ANOMALY_THRESHOLD`, `ANOMALY_VARIATION`, `ANOMALY_MISSING` ;
- mission correcte ;
- satellite correct ;
- métrique correcte ;
- valeur de télémétrie renseignée.

Résultat obtenu :

```text
PASS
```

---

## Validation navigateur

La page des alertes mission affiche correctement les alertes générées depuis les anomalies.

Cas validés :

- affichage de la liste des alertes ;
- affichage du type ;
- affichage de la gravité ;
- affichage du statut ;
- affichage du satellite ;
- affichage de la métrique ;
- affichage du message ;
- affichage de la date de création ;
- bouton d’acquittement disponible.

Résultat :

```text
PASS
```

---

## Correction réalisée pendant l’US

Un cas spécifique a été corrigé.

Situation initiale :

```text
Anomalies déjà existantes en MongoDB
        ↓
Redétection
        ↓
savedCount = 0
        ↓
Aucune alerte créée
```

Correction :

Le service récupère maintenant les anomalies détectées déjà persistées afin de générer les alertes manquantes même si les anomalies ne sont pas nouvellement sauvegardées.

Situation corrigée :

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

## Fichiers principaux modifiés

| Fichier | Rôle |
|---|---|
| `Alert.java` | Ajout des champs liés à l’anomalie |
| `AlertRepository.java` | Ajout de la recherche par `anomalyId` |
| `AlertResponse.java` | Exposition des nouveaux champs |
| `AlertServiceImpl.java` | Mapping des nouveaux champs |
| `AnomalyAlertGenerationService.java` | Interface de génération |
| `AnomalyAlertGenerationServiceImpl.java` | Génération des alertes |
| `TelemetryAnomalyRepository.java` | Recherche des anomalies déjà persistées |
| `TelemetryAnomalyDetectionServiceImpl.java` | Déclenchement de génération d’alertes |
| `TelemetryImportAuthorizationIntegrationTest.java` | Tests US18 |
| `TelemetryQueryAuthorizationIntegrationTest.java` | Nettoyage des alertes dans les tests |

---

## Hors périmètre

L’US18 ne couvre pas :

- notification email ;
- notification SMS ;
- notification push ;
- escalade automatique ;
- fusion d’alertes similaires ;
- corrélation avancée d’alertes ;
- création automatique d’incidents.

---

## Conclusion

L’US18 est validée.

Les anomalies de télémétrie génèrent automatiquement des alertes mission persistées en SQL, consultables depuis le module Mission Control et non dupliquées en cas de redétection.