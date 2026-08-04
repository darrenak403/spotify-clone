import {useAuth} from "@/providers/AuthProvider";
import {Avatar, AvatarFallback, AvatarImage} from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {LogOut} from "lucide-react";

const UserMenu = () => {
  const {user, signOutUser} = useAuth();
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Account menu" className="rounded-full">
          <Avatar className="size-8">
            <AvatarImage src={user.imageUrl} alt={user.fullName} />
            <AvatarFallback>{user.fullName[0]}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5 text-sm font-medium truncate">
          {user.fullName}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOutUser}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default UserMenu;
