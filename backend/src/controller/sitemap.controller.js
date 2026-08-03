import {prisma} from "../lib/prisma.js";
import {slugify} from "../lib/slugify.js";

const CANONICAL_ORIGIN = "https://music.darrenak.id.vn";

const XML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

const escapeXml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => XML_ESCAPES[char]);

const toUrlEntry = ({loc, lastmod}) =>
  `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;

export const getSitemap = async (req, res, next) => {
  try {
    const [albums, songs] = await Promise.all([
      prisma.album.findMany({select: {slug: true, artist: true, updatedAt: true}}),
      prisma.song.findMany({select: {artist: true, updatedAt: true}}),
    ]);

    const artistLastmod = new Map();
    let siteLastmod = new Date(0);

    for (const record of [...albums, ...songs]) {
      if (record.updatedAt > siteLastmod) siteLastmod = record.updatedAt;

      const slug = slugify(record.artist);
      const existing = artistLastmod.get(slug);
      if (!existing || record.updatedAt > existing.updatedAt) {
        artistLastmod.set(slug, {slug, updatedAt: record.updatedAt});
      }
    }

    const urls = [
      {loc: `${CANONICAL_ORIGIN}/`, lastmod: siteLastmod.toISOString()},
      ...albums
        .filter((album) => album.slug)
        .map((album) => ({
          loc: `${CANONICAL_ORIGIN}/albums/${album.slug}`,
          lastmod: album.updatedAt.toISOString(),
        })),
      ...[...artistLastmod.values()].map((artist) => ({
        loc: `${CANONICAL_ORIGIN}/artists/${artist.slug}`,
        lastmod: artist.updatedAt.toISOString(),
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map(toUrlEntry)
      .join("\n")}\n</urlset>`;

    res.status(200).setHeader("Content-Type", "application/xml").send(xml);
  } catch (error) {
    next(error);
  }
};
