import {useAuth} from "@/providers/AuthProvider";
import {Avatar, AvatarFallback, AvatarImage} from "./ui/avatar";
import {Button} from "./ui/button";
import {LogOut} from "lucide-react";

const UserMenu = () => {
  const {user, signOutUser} = useAuth();
  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-8">
        <AvatarImage src={user.imageUrl} alt={user.fullName} />
        <AvatarFallback>{user.fullName[0]}</AvatarFallback>
      </Avatar>
      <Button size="icon" variant="ghost" onClick={signOutUser} title="Sign out">
        <LogOut className="size-4" />
      </Button>
    </div>
  );
};
export default UserMenu;
