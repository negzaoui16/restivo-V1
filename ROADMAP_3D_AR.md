# 📋 Cahier des Charges & Roadmap Technique : Menu, AR, 3D & Réservations
**Projet :** Restivo  
**Rôle :** Responsable des Modules Menu (Gestion & Personnalisation), Réalité Augmentée (AR), Génération IA, Restaurant 3D & Réservations  
**Dernière mise à jour :** Octobre 2026 (Mise à jour post-implémentation Modules 1, 2, 3)  
**Statut Global :** Modules 1, 2 et 3 **100% TERMINÉS & TESTÉS** ✅ | Modules 4 et 5 **À FAIRE** ⏳  

---

## 📊 Résumé d'Avancement des Modules

| Module | Intitulé | Statut | Détails & État Actuel |
| :--- | :--- | :---: | :--- |
| **Module 1** | **Gestion & Personnalisation du Menu** | ✅ **TERMINÉ** | CRUD Catégories & Articles, Drag & Drop, Toggles Dispo/Featured, Identité visuelle & Preview. |
| **Module 2** | **Génération IA Image-to-3D** | ✅ **TERMINÉ** | Migré de TripoSR vers **TRELLIS**. Découpage modulaire, requêtes REST/queue (sans `@gradio/client`), Fallback contextuel, stockage persistant. |
| **Module 3** | **Visualisation Plat 3D & Réalité Augmentée (AR)** | ✅ **TERMINÉ** | Intégration `<model-viewer>` dans `ARModal.tsx`, blocage vue du dessous de l'assiette, bouton WebAR natif. |
| **Module 4** | **Restaurant en 3D (Plan Interactif)** | ⏳ **À FAIRE** | Conversion du plan 2D en scène 3D temps réel avec `Three.js` / `@react-three/fiber`. |
| **Module 5** | **Système de Réservation de Tables** | ⏳ **À FAIRE** | Tunnel de réservation client lié aux tables 3D + Gestion opérationnelle staff/restaurant. |

---

## 🏗️ Architecture & Technologies en Place

| Composant | Solution Implémentée | Emplacement dans le Code | Statut |
| :--- | :--- | :--- | :---: |
| **Menu Dashboard** | Next.js 16 (App Router) + Tailwind CSS + Lucide | `app/mainpage/restaurants/menu/` | ✅ Actif |
| **Upload d'Images 2D** | Route API dédiée avec stockage disque permanent | `app/api/upload-image/route.ts` ➔ `public/uploads/dishes/` | ✅ Actif |
| **Génération 3D (IA)** | **TRELLIS** (`trellis-community/TRELLIS`) via REST Queue API | `app/api/generate-3d/` (modulaire) ➔ `public/models/` | ✅ Actif |
| **Visualisation AR / 3D** | Google `<model-viewer>` v4.0.0 avec restriction orbitale | `app/mainpage/restaurants/menu/_components/ARModal.tsx` | ✅ Actif |
| **Base de données** | PostgreSQL + Prisma 8 (`@prisma/orm-postgres`) | `prisma/contract.prisma` & `lib/menu/service.ts` | ✅ Actif |
| **Authentification HF** | Token ZeroGPU Hugging Face | `.env` (`HUGGINGFACE_TOKEN`) | ✅ Configuré |
| **Scène 3D Salle** | `Three.js` / `@react-three/fiber` | *À créer dans `app/mainpage/restaurants/floor-plan/`* | ⏳ Prochain |
| **Moteur Réservation** | Prisma + Routes REST / Server Actions | *À créer* | ⏳ Prochain |

---

## 🛠️ Détail des Réalisations (Ce qui a été fait)

### ✅ MODULE 1 : Gestion & Personnalisation du Menu
* **Gestion des Catégories & Plats :**
  * Ajout, modification, suppression, duplication d'articles.
  * Toggles en un clic pour la disponibilité (`isAvailable`) et mise en vedette (`isFeatured`).
  * Liaison automatique avec les catégories existantes.
* **Résolution du Bug de Perte d'Image au Redémarrage :**
  * Création de la route [`app/api/upload-image/route.ts`](file:///c:/Users/Negza/Desktop/Project%20Next/restivo-V1-main/app/api/upload-image/route.ts).
  * Les photos téléversées depuis le PC sont sauvegardées définitivement sous `public/uploads/dishes/dish-[uuid].[ext]`.
  * Élimination des URLs temporaires `blob:http://...` qui cassaient les images après arrêt/redémarrage du serveur.
  * Ajout de la protection `onError` dans [`MenuTable.tsx`](file:///c:/Users/Negza/Desktop/Project%20Next/restivo-V1-main/app/mainpage/restaurants/menu/_components/MenuTable.tsx).

---

### ✅ MODULE 2 : Génération 3D par IA (TRELLIS)
* **Abandon de TripoSR au profit de TRELLIS :**
  * TripoSR produisait des formes sphériques déformées sur les photos de pizzas prises du dessus.
  * Remplacement réussi par **TRELLIS** (`trellis-community/TRELLIS`), offrant un niveau de détail et de texture nettement supérieur.
* **Suppression de `@gradio/client` :**
  * La librairie `@gradio/client` causait des erreurs de timeout (`UND_ERR_HEADERS_TIMEOUT`) dans Next.js lors de générations longues (>25s).
  * Réécriture complète avec des requêtes HTTP natives `fetch` gérant l'API Queue Gradio et Server-Sent Events (SSE).
* **Découpage Modulaire Propre sous [`app/api/generate-3d/`](file:///c:/Users/Negza/Desktop/Project%20Next/restivo-V1-main/app/api/generate-3d/) :**
  1. [`image-parser.ts`](file:///c:/Users/Negza/Desktop/Project%20Next/restivo-V1-main/app/api/generate-3d/image-parser.ts) : Extrait et normalise l'image en `Blob` standard (que l'entrée soit un fichier ou une URL).
  2. [`trellis.ts`](file:///c:/Users/Negza/Desktop/Project%20Next/restivo-V1-main/app/api/generate-3d/trellis.ts) : Gère le workflow TRELLIS (upload ➔ start_session fn 4 ➔ preprocess_image fn 8 ➔ generate_and_extract_glb fn 11 ➔ téléchargement du `.glb`).
  3. [`fallback.ts`](file:///c:/Users/Negza/Desktop/Project%20Next/restivo-V1-main/app/api/generate-3d/fallback.ts) : Système de secours contextuel automatique (si quota Hugging Face ZeroGPU dépassé ou serveur injoignable, sélectionne automatiquement un modèle 3D adapté comme `pizza-pepperoni.glb` ou `pizza.glb` sans casser l'expérience utilisateur).
  4. [`route.ts`](file:///c:/Users/Negza/Desktop/Project%20Next/restivo-V1-main/app/api/generate-3d/route.ts) : Point d'entrée orchestrateur avec logs d'étapes détaillés (`[1/3]`, `[2/3]`, `[3/3]`).
* **Sauvegarde des modèles :** Les fichiers `.glb` sont stockés sous `public/models/item-3d-[uuid].glb` et leur chemin est enregistré dans le champ `model3dUrl` de la table `MenuItem` en base PostgreSQL.

---

### ✅ MODULE 3 : Visualisation 3D & Réalité Augmentée (AR)
* **Composant Modale 3D :** [`app/mainpage/restaurants/menu/_components/ARModal.tsx`](file:///c:/Users/Negza/Desktop/Project%20Next/restivo-V1-main/app/mainpage/restaurants/menu/_components/ARModal.tsx).
* **Badge interactif :** Chaque plat ayant un `model3dUrl` affiche un badge violet `"3D / AR"` dans la table du menu ouvrant instantanément la modale.
* **Restrictions de caméra :**
  * `min-camera-orbit="auto 0deg auto"` et `max-camera-orbit="auto 88deg auto"`.
  * Empêche l'utilisateur d'orienter la caméra sous l'objet (bloque la vue de la face inférieure plate de l'assiette/pizza tout en laissant la rotation 360° fluide sur les côtés et le dessus).
  * `disable-pan=""` pour garder le modèle bien centré.
* **Support AR Natif :** Bouton WebAR prêt à l'emploi (`ar-modes="webxr scene-viewer quick-look"`) permettant la projection directe sur table via smartphone.

---

## ⏳ Prochaines Étapes Restantes (À Réaliser)

### 📌 ÉTAPE 1 : Module 4 - Restaurant en 3D (Plan Interactif)
1. **Installation des dépendances 3D :**
   * `three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`.
2. **Récupération des données du Plan 2D existant :**
   * Tables (`x`, `y`, `width`, `height`, `rotation`, `shape`, `capacity`).
   * Éléments du plan (murs, portes, cloisons, sol).
3. **Création du composant Canvas 3D :**
   * Transformer les coordonnées 2D `(x, y)` en coordonnées 3D `(x, 0, z)`.
   * Modélisation procédurale ou modèles GLTF pour les tables (rondes, carrées, rectangulaires) et chaises.
   * Système d'éclairage et ombres douces.
4. **Indicateurs de Disponibilité :**
   * Table disponible : surbrillance verte 🟢.
   * Table occupée/réservée : surbrillance rouge 🔴.
   * Événement de clic sur une table pour initier la réservation.

---

### 📌 ÉTAPE 2 : Module 5 - Système Complet de Réservation
1. **Tunnel Client de Réservation :**
   * Sélection Date, Heure, Nombre de personnes.
   * Mise à jour dynamique de la scène 3D selon les tables libres sur ce créneau.
   * Formulaire de validation (Nom, Téléphone, Email, Demandes spéciales).
   * Génération du code de confirmation (ex: `#RES-XXXX`).
2. **Dashboard Restaurateur / Staff :**
   * Page de gestion des réservations (`app/mainpage/restaurants/reservations/`).
   * Vue calendrier et vue liste filtrable par date et par statut (`PENDING`, `CONFIRMED`, `SEATED`, `COMPLETED`, `CANCELLED`).
   * Actions en 1 clic pour valider l'arrivée du client ou libérer la table.

---

## 📁 Répertoire des Fichiers Clés du Projet

```text
restivo-V1-main/
├── app/
│   ├── api/
│   │   ├── generate-3d/
│   │   │   ├── route.ts            # Orchestrateur API 3D
│   │   │   ├── trellis.ts          # Intégration TRELLIS REST Queue
│   │   │   ├── fallback.ts         # Secours intelligent contextuel
│   │   │   └── image-parser.ts     # Normalisation d'image en Blob
│   │   └── upload-image/
│   │       └── route.ts            # Sauvegarde permanente des photos 2D
│   └── mainpage/restaurants/menu/
│       ├── _components/
│       │   ├── ARModal.tsx          # Viewer 3D / AR avec <model-viewer>
│       │   ├── AddMenuItemPanel.tsx # Formulaire ajout/édition avec upload persistant & IA 3D
│       │   └── MenuTable.tsx        # Tableau des plats avec badge 3D/AR
│       └── page.tsx                 # Page principale du menu
├── public/
│   ├── models/                     # Modèles .glb persistants (item-3d-*.glb + fallbacks)
│   └── uploads/dishes/             # Photos des plats uploadées en local
├── lib/
│   └── menu/
│       ├── service.ts              # Logique métier Prisma MenuItem & MenuCategory
│       └── validation.ts           # Schémas Zod
└── ROADMAP_3D_AR.md                # 📍 CE FICHIER (Document de référence & état d'avancement)
```

---

## 💡 Notes Importantes pour les Futures Sessions / Nouveaux Agents
* **Serveur de développement :** Toujours lancer avec `npm run dev` pour garantir la prise en compte instantanée des nouveaux modèles et images dans `public/`.
* **Génération 3D :** Utilise `trellis-community/TRELLIS`. Si le quota ZeroGPU de Hugging Face est atteint (120s journalières gratuites), le système bascule automatiquement sur le fallback sans planter.
* **Token Hugging Face :** Configurable dans le fichier `.env` via `HUGGINGFACE_TOKEN`.
