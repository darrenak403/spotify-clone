import {Route, Routes} from "react-router-dom";
import {lazy, Suspense} from "react";
import MainLayout from "./layout/MainLayout";
import {Loader} from "lucide-react";

import {Toaster} from "react-hot-toast";

const HomePage = lazy(() => import("./pages/home/HomePage"));
const ChatPage = lazy(() => import("./pages/chat/ChatPage"));
const AlbumPage = lazy(() => import("./pages/album/AlbumPage"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));
const NotFoundPage = lazy(() => import("./pages/404/NotFoundPage"));

const RouteLoader = () => (
  <div className="h-screen w-full flex items-center justify-center">
    <Loader className="size-8 text-emerald-500 animate-spin" />
  </div>
);

function App() {
  return (
    <>
      <Routes>
        <Route
          path="/admin"
          element={
            <Suspense fallback={<RouteLoader />}>
              <AdminPage />
            </Suspense>
          }
        />

        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/albums/:albumId" element={<AlbumPage />} />
          <Route path="/*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
