# Fair App 🛺

Fair is an ordinance-compliant tricycle-hailing and fare-calculation platform that helps commuters in Angeles City calculate accurate tricycle fares using GPS tracking. The app ensures compliance with Angeles City LGU Ordinance No. 723 and provides tools for verifying LGU discounts and reporting driver disputes. This dual-system platform consists of:

1. **Fair Commuter App**: A mobile application for commuters to calculate accurate fares using GPS tracking, apply for LGU discounts, and report driver disputes.
2. **Fair Admin Dashboard**: A web-based backend dashboard managed exclusively by the Angeles City Local Government Unit (LGU) and the Public Transport Regulatory Office (PTRO) to oversee operations, manage drivers, and handle disputes.

---

## 🌟 Tech Stack

### Frontend (Commuter App)
- **Framework:** React Native
- **Toolchain:** Expo
- **Language:** TypeScript

### Backend (Admin Dashboard & API)
- **Framework:** Django & Django REST Framework (Python)
- **Database:** PostgreSQL
- **Authentication:** Token-based authentication

---

## 🛠 Prerequisites

Before setting up the project locally, ensure you have the following installed:
- **Node.js** (v18 or higher recommended)
- **Python** (v3.10 or higher)
- **PostgreSQL** (running locally)
- **Expo Go** (installed on your physical mobile device for testing)
- **Git**

---

## Setup Instructions

### 1. Database Setup

Ensure PostgreSQL is running on your machine and create a database for the project. For example, using `psql` or pgAdmin:
```sql
CREATE DATABASE fair_db;
```

### 2. Backend Setup (Fair Admin)

Navigate to the `fair-admin` directory and set up the Python environment:

```bash
# Clone the admin repository (if not already cloned)
# Navigate to the backend directory
cd fair-admin

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Environment Variables:**
Create a `.env` file in the `fair-admin` root directory with the following configuration (adjust database credentials to match your local setup):
```env
SECRET_KEY=your_secure_django_secret_key
DEBUG=True
DB_NAME=fair_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
```

**Migrations & Superuser:**
```bash
# Run database migrations to set up the schema
python manage.py migrate

# Create the PTRO superuser account
python manage.py createsuperuser
# (Follow the prompts to set the username, email, and password)

# Start the Django development server
python manage.py runserver
```

### 3. Frontend Setup (Fair Commuter App)

Open a new terminal, navigate to the `fair` directory, and set up the mobile app:

```bash
# Navigate to the frontend directory
cd fair

# Install NPM dependencies
npm install
```

**Environment Variables:**
Create a `.env` file in the `fair` root directory. 

> **⚠️ WARNING: PHYSICAL DEVICE TESTING**
> When testing on a physical device using Expo Go, you MUST update the API base URL to your computer's local IPv4 address (e.g., `http://192.168.1.x:8000`), NOT `localhost`. Using `localhost` will point to the mobile device itself and cause network failures.

```env
# Example for local development on a physical device:
EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LOCAL_IPV4_ADDRESS>:8000/api
```

**Start the App:**
```bash
# Start the Expo development server
npx expo start
```
Once the server starts, scan the provided QR code with the Expo Go app on your physical device to launch the commuter app.
