import {useAuth} from "@/providers/AuthProvider";
import {Button} from "./ui/button";
import {Loader2} from "lucide-react";
import {useState} from "react";

const SignInOAuthButton = () => {
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
    <Button
      onClick={handleClick}
      disabled={isSigningIn}
      variant={"secondary"}
      className="w-full text-white border-zinc-200 h-11"
    >
      {isSigningIn ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        "Continue with Google"
      )}
    </Button>
  );
};

export default SignInOAuthButton;
