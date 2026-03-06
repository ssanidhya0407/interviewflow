# Deployment Guide

This guide explains how to deploy the Career Forge AI application using Docker Compose. This is the simplest way to run both the Frontend (Next.js) and Backend (FastAPI) together.

## Prerequisites

1.  **Docker** and **Docker Compose** installed on your machine or VPS.
2.  **API Keys**: You need a Google Gemini API Key.

## Quick Start (Local)

1.  **Create an `.env` file** in the root directory (same level as `docker-compose.yml`):
    ```bash
    GOOGLE_GENAI_API_KEY=your_actual_api_key_here
    NEXT_PUBLIC_API_URL=http://localhost:8000
    ```

2.  **Build and Run**:
    ```bash
    docker-compose up --build
    ```

3.  Access the app at `http://localhost:3000`.

## Deploying to a VPS (DigitalOcean, AWS, Linode)

1.  **Clone the Repository** on your server:
    ```bash
    git clone https://github.com/ssanidhya0407/career-forge-ai.git
    cd career-forge-ai
    ```

2.  **Update Environment Variables**:
    Create the `.env` file with your **Server's IP or Domain**:
    ```bash
    GOOGLE_GENAI_API_KEY=your_actual_api_key_here
    # IMPORTANT: Change localhost to your server's IP or Domain
    NEXT_PUBLIC_API_URL=http://your-server-ip:8000
    ```

3.  **Run in Background**:
    ```bash
    docker-compose up -d --build
    ```

4.  The application will be running at `http://your-server-ip:3000`.

## Architecture Note

-   **Frontend**: Runs on Port 3000. It is a client-side React app, so it needs to know where the Backend is reachable from the *User's Browser* (hence `NEXT_PUBLIC_API_URL`).
-   **Backend**: Runs on Port 8000. It stores data in a local SQLite file (`interviewflow.db`).

## 🌍 How to Share with the World (Public Access)

To make your app accessible to anyone on the internet (e.g., `www.interviewflow.com`), you need a server. Here are the two best options:

### Option 1: VPS (DigitalOcean / AWS / Linode) - **recommended**
This is the most robust method for this app because it uses **SQLite**. A VPS gives you a persistent file system so your database isn't deleted when the server restarts.

1.  **Buy a Server**: Get a basic Ubuntu Droplet ($6/mo).
2.  **Setup**: SSH into the server and install Docker.
3.  **Deploy**: Follow the "Deploying to a VPS" steps above.
4.  **Domain**: Buy a domain (e.g., on Namecheap) and point its `A Record` to your Server's IP.

### Option 2: Railway + Vercel (The "Modern Stack" Way)

This is a popular combination: **Railway** for the Backend (Python/Docker) and **Vercel** for the Frontend (Next.js).

#### Part A: Deploy Backend to Railway
1.  Sign up at [Railway.app](https://railway.app).
2.  Click **New Project** -> **GitHub Repo** -> Select `career-forge-ai`.
3.  **Config**: 
    *   **Root Directory**: Go to **Settings** -> **General** -> **Root Directory** and set it to `/backend`. **(Critical Step)**
    *   Railway should then detect the `Dockerfile`. If it defaults to "Nixpacks", change Build Provider to "Docker".
4.  **Variables**: Go to the **Variables** tab and add:
    *   `GOOGLE_GENAI_API_KEY`: Your Gemini API Key.
    *   `FIREBASE_CREDENTIALS_JSON`: Open your local `serviceAccountKey.json`, copy the **entire content**, and paste it here as the value.
    *   `PORT`: `8000`.
5.  **Domain**: Go to **Settings** -> **Domains** -> **Generate Domain**. (e.g., `career-forge-backend.up.railway.app`). Copy this URL.

#### Part B: Deploy Frontend to Vercel
1.  Sign up at [Vercel.com](https://vercel.com).
2.  Click **Add New** -> **Project** -> Select `career-forge-ai`.
3.  **Config**: 
    *   Framework Preset: **Next.js**.
    *   Root Directory: Click Edit and select `frontend`.
4.  **Environment Variables**: expand the section and add:
    *   `NEXT_PUBLIC_API_URL`: The Domain URL you got from Railway (e.g., `https://career-forge-backend.up.railway.app`). **Important**: Make sure it starts with `https://` and has no trailing slash.
5.  Click **Deploy**.

---

## 📋 Environment Variables Checklist

Copy and paste these keys when setting up your cloud projects.

**Backend (Railway)**
```
GOOGLE_GENAI_API_KEY=
FIREBASE_CREDENTIALS_JSON=
```

**Frontend (Vercel)**
```
NEXT_PUBLIC_API_URL=
```

