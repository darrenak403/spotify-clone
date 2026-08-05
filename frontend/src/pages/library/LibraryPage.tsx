import AlbumList from "@/layout/components/AlbumList";

const LibraryPage = () => {
  return (
    <div className="h-full overflow-y-auto p-4 pb-[calc(176px+env(safe-area-inset-bottom))] md:pb-6">
      <h1 className="text-2xl font-bold mb-4">Your Library</h1>
      <AlbumList />
    </div>
  );
};

export default LibraryPage;
