# ClinicFlow - Setup Guide

This document provides step-by-step instructions on how to clone, install, and run the ClinicFlow platform on your local development environment. 

## Prerequisites

Before you begin, ensure you have the following installed on your system:
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **MongoDB** (running locally on port 27017, or a MongoDB Atlas connection string)
- **Git**

---

## 1. Clone the Repository

Clone the project repository to your local machine and navigate into the project directory:

```bash
git clone <your-repo-url>/medi-saas.git
cd medi-saas
```

*Note: Replace `<your-repo-url>` with the actual repository URL.*

---

## 2. Backend Setup (Cloud Sync API)

The backend is an Express Node.js application backed by MongoDB. It handles the cloud synchronization for offline-first local nodes.

### Step 2.1: Install Dependencies
Navigate to the `backend` directory and install the necessary npm packages:

```bash
cd backend
npm install
```

### Step 2.2: Environment Variables
Create a `.env` file in the `backend` directory (if it doesn't already exist) and configure your environment variables. 

Here is the default `.env` configuration for local development:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/clinicflow
JWT_SECRET=super_secret_jwt_key_for_local_dev
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

### Step 2.3: Start the Backend Server
Start the backend server in development mode using `nodemon`:

```bash
npm run dev
```
The backend API should now be running on `http://localhost:5000`.

---

## 3. Frontend Setup (Local Edge Node)

The frontend is a desktop application built with **React (Vite)** and **Electron**. It uses **SQLite** (`better-sqlite3`) for local-first data storage.

### Step 3.1: Install Dependencies
Open a new terminal window, navigate to the `frontend` directory, and install the dependencies:

```bash
cd frontend
npm install
```
*Note: A post-install script (`npx @electron/rebuild -f -w better-sqlite3`) will automatically run to compile the SQLite native modules for your specific Electron architecture.*

### Step 3.2: Run the Electron App
To start the application in development mode, run:

```bash
npm run electron:dev
```
This command does two things concurrently:
1. Starts the Vite React development server on `http://localhost:5173`.
2. Launches the Electron desktop window wrapper once the React server is ready.

---

## 4. Building for Production

If you want to package the Electron application for distribution (e.g., creating a Windows installer):

```bash
cd frontend
npm run electron:build
```
This will bundle the React application and build the Electron executable into the `frontend/dist` or `frontend/build` folder according to the `electron-builder` configuration in `package.json`.

---

## Troubleshooting

- **SQLite Rebuild Errors:** If you encounter errors relating to `better-sqlite3` when running the frontend, it usually means the native node modules didn't compile correctly for Electron. Ensure you have the necessary C++ build tools installed on your OS (e.g., Visual Studio Build Tools for Windows, or Xcode Command Line Tools for macOS) and run `npm run postinstall` inside the `frontend` folder manually.
- **MongoDB Connection:** If the backend crashes on startup, ensure your local MongoDB service is actively running and accessible at `mongodb://localhost:27017`.
