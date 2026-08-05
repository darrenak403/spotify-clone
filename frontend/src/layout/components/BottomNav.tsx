import {cn} from "@/lib/utils";
import {HomeIcon, Library, Search, Users} from "lucide-react";
import {Link, useLocation} from "react-router-dom";

interface BottomNavProps {
  onFriendsClick: () => void;
}

const tabs = [
  {to: "/", label: "Home", icon: HomeIcon},
  {to: "/search", label: "Search", icon: Search},
  {to: "/library", label: "Library", icon: Library},
];

const BottomNav = ({onFriendsClick}: BottomNavProps) => {
  const {pathname} = useLocation();

  return (
    <nav className="flex items-stretch justify-around h-16 bg-zinc-900 border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]">
      {tabs.map(({to, label, icon: Icon}) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[11px]",
              active ? "text-emerald-500" : "text-zinc-400"
            )}
          >
            <Icon className="size-7" strokeWidth={2.25} />
            {label}
          </Link>
        );
      })}
      <button
        onClick={onFriendsClick}
        className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] text-zinc-400"
      >
        <Users className="size-7" strokeWidth={2.25} />
        Friends
      </button>
    </nav>
  );
};

export default BottomNav;
