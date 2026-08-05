import {LayoutDashboardIcon} from "lucide-react";
import {Link} from "react-router-dom";
import HeaderSignInButton from "./HeaderSignInButton";
import UserMenu from "./UserMenu";
import {useAuthStore} from "@/stores/useAuthStore";
import {useAuth} from "@/providers/AuthProvider";
import {buttonVariants} from "./ui/button";
import {cn} from "@/lib/utils";

const TopBar = () => {
  const {isAdmin} = useAuthStore();
  const {user} = useAuth();
  return (
    <div
      className="flex items-center justify-between gap-2 h-16 px-4 sticky top-0 bg-zinc-900/75
      backdrop-blur-md z-10"
    >
      <div className="flex gap-2 items-center shrink-0">
        <img src="/logoamnhac.png" alt="Evon logo" className="size-10 sm:size-8" />
        <span className="hidden sm:inline">Evon</span>
      </div>
      <div className="flex gap-2 sm:gap-4 items-center min-w-0 max-w-[70%] sm:max-w-none">
        {isAdmin && (
          <Link
            to={"/admin"}
            className={cn(buttonVariants({variant: "outline"}), "shrink-0")}
          >
            <LayoutDashboardIcon className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">Admin Dashboard</span>
          </Link>
        )}

        {user ? <UserMenu /> : <HeaderSignInButton />}
      </div>
    </div>
  );
};

export default TopBar;
