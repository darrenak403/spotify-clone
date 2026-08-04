import {buttonVariants} from "@/components/ui/button";
import {ScrollArea} from "@/components/ui/scroll-area";
import {cn} from "@/lib/utils";
import {useAuth} from "@/providers/AuthProvider";
import {HomeIcon, Library, MessageCircle} from "lucide-react";
import {Link} from "react-router-dom";
import AlbumList from "./AlbumList";

const LeftSidebar = () => {
  const {user} = useAuth();

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Navigation Menu */}
      <div className="rounded-lg bg-zinc-900 p-4">
        <div className="space-y-2">
          <Link
            to={"/"}
            className={cn(
              buttonVariants({
                variant: "ghost",
                className: "w-full justify-start text-white hover:bg-zinc-800",
              })
            )}
          >
            <HomeIcon className="mr-2 size-5" />
            <span className="hidden md:inline">Home</span>
          </Link>

          {user && (
            <Link
              to={"/chat"}
              className={cn(
                buttonVariants({
                  variant: "ghost",
                  className:
                    "w-full justify-start text-white hover:bg-zinc-800",
                })
              )}
            >
              <MessageCircle className="mr-2 size-5" />
              <span className="hidden md:inline">Messages</span>
            </Link>
          )}
        </div>
      </div>
      {/* Library Section*/}
      <div className="flex-1 rounded-lg bg-zinc-900 p-4">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center text-white px-2">
            <Library className="size-5 mr-2" />
            <span className="hidden md:inline">Library</span>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-300px)]">
          <AlbumList compact />
        </ScrollArea>
      </div>
    </div>
  );
};

export default LeftSidebar;
