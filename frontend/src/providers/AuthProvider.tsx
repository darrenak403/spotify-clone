import {axiosInstance} from "@/lib/axios";
import {auth, googleProvider} from "@/lib/firebase";
import {useAuthStore} from "@/stores/useAuthStore";
import {useChatStore} from "@/stores/useChatStore";
import type {User as DbUser} from "@/types";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import {createContext, useContext, useEffect, useState} from "react";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  user: DbUser | null;
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
    await signInWithPopup(auth, googleProvider);
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{firebaseUser, user, signInWithGoogle, signOutUser}}>
      {children}
    </AuthContext.Provider>
  );
};
export default AuthProvider;
