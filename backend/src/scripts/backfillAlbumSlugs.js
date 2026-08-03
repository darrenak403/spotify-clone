import {prisma} from "../lib/prisma.js";
import {slugify} from "../lib/slugify.js";

const run = async () => {
  const albums = await prisma.album.findMany({
    where: {slug: null},
    orderBy: {createdAt: "asc"},
  });

  for (const album of albums) {
    const base = slugify(album.title) || album.id;
    let candidate = base;
    let attempt = 1;

    // Retry with a short deterministic disambiguator on collision, same
    // strategy used by createAlbum for new rows (see admin.controller.js).
    while (true) {
      const existing = await prisma.album.findUnique({
        where: {slug: candidate},
      });
      if (!existing || existing.id === album.id) break;
      attempt += 1;
      candidate = `${base}-${attempt}`;
    }

    await prisma.album.update({
      where: {id: album.id},
      data: {slug: candidate},
    });
    console.log(`${album.id} -> ${candidate}`);
  }

  console.log(`Backfilled ${albums.length} album slug(s).`);
};

run()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
