# Document d'Architecture Logicielle (DAL)

**Projet :** City Alert
**Version :** 1.0
**Date :** 05/02/2026
**Equipe :** BREVET Noa | BUCHY -- PETARD Kenzo | TRAN Florian
**Ecole :** ESGI -- Master 2

> **Document complementaire :** [Methodologie de developpement](./METHODOLOGIE.md) -- decrit le cycle de developpement, les outils, la CI/CD et les processus qualite.

---

## Table des matieres

1. [Objet du document](#1-objet-du-document)
2. [Choix de la stack technique](#2-choix-de-la-stack-technique)
3. [Architecture logicielle](#3-architecture-logicielle)
4. [Infrastructure et conteneurisation](#4-infrastructure-et-conteneurisation)
5. [Securite](#5-securite)
6. [Environnements](#6-environnements)

---

## 1. Objet du document

Ce document decrit l'**architecture logicielle** de **City Alert**, application mobile de signalement d'incidents sur la voirie. Il couvre les choix techniques, l'organisation du code, le modele de donnees, l'infrastructure et la securite.

Il s'appuie sur le cahier des charges et l'analyse fonctionnelle du besoin (AFB) pour garantir la coherence entre les exigences fonctionnelles et les decisions d'architecture.

**Problematique :** Comment simplifier et centraliser le signalement, la gestion et le suivi des incidents sur voirie, tout en repondant aux besoins varies des citoyens, des agents de terrain et des collectivites ?

**Perimetre MVP :**
- Carte interactive des signalements
- Formulaire de creation (nom, lieu, photo)
- Traitement du signalement (statut, suivi)

---

## 2. Choix de la stack technique

### 2.1 Vue d'ensemble

```mermaid
graph LR
    subgraph "Client"
        M[React Native<br/>Expo]
    end

    subgraph "Serveur"
        API[NestJS<br/>REST API]
    end

    subgraph "Base de donnees"
        DB[(PostgreSQL 16)]
    end

    subgraph "Partage"
        S[packages/shared<br/>Types TypeScript]
    end

    M <-->|HTTP/JSON| API
    API <-->|TypeORM| DB
    S -.->|import| M
    S -.->|import| API

    style M fill:#61dafb,color:#000
    style API fill:#e0234e,color:#fff
    style DB fill:#336791,color:#fff
    style S fill:#3178c6,color:#fff
```

### 2.2 Justification des choix

| Composant | Technologie | Justification |
|-----------|------------|---------------|
| **Langage** | TypeScript | Typage statique partage front/back, reduction des bugs, autocompletion |
| **Backend** | NestJS 11 | Framework structure (modules, DI, guards), ecosysteme mature, conventions claires |
| **ORM** | TypeORM | Integration native NestJS, support PostgreSQL, decorateurs TypeScript |
| **BDD** | PostgreSQL 16 | Robuste, open-source, support geospatial natif, adapte aux donnees structurees |
| **Auth** | Auth0 (fournisseur externe) | Authentification deleguee, conforme RGPD, gestion des tokens OAuth2/OIDC, SSO, MFA integre, pas de stockage de mots de passe cote serveur |
| **Mobile** | React Native + Expo | Cross-platform iOS/Android, hot reload, acces natif (camera, GPS), Expo simplifie le build |
| **Routing mobile** | Expo Router | File-based routing, convention Next.js, navigation typee |
| **State management** | Zustand | Leger, simple, pas de boilerplate (vs Redux), performant |
| **HTTP Client** | Axios | Intercepteurs, gestion d'erreurs, timeout configurable |
| **Monorepo** | pnpm workspaces | Partage de types, un seul lockfile, installation rapide, espace disque optimise |
| **Conteneurisation** | Docker + Compose | Environnement reproductible, isolation, deploiement simplifie |
| **Stockage objets** | OVHcloud Object Storage (S3) | Stockage des photos de signalements, API compatible S3, scalable, pas de fichiers sur le serveur applicatif |
| **Hebergement** | OVHcloud | Hebergeur europeen (conformite RGPD), deploiement d'images Docker, souverainete des donnees |
| **Automatisation** | Makefile | Point d'entree unique, commandes memorisables, pas de dependance supplementaire |
| **CI/CD** | GitHub Actions | Integre a GitHub, gratuit pour les repos publics, configuration YAML declarative |
| **Qualite** | ESLint + Prettier + Husky | Lint automatique, formatage uniforme, hooks pre-commit |

### 2.3 Versions principales

| Dependance | Version |
|-----------|---------|
| Node.js | >= 18.0.0 |
| pnpm | >= 8.0.0 |
| TypeScript | 5.9.3 |
| NestJS | 11.x |
| TypeORM | 0.3.28 |
| PostgreSQL | 16 (Alpine) |
| React Native | 0.81.x |
| Expo SDK | 54.x |
| Expo Router | 6.x |
| Zustand | 5.x |

---

## 3. Architecture logicielle

### 3.1 Architecture Monorepo

```
citizen-alert/
|-- apps/
|   |-- api/                  # Backend NestJS
|   |   |-- src/
|   |   |   |-- auth/         # Module authentification
|   |   |   |-- users/        # Module utilisateurs
|   |   |   |-- hazards/      # Module signalements
|   |   |   |-- app.module.ts # Module racine
|   |   |   +-- main.ts       # Point d'entree
|   |   |-- test/             # Tests E2E
|   |   +-- Dockerfile
|   +-- mobile/               # Frontend React Native
|       |-- app/              # Ecrans (file-based routing)
|       |   |-- auth/         # Login, Register
|       |   +-- (tabs)/       # Navigation par onglets
|       +-- src/
|           |-- services/     # Couche API (Axios)
|           |-- stores/       # Etat global (Zustand)
|           |-- components/   # Composants reutilisables
|           |-- hooks/        # Hooks personnalises
|           +-- types/        # Types locaux
|-- packages/
|   +-- shared/               # Types partages front/back
|       +-- src/types/
|-- docker/                   # Docker Compose + init SQL
|-- scripts/                  # Scripts utilitaires
|-- Makefile                  # Commandes automatisees
+-- package.json              # Racine monorepo
```

### 3.2 Architecture Backend (NestJS -- Architecture modulaire)

```mermaid
graph TB
    subgraph "Client Mobile"
        C[React Native App]
    end

    subgraph "API NestJS"
        MW[Middleware CORS]
        VP[ValidationPipe Global]

        subgraph "Auth Module"
            AC[AuthController]
            AS[AuthService]
            LS[LocalStrategy]
            JS[JwtStrategy]
            JG[JwtAuthGuard]
        end

        subgraph "Users Module"
            UC[UsersController]
            US[UsersService]
            UE[User Entity]
        end

        subgraph "Hazards Module"
            HC[HazardsController]
            HS[HazardsService]
            HE[Hazard Entity]
        end
    end

    subgraph "Base de donnees"
        DB[(PostgreSQL)]
    end

    C -->|HTTP REST| MW
    MW --> VP
    VP --> AC
    VP --> UC
    VP --> HC

    AC --> AS
    AS --> US
    AS --> JS
    AS --> LS

    UC --> US
    US --> UE
    UE -->|TypeORM| DB

    HC --> HS
    HS --> HE
    HE -->|TypeORM| DB

    JG -.->|Protege| UC
    JG -.->|Protege| HC

    style DB fill:#336791,color:#fff
    style C fill:#61dafb,color:#000
```

**Pattern architectural :** Chaque module suit le pattern **Controller -> Service -> Entity/Repository** :
- **Controller** : Point d'entree HTTP, validation des DTOs, delegation au Service
- **Service** : Logique metier, interactions avec le Repository
- **Entity** : Mapping objet-relationnel (TypeORM), schema de la table

### 3.3 Architecture Frontend (React Native + Expo)

```mermaid
graph TB
    subgraph "Expo Router"
        L[_layout.tsx<br/>Root Layout]
        I[index.tsx<br/>Home]
        AL[auth/login.tsx]
        AR[auth/register.tsx]
        TL["(tabs)/_layout.tsx"]
        TM["(tabs)/map.tsx"]
        TR["(tabs)/report.tsx"]
        TP["(tabs)/profile.tsx"]
    end

    subgraph "State Layer"
        ZA[authStore<br/>Zustand]
        ZH[hazardStore<br/>Zustand]
    end

    subgraph "Service Layer"
        SA[authService]
        SH[hazardService]
        AX[Axios Instance<br/>api.ts]
    end

    L --> I
    L --> AL
    L --> AR
    L --> TL
    TL --> TM
    TL --> TR
    TL --> TP

    AL --> ZA
    AR --> ZA
    TP --> ZA
    TM --> ZH
    TR --> ZH

    ZA --> SA
    ZH --> SH
    SA --> AX
    SH --> AX

    AX -->|HTTP| API[NestJS API]

    style API fill:#e0234e,color:#fff
    style AX fill:#5a29e4,color:#fff
```

**Flux de donnees unidirectionnel :**
1. L'ecran appelle une action du **Store** (Zustand)
2. Le Store appelle le **Service** (couche API)
3. Le Service effectue la requete HTTP via **Axios**
4. La reponse met a jour le **State** du Store
5. Le composant se **re-render** automatiquement

### 3.4 Modele de donnees

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar email UK
        varchar password
        varchar firstName
        varchar lastName
        varchar phoneNumber
        boolean isActive
        timestamp createdAt
        timestamp updatedAt
    }

    HAZARDS {
        uuid id PK
        enum type "accident|road_issue|warning|police|other"
        varchar description
        decimal latitude
        decimal longitude
        varchar address
        enum status "active|resolved|archived"
        varchar imageUrl
        uuid userId FK
        timestamp createdAt
        timestamp updatedAt
    }

    USERS ||--o{ HAZARDS : "signale"
```

### 3.5 Stockage des images (OVHcloud Object Storage -- S3)

Les photos jointes aux signalements sont stockees dans un **bucket S3** heberge sur OVHcloud Object Storage (API compatible Amazon S3). Ce choix decouple le stockage de fichiers du serveur applicatif et de la base de donnees.

#### Pourquoi un stockage objet S3 et pas la BDD ?

| Critere | PostgreSQL (BLOB) | Stockage objet S3 |
|---------|-------------------|-------------------|
| **Performance** | Degrade les requetes, surcharge le WAL | Acces direct par URL, pas d'impact sur la BDD |
| **Scalabilite** | Limitee par la taille de la BDD | Stockage quasi-illimite, facturation a l'usage |
| **Couts** | Stockage BDD couteux, sauvegardes lourdes | Stockage basse densite, tres economique |
| **CDN / Cache** | Impossible | Compatible CDN pour servir les images rapidement |
| **Sauvegardes** | Photos incluses = sauvegardes lentes | Sauvegardes BDD legeres, images gerees separement |

#### Architecture du flux d'upload

```mermaid
sequenceDiagram
    participant M as App Mobile
    participant API as NestJS API
    participant S3 as OVHcloud S3<br/>Object Storage
    participant DB as PostgreSQL

    M->>API: 1. POST /api/hazards (photo + donnees)
    API->>S3: 2. Upload image (AWS SDK / presigned URL)
    S3-->>API: 3. URL publique de l'image
    API->>DB: 4. INSERT hazard (imageUrl = URL S3)
    DB-->>API: 5. Hazard cree
    API-->>M: 6. Reponse avec imageUrl

    Note over M,S3: La photo est servie directement<br/>depuis S3, pas par l'API
```

#### Configuration du bucket

| Parametre | Valeur |
|-----------|--------|
| **Fournisseur** | OVHcloud Object Storage (S3-compatible) |
| **Region** | GRA (Gravelines, France) |
| **Bucket** | `citizen-alert-images` |
| **Acces images** | Public en lecture (URLs signees ou ACL publique) |
| **Acces upload** | Prive (credentials API uniquement) |
| **SDK** | `@aws-sdk/client-s3` (compatible OVHcloud) |

> En base de donnees, le champ `imageUrl` de la table `hazards` stocke uniquement l'**URL** de l'image dans le bucket S3, pas le fichier binaire.

#### Variables d'environnement S3

| Variable | Description |
|----------|-------------|
| `S3_ENDPOINT` | Endpoint OVHcloud S3 (ex: `s3.gra.cloud.ovh.net`) |
| `S3_REGION` | Region du bucket (`gra`) |
| `S3_BUCKET` | Nom du bucket (`citizen-alert-images`) |
| `S3_ACCESS_KEY` | Cle d'acces OVHcloud |
| `S3_SECRET_KEY` | Cle secrete OVHcloud |

---

### 3.6 Endpoints API REST

| Methode | Route | Auth | Description |
|---------|-------|------|-------------|
| `POST` | `/api/auth/register` | Non | Inscription |
| `POST` | `/api/auth/login` | Non | Connexion |
| `GET` | `/api/auth/profile` | JWT | Profil connecte |
| `GET` | `/api/users` | JWT | Liste des utilisateurs |
| `GET` | `/api/users/:id` | JWT | Detail utilisateur |
| `PATCH` | `/api/users/:id` | JWT | Modifier utilisateur (self) |
| `DELETE` | `/api/users/:id` | JWT | Supprimer utilisateur (self) |
| `POST` | `/api/hazards` | JWT | Creer un signalement |
| `GET` | `/api/hazards` | Non | Liste des signalements |
| `GET` | `/api/hazards/active` | Non | Signalements actifs |
| `GET` | `/api/hazards/nearby` | Non | Signalements a proximite |
| `GET` | `/api/hazards/:id` | Non | Detail d'un signalement |
| `PATCH` | `/api/hazards/:id` | JWT | Modifier (proprietaire) |
| `DELETE` | `/api/hazards/:id` | JWT | Supprimer (proprietaire) |

---

## 4. Infrastructure et conteneurisation

### 4.1 Architecture Docker

```mermaid
graph TB
    subgraph "Docker Compose"
        subgraph "citizen-alert-network (bridge)"
            PG[PostgreSQL 16 Alpine<br/>Container: citizen-alert-postgres<br/>Port interne: 5432]
            API[NestJS API<br/>Container: citizen-alert-api<br/>Port interne: 3000]
        end
    end

    subgraph "Volumes"
        V[(postgres_data<br/>Donnees persistantes)]
        INIT[init.sql<br/>Script initialisation]
    end

    subgraph "Services externes"
        S3[OVHcloud Object Storage<br/>Bucket S3<br/>citizen-alert-images]
        AUTH[Auth0<br/>Fournisseur d'identite]
    end

    subgraph "Hote"
        DEV[Developpeur]
        MOB[App Mobile<br/>Expo Go]
    end

    DEV -->|:5434| PG
    DEV -->|:3001 dev local<br/>:3002 docker| API
    MOB -->|HTTP| API
    API -->|:5432 interne| PG
    API -->|Upload images| S3
    API -->|Verification JWT| AUTH
    MOB -->|Lecture images| S3
    V --- PG
    INIT -.->|docker-entrypoint| PG

    style PG fill:#336791,color:#fff
    style API fill:#e0234e,color:#fff
    style S3 fill:#ff9900,color:#000
    style AUTH fill:#eb5424,color:#fff
```

### 4.2 Dockerfile (Multi-stage build)

Le Dockerfile de l'API utilise un **build multi-stage** pour optimiser la taille de l'image finale :

| Stage | Image de base | Role |
|-------|--------------|------|
| **builder** | `node:18-slim` | Installe les deps, compile TypeScript |
| **production** | `node:18-slim` | Deps de production uniquement + artefacts compiles |

Cela permet de ne pas embarquer les outils de build (TypeScript, ESLint, etc.) dans l'image finale.

### 4.3 Docker Compose -- Services

| Service | Image | Port externe | Port interne | Healthcheck |
|---------|-------|-------------|-------------|-------------|
| `postgres` | `postgres:16-alpine` | 5434 | 5432 | `pg_isready` |
| `api` | Build local (Dockerfile) | 3002 | 3000 | -- |

**Reseau :** `citizen-alert-network` (bridge) -- permet la communication inter-conteneurs par nom de service (ex: `postgres:5432`).

**Volume :** `postgres_data` -- persistance des donnees entre redemarrages.

---

## 5. Securite

### 5.1 Authentification deleguee (Auth0)

L'authentification est deleguee a **Auth0**, fournisseur d'identite externe (IDaaS). Ce choix permet de :

- **Ne pas stocker de mots de passe** cote serveur : la gestion des credentials est entierement geree par Auth0
- **Beneficier de fonctionnalites avancees** sans developpement : MFA (multi-factor authentication), SSO (single sign-on), social login (Google, Apple)
- **Respecter la conformite RGPD** : Auth0 propose des options d'hebergement EU et des politiques de retention de donnees configurables
- **Securiser les echanges** via les standards OAuth 2.0 et OpenID Connect (OIDC)

```mermaid
sequenceDiagram
    participant M as App Mobile
    participant A as Auth0
    participant API as NestJS API

    M->>A: 1. Login (email/password ou social)
    A-->>M: 2. Access Token (JWT) + ID Token
    M->>API: 3. Requete API avec Bearer Token
    API->>A: 4. Verification du token (JWKS)
    A-->>API: 5. Token valide
    API-->>M: 6. Reponse
```

Le backend valide les tokens JWT emis par Auth0 via la cle publique (JWKS endpoint), sans jamais avoir acces aux credentials utilisateur.

### 5.2 Autres mesures de securite

| Mesure | Implementation |
|--------|---------------|
| **Validation des entrees** | class-validator (DTOs avec decorateurs) |
| **Whitelist des champs** | `forbidNonWhitelisted: true` sur le ValidationPipe global |
| **CORS** | Origines autorisees configurables (`ALLOWED_ORIGINS`) |
| **Protection des routes** | Guards NestJS (`JwtAuthGuard`) |
| **Autorisation** | Verification proprietaire sur les operations sensibles (update/delete) |

### 5.3 Variables sensibles

Les secrets (`AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `DB_PASSWORD`) sont geres via des variables d'environnement (`.env` local, secrets GitHub Actions en CI). Le fichier `.env` est exclu du depot Git (`.gitignore`).

---

## 6. Environnements

### 6.1 Hebergement de production (OVHcloud)

L'application est hebergee sur **OVHcloud**, hebergeur europeen. Ce choix repond a plusieurs exigences :

- **Conformite RGPD** : donnees hebergees en France/UE, pas de transfert hors UE
- **Souverainete** : fournisseur francais, soumis au droit europeen
- **Deploiement Docker natif** : les images Docker construites en CI sont directement deployees sur l'infrastructure OVHcloud
- **Cout maitrise** : offres adaptees aux projets universitaires et startups

**Strategie de deploiement :** L'image Docker de l'API, construite par la CI GitHub Actions, est poussee sur un registry puis deployee sur l'instance OVHcloud.

```mermaid
graph LR
    A[GitHub Actions<br/>Build image] --> B[Registry Docker]
    B --> C[OVHcloud<br/>Instance de production]
    C --> D[(PostgreSQL<br/>OVHcloud)]
    C --> E[Auth0<br/>Fournisseur d'identite]
    C --> F[OVHcloud S3<br/>Object Storage<br/>Photos signalements]

    style C fill:#000091,color:#fff
    style D fill:#336791,color:#fff
    style F fill:#ff9900,color:#000
```

### 6.2 Tableau des environnements

| Environnement | Hebergement | Base de donnees | API Port | Usage |
|--------------|-------------|----------------|----------|-------|
| **Dev local** | Machine developpeur | PostgreSQL Docker (:5434) | 3001 | Developpement quotidien |
| **Dev Docker** | Machine developpeur | PostgreSQL Docker (:5434) | 3002 | Test de l'image Docker |
| **CI** | GitHub Actions (Ubuntu) | PostgreSQL service (:5432) | -- | Tests automatises |
| **Production** | OVHcloud | PostgreSQL OVHcloud | 3000 | Deploiement final |

### 6.3 Variables d'environnement

| Variable | Dev | CI | Production (OVHcloud) |
|----------|-----|-----|------------|
| `NODE_ENV` | development | test | production |
| `DB_HOST` | localhost | localhost | (instance OVHcloud) |
| `DB_PORT` | 5434 | 5432 | 5432 |
| `AUTH0_DOMAIN` | dev.auth0.com | test.auth0.com | prod.auth0.com |
| `AUTH0_CLIENT_ID` | dev-client-id | test-client-id | (secret) |
| `S3_ENDPOINT` | s3.gra.cloud.ovh.net | s3.gra.cloud.ovh.net | s3.gra.cloud.ovh.net |
| `S3_BUCKET` | citizen-alert-images-dev | citizen-alert-images-test | citizen-alert-images |
| `S3_ACCESS_KEY` | dev-key | test-key | (secret) |
| `ALLOWED_ORIGINS` | localhost:* | -- | domaine prod |
| `EXPO_PUBLIC_API_URL` | http://IP:3001/api | -- | https://api.cityalert.fr/api |
