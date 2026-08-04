import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {Outlet} from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import FriendActivity from "./components/FriendActivity";
import AudioPlayer from "./components/AudioPlayer";
import {PlaybackControls} from "./components/PlaybackControls";
import {Suspense, useEffect, useState} from "react";
import {Loader, Users} from "lucide-react";

const PageLoader = () => (
  <div className="h-full w-full flex items-center justify-center">
    <Loader className="size-8 text-emerald-500 animate-spin" />
  </div>
);

const MainLayout = () => {
  const [isMobile, setIsMobile] = useState(false); // Replace with actual mobile detection logic
  const [showFriendActivity, setShowFriendActivity] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth <= 768 // Example breakpoint for mobile
      );
    };
    checkMobile(); // Initial check
    window.addEventListener("resize", checkMobile); // Update on resize
    return () => {
      window.removeEventListener("resize", checkMobile); // Cleanup listener
    };
  }, []);
  return (
    <div className="h-screen bg-black text-white flex flex-col pt-[env(safe-area-inset-top)]">
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 flex h-full overflow-hidden p-2"
      >
        <AudioPlayer />
        {/* Left sidebar */}
        <ResizablePanel
          defaultSize={20}
          minSize={isMobile ? 0 : 10}
          maxSize={30}
        >
          <LeftSidebar />
        </ResizablePanel>

        <ResizableHandle className="w-2 bg-black rounded-lg transition-colors" />

        {/* Main content */}
        <ResizablePanel defaultSize={isMobile ? 80 : 60}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </ResizablePanel>

        {!isMobile && (
          <>
            <ResizableHandle className="w-2 bg-black rounded-lg transition-colors" />

            {/* Right sidebar */}
            <ResizablePanel
              defaultSize={20}
              minSize={0}
              maxSize={25}
              collapsedSize={0}
            >
              <FriendActivity />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {isMobile && (
        <>
          <button
            onClick={() => setShowFriendActivity(true)}
            className="fixed right-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-20 size-12 rounded-full bg-emerald-500
            hover:bg-emerald-400 shadow-lg flex items-center justify-center transition-colors"
            aria-label="Show friend activity"
          >
            <Users className="size-5 text-black" />
          </button>

          <Dialog open={showFriendActivity} onOpenChange={setShowFriendActivity}>
            <DialogContent
              showCloseButton={false}
              className="p-0 border-0 bg-transparent max-w-sm h-[70vh] sm:h-[70vh]"
            >
              <DialogTitle className="sr-only">Friend Activity</DialogTitle>
              <FriendActivity />
            </DialogContent>
          </Dialog>
        </>
      )}

      <PlaybackControls />
    </div>
  );
};

export default MainLayout;
