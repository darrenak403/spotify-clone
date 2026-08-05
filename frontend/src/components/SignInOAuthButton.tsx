import {useAuth} from "@/providers/AuthProvider";
import {Loader2} from "lucide-react";
import GoogleIcon from "./icons/GoogleIcon";
import {useState} from "react";
import {cn} from "@/lib/utils";

const SignInOAuthButton = ({className}: {className?: string}) => {
  const {signInWithGoogle} = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleClick = async () => {
    setFailed(false);
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign-in failed", error);
      setFailed(true);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isSigningIn}
        aria-label="Continue with Google"
        aria-busy={isSigningIn}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white px-4",
          "text-sm font-semibold text-black transition",
          "hover:bg-zinc-100 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900",
          "disabled:cursor-not-allowed disabled:opacity-80"
        )}
      >
        {isSigningIn ? (
          <>
            <Loader2 className="size-4 shrink-0 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <GoogleIcon className="size-5 shrink-0" />
            <span>Continue with Google</span>
          </>
        )}
      </button>

      {failed && (
        <div className="mt-3 text-center">
          <p className="text-sm font-medium text-white">Sign-in failed</p>
          <p className="mt-1 text-xs leading-5 text-zinc-400">
            We couldn't complete the sign-in process. Please try again.
          </p>
        </div>
      )}
    </div>
  );
};

export default SignInOAuthButton;
