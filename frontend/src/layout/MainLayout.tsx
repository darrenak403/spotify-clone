import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {Outlet} from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import FriendActivity from "./components/FriendActivity";
import AudioPlayer from "./components/AudioPlayer";
import {PlaybackControls} from "./components/PlaybackControls";
import {useEffect, useState} from "react";

const MainLayout = () => {
  const [isMobile, setIsMobile] = useState(false); // Replace with actual mobile detection logic

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
    <div className="h-screen bg-black text-white flex flex-col">
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
          <Outlet />
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

      <PlaybackControls />
    </div>
  );
};

export default MainLayout;
