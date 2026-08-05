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

const itemClass = (active: boolean) =>
  cn(
    "flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl py-1.5",
    "transition-colors duration-200 active:scale-95",
    active ? "bg-emerald-400/10 text-emerald-400" : "text-zinc-400"
  );

const BottomNav = ({onFriendsClick}: BottomNavProps) => {
  const {pathname} = useLocation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-white/[0.08]
      bg-zinc-900/95 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      aria-label="Primary"
    >
      <div className="grid h-16 grid-cols-4 px-2">
        {tabs.map(({to, label, icon: Icon}) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={itemClass(active)}
            >
              <Icon className="size-[22px]" strokeWidth={2.25} />
              <span className="text-[11px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
        <button
          onClick={onFriendsClick}
          aria-label="Friends"
          className={itemClass(false)}
        >
          <Users className="size-[22px]" strokeWidth={2.25} />
          <span className="text-[11px] font-medium leading-none">Friends</span>
        </button>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" aria-hidden="true" />
    </nav>
  );
};

export default BottomNav;
