import AlbumList from "@/layout/components/AlbumList";

const LibraryPage = () => {
  return (
    <div className="h-full overflow-y-auto p-4 pb-24">
      <h1 className="text-2xl font-bold mb-4">Your Library</h1>
      <AlbumList />
    </div>
  );
};

export default LibraryPage;
