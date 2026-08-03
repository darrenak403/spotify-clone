import {prisma} from "../lib/prisma.js";
import {config} from "dotenv";

config();

const songs = [
  {
    title: "City Rain",
    artist: "Urban Echo",
    imageUrl: "/cover-images/7.jpg",
    audioUrl: "/songs/7.mp3",
    duration: 39, // 0:39
  },
  {
    title: "Neon Lights",
    artist: "Night Runners",
    imageUrl: "/cover-images/5.jpg",
    audioUrl: "/songs/5.mp3",
    duration: 36, // 0:36
  },
  {
    title: "Urban Jungle",
    artist: "City Lights",
    imageUrl: "/cover-images/15.jpg",
    audioUrl: "/songs/15.mp3",
    duration: 36, // 0:36
  },
  {
    title: "Neon Dreams",
    artist: "Cyber Pulse",
    imageUrl: "/cover-images/13.jpg",
    audioUrl: "/songs/13.mp3",
    duration: 39, // 0:39
  },
  {
    title: "Summer Daze",
    artist: "Coastal Kids",
    imageUrl: "/cover-images/4.jpg",
    audioUrl: "/songs/4.mp3",
    duration: 24, // 0:24
  },
  {
    title: "Ocean Waves",
    artist: "Coastal Drift",
    imageUrl: "/cover-images/9.jpg",
    audioUrl: "/songs/9.mp3",
    duration: 28, // 0:28
  },
  {
    title: "Crystal Rain",
    artist: "Echo Valley",
    imageUrl: "/cover-images/16.jpg",
    audioUrl: "/songs/16.mp3",
    duration: 39, // 0:39
  },
  {
    title: "Starlight",
    artist: "Luna Bay",
    imageUrl: "/cover-images/10.jpg",
    audioUrl: "/songs/10.mp3",
    duration: 30, // 0:30
  },
  {
    title: "Stay With Me",
    artist: "Sarah Mitchell",
    imageUrl: "/cover-images/1.jpg",
    audioUrl: "/songs/1.mp3",
    duration: 46, // 0:46
  },
  {
    title: "Midnight Drive",
    artist: "The Wanderers",
    imageUrl: "/cover-images/2.jpg",
    audioUrl: "/songs/2.mp3",
    duration: 41, // 0:41
  },
  {
    title: "Moonlight Dance",
    artist: "Silver Shadows",
    imageUrl: "/cover-images/14.jpg",
    audioUrl: "/songs/14.mp3",
    duration: 27, // 0:27
  },
  {
    title: "Lost in Tokyo",
    artist: "Electric Dreams",
    imageUrl: "/cover-images/3.jpg",
    audioUrl: "/songs/3.mp3",
    duration: 24, // 0:24
  },
  {
    title: "Neon Tokyo",
    artist: "Future Pulse",
    imageUrl: "/cover-images/17.jpg",
    audioUrl: "/songs/17.mp3",
    duration: 39, // 0:39
  },
  {
    title: "Purple Sunset",
    artist: "Dream Valley",
    imageUrl: "/cover-images/12.jpg",
    audioUrl: "/songs/12.mp3",
    duration: 17, // 0:17
  },
];

const albums = [
  {
    title: "Urban Nights",
    artist: "Various Artists",
    imageUrl: "/albums/1.jpg",
    releaseYear: 2024,
    songRange: [0, 4],
  },
  {
    title: "Coastal Dreaming",
    artist: "Various Artists",
    imageUrl: "/albums/2.jpg",
    releaseYear: 2024,
    songRange: [4, 8],
  },
  {
    title: "Midnight Sessions",
    artist: "Various Artists",
    imageUrl: "/albums/3.jpg",
    releaseYear: 2024,
    songRange: [8, 11],
  },
  {
    title: "Eastern Dreams",
    artist: "Various Artists",
    imageUrl: "/albums/4.jpg",
    releaseYear: 2024,
    songRange: [11, 14],
  },
];

const seedDatabase = async () => {
  try {
    await prisma.$transaction(async (tx) => {
      // Clear existing data
      await tx.song.deleteMany();
      await tx.album.deleteMany();

      // First, create all songs
      const createdSongs = await Promise.all(
        songs.map((song) => tx.song.create({data: song}))
      );

      // Create albums, then link each song to its album via the FK relation
      for (const {songRange, ...albumData} of albums) {
        const album = await tx.album.create({data: albumData});
        const albumSongs = createdSongs.slice(songRange[0], songRange[1]);

        await tx.song.updateMany({
          where: {id: {in: albumSongs.map((song) => song.id)}},
          data: {albumId: album.id},
        });
      }
    });

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

seedDatabase();
