# US20 - Générer un rapport de mission PDF

## État de validation

US20 validée côté backend et frontend.

L’application permet à un utilisateur autorisé de générer un rapport PDF complet pour une mission existante.

Le rapport est généré à la demande et ne modifie pas les données en base.

---

## Objectif de l’US

Permettre à un utilisateur de produire une synthèse exploitable de l’état courant d’une mission.

Le rapport regroupe les informations clés de la mission, ses satellites, ses simulations, ses alertes et ses incidents.

---

## Dépendances

| User Story | Description | État |
|---|---|---|
| US05 | Gestion des missions | Validée |
| US07 | Dashboard mission | Validée |
| US10 | Gestion des incidents | Validée |
| US19 | Export PDF simulation | Validée |
| US20 | Rapport PDF mission | Validée |

---

## Endpoint testé

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/missions/{missionId}/report/pdf` | Génération du rapport PDF de mission |

---

## Headers attendus

| Header | Valeur attendue |
|---|---|
| `Content-Type` | `application/pdf` |
| `Content-Disposition` | `attachment; filename="mission-report-<id>.pdf"` |

---

## Rôles testés

| Rôle | Résultat attendu | État |
|---|---|---|
| ADMIN | Génération autorisée | PASS |
| OPERATEUR | Génération autorisée | PASS |
| LECTEUR | Génération autorisée | PASS |
| Non connecté | Accès refusé | PASS |

---

## Contenu attendu du rapport PDF

Le rapport contient les sections suivantes :

- métadonnées du rapport ;
- informations générales de la mission ;
- KPI globaux ;
- satellites associés ;
- synthèse des simulations ;
- dernières simulations ;
- synthèse des alertes ;
- dernières alertes ;
- synthèse des incidents ;
- derniers incidents ;
- conclusion automatique.

---

## Détail du contenu

### Métadonnées du rapport

- date de génération ;
- auteur de génération ;
- identifiant de mission.

### Informations générales de la mission

- nom ;
- description ;
- statut ;
- date de création ;
- date de clôture si disponible.

### KPI globaux

- nombre total de satellites ;
- nombre de satellites actifs ;
- nombre de satellites inactifs ;
- nombre total de simulations ;
- nombre de simulations ORBIT ;
- nombre de simulations HOHMANN ;
- nombre total d’alertes ;
- nombre d’alertes actives ;
- nombre d’alertes acquittées ;
- nombre total d’incidents ;
- nombre d’incidents ouverts ;
- nombre d’incidents en cours ;
- nombre d’incidents clôturés.

### Satellites associés

Pour chaque satellite :

- identifiant ;
- nom ;
- statut ;
- masse ;
- altitude ;
- inclinaison ;
- excentricité.

### Synthèse des simulations

- nombre total ;
- nombre de simulations ORBIT ;
- nombre de simulations HOHMANN.

### Dernières simulations

Pour les dernières simulations :

- identifiant ;
- type ;
- statut ;
- satellite ;
- date de création ;
- auteur ;
- résultat principal.

### Synthèse des alertes

- nombre total ;
- nombre d’alertes actives ;
- nombre d’alertes acquittées ;
- nombre d’alertes de gravité faible ;
- nombre d’alertes de gravité moyenne ;
- nombre d’alertes de gravité élevée.

### Dernières alertes

Pour les dernières alertes :

- identifiant ;
- type ;
- gravité ;
- statut ;
- satellite ;
- métrique ;
- date de création ;
- message.

### Synthèse des incidents

- nombre total ;
- nombre d’incidents ouverts ;
- nombre d’incidents en cours ;
- nombre d’incidents clôturés ;
- nombre d’incidents de gravité faible ;
- nombre d’incidents de gravité moyenne ;
- nombre d’incidents de gravité élevée.

### Derniers incidents

Pour les derniers incidents :

- identifiant ;
- titre ;
- gravité ;
- statut ;
- satellite ;
- date de création ;
- date de clôture si disponible.

### Conclusion automatique

Le rapport se termine par une synthèse textuelle indiquant :

- le statut courant de la mission ;
- le nombre de satellites ;
- le nombre de satellites actifs ;
- le nombre d’alertes actives ;
- le nombre d’incidents ouverts ;
- le nombre d’incidents en cours.

---

## Tests backend réalisés

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US20-T01 | Génération PDF avec rôle ADMIN | PDF retourné | PASS |
| US20-T02 | Génération PDF avec rôle LECTEUR | PDF retourné | PASS |
| US20-T03 | Mission inexistante | Erreur 404 | PASS |
| US20-T04 | Utilisateur non connecté | Accès refusé | PASS |
| US20-T05 | Vérification Content-Type | `application/pdf` | PASS |
| US20-T06 | Vérification Content-Disposition | `mission-report-<id>.pdf` | PASS |
| US20-T07 | PDF non vide | Taille supérieure à 0 | PASS |
| US20-T08 | Signature du fichier PDF | Le fichier commence par `%PDF` | PASS |
| US20-T09 | Données satellites présentes | KPI et liste satellites générés | PASS |
| US20-T10 | Données simulations présentes | Synthèse et dernières simulations générées | PASS |
| US20-T11 | Données alertes présentes | Synthèse et dernières alertes générées | PASS |
| US20-T12 | Données incidents présentes | Synthèse et derniers incidents générés | PASS |

---

## Tests frontend réalisés

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| US20-T13 | Affichage page détail mission | Page chargée | PASS |
| US20-T14 | Bouton rapport visible | Bouton `Générer rapport PDF` affiché | PASS |
| US20-T15 | Clic sur le bouton rapport | Téléchargement lancé | PASS |
| US20-T16 | Nom du fichier téléchargé | `mission-report-<id>.pdf` | PASS |
| US20-T17 | PDF téléchargé | Fichier ouvrable | PASS |
| US20-T18 | Erreur 403 | Redirection vers forbidden | PASS |
| US20-T19 | Erreur 404 | Message `Mission introuvable` | PASS |
| US20-T20 | Build frontend | Build OK | PASS |

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

Endpoint validé :

```http
GET /api/missions/{missionId}/report/pdf
```

Cas validés :

- génération avec un utilisateur autorisé ;
- génération pour une mission existante ;
- génération pour une mission avec satellites ;
- génération pour une mission avec simulations ;
- génération pour une mission avec alertes ;
- génération pour une mission avec incidents ;
- mission inexistante ;
- utilisateur non authentifié.

Résultat :

```text
PASS
```

---

## Validation navigateur

La génération du rapport a été validée depuis la page détail mission.

Étapes réalisées :

1. ouverture d’une mission existante ;
2. clic sur le bouton `Générer rapport PDF` ;
3. téléchargement du fichier `mission-report-<id>.pdf` ;
4. ouverture du PDF ;
5. vérification du contenu général ;
6. vérification de la cohérence avec les données de la mission.

Résultat :

```text
PASS
```

---

## Fichiers principaux modifiés

| Fichier | Rôle |
|---|---|
| `MissionReportService.java` | Interface du service de génération |
| `MissionReportServiceImpl.java` | Génération du rapport PDF |
| `MissionReportController.java` | Endpoint de téléchargement du rapport |
| `MissionReportAuthorizationIntegrationTest.java` | Tests d’autorisation et de génération |
| `mission.service.ts` | Appel HTTP vers l’endpoint rapport PDF |
| `mission-detail.component.ts` | Logique de téléchargement du rapport |
| `mission-detail.component.html` | Bouton de génération du rapport |
| `mission-detail.component.css` | Ajustements visuels |
| `README.md` | Documentation fonctionnelle |
| `docs/tests/US20-tests.md` | Documentation de validation |

---

## Règles métier validées

| Règle | Validation |
|---|---|
| Rapport généré à la demande | PASS |
| Données issues de l’état courant de la mission | PASS |
| Aucune modification en base | PASS |
| Modèle PDF unique et standardisé | PASS |
| Génération par ADMIN | PASS |
| Génération par OPERATEUR | PASS |
| Génération par LECTEUR | PASS |
| Refus utilisateur non connecté | PASS |
| Erreur 404 si mission inexistante | PASS |

---

## Hors périmètre

L’US20 ne couvre pas :

- personnalisation avancée du rapport ;
- génération automatique périodique ;
- export Word ;
- export multi-formats ;
- envoi automatique du rapport par email ;
- archivage automatique du rapport ;
- signature numérique du PDF.

---

## Conclusion

L’US20 est validée.

Un utilisateur autorisé peut générer un rapport PDF complet d’une mission depuis la page détail mission.

Le rapport contient les informations générales de la mission, les satellites associés, les simulations, les alertes, les incidents et une conclusion automatique sur l’état courant de la mission.