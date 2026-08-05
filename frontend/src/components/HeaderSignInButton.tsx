import {useAuth} from "@/providers/AuthProvider";
import {Loader2} from "lucide-react";
import {useState} from "react";
import {cn} from "@/lib/utils";

const HeaderSignInButton = () => {
  const {signInWithGoogle} = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleClick = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign-in failed", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSigningIn}
      aria-label="Sign in"
      aria-busy={isSigningIn}
      className={cn(
        "h-10 shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.06] px-4",
        "text-sm font-medium text-white transition",
        "hover:bg-white/[0.1] active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
        "disabled:cursor-not-allowed disabled:opacity-70"
      )}
    >
      {isSigningIn ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
    </button>
  );
};

export default HeaderSignInButton;
