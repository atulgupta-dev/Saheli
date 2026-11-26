# Deploying Saheli AI Backend to Render Free (No-Card Hackathon Setup)

This guide documents deploying the Saheli AI backend to Render's Free tier alongside Firebase Authentication and Firestore on the **Firebase Spark (Free)** plan and Next.js frontend on **Vercel Hobby**.

---

## 1. Prerequisites (100% Free / No Card Required)

1. **GitHub Account**: Access to repository `https://github.com/atulgupta-dev/Saheli`.
2. **Render Account**: Sign up at [render.com](https://render.com) (free, no credit card required).
3. **Firebase Console**: Project `saheli-2576f` on the **Spark Plan**.
4. **Google AI Studio**: Free-tier Gemini API key from [aistudio.google.com](https://aistudio.google.com).

---

## 2. Obtain Firebase Service Account (Base64)

To authenticate Firebase Admin SDK on Render without committed credential files:

1. Open [Firebase Console](https://console.firebase.google.com/) -> Select project `saheli-2576f`.
2. Click **Project settings** (gear icon) -> **Service accounts**.
3. Click **Generate new private key** and download the `.json` file.
4. Convert the `.json` file to a single base64 string:
   - **macOS / Linux**:
     ```bash
     base64 -w 0 <path_to_service_account>.json
     ```
   - **Windows PowerShell**:
     ```powershell
     [Convert]::ToBase64String([IO.File]::ReadAllBytes("<path_to_service_account>.json"))
     ```
5. Copy the base64 output. This string will be stored as `FIREBASE_SERVICE_ACCOUNT_B64` in Render.

---

## 3. Render Dashboard Setup

1. Log into [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Choose **Build and deploy from a Git repository** -> Connect `atulgupta-dev/Saheli`.
4. Configure service parameters:
   - **Name**: `saheli-backend`
   - **Region**: Singapore (`singapore`) or closest free region (e.g. Frankfurt / Ohio)
   - **Branch**: `feature/backend-cloud` (or `develop` after integration)
   - **Root Directory**: `backend`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
5. Expand **Advanced** -> Add **Health Check Path**: `/health`.

---

## 4. Environment Variables on Render

Under the **Environment Variables** section in the Render Web Service configuration, add:

| Key | Value | Purpose |
|---|---|---|
| `ENV` | `production` | Enforces production security (disallows mock tokens) |
| `FIREBASE_PROJECT_ID` | `saheli-2576f` | Target Firebase project |
| `GOOGLE_CLOUD_PROJECT` | `saheli-2576f` | Firestore project scoping |
| `FIREBASE_SERVICE_ACCOUNT_B64` | `<your_base64_string>` | In-memory Firebase Admin auth |
| `GEMINI_API_KEY` | `<your_free_tier_gemini_key>` | Free-tier Gemini AI access |
| `ENABLE_DEMO_MOCKS` | `false` | Disables mock authentication in prod |
| `CORS_ORIGINS` | `http://localhost:3000,https://saheli.vercel.app` | Allowed origins |
| `CORS_ORIGIN_REGEX` | `https://.*\.vercel\.app` | Dynamic preview Vercel domains |

*Note: Render automatically injects `PORT` (usually 10000). The startup command `uvicorn app.main:app --host 0.0.0.0 --port $PORT` binds dynamically to Render's port.*

---

## 5. Verification Steps

Once Render finishes deploying:

1. **Public Health Endpoint**:
   Visit `https://<your-render-subdomain>.onrender.com/health`
   Expected response:
   ```json
   {"status":"ok","service":"saheli-api","version":"0.1.0"}
   ```
2. **Interactive API Documentation (Swagger)**:
   Visit `https://<your-render-subdomain>.onrender.com/docs`
   Inspect all 8 documented V1 endpoints.
3. **Verify CORS**:
   Browser requests from `localhost:3000` or `https://*.vercel.app` will receive valid `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials: true` headers.

---

## 6. Frontend Integration (Member 4)

In Member 4's Next.js repository on Vercel:
1. Set the environment variable:
   ```env
   NEXT_PUBLIC_API_URL=https://<your-render-subdomain>.onrender.com
   ```
2. All protected API requests pass the Firebase ID token in the header:
   ```typescript
   headers: {
     "Authorization": `Bearer ${firebaseIdToken}`
   }
   ```
3. For local demo testing without live Firebase tokens, Member 4 can run the backend locally with `ENABLE_DEMO_MOCKS=true` and pass `Bearer mock_user_123`.

---

## 7. Spark Plan Limitations & Guarantees

- **Cloud Storage**: Original PDF/JPEG/PNG files are processed ephemerally in-memory (or in temporary files that are deleted immediately after analysis).
- **Report Retention**: If the user consents (`consent_to_store=true`), extracted structured metrics and citations are saved to Firestore. If `consent_to_store=false`, neither the file nor its extracted content is persisted.
- **Spin-down**: Render Free web services spin down after 15 minutes of inactivity and take ~30-50s to cold-start on the first incoming request.
