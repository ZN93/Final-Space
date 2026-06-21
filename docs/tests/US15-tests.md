# US15 - Importer des données de télémétrie au format CSV

## État de validation

**US15 validée côté backend et frontend.**

L’application permet à un administrateur ou à un opérateur d’importer des données de télémétrie au format CSV pour un satellite actif.

Les données sont persistées dans MongoDB, dans la collection `telemetry_points`.

---

## Objectif de l’US

Permettre l’import de données de télémétrie au format CSV afin de préparer leur visualisation et leur analyse.

Les données importées sont associées :

- à une mission ;
- à un satellite ;
- à un import identifié par un `sourceImportId`.

---

## Dépendances

| User Story | Description | État |
|---|---|---|
| US06 | Gestion des satellites | Validée |
| US15 | Import CSV télémétrie | En cours de validation |

---

## Choix d’architecture

L’US15 introduit une base de données non relationnelle dans le projet.

Le choix retenu est :

| Base | Usage |
|---|---|
| PostgreSQL | Données métier relationnelles |
| MongoDB | Données de télémétrie temporelles |

Les données de télémétrie sont stockées dans MongoDB car elles sont :

- temporelles ;
- potentiellement volumineuses ;
- fortement liées à des métriques ;
- adaptées à un stockage documentaire ;
- destinées à être exploitées ensuite pour des graphiques et de l’analyse.

---

## Collection MongoDB

Collection utilisée :

```text
telemetry_points
```

Document MongoDB :

```json
{
  "id": "...",
  "missionId": 4,
  "satelliteId": 3,
  "timestamp": "2026-01-01T10:00:00Z",
  "metric": "temperature",
  "value": 42.5,
  "sourceImportId": "a8c9129a-2002-491a-a61a-7ddf4fe3373c",
  "createdAt": "2026-06-21T11:28:30Z"
}
```

Index défini :

```text
satelliteId, metric, timestamp
```

---

## Format CSV attendu

Le fichier CSV doit contenir le header suivant :

```csv
timestamp,metric,value
```

Exemple de fichier valide :

```csv
timestamp,metric,value
2026-01-01T10:00:00Z,temperature,42.5
2026-01-01T10:00:00Z,battery,78
```

---

## Endpoint testé

| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/api/missions/{missionId}/satellites/{satelliteId}/telemetry/import` | Importer un fichier CSV de télémétrie |

Le endpoint attend une requête `multipart/form-data` avec une clé :

```text
file
```

---

## DTO de réponse

Réponse en cas de succès :

```json
{
  "importId": "a8c9129a-2002-491a-a61a-7ddf4fe3373c",
  "importedCount": 2,
  "errorCount": 0,
  "errors": []
}
```

Réponse en cas d’erreur CSV :

```json
{
  "importId": null,
  "importedCount": 0,
  "errorCount": 3,
  "errors": [
    {
      "line": 3,
      "message": "Timestamp invalide. Format attendu : ISO-8601, exemple 2026-01-01T10:00:00Z"
    },
    {
      "line": 4,
      "message": "La métrique est obligatoire"
    },
    {
      "line": 5,
      "message": "La valeur doit être numérique"
    }
  ]
}
```

---

## Règles métier couvertes

| Référence | Règle | État |
|---|---|---|
| RG-TEL-01 | Le fichier doit être au format CSV | PASS |
| RG-TEL-02 | Le header doit être `timestamp,metric,value` | PASS |
| RG-TEL-03 | Le timestamp doit être valide | PASS |
| RG-TEL-04 | La métrique ne doit pas être vide | PASS |
| RG-TEL-05 | La valeur doit être numérique | PASS |
| RG-TEL-06 | Le satellite doit exister | PASS |
| RG-TEL-07 | Le satellite doit être actif | PASS |
| RG-TEL-08 | Le satellite doit appartenir à la mission indiquée | PASS |
| RG-TEL-09 | La mission ne doit pas être clôturée | PASS |
| RG-TEL-10 | Aucune donnée partielle n’est persistée en cas d’erreur | PASS |
| RG-TEL-11 | ADMIN peut importer | PASS |
| RG-TEL-12 | OPERATEUR peut importer | PASS |
| RG-TEL-13 | LECTEUR ne peut pas importer | PASS |
| RG-TEL-14 | Un utilisateur non authentifié ne peut pas importer | PASS |

---

## Tests unitaires - TelemetryImportServiceImplTest

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/telemetry/service/impl/TelemetryImportServiceImplTest.java
```

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US15-T01 | Importer un CSV valide | Points persistés dans MongoDB | PASS |
| US15-T02 | Header CSV invalide | Import rejeté | PASS |
| US15-T03 | Lignes CSV invalides | Import rejeté avec erreurs ligne par ligne | PASS |
| US15-T04 | Header avec BOM UTF-8 | Import accepté | PASS |
| US15-T05 | Fichier vide | Import rejeté | PASS |
| US15-T06 | Fichier non CSV | Import rejeté | PASS |
| US15-T07 | Satellite inexistant | Import rejeté | PASS |
| US15-T08 | Satellite rattaché à une autre mission | Import rejeté | PASS |
| US15-T09 | Satellite inactif | Import rejeté | PASS |
| US15-T10 | Mission clôturée | Import rejeté | PASS |

---

## Tests d’intégration API / sécurité

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/security/TelemetryImportAuthorizationIntegrationTest.java
```

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US15-T11 | ADMIN importe un CSV valide | `201 Created` | PASS |
| US15-T12 | OPERATEUR importe un CSV valide | `201 Created` | PASS |
| US15-T13 | LECTEUR tente d’importer un CSV | `403 Forbidden` | PASS |
| US15-T14 | Utilisateur non authentifié tente d’importer | `401 Unauthorized` | PASS |
| US15-T15 | CSV invalide | `400 Bad Request` | PASS |
| US15-T16 | Satellite inactif | `400 Bad Request` | PASS |
| US15-T17 | Mission clôturée | `400 Bad Request` | PASS |
| US15-T18 | Satellite hors mission | `400 Bad Request` | PASS |

---

## Tests Postman réalisés

| Scénario | Résultat attendu | État |
|---|---|---|
| Import CSV valide avec ADMIN | `201 Created` | PASS |
| Import CSV valide avec OPERATEUR | `201 Created` | PASS |
| Import CSV invalide | `400 Bad Request` avec erreurs détaillées | PASS |
| Vérification MongoDB après import valide | 2 documents présents | PASS |
| Vérification MongoDB après import invalide | Aucun document supplémentaire | PASS |

---

## Vérification MongoDB

Commande utilisée :

```bash
docker exec -it finalspace-mongodb mongosh --username finalspace --password finalspace --authenticationDatabase admin
```

Commandes Mongo :

```javascript
use finalspace
db.telemetry_points.find().pretty()
```

Résultat observé :

```text
2 documents présents dans telemetry_points
```

Les documents contiennent :

- `missionId` ;
- `satelliteId` ;
- `timestamp` ;
- `metric` ;
- `value` ;
- `sourceImportId` ;
- `createdAt`.

---

## Tests frontend réalisés

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US15-T19 | Afficher la section import CSV | Section visible pour ADMIN / OPERATEUR | PASS |
| US15-T20 | Sélectionner un fichier CSV | Nom du fichier affiché | PASS |
| US15-T21 | Importer un CSV valide | Message de succès affiché | PASS |
| US15-T22 | Importer un CSV invalide | Erreurs ligne par ligne affichées | PASS |
| US15-T23 | Accès LECTEUR | Import non autorisé | PASS |
| US15-T24 | Build Angular | Build OK | PASS |

---

## Résultat d’exécution automatisée

Commande backend :

```bash
./mvnw clean test
```

Résultat :

```text
Tests run: 180, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

Commande frontend :

```bash
npm run build
```

Résultat :

```text
Application bundle generation complete
```

---

## Points techniques importants

### Configuration MongoDB Spring Boot 4

La configuration MongoDB utilisée est :

```properties
spring.mongodb.uri=mongodb://finalspace:finalspace@localhost:27017/finalspace?authSource=admin
```

La propriété `spring.data.mongodb.uri` n’est pas utilisée dans ce projet Spring Boot 4.

### Chargement de la mission du satellite

Pour éviter une erreur `LazyInitializationException`, le repository satellite expose une méthode chargeant le satellite avec sa mission :

```java
Optional<Satellite> findByIdWithMission(Long id);
```

Cela permet de valider :

- le rattachement mission / satellite ;
- le statut de la mission ;
- le statut du satellite.

### Gestion du BOM UTF-8

L’import CSV supporte les fichiers contenant un BOM UTF-8 au début du header.

---

## Sécurité

| Rôle | Import CSV |
|---|---|
| ADMIN | Autorisé |
| OPERATEUR | Autorisé |
| LECTEUR | Refusé |
| Non authentifié | Refusé |

---

## Hors périmètre

Les éléments suivants ne sont pas couverts par l’US15 :

- visualisation graphique des données ;
- détection automatique d’anomalies ;
- import temps réel ;
- modification de points existants ;
- suppression de points existants ;
- import de fichiers autres que CSV ;
- historisation détaillée des imports ;
- pagination des points de télémétrie.

---

## Conclusion

L’US15 est terminée côté backend et frontend.

Le projet utilise désormais MongoDB pour stocker les données de télémétrie.

L’import CSV est fonctionnel, sécurisé et validé par tests automatisés.

Les données importées sont disponibles pour les prochaines user stories de visualisation et de détection d’anomalies.