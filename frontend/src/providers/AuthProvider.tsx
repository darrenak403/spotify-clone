import {axiosInstance} from "@/lib/axios";
import {auth, googleProvider} from "@/lib/firebase";
import {useAuthStore} from "@/stores/useAuthStore";
import {useChatStore} from "@/stores/useChatStore";
import type {User as DbUser} from "@/types";
import {Capacitor} from "@capacitor/core";
import {FirebaseAuthentication} from "@capacitor-firebase/authentication";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import {createContext, useContext, useEffect, useState} from "react";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  user: DbUser | null;
  authReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

// Render's free tier sleeps after 15min idle — the first request after that
// can take 30s+ to wake it up and may time out at the proxy. Retry a couple
// times with backoff instead of leaving the user stuck on the logged-out
// screen until they manually refresh.
const withRetry = async <T,>(fn: () => Promise<T>, retries = 2, delayMs = 4000): Promise<T> => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

const updateApiToken = (token: string | null) => {
  if (token)
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete axiosInstance.defaults.headers.common["Authorization"];
};

const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<DbUser | null>(null);
  // Flips true once the first onAuthStateChanged callback (and, for a
  // signed-in user, the token/admin-check flow it kicks off) has settled.
  // Consumers that need an auth-aware request (e.g. admin-only endpoints)
  // must wait for this instead of firing on mount — isLoading in
  // useAuthStore defaults to false and only turns true once checkAdminStatus
  // has already started, which is too late to guard the very first request.
  const [authReady, setAuthReady] = useState(false);
  const {checkAdminStatus, reset: resetAuthStore} = useAuthStore();
  const {initSocket, disconnectSocket} = useChatStore();

  useEffect(() => {
    // Firebase, its auth-state resolution, and the chat socket all load
    // lazily after first paint — every consumer of `user` already renders a
    // logged-out state until this resolves, so nothing here should block
    // the initial render.
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);

      if (!fbUser) {
        updateApiToken(null);
        setUser(null);
        resetAuthStore();
        disconnectSocket();
        setAuthReady(true);
        return;
      }

      (async () => {
        try {
          // REST calls use the raw Firebase ID token (verified by the
          // backend's verifyIdToken middleware) — never the session token.
          const idToken = await fbUser.getIdToken();
          updateApiToken(idToken);

          const {data} = await withRetry(() => axiosInstance.post("/auth/callback"));
          setUser(data.user);

          // Independent of each other — both only need the already-resolved
          // idToken/data.user from the callback above, so run them together.
          const [, {data: sessionData}] = await withRetry(() =>
            Promise.all([checkAdminStatus(), axiosInstance.post("/auth/session")])
          );

          // Session token is scoped to the Socket.io handshake only.
          initSocket(data.user._id, sessionData.token);
        } catch (error) {
          console.error("Error in auth provider", error);
          updateApiToken(null);
          setUser(null);
        } finally {
          setAuthReady(true);
        }
      })();
    });

    return () => {
      unsubscribe();
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithGoogle = async () => {
    if (Capacitor.isNativePlatform()) {
      // signInWithPopup relies on a full browser context that Capacitor's
      // WKWebView doesn't provide — it hangs forever there. The native
      // plugin does the OS-level Google sign-in, then we feed its ID token
      // into the Firebase JS SDK so the rest of the app (onAuthStateChanged
      // etc.) keeps working unchanged.
      const result = await FirebaseAuthentication.signInWithGoogle();
      const idToken = result.credential?.idToken;
      if (!idToken) throw new Error("Google sign-in did not return an ID token");
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } else {
      await signInWithPopup(auth, googleProvider);
    }
  };

  const signOutUser = async () => {
    if (Capacitor.isNativePlatform()) {
      await FirebaseAuthentication.signOut();
    }
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{firebaseUser, user, authReady, signInWithGoogle, signOutUser}}>
      {children}
    </AuthContext.Provider>
  );
};
export default AuthProvider;
