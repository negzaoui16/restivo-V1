# 🍽️ Restivo — Smart Restaurant Management & Immersive 3D/WebAR Dining Experience

<div align="center">

![Next.js 16](https://img.shields.io/badge/Next.js-16.3.6-black?style=for-the-badge&logo=next.js)
![React 19](https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![Prisma 8](https://img.shields.io/badge/Prisma-8.0-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql)
![WebAR Ready](https://img.shields.io/badge/WebAR-3D_Anchored-orange?style=for-the-badge&logo=webxr)
![PWA](https://img.shields.io/badge/PWA-Serwist-5A0FC8?style=for-the-badge)

<p align="center">
  <b>A comprehensive, modern hospitality platform uniting restaurant operations, interactive floor planning, predictive analytics, and browser-native 3D & Augmented Reality (WebAR) food menus with true 1:1 real-world dish scaling.</b>
</p>

</div>

---

## 🌟 Overview

**Restivo** transforms the dining and restaurant management experience for both restaurateurs and customers. 

Instead of traditional static paper or PDF menus, Restivo empowers diners to explore dishes in **interactive 3D** and project them directly onto their table in **Augmented Reality (WebAR)** right from their smartphone browser—no app download required. 

Behind the scenes, restaurant owners get a full suite of management tools: an AI-assisted 2D-to-3D food generator, visual floor plan builder, staff role management, live order workflows, table reservations, and predictive business analytics driven by machine learning algorithms.

---

## 🚀 Key Features

### 🍔 1. Immersive 3D & WebAR Food Experience
* **Browser-Native WebAR**: Instant augmented reality experience inside standard mobile browsers (Chrome, Safari) without requiring native app installs.
* **Trellis & Tripo AI 2D-to-3D Pipeline**: Seamlessly convert high-resolution dish photographs into lightweight, web-optimized `.glb` 3D models with automated normal maps and realistic lighting.
* **True 3D Spatial Table Anchoring (`Fixé sur table`)**:
  * Utilizes W3C `DeviceOrientation` 3D rotation matrices to anchor food directly onto the user's table or placemat.
  * Eliminates drift during horizontal and vertical inspection, locking the dish at its precise coordinates.
* **Natural Viewport Physics & Dynamic Exit**:
  * **Pitch Up Exit**: Tilting the phone upward to look at the room or screen smoothly moves the dish out of the lower camera view.
  * **Yaw Exit**: Turning the phone away (`> 24°`) gracefully guides the model off-screen; pointing the camera back at the table snaps it instantly back into place.
* **Multi-Angle Inspection**:
  * **Top-Down View (`Vue Dessus`)**: Tilting above the dish automatically drops the camera polar angle down to `14°` to show the inner ingredients.
  * **Side/Orbit View (`Vue Côté`)**: Tilting left or right rotates azimuthally (`theta`) around the food with active roll compensation.
* **1:1 Official Real-World Scale (`cm`)**:
  * Standardized real-world dimensions for dishes (e.g., *Burger: 12 cm*, *Pizza: 30 cm*, *M9loub: 22 cm*, *Drinks: 8 cm*).
  * Calibrated optical distance scaling ensuring accurate, true-to-life portion sizes on table placemats.

---

### 👨‍🍳 2. Restaurant Operations (Owner & Manager Suite)
* **Dynamic Menu Management**:
  * Categorized menu builder (Appetizers, Mains, Pizzas, Desserts, Beverages).
  * Real-time availability toggles, modifier groups, and allergen warnings.
  * Dietary and cultural badges: *Halal*, *Vegan*, *Vegetarian*, *Gluten-Free*, *Spicy*.
* **Interactive 2D Floor Plan Designer**:
  * Visual floor plan creation with draggable objects: tables, chairs, booths, bar counters, walls, and VIP areas.
  * Real-time table capacity tracking, seating arrangements, and live occupancy status.
* **Staff & Role-Based Access Control (RBAC)**:
  * Strict permission boundaries for `OWNER`, `MANAGER`, and `STAFF`.
  * Secure invitation workflows and staff activity management.

---

### 📦 3. Live Order Tracking & Kitchen Workflow
* **Order Lifecycle Management**: End-to-end status tracking from `Pending` ➔ `Preparing` ➔ `Ready` ➔ `Delivered` ➔ `Completed`.
* **Table QR Code Integration**: Customers scan their table's QR code to view the live 3D menu and order directly to their table.
* **Kitchen Display System (KDS)**: Real-time ticket management for kitchen teams with time elapsed alerts.

---

### 📅 4. Reservations & Customer Engagement
* **Smart Table Booking**: Real-time reservation engine with party size validation, date/time slot selection, and guest notes.
* **Customer Profile & Favorites**: Diners can save favorite dishes, view dietary histories, and track past orders.

---

### 📊 5. Predictive Business Intelligence & Analytics
* **Machine Learning Analytics Engine**: Powered by `ml-regression` and `simple-statistics`.
* **Revenue Forecasting**: Historical trend analysis and revenue projections.
* **Performance Metrics**: Peak dining hour heatmaps, table turnover velocity, and dish popularity rankings to minimize food waste and optimize stock.

---

### 📱 6. Progressive Web App (PWA) & Offline Support
* Built with **Serwist** service workers for robust caching and offline support.
* Fast installable mobile web app with app-like gestures, pull-to-refresh, and touch responsiveness.

---

## 🏗️ Architecture

```mermaid
flowchart TD
    subgraph Owner["👨‍🍳 Restaurateur / Owner Portal"]
        MenuEditor["Menu & Category Builder"]
        FloorPlan["Interactive Floor Plan Designer"]
        AI_Gen["AI 2D ➔ 3D Converter (Trellis / Tripo)"]
        AnalyticsDashboard["ML Analytics & Performance Insights"]
    end

    subgraph Backend["⚙️ Backend & APIs (Next.js 16 App Router)"]
        APIMenu["/api/restaurants/[id]/menu"]
        APIFloor["/api/restaurants/[id]/floors"]
        APIOrders["/api/orders"]
        API3D["/api/generate-3d"]
        AuthService["JWT Authentication (Jose / Bcrypt)"]
    end

    subgraph Data["🗄️ Persistence & Storage"]
        DB[(PostgreSQL Database)]
        PrismaORM["Prisma 8 ORM"]
        ModelStorage["3D Asset Storage (public/models/*.glb)"]
    end

    subgraph Client["📱 Customer Mobile Experience"]
        PublicMenu["Responsive 3D Menu Preview"]
        ARView["WebAR Camera & Gyro Engine (ARModal.tsx)"]
        Cart["Table Ordering & Reservation Flow"]
    end

    Owner -->|Manage Menus & Photos| MenuEditor
    MenuEditor -->|Dish Photo| AI_Gen
    AI_Gen -->|Generate .glb| API3D
    API3D -->|Save Assets| ModelStorage
    MenuEditor -->|Save Menu Structure| APIMenu
    FloorPlan -->|Save Tables & Layout| APIFloor

    APIMenu --> PrismaORM
    APIFloor --> PrismaORM
    APIOrders --> PrismaORM
    PrismaORM --> DB

    DB -->|Read Menu & Items| PublicMenu
    PublicMenu -->|Open AR| ARView
    ARView -->|Stream Model| ModelStorage
    PublicMenu -->|Submit Order| Cart
    Cart -->|Create Order| APIOrders
```

---

## 💻 Tech Stack

| Domain | Technology / Library | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) | React Server Components, Route Handlers, Turbopack / Webpack |
| **Frontend** | [React 19](https://react.dev), [Tailwind CSS 4](https://tailwindcss.com) | Modern reactive UI with zero-runtime utility styling |
| **Language** | [TypeScript 5](https://www.typescriptlang.org) | Strict type safety across client, server, and database contracts |
| **Icons & UI** | [Lucide React](https://lucide.dev) | Modern, lightweight SVG iconography |
| **3D & WebAR** | [`<model-viewer>`](https://modelviewer.dev), WebXR / DeviceOrientation | Real-time GLB rendering, 6-DoF table anchoring, camera integration |
| **AI 3D Pipeline** | Trellis AI / Tripo API | Image-to-3D neural reconstruction producing textured `.glb` models |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org), [Prisma 8](https://www.prisma.io) | Relational database with schema contracts and type-safe queries |
| **Auth & Security** | [Jose](https://github.com/panva/jose), [Bcrypt.js](https://github.com/dcodeIO/bcrypt.js) | Stateless JWT tokens, password hashing, role-based protection |
| **Analytics & ML** | `ml-regression`, `simple-statistics`, `temporal-polyfill` | Trend forecasting, regression modeling, and performance metrics |
| **PWA & Offline** | [Serwist](https://serwist.pages.dev) | Next.js service worker with advanced runtime caching strategies |
| **Dev & Tunneling** | Cloudflare Tunnel (`cloudflared`) | Secure public HTTPS tunneling for mobile sensor testing (Camera/Gyro) |

---

## 📁 Project Structure

```text
restivo-V1-main/
├── app/
│   ├── api/                              # Next.js API Route Handlers
│   │   ├── auth/                         # Authentication & session routes
│   │   ├── generate-3d/                  # 2D to 3D Trellis/Tripo AI endpoint
│   │   ├── orders/                       # Order placement & lifecycle endpoints
│   │   └── restaurants/                  # Restaurant CRUD, menus, items, categories
│   ├── auth/                             # Login, register, forgot-password pages
│   ├── homepage/                         # Public marketing landing page
│   ├── mainpage/                         # Authenticated application core
│   │   ├── explore/                      # Restaurant discovery & search
│   │   ├── favorites/                    # Saved dishes and favorite spots
│   │   ├── orders/                       # Order history and live tracking
│   │   ├── profile/                      # User account settings
│   │   ├── reservations/                 # Table booking manager
│   │   ├── restaurants/
│   │   │   ├── analytics/                # Business intelligence dashboards
│   │   │   ├── floors/                   # Interactive 2D floor plan editor
│   │   │   ├── menu/                     # Menu builder & item drawers
│   │   │   │   └── _components/          # ARModal.tsx, MenuPreview.tsx, AddMenuItemPanel.tsx
│   │   │   └── settings/                 # General restaurant configurations
│   │   └── staff/                        # Staff members and role invitations
│   └── _components/                      # Shared global components (PullToRefresh, Navbar)
├── docs/                                 # Technical architecture, guides, and LaTeX reports
├── lib/
│   ├── analytics/                        # ML regression & forecasting logic
│   ├── auth/                             # JWT tokens, password hashing, cookies
│   ├── floors/                           # Floor plan data models & transforms
│   ├── menu/                             # Menu service, validation, and official sizes
│   └── restaurants/                      # Restaurant business logic
├── prisma/
│   ├── contract.prisma                   # PostgreSQL database schema & relations
│   └── contract.d.ts                     # TypeScript contract declarations
├── public/
│   ├── models/                           # Stored .glb 3D models of dishes
│   ├── uploads/                          # Uploaded dish photography
│   └── sw.js                             # PWA service worker bundle
├── types/                                # Custom TypeScript type definitions
└── README.md                             # Project documentation
```

---

## 🛠️ Getting Started

### Prerequisites
* **Node.js**: `v20.x` or higher
* **npm**: `v10.x` or higher
* **PostgreSQL**: Running instance (local or hosted, e.g. Neon, Supabase)
* *(Optional for mobile testing)*: [Cloudflare CLI (`cloudflared`)](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)

### 1. Clone the Repository
```bash
git clone https://github.com/Negzaoui/restivo-V1-main.git
cd restivo-V1-main
git checkout Negzaoui
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/restivo_db?schema=public"

# Authentication
JWT_SECRET="your-ultra-secure-jwt-secret-key"

# AI 3D Generation Pipeline
TRIPO_API_KEY="your-tripo-api-key"
HUGGINGFACE_TOKEN="your-huggingface-token"
HUGGINGFACE_TOKENS="token_1,token_2,token_3"
```

### 4. Setup Database
```bash
npx prisma db push
# or run migrations if applicable
```

### 5. Launch the Development Server
```bash
npm run dev
```

The application will be live at `http://localhost:3000`.

---

## 📱 Testing 3D & WebAR on Mobile Devices

Because WebAR requires access to the **device camera** and **device orientation sensors (gyroscope/accelerometer)**, modern browsers require a secure **HTTPS** context.

### Option A: Cloudflare Tunnel (Recommended)
You can expose your local Next.js server over a secure, publicly accessible HTTPS tunnel:

```bash
npm run tunnel
# or
cloudflared tunnel --url http://localhost:3000
```
Open the generated `https://xxxx.trycloudflare.com` URL on your smartphone browser.

### Option B: Local HTTPS Server
```bash
npm run dev:https
```

---

## 🎯 How WebAR Table Anchoring Works

```text
                     [ Smartphone Camera View ]
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
    [ Normal Table View ]             [ Phone Raised / Tilted Up ]
    - Gyro Beta ~ 45°-55°             - Gyro Beta > Anchor + 7°
    - Pitch/Roll stabilized           - Model descends off-screen
    - 3D Dish locked on table         - Restores position when lowered
```

1. **Table Pinning (`Fixer sur table`)**: Tap the button to lock the spatial anchor (`pos0.x, pos0.y, beta0, gamma0`).
2. **True 3D Orbiting**: Walk around or tilt your device: the dish remains stationary while `<model-viewer>` dynamically adjusts polar (`phi`) and azimuthal (`theta`) angles.
3. **Smart Exits**: 
   * Tilting the phone up to look away naturally slides the dish downward out of the camera view.
   * Turning horizontally (`> 24°`) slides the model off-screen until you face the table again.
4. **Official 1:1 Scale**: Real portion sizing in centimeters ensures what customers see on screen matches what lands on their plate.

---

## 📜 Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `next dev --webpack` | Starts the Next.js development server on port 3000 |
| `npm run dev:https` | `next dev --webpack --experimental-https ...` | Starts local development server over native HTTPS |
| `npm run tunnel` | `cloudflared tunnel --url http://localhost:3000` | Opens a public Cloudflare HTTPS tunnel for mobile AR testing |
| `npm run build` | `next build --webpack` | Compiles the production build |
| `npm run start` | `next start` | Runs the compiled production server |
| `npm run lint` | `eslint` | Runs ESLint static code checks |

---

## 👥 Branch Information

This branch (`Negzaoui`) includes the latest production enhancements for:
* **WebAR 3D Table Anchoring Engine** with pitch-up exit physics and yaw lock.
* **1:1 Official Real-World Dish Sizing (`cm`)** with automated category presets.
* **GPU-Optimized Mobile Menu Rendering** eliminating scroll flickering and touch conflicts.
* **Advanced Machine Learning Analytics** for restaurant performance forecasting.

---

<div align="center">
  <sub>Developed with ❤️ for next-generation restaurant dining experiences.</sub>
</div>
