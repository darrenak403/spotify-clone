import {useAuth} from "@/providers/AuthProvider";
import {Button} from "./ui/button";

const SignInOAuthButton = () => {
  const {signInWithGoogle} = useAuth();

  return (
    <Button
      onClick={signInWithGoogle}
      variant={"secondary"}
      className="w-full text-white border-zinc-200 h-11"
    >
      Continue with Google
    </Button>
  );
};

export default SignInOAuthButton;
