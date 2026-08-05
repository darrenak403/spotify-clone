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
import BottomNav from "./components/BottomNav";
import MiniPlayer from "./components/MiniPlayer";
import AudioPlayer from "./components/AudioPlayer";
import {PlaybackControls} from "./components/PlaybackControls";
import {Suspense, useState} from "react";
import {Loader} from "lucide-react";
import {useIsMobile} from "@/hooks/useIsMobile";

const PageLoader = () => (
  <div className="h-full w-full flex items-center justify-center">
    <Loader className="size-8 text-emerald-500 animate-spin" />
  </div>
);

const MainLayout = () => {
  const isMobile = useIsMobile();
  const [showFriendActivity, setShowFriendActivity] = useState(false);

  return (
    <div className="h-screen bg-black text-white flex flex-col pt-[env(safe-area-inset-top)]">
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 flex h-full overflow-hidden p-2"
      >
        <AudioPlayer />

        {/* Left sidebar — desktop only; mobile uses BottomNav instead */}
        {!isMobile && (
          <>
            <ResizablePanel defaultSize={20} minSize={10} maxSize={30}>
              <LeftSidebar />
            </ResizablePanel>
            <ResizableHandle className="w-2 bg-black rounded-lg transition-colors" />
          </>
        )}

        {/* Main content */}
        <ResizablePanel defaultSize={isMobile ? 100 : 60}>
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

      {/* Desktop keeps the full footer; mobile gets a mini player + bottom nav */}
      {isMobile ? <MiniPlayer /> : <PlaybackControls />}

      {isMobile && (
        <>
          <BottomNav onFriendsClick={() => setShowFriendActivity(true)} />

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
    </div>
  );
};

export default MainLayout;
