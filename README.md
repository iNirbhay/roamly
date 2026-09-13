# Roamly — Mindful Sanctuaries & Travel Platform Across India

> **Discover. Stay. Explore.**  
> Roamly is a full-stack, premium travel and hospitality discovery platform showcasing curated architectural retreats, royal havelis, lakehouses, and mountain cabins across India.

---

## ✨ Key Features

### 1. Interactive Explore India Geographic Guide
- **Leaflet & MarkerCluster Integration**: Centered, high-performance geographic exploration featuring CartoDB Voyager tiles.
- **Custom Roamly Markers & Clusters**: Teardrop pins with pulse rings and cluster badges communicating real stay counts (`● 12 stays`).
- **"✨ Surprise Me" Discovery**: Instant camera flight to a randomly selected real sanctuary with auto-opening editorial popup.
- **Live Search Console**: Fast autocomplete querying cities, states, and real database stay counts.
- **Category Filter Chips**: Instant client-side filtering for Havelis, Resorts, Homestays, and Luxury Villas.
- **Side Discovery Panel**: Popular Cities and Available Stays tabs with fly-to navigation.
- **Curated Destination Grid**: 2-row initial layout with smooth "Show More Destinations" toggle.

### 2. Role-Based Architecture & Authentication
- **Traveler / User Role**:
  - Browse listings, explore interactive maps, book sanctuaries with dates & add-ons.
  - Strict user-specific isolation: traveler bookings are anchored to authenticated `travelerId` / `req.user._id`.
  - Filter between Upcoming vs Previous bookings with printable confirmation vouchers.
- **Host / Admin Role**:
  - Dedicated **Host Dashboard** with revenue metrics, reservation statuses, and occupancy insights.
  - **My Properties** management and guest reservation tracking.
  - Admin automatically established as host for all flagship listings.
- **Secure Authentication**:
  - Passport.js Local Strategy with persistent sessions (7-day cookie).
  - Google OAuth 2.0 & optional Auth0 integration.
  - Interactive 2-step role selection on registration (`/signup`).

### 3. Demo Payment Gateway & Booking Checkout Flow
- **Multi-Step Checkout**:
  - Listing details → Dates & guest selection → Transparent fee breakdown (base price + service fee + GST).
  - Realistic Demo Payment Sandbox modal supporting Demo Card, Demo UPI (QR & ID), and NetBanking.
  - Processing animation simulating banking settlement without processing real money.
  - Instant booking voucher generation with unique formatted identifiers (e.g., `ROAM-783921`).

### 4. Distinctive Roamly Brand Identity
- **Color Palette**:
  - **Deep Navy** (`#071422` / `#0B1B2B`): Grounded editorial typography, map controls, dark footer.
  - **Roamly Forest Green** (`#1E5338`): Action buttons, interactive markers, active travel chips.
  - **Warm Gold** (`#D99B26`): Sun accents, ratings, highlights.
  - **Soft Sand** (`#FBF8F2` / `#F5EFE6`): Backgrounds and surface cards.
- **Custom Brand Assets**:
  - Multi-resolution transparent favicon emblems for browser tabs (`favicon.ico`, `favicon.png`, `apple-touch-icon.png`).
  - Seamless transparent Roamly logo across header and footer.
- **Premium Footer**:
  - Dark Deep Navy contrast section with decorative SVG travel route line and connected travel nodes.
  - Role-aware navigation columns and newsletter discovery console.

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose ODM
- **Authentication**: Passport.js (Local, Google OAuth 2.0, Auth0), Connect-Flash, Express-Session
- **Templating**: EJS, EJS-Mate
- **Mapping & Geocoding**: Leaflet.js, Leaflet.markercluster, CartoDB Voyager Tiles
- **Styling**: Vanilla CSS3, Bootstrap 5.3, FontAwesome 6, Google Fonts (Plus Jakarta Sans)
- **Image Hosting**: Cloudinary (optional via multer-storage-cloudinary)

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) running locally on `mongodb://127.0.0.1:27017/wanderlust`

### 2. Installation
```bash
# Clone the repository
git clone <repository-url>
cd "Mega Project"

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory (already configured in `.gitignore`):
```env
CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

MAP_TOKEN=your_mapbox_token

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8080/auth/google/callback
```

### 4. Database Initialization
Seed the database with curated Indian sanctuaries and initialize Admin ownership:
```bash
node init/index.js
```

### 5. Run the Server
```bash
npm start
# Server will start on http://localhost:8080
```

---

## 📂 Project Structure

```
├── app.js                   # Application entry point & middleware configuration
├── config/
│   └── passport.js          # Passport strategy configuration (Local, Google, Auth0)
├── controllers/
│   ├── bookings.js          # Checkout & user booking controller
│   ├── host.js              # Host dashboard & property management
│   ├── listings.js          # Sanctuaries CRUD & category filters
│   └── users.js             # User authentication & OAuth handlers
├── models/
│   ├── booking.js           # Strict role-anchored Booking schema
│   ├── listing.js           # Sanctuary listing schema
│   ├── review.js            # Customer review schema
│   └── users.js             # User model with role permissions
├── routes/
│   ├── api.js               # REST API endpoints
│   ├── bookings.js          # Booking & checkout routes
│   ├── host.js              # Host dashboard routes
│   ├── listings.js          # Listing routes
│   └── users.js             # Authentication routes
├── views/
│   ├── bookings/            # Checkout & My Bookings views
│   ├── host/                # Host dashboard & management views
│   ├── includes/            # Navbar, footer, flash alerts
│   ├── layouts/             # Boilerplate wrapper
│   ├── listings/            # Explore India, show, edit, and index views
│   └── users/               # Login & role-selection signup views
└── public/
    ├── images/              # Logos, transparent favicons, haveli assets
    ├── js/                  # Explore India map controller, checkout scripts
    └── stylesheets/         # Global styles, Explore India & checkout styles
```

---

## 🛡️ License
Roamly Private Limited. All rights reserved. Mindful travel across India.
