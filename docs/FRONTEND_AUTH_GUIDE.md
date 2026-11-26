# Frontend Authentication & Google Sign-In Guide (Member 4 Integration)

This guide documents how Member 4 can integrate Firebase Authentication (Google Sign-In + Email/Password) in the Next.js frontend to communicate seamlessly with the FastAPI backend on Render Free.

---

## 1. Firebase Client Configuration

Create `frontend/src/lib/firebase.ts` (or equivalent):

```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "saheli-2576f.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "saheli-2576f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "saheli-2576f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
```

---

## 2. Google Sign-In Implementation with Mobile Fallback

On mobile browsers (PWA context), popups are frequently blocked by default. Use `signInWithPopup` with automatic fallback to `signInWithRedirect`:

```typescript
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
      // Mobile-friendly redirect fallback
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
}

export async function handleRedirectCallback(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (error) {
    console.error("Firebase redirect login error:", error);
    throw error;
  }
}

export async function logout(): Promise<void> {
  await signOut(auth);
}
```

---

## 3. Calling Protected Backend APIs

When calling the FastAPI backend, always retrieve the **Firebase ID Token**:

```typescript
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User is not signed in");
  }

  // Force token refresh if expired (handled automatically by Firebase SDK)
  const idToken = await currentUser.getIdToken();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${idToken}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}
```

> [!WARNING]
> **CRITICAL**: Always pass `await user.getIdToken()`. Never pass `credential.accessToken` (raw Google OAuth access tokens are rejected by the backend with a `401 AUTHENTICATION_ERROR`).

---

## 4. Local Development Without Live Firebase Tokens

During local frontend development, if you run the backend locally with `ENABLE_DEMO_MOCKS=true`, you can mock login by setting:
```typescript
headers: {
  "Authorization": "Bearer mock_google_user_demo"
}
```
This returns a full user profile (`auth_provider: "google.com"`, `display_name: "Saheli Google User"`) without opening Google login.

---

## 5. Firebase Console Configuration (Manual Step)

Before deploying to Vercel:
1. Open [Firebase Console](https://console.firebase.google.com/) -> Select `saheli-2576f`.
2. Go to **Authentication** -> **Settings** -> **Authorized domains**.
3. Add:
   - `localhost`
   - Your production domain (e.g. `saheli.vercel.app`)
   - Any custom production domains
