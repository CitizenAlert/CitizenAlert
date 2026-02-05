# Document de Methodologie de Developpement

**Projet :** City Alert
**Version :** 1.0
**Date :** 05/02/2026
**Equipe :** BREVET Noa | BUCHY -- PETARD Kenzo | TRAN Florian
**Ecole :** ESGI -- Master 2

> **Document complementaire :** [Document d'Architecture Logicielle (DAL)](./DAL.md) -- decrit la stack, l'architecture, le modele de donnees et l'infrastructure.

---

## Table des matieres

1. [Objet du document](#1-objet-du-document)
2. [Cycle de developpement](#2-cycle-de-developpement)
3. [Detail des outils et methodologies](#3-detail-des-outils-et-methodologies)
4. [Gestion du code source](#4-gestion-du-code-source)
5. [Integration et deploiement continus (CI/CD)](#5-integration-et-deploiement-continus-cicd)
6. [Automatisation (Makefile)](#6-automatisation-makefile)
7. [Qualite de code](#7-qualite-de-code)
8. [Annexe -- Chaine d'outils](#annexe----chaine-doutils)

---

## 1. Objet du document

Ce document decrit la **methodologie de developpement** adoptee pour le projet **City Alert**. Il presente le cycle de developpement, justifie chaque outil et processus utilise, et detaille les pipelines CI/CD, l'automatisation et les pratiques de qualite de code.

L'objectif est de formaliser **comment** l'equipe developpe, teste et livre le logiciel, en complement du [DAL](./DAL.md) qui decrit **quoi** est construit (architecture, modele de donnees, infrastructure).

---

## 2. Cycle de developpement

### 2.1 Vue d'ensemble -- Cycle en V adapte

Le projet suit un cycle iteratif inspire du **Cycle en V adapte a l'Agile**, ou chaque phase de conception (branche descendante) trouve son pendant en phase de validation (branche ascendante). Les outils sont choisis pour couvrir chaque etape, de l'expression du besoin jusqu'au deploiement.

```mermaid
graph TB
    subgraph "Phase descendante -- Conception"
        A["1. Expression du besoin<br/><b>Cahier des charges + AFB</b>"]
        B["2. Gestion de projet<br/><b>Notion (Kanban)</b>"]
        C["3. Versionnement<br/><b>Git + GitHub</b>"]
        D["4. Developpement<br/><b>TypeScript + NestJS + Expo</b>"]
        E["5. Gestion des deps<br/><b>pnpm workspaces (Monorepo)</b>"]
    end

    subgraph "Phase ascendante -- Validation"
        F["6. Qualite de code<br/><b>ESLint + Prettier</b>"]
        G["7. Pre-commit<br/><b>Husky + lint-staged</b>"]
        H["8. Tests<br/><b>Jest + Supertest</b>"]
        I["9. Integration continue<br/><b>GitHub Actions (CI)</b>"]
        J["10. Conteneurisation & Deploy<br/><b>Docker + Makefile</b>"]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J

    A -.-|"Valide par"| J
    B -.-|"Suivi par"| I
    C -.-|"Protege par"| H
    D -.-|"Verifie par"| G
    E -.-|"Controle par"| F

    style A fill:#e1f5fe
    style J fill:#e8f5e9
    style I fill:#fff3e0
```

### 2.2 Correspondance Cycle en V

Le tableau suivant resume la correspondance entre chaque phase de conception et sa phase de validation miroir :

| # | Phase de conception | Outil | Phase de validation | Outil |
|---|---|---|---|---|
| 1 ↔ 10 | Expression du besoin | Cahier des charges, AFB | Recette & deploiement | Docker, Makefile, revue utilisateur |
| 2 ↔ 9 | Gestion de projet | Notion (Kanban) | Suivi & metriques | GitHub Actions (CI reports) |
| 3 ↔ 8 | Versionnement | Git + GitHub (branches) | Protection du code | Tests unitaires/integ/E2E (Jest) |
| 4 ↔ 7 | Developpement | TypeScript, NestJS, Expo | Verification pre-commit | Husky + lint-staged |
| 5 ↔ 6 | Gestion des deps | pnpm workspaces | Controle qualite statique | ESLint + Prettier |

---

## 3. Detail des outils et methodologies

### Etape 1 -- Expression du besoin (Cahier des charges + AFB)

**Outil :** Documents de cadrage (Cahier des charges, Analyse Fonctionnelle du Besoin)

**Pourquoi :** Avant toute ligne de code, les besoins fonctionnels et non fonctionnels sont formalises. Le cahier des charges fixe le perimetre, les contraintes et les criteres de succes. L'AFB identifie les acteurs (citoyens, services techniques, elus), les fonctions de service et les flux d'information. Cette etape sert de **reference contractuelle** tout au long du projet et permet de valider chaque livrable par rapport aux exigences initiales.

**Apport au projet :** Evite le hors-sujet, aligne toute l'equipe sur un objectif commun, sert de grille de validation finale.

---

### Etape 2 -- Gestion de projet (Notion -- Kanban)

**Outil :** Notion -- tableaux Kanban

**Pourquoi :** Notion centralise la gestion de projet dans un espace unique et collaboratif. Le tableau Kanban decoupe le backlog en taches atomiques et offre une visibilite en temps reel sur l'avancement (colonnes : A faire, En cours, En review, Termine). Chaque tache est assignee, datee et liee a une branche Git.

**Apport au projet :**
- **Visibilite** : chaque membre voit instantanement l'etat du projet
- **Priorisation** : les taches sont ordonnees par priorite dans le backlog
- **Tracabilite** : lien entre tache Notion, branche Git et Pull Request
- **Rituels Agile** : sprint planning, suivi hebdomadaire, retrospective

---

### Etape 3 -- Versionnement (Git + GitHub)

**Outil :** Git (systeme de controle de version distribue) + GitHub (plateforme d'hebergement)

**Pourquoi :** Git permet le **developpement parallele** grace au branching : chaque fonctionnalite est developpee dans une branche isolee (`feature/xxx`), sans impacter le travail des autres. Le systeme **decentralise** garantit que chaque developpeur possede une copie complete de l'historique, assurant la resilience et le travail hors-ligne. GitHub ajoute les Pull Requests (revue de code entre pairs), la gestion des issues et le declenchement des pipelines CI/CD.

**Apport au projet :**
- **Developpement parallele** : 3 developpeurs travaillent simultanement sur des branches separees
- **Historique complet** : chaque modification est tracee (qui, quand, pourquoi)
- **Revue de code** : les Pull Requests imposent une relecture avant merge
- **Rollback** : possibilite de revenir a n'importe quel etat anterieur du code
- **Integration CI/CD** : chaque push declenche automatiquement les pipelines de validation

> Le detail de la strategie de branching et des conventions est traite dans la [section 4](#4-gestion-du-code-source).

---

### Etape 4 -- Developpement (TypeScript + NestJS + Expo)

**Outils :** TypeScript (langage), NestJS (backend), React Native + Expo (mobile)

**Pourquoi TypeScript :** Un langage unique cote front et back, avec un **typage statique strict**, reduit les bugs a la compilation plutot qu'au runtime. Le partage de types (package `shared`) garantit un contrat d'interface coherent entre l'API et l'application mobile. L'autocompletion et le refactoring sont fiabilises par le compilateur.

**Pourquoi NestJS :** Framework backend **structure et opinionate** : architecture modulaire (un module par domaine metier), injection de dependances native, decorateurs pour la validation, guards pour la securite. Ces conventions evitent les debats d'architecture et permettent a un nouveau developpeur de comprendre le code rapidement. L'ecosysteme NestJS (TypeORM, class-validator, integration Auth0) couvre tous les besoins du projet sans integration artisanale. L'authentification est deleguee a **Auth0** (fournisseur d'identite externe), ce qui evite de gerer les mots de passe cote serveur et apporte gratuitement le MFA, le SSO et la conformite RGPD (voir [DAL -- section 5](./DAL.md#5-securite)).

**Pourquoi React Native + Expo :** Un seul code source produit une application **native iOS et Android**, repondant a la contrainte du cahier des charges (compatibilite multi-plateforme). Expo simplifie l'acces aux API natives (camera, geolocalisation, notifications) et fournit un serveur de developpement avec hot-reload. Le file-based routing d'Expo Router suit les conventions modernes (inspirees de Next.js).

**Apport au projet :**
- **Productivite** : un seul langage, un seul ecosysteme, moins de context-switching
- **Fiabilite** : le typage statique detecte les erreurs avant l'execution
- **Maintenabilite** : architecture modulaire, conventions claires, code auto-documente
- **Cross-platform** : un seul code pour iOS et Android

> L'architecture detaillee (modules, patterns, diagrammes) est documentee dans le [DAL -- section 3](./DAL.md#3-architecture-logicielle).

---

### Etape 5 -- Gestion des dependances (pnpm workspaces -- Monorepo)

**Outil :** pnpm avec workspaces

**Pourquoi :** Le monorepo regroupe le backend (`apps/api`), le mobile (`apps/mobile`) et les types partages (`packages/shared`) dans un **depot unique**. pnpm optimise l'espace disque via un store global de packages (liens symboliques au lieu de copies) et garantit un **lockfile unique** (`pnpm-lock.yaml`) pour tout le projet. Les workspaces permettent d'executer des commandes ciblees (`pnpm --filter api build`) tout en partageant les dependances communes.

**Apport au projet :**
- **Coherence** : une seule source de verite pour les types partages front/back
- **Simplicite** : un seul `git clone`, un seul `make install` pour tout configurer
- **Performance** : installation des deps plus rapide que npm/yarn grace au content-addressable store
- **Orchestration** : `pnpm -r` execute des commandes sur tous les packages, `--filter` cible un package precis

---

### Etape 6 -- Qualite de code (ESLint + Prettier)

**Outils :** ESLint (analyse statique), Prettier (formatage automatique)

**Pourquoi ESLint :** Analyse statique du code TypeScript pour detecter les erreurs courantes (variables non utilisees, `any` implicite, imports manquants) **avant meme l'execution**. Les regles configurees dans `.eslintrc.js` imposent des bonnes pratiques communes a toute l'equipe. Integre avec Prettier pour eviter les conflits entre formatage et linting.

**Pourquoi Prettier :** Formatage automatique et **deterministe** du code (indentation, quotes, virgules, largeur de ligne). Elimine definitivement les debats de style dans les Pull Requests. Un seul fichier `.prettierrc` assure un code visuellement uniforme sur tout le projet.

**Apport au projet :**
- **Uniformite** : chaque fichier suit les memes regles, quel que soit l'auteur
- **Prevention** : les erreurs sont detectees a l'ecriture, pas en production
- **Productivite** : zero temps perdu sur le formatage, l'outil s'en charge

> La configuration detaillee est documentee dans la [section 7](#7-qualite-de-code).

---

### Etape 7 -- Pre-commit (Husky + lint-staged)

**Outils :** Husky (Git hooks), lint-staged (execution ciblee sur les fichiers modifies)

**Pourquoi :** Husky intercepte le `git commit` et execute automatiquement ESLint + Prettier **uniquement sur les fichiers modifies** (via lint-staged). Un commit qui contient du code non conforme est **bloque avant d'atteindre le depot**. Cela constitue une premiere barriere de qualite, locale et instantanee, qui evite de polluer l'historique Git avec du code mal formate ou des erreurs evidentes.

**Apport au projet :**
- **Barriere automatique** : impossible de commiter du code non conforme
- **Rapidite** : seuls les fichiers modifies sont analyses (pas tout le projet)
- **Pas de dependance CI** : la verification se fait en local, avant meme le push

---

### Etape 8 -- Tests (Jest + Supertest)

**Outils :** Jest (framework de test), ts-jest (support TypeScript), @nestjs/testing (tests d'integration NestJS), Supertest (tests HTTP E2E)

**Pourquoi :** Les tests automatises verifient que le code **fonctionne conformement aux specifications** a chaque modification. Les tests unitaires valident la logique metier isolee (services). Les tests d'integration verifient le bon cablage des modules NestJS (controllers + services + base de donnees). Les tests E2E simulent des appels HTTP reels pour valider les flux de bout en bout.

**Apport au projet :**
- **Non-regression** : chaque modification est verifiee contre les tests existants
- **Confiance** : le refactoring est securise par le filet de tests
- **Documentation vivante** : les tests decrivent le comportement attendu du systeme
- **Detection precoce** : un bug est detecte localement, pas en production

| Type | Outil | Portee | Exemple |
|------|-------|--------|---------|
| Unitaire | Jest + ts-jest | Logique metier isolee | `AuthService.validateUser()` |
| Integration | @nestjs/testing | Module complet | `HazardsModule` avec DB test |
| E2E | Jest + Supertest | Flux HTTP complet | `POST /api/hazards` -> 201 |

---

### Etape 9 -- Integration continue (GitHub Actions)

**Outil :** GitHub Actions (pipelines CI/CD)

**Pourquoi :** A chaque push ou Pull Request, GitHub Actions execute automatiquement un pipeline de validation dans un **environnement vierge et reproductible** (Ubuntu + PostgreSQL de test). Le pipeline enchaine : installation des deps, lint, build, tests. Si une etape echoue, la Pull Request est **bloquee** et ne peut pas etre mergee. Cela garantit que la branche `main` contient toujours du code fonctionnel et valide.

**Apport au projet :**
- **Automatisation** : aucune validation manuelle necessaire, le pipeline s'execute a chaque push
- **Reproductibilite** : l'environnement CI est identique pour tous, eliminant le "ca marche sur ma machine"
- **Protection de main** : seul le code qui passe tous les checks peut etre merge
- **Feedback rapide** : le developpeur est notifie en minutes si son code casse quelque chose
- **Gratuit** : GitHub Actions est gratuit pour les repos publics/educatifs

> Le detail du pipeline et du workflow YAML est traite dans la [section 5](#5-integration-et-deploiement-continus-cicd).

---

### Etape 10 -- Conteneurisation et deploiement (Docker + Makefile)

**Outils :** Docker + Docker Compose (conteneurisation), Makefile (automatisation des commandes)

**Pourquoi Docker :** Docker encapsule chaque service (API, PostgreSQL) dans un **conteneur isole et reproductible**. Le `Dockerfile` multi-stage produit une image de production legere (sans outils de dev). Docker Compose orchestre les conteneurs (reseau interne, volumes persistants, healthchecks, ordre de demarrage). Tout developpeur obtient un environnement identique avec un seul `make docker-up`, quel que soit son OS. En production, l'image Docker est deployee sur **OVHcloud** (hebergeur europeen, conformite RGPD, souverainete des donnees).

**Pourquoi Makefile :** Le Makefile sert de **point d'entree unique** et de couche d'abstraction au-dessus de pnpm et Docker. Au lieu de memoriser `docker compose -f docker/docker-compose.yml up -d postgres && pnpm --filter api start:dev`, le developpeur tape `make dev-api`. Cela reduit la courbe d'apprentissage, uniformise les commandes et documente les operations courantes.

**Apport au projet :**
- **"Works on my machine" elimine** : Docker garantit le meme environnement partout (dev, CI, prod)
- **Isolation** : chaque service a ses propres dependances, pas de conflit systeme
- **Demarrage en une commande** : `make dev-api` lance la DB + l'API, `make dev-mobile` lance le front
- **Production-ready** : l'image Docker multi-stage est directement deployable
- **Onboarding simplifie** : un nouveau developpeur est operationnel en 3 commandes (`git clone`, `make install`, `make dev-api`)

> L'architecture Docker detaillee (Dockerfile, Compose, ports, volumes) est documentee dans le [DAL -- section 4](./DAL.md#4-infrastructure-et-conteneurisation).

---

## 4. Gestion du code source

### 4.1 Strategie de branching (Git Flow simplifie)

```mermaid
gitGraph
    commit id: "init"
    branch develop
    checkout develop
    commit id: "setup projet"
    branch feature/auth
    checkout feature/auth
    commit id: "auth module"
    commit id: "jwt strategy"
    checkout develop
    merge feature/auth id: "PR #1"
    branch feature/hazards
    checkout feature/hazards
    commit id: "hazard CRUD"
    commit id: "geolocation"
    checkout develop
    merge feature/hazards id: "PR #2"
    checkout main
    merge develop id: "Release MVP"
```

- **`main`** : branche de production, toujours stable et deployable
- **`develop`** : branche d'integration, recoit les merges des features
- **`feature/*`** : branches de travail, une par fonctionnalite

### 4.2 Convention de nommage des branches

| Prefixe | Usage | Exemple |
|---------|-------|---------|
| `feature/` | Nouvelle fonctionnalite | `feature/hazard-map` |
| `fix/` | Correction de bug | `fix/login-validation` |
| `refactor/` | Refactoring | `refactor/api-structure` |
| `docs/` | Documentation | `docs/dal` |

### 4.3 Convention de commits

Le projet suit la convention [Conventional Commits](https://www.conventionalcommits.org/), qui structure les messages de commit pour faciliter la lecture de l'historique et l'automatisation (changelogs, versionnement semantique) :

```
<type>: <description courte>

Types utilises :
  feat:     nouvelle fonctionnalite
  fix:      correction de bug
  docs:     documentation
  refactor: refactoring (pas de changement fonctionnel)
  test:     ajout ou modification de tests
  chore:    maintenance (deps, config, CI)
```

**Exemples :**
```
feat: add hazard creation endpoint
fix: resolve JWT expiration issue
docs: update DAL with CI/CD section
refactor: extract shared types to packages/shared
chore: update all packages to latest versions
```

### 4.4 Processus de Pull Request

```mermaid
graph LR
    A[Feature branch] -->|git push| B[Pull Request]
    B --> C{CI Pipeline}
    C -->|Echec| D[Corriger & re-push]
    D --> C
    C -->|Succes| E[Code Review]
    E -->|Corrections demandees| D
    E -->|Approuve| F[Merge dans develop]
    F -->|Release| G[Merge dans main]
```

Regles :
- Chaque PR doit passer la CI (lint + build + tests)
- Au moins 1 approbation requise avant merge
- Le titre de la PR suit la convention Conventional Commits
- Les branches sont supprimees apres merge

---

## 5. Integration et deploiement continus (CI/CD)

### 5.1 Pipeline CI/CD cible

```mermaid
graph LR
    subgraph "CI -- Integration Continue"
        A[Push / PR] --> B[Install deps<br/>pnpm install]
        B --> C[Lint<br/>ESLint + Prettier]
        C --> D[Build<br/>TypeScript compile]
        D --> E[Tests unitaires<br/>Jest]
        E --> F[Tests E2E<br/>avec DB test]
    end

    subgraph "CD -- Deploiement Continu"
        F -->|main branch| G[Build Docker image]
        G --> H[Push image<br/>Registry]
        H --> I[Deploy<br/>OVHcloud]
    end

    style A fill:#e1f5fe
    style F fill:#fff3e0
    style I fill:#e8f5e9
```

### 5.2 GitHub Actions -- Workflow CI

Le workflow CI s'execute a chaque push et pull request. Il valide le code, lance les tests et verifie la compilation dans un environnement vierge avec une base de donnees PostgreSQL de test.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: citizen_alert_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Build shared package
        run: pnpm --filter shared build

      - name: Build API
        run: pnpm --filter api build

      - name: Run API tests
        run: pnpm --filter api test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/citizen_alert_test
          JWT_SECRET: test-secret
          JWT_EXPIRATION: 7d
```

### 5.3 Strategie de deploiement

| Evenement | Action declenchee |
|-----------|-------------------|
| PR vers `develop` | CI : lint + build + tests |
| Merge vers `develop` | CI + build image Docker staging |
| PR vers `main` | CI complet + review obligatoire |
| Merge vers `main` | CI + CD : build + deploy production (OVHcloud) |

---

## 6. Automatisation (Makefile)

Le **Makefile** a la racine du projet sert de point d'entree unique pour toutes les commandes, evitant de memoriser les syntaxes pnpm/docker.

### 6.1 Commandes principales

```mermaid
graph TB
    subgraph "make install"
        I[pnpm install]
    end

    subgraph "make dev-api"
        DA1[docker compose up -d postgres]
        DA2[pnpm --filter api start:dev]
        DA1 --> DA2
    end

    subgraph "make dev-mobile"
        DM[pnpm --filter mobile start]
    end

    subgraph "make test"
        T[pnpm --filter api test]
    end

    subgraph "make lint"
        L[pnpm lint]
    end

    subgraph "make docker-up"
        DU[docker compose up -d]
    end
```

### 6.2 Reference des commandes

| Commande | Description |
|----------|-------------|
| `make install` | Installer toutes les dependances |
| `make dev-api` | Demarrer DB (Docker) + API (local, port 3001) |
| `make dev-mobile` | Demarrer le serveur Expo |
| `make build` | Compiler l'API pour la production |
| `make test` | Lancer les tests |
| `make lint` | Verifier le code (ESLint) |
| `make format` | Formater le code (Prettier) |
| `make docker-up` | Demarrer tous les conteneurs Docker |
| `make docker-down` | Arreter les conteneurs |
| `make docker-rebuild` | Reconstruire les images Docker |
| `make db-shell` | Ouvrir un shell PostgreSQL |
| `make clean` | Supprimer node_modules et artefacts de build |

### 6.3 Workflow de developpement recommande

```
Terminal 1                    Terminal 2
+-----------------------+    +-----------------------+
| $ make dev-api        |    | $ make dev-mobile     |
|                       |    |                       |
| > PostgreSQL :5434    |    | > Expo Dev Server     |
| > NestJS API :3001    |    | > QR Code affiche     |
+-----------------------+    +-----------------------+
```

**Onboarding d'un nouveau developpeur :**
```bash
git clone <repo>          # 1. Cloner le depot
make install              # 2. Installer les dependances
make dev-api              # 3. Lancer le backend (Terminal 1)
make dev-mobile           # 4. Lancer le frontend (Terminal 2)
```

---

## 7. Qualite de code

### 7.1 Vue d'ensemble des barrieres de qualite

```mermaid
graph LR
    subgraph "Barriere 1 -- IDE"
        CODE[Code source] --> ESLINT[ESLint<br/>Analyse statique]
        CODE --> PRETTIER[Prettier<br/>Formatage]
        CODE --> TS[TypeScript<br/>Typage strict]
    end

    subgraph "Barriere 2 -- Pre-commit"
        HUSKY[Husky<br/>Git Hooks] --> STAGED[lint-staged<br/>Fichiers modifies]
        STAGED --> ESLINT
        STAGED --> PRETTIER
    end

    subgraph "Barriere 3 -- CI"
        GH[GitHub Actions] --> LINT[Lint]
        GH --> BUILD[Build]
        GH --> TEST[Tests Jest]
    end

    style HUSKY fill:#e8f5e9
    style GH fill:#fff3e0
```

L'approche repose sur **3 barrieres successives** :

| Barriere | Moment | Outils | Ce qu'elle bloque |
|----------|--------|--------|-------------------|
| **1. IDE** | A l'ecriture | ESLint, Prettier, TypeScript | Erreurs de syntaxe, typage, formatage |
| **2. Pre-commit** | Au `git commit` | Husky + lint-staged | Code non conforme dans l'historique Git |
| **3. CI** | Au `git push` / PR | GitHub Actions | Code casse dans les branches partagees |

### 7.2 Configuration ESLint

- Parser : `@typescript-eslint/parser`
- Extends : `eslint:recommended`, `@typescript-eslint/recommended`, `prettier`
- Regles notables : warning sur `any` explicite, interface naming desactivee
- Integration Prettier pour eviter les conflits lint/format

### 7.3 Configuration Prettier

| Parametre | Valeur |
|-----------|--------|
| Semicolons | `true` |
| Quotes | single (`'`) |
| Trailing commas | `all` |
| Largeur max | 100 caracteres |
| Indentation | 2 espaces |
| Arrow parens | `avoid` |

### 7.4 Husky + lint-staged

A chaque `git commit`, Husky execute lint-staged qui applique ESLint + Prettier **uniquement sur les fichiers modifies (staged)**. Si le code ne passe pas, le commit est refuse.

### 7.5 TypeScript strict mode

Active sur tout le projet (`strict: true` dans chaque `tsconfig.json`), ce qui active :
- `strictNullChecks` : pas de `null`/`undefined` implicites
- `noImplicitAny` : tout doit etre type explicitement
- `strictPropertyInitialization` : les proprietes doivent etre initialisees

---

## Annexe -- Chaine d'outils

```mermaid
graph TB
    subgraph "1. Cadrage"
        CDC["Cahier des charges<br/>+ AFB<br/><i>Perimetre & exigences</i>"]
    end

    subgraph "2. Gestion de projet"
        NOTION["Notion Kanban<br/><i>Backlog, sprints, suivi</i>"]
    end

    subgraph "3. Versionnement"
        GIT["Git + GitHub<br/><i>Branches, PR, historique</i>"]
    end

    subgraph "4. Developpement"
        TS["TypeScript<br/><i>Typage statique partage</i>"]
        NEST["NestJS<br/><i>API modulaire, DI, guards</i>"]
        EXPO["Expo + React Native<br/><i>Cross-platform iOS/Android</i>"]
        PNPM["pnpm Workspaces<br/><i>Monorepo, deps partagees</i>"]
    end

    subgraph "5. Qualite"
        ESLINT["ESLint + Prettier<br/><i>Lint + formatage uniforme</i>"]
        HUSKY["Husky + lint-staged<br/><i>Pre-commit automatique</i>"]
        JEST["Jest + Supertest<br/><i>Tests unit/integ/E2E</i>"]
    end

    subgraph "6. CI/CD & Infrastructure"
        GHA["GitHub Actions<br/><i>Pipeline automatise</i>"]
        DOCKER["Docker + Compose<br/><i>Conteneurs reproductibles</i>"]
        MAKE["Makefile<br/><i>Point d'entree unique</i>"]
        PG["PostgreSQL 16<br/><i>BDD relationnelle</i>"]
    end

    CDC --> NOTION
    NOTION --> GIT
    GIT --> PNPM
    PNPM --> TS
    TS --> NEST
    TS --> EXPO
    NEST --> ESLINT
    EXPO --> ESLINT
    ESLINT --> HUSKY
    HUSKY --> GIT
    GIT -->|Push / PR| GHA
    GHA --> JEST
    GHA --> DOCKER
    DOCKER --> PG
    MAKE --> DOCKER
    MAKE --> PNPM

    style CDC fill:#e1f5fe
    style GHA fill:#fff3e0
    style DOCKER fill:#e8f5e9
    style TS fill:#3178c6,color:#fff
    style NEST fill:#e0234e,color:#fff
    style PG fill:#336791,color:#fff
```
