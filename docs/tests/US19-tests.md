# US19 - Exporter les résultats de simulation CSV / PDF

## État de validation

**US19 validée côté backend et frontend.**

L’application permet d’exporter les résultats d’une simulation orbitale ou d’un transfert de Hohmann aux formats CSV et PDF.

---

## Objectif de l’US

Permettre à un utilisateur autorisé d’exporter les résultats d’une simulation afin de les analyser, les archiver ou les partager.

---

## Dépendances

| User Story | Description | État |
|---|---|---|
| US12 | Lancer une simulation orbitale | Validée |
| US13 | Lancer une manœuvre de transfert de Hohmann | Validée |
| US14 | Historique des simulations | Validée |
| US19 | Export simulation CSV / PDF | Validée |

---

## Endpoints testés

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/simulations/{id}/export/csv` | Export CSV |
| `GET` | `/api/simulations/{id}/export/pdf` | Export PDF |

---

## Rôles testés

| Rôle | Résultat attendu | État |
|---|---|---|
| ADMIN | Export autorisé | PASS |
| OPERATEUR | Export autorisé | PASS |
| LECTEUR | Export autorisé | PASS |
| Non connecté | Accès refusé | PASS |

---

## Export CSV

Le CSV est généré en mémoire depuis les données persistées de la simulation.

Format :

```text
simulationId;missionId;missionName;satelliteId;satelliteName;type;status;createdAt;createdBy;inputMassKg;inputAltitudeKm;inputInclinationDeg;inputEccentricity;targetAltitudeKm;orbitalPeriodMinutes;averageVelocityKmS;orbitShape;deltaV1MS;deltaV2MS;deltaVTotalMS;transferTimeMinutes
```

Le séparateur utilisé est `;`.

L’encodage est UTF-8 avec BOM afin de garantir une ouverture correcte dans Excel FR.

---

## Export PDF

Le PDF est généré avec OpenPDF `3.0.5`.

Le rapport contient :

- titre du rapport ;
- date de génération ;
- métadonnées ;
- tableau des paramètres ;
- tableau des résultats ;
- mention de génération automatique.

---

## Tests backend réalisés

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US19-T01 | Export CSV simulation ORBIT | Fichier CSV retourné | PASS |
| US19-T02 | Export CSV simulation HOHMANN | Fichier CSV retourné | PASS |
| US19-T03 | Export PDF simulation ORBIT | Fichier PDF retourné | PASS |
| US19-T04 | Export PDF simulation HOHMANN | Fichier PDF retourné | PASS |
| US19-T05 | CSV contient les colonnes fixes | Header correct | PASS |
| US19-T06 | CSV contient les métadonnées | Simulation, mission, satellite présents | PASS |
| US19-T07 | CSV contient les inputs | Masse, altitude, inclinaison, excentricité présents | PASS |
| US19-T08 | CSV ORBIT contient les résultats orbitaux | Période, vitesse, forme présents | PASS |
| US19-T09 | CSV HOHMANN contient les résultats Hohmann | Delta V et durée présents | PASS |
| US19-T10 | PDF commence par `%PDF` | PDF valide | PASS |
| US19-T11 | PDF non vide | Taille supérieure à 0 | PASS |
| US19-T12 | Content-Type CSV | `text/csv` | PASS |
| US19-T13 | Content-Type PDF | `application/pdf` | PASS |
| US19-T14 | Content-Disposition CSV | Téléchargement fichier `.csv` | PASS |
| US19-T15 | Content-Disposition PDF | Téléchargement fichier `.pdf` | PASS |
| US19-T16 | Simulation introuvable | Erreur 404 | PASS |
| US19-T17 | Utilisateur LECTEUR | Export autorisé | PASS |
| US19-T18 | Utilisateur non connecté | Accès refusé | PASS |

---

## Tests frontend réalisés

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US19-T19 | Affichage section exports | Boutons visibles sur détail simulation | PASS |
| US19-T20 | Clic Exporter CSV | Fichier CSV téléchargé | PASS |
| US19-T21 | Clic Exporter PDF | Fichier PDF téléchargé | PASS |
| US19-T22 | Export simulation ORBIT | Téléchargement OK | PASS |
| US19-T23 | Export simulation HOHMANN | Téléchargement OK | PASS |
| US19-T24 | Compte LECTEUR | Boutons fonctionnels | PASS |
| US19-T25 | Erreur 403 | Redirection forbidden | PASS |
| US19-T26 | Erreur 404 | Message simulation introuvable | PASS |
| US19-T27 | Build frontend | Build OK | PASS |

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

Endpoints validés :

```http
GET /api/simulations/{id}/export/csv
GET /api/simulations/{id}/export/pdf
```

Cas validés :

- export CSV avec token ADMIN ;
- export PDF avec token ADMIN ;
- export CSV avec token LECTEUR ;
- export PDF avec token LECTEUR ;
- simulation inexistante ;
- utilisateur non authentifié.

Résultat :

```text
PASS
```

---

## Validation navigateur

La page détail simulation permet de télécharger les exports.

Cas validés :

- ouverture détail simulation ;
- bouton `Exporter CSV` visible ;
- bouton `Exporter PDF` visible ;
- téléchargement CSV fonctionnel ;
- téléchargement PDF fonctionnel ;
- CSV correctement séparé en colonnes dans Excel ;
- PDF ouvrable et lisible ;
- test réalisé avec un utilisateur LECTEUR.

Résultat :

```text
PASS
```

---

## Format CSV final

Exemple pour une simulation ORBIT :

```csv
simulationId;missionId;missionName;satelliteId;satelliteName;type;status;createdAt;createdBy;inputMassKg;inputAltitudeKm;inputInclinationDeg;inputEccentricity;targetAltitudeKm;orbitalPeriodMinutes;averageVelocityKmS;orbitShape;deltaV1MS;deltaV2MS;deltaVTotalMS;transferTimeMinutes
24;4;Mission to the MOOOOON;3;LunaSat-03;ORBIT;SUCCESS;2026-07-06T00:56:57.705593;admin@finalspace.com;850.0;500.0;95.0;0.4;;94.47;7.62;ELLIPTIQUE;;;;
```

---

## Fichiers principaux modifiés

| Fichier | Rôle |
|---|---|
| `pom.xml` | Ajout OpenPDF 3.0.5 |
| `SimulationExportService.java` | Interface du service d’export |
| `SimulationExportServiceImpl.java` | Génération CSV et PDF |
| `SimulationExportController.java` | Endpoints de téléchargement |
| `simulation.service.ts` | Appels HTTP export CSV/PDF |
| `simulation-detail.component.ts` | Logique de téléchargement |
| `simulation-detail.component.html` | Boutons d’export |
| `simulation-detail.component.css` | Styles de la section export |

---

## Hors périmètre

L’US19 ne couvre pas :

- personnalisation du modèle PDF ;
- export de plusieurs simulations en une seule opération ;
- envoi automatique par email ;
- archivage automatique ;
- export planifié ;
- signature numérique des PDF.

---

## Conclusion

L’US19 est validée.

Les utilisateurs autorisés peuvent exporter une simulation précise en CSV ou PDF depuis le détail de simulation. Les fichiers générés reflètent les données enregistrées, sans modifier la base.