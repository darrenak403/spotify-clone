import {Link} from "react-router-dom";
import {ArrowLeft} from "lucide-react";
import UserMenu from "@/components/UserMenu";
import {Button} from "@/components/ui/button";

const Header = () => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="rounded-lg">
          <img src="/logoamnhac.png" className="size-10 text-black" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Music Manager</h1>
          <p className="text-zinc-400 mt-1">Manage your music catalog</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
        </Button>
        <UserMenu />
      </div>
    </div>
  );
};
export default Header;
