# US16 - Visualiser la télémétrie sous forme de graphiques

## État de validation

**US16 validée côté backend et frontend.**

L’application permet de visualiser les données de télémétrie importées pour un satellite sous forme de graphiques temporels.

Les données affichées proviennent de MongoDB, dans la collection `telemetry_points`.

---

## Objectif de l’US

Permettre à un utilisateur authentifié de consulter les données de télémétrie d’un satellite afin d’analyser l’évolution de ses paramètres dans le temps.

Les graphiques permettent de visualiser des séries temporelles comme :

* température ;
* batterie ;
* vitesse ;
* autres métriques importées.

---

## Dépendances

| User Story | Description                                             | État    |
| ---------- | ------------------------------------------------------- | ------- |
| US15       | Import des données de télémétrie au format CSV          | Validée |
| US16       | Visualisation de la télémétrie sous forme de graphiques | Validée |

---

## Endpoints testés

| Méthode | Endpoint                                          | Description                                |
| ------- | ------------------------------------------------- | ------------------------------------------ |
| `GET`   | `/api/satellites/{satelliteId}/telemetry/metrics` | Récupérer les métriques disponibles        |
| `GET`   | `/api/satellites/{satelliteId}/telemetry`         | Récupérer les points de télémétrie filtrés |

---

## Paramètres de recherche

| Paramètre | Obligatoire | Description                           |
| --------- | ----------- | ------------------------------------- |
| `metric`  | Oui         | Une ou plusieurs métriques à afficher |
| `from`    | Non         | Date de début au format ISO-8601      |
| `to`      | Non         | Date de fin au format ISO-8601        |
| `limit`   | Non         | Limite du nombre de points retournés  |

---

## Règles métier couvertes

| Référence     | Règle                                                        | État |
| ------------- | ------------------------------------------------------------ | ---- |
| RG-TEL-VIS-01 | Les métriques disponibles peuvent être récupérées            | PASS |
| RG-TEL-VIS-02 | Une métrique est obligatoire pour consulter les points       | PASS |
| RG-TEL-VIS-03 | Plusieurs métriques peuvent être consultées simultanément    | PASS |
| RG-TEL-VIS-04 | Les données sont retournées dans l’ordre chronologique       | PASS |
| RG-TEL-VIS-05 | Le filtre `from` / `to` est appliqué                         | PASS |
| RG-TEL-VIS-06 | Une période invalide est rejetée                             | PASS |
| RG-TEL-VIS-07 | Une limite de volume est appliquée                           | PASS |
| RG-TEL-VIS-08 | Un satellite inexistant est rejeté                           | PASS |
| RG-TEL-VIS-09 | Les données restent consultables si la mission est clôturée  | PASS |
| RG-TEL-VIS-10 | Les données restent consultables si le satellite est inactif | PASS |
| RG-TEL-VIS-11 | ADMIN peut consulter                                         | PASS |
| RG-TEL-VIS-12 | OPERATEUR peut consulter                                     | PASS |
| RG-TEL-VIS-13 | LECTEUR peut consulter                                       | PASS |
| RG-TEL-VIS-14 | Un utilisateur non authentifié ne peut pas consulter         | PASS |

---

## Tests d’intégration API / sécurité

Classe associée :

```text
backend/src/test/java/com/finalspace/backend/security/TelemetryQueryAuthorizationIntegrationTest.java
```

| ID       | Scénario                                           | Résultat attendu                   | État |
| -------- | -------------------------------------------------- | ---------------------------------- | ---- |
| US16-T01 | ADMIN récupère les métriques disponibles           | `200 OK`                           | PASS |
| US16-T02 | OPERATEUR consulte une métrique                    | `200 OK`                           | PASS |
| US16-T03 | LECTEUR consulte une métrique                      | `200 OK`                           | PASS |
| US16-T04 | Utilisateur non authentifié consulte la télémétrie | `401 Unauthorized`                 | PASS |
| US16-T05 | Requête sans métrique                              | `400 Bad Request`                  | PASS |
| US16-T06 | Filtre par période                                 | Données filtrées                   | PASS |
| US16-T07 | Lecture de plusieurs métriques                     | Données multi-métriques retournées | PASS |
| US16-T08 | Limite de volume                                   | Nombre de points limité            | PASS |
| US16-T09 | Période invalide                                   | `400 Bad Request`                  | PASS |
| US16-T10 | Satellite inexistant                               | `404 Not Found`                    | PASS |

---

## Tests frontend réalisés

| ID       | Scénario                            | Résultat attendu                                 | État |
| -------- | ----------------------------------- | ------------------------------------------------ | ---- |
| US16-T11 | Affichage des métriques disponibles | Métriques affichées sous forme de cases à cocher | PASS |
| US16-T12 | Sélection d’une métrique            | Une courbe est affichée                          | PASS |
| US16-T13 | Sélection de plusieurs métriques    | Plusieurs courbes sont affichées                 | PASS |
| US16-T14 | Rafraîchissement manuel             | Les données sont rechargées                      | PASS |
| US16-T15 | Filtrage par période                | Le graphique se met à jour selon les dates       | PASS |
| US16-T16 | Aucune donnée disponible            | Message informatif affiché                       | PASS |
| US16-T17 | Données importées après US15        | Les métriques sont rechargées après import       | PASS |
| US16-T18 | Build Angular                       | Build OK                                         | PASS |

---

## Données de test utilisées

Un fichier CSV de démonstration a été importé pour tester l’affichage graphique.

Métriques utilisées :

* `temperature`
* `battery`
* `speed`

Nombre de points importés :

```text
15
```

Résultat attendu :

* 5 points pour `temperature` ;
* 5 points pour `battery` ;
* 5 points pour `speed`.

---

## Résultat d’exécution automatisée

Commande backend :

```bash
./mvnw test
```

Résultat :

```text
Tests run: 196, Failures: 0, Errors: 0, Skipped: 0
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

## Validation navigateur

La fonctionnalité a été testée depuis la page détail satellite.

Cas validés :

* métriques disponibles affichées ;
* graphique affiché après clic sur `Rafraîchir` ;
* affichage de la métrique `battery` ;
* affichage de la métrique `speed` ;
* affichage de la métrique `temperature` ;
* affichage de plusieurs métriques simultanément ;
* affichage du nombre de points ;
* affichage du nombre de métriques sélectionnées ;
* filtrage avec dates de début et de fin ;
* lecture seule des graphiques.

---

## Notes techniques

Les courbes sont générées côté Angular avec un SVG simple.

Aucune dépendance graphique externe n’a été ajoutée.

Les données sont transformées côté frontend afin de produire :

* une série par métrique ;
* des points SVG ;
* un chemin SVG pour chaque courbe.

---

## Limites identifiées

Lorsque plusieurs métriques ont des ordres de grandeur très différents, la métrique avec les valeurs les plus élevées peut écraser visuellement les autres.

Exemple :

* `speed` autour de 7600 ;
* `battery` autour de 70 ;
* `temperature` autour de 40.

Cette limite est acceptable pour l’US16, mais pourra être améliorée dans une évolution future avec :

* une normalisation des courbes ;
* un axe par métrique ;
* un affichage métrique par métrique ;
* des statistiques dédiées.

---

## Hors périmètre

L’US16 ne couvre pas :

* la visualisation temps réel ;
* la détection automatique d’anomalies ;
* les seuils d’alerte ;
* les statistiques avancées ;
* le zoom graphique ;
* l’export du graphique ;
* la personnalisation avancée des courbes.

---

## Conclusion

L’US16 est terminée.

Les utilisateurs authentifiés peuvent consulter les données de télémétrie d’un satellite sous forme de graphiques temporels.

La fonctionnalité prépare les prochaines user stories liées à l’analyse et à la détection d’anomalies.
