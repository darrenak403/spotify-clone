import {
  buildSiteJsonLd,
  buildAlbumJsonLd,
  buildArtistJsonLd,
  serializeJsonLd,
} from "../src/lib/jsonLd.js";

// Vercel serverless function invoked ONLY for recognized crawler/scraper
// user agents (see the `has` user-agent rules in vercel.json — that file is
// the single source of truth for which bot identities get routed here).
// Fetches the same backend API the live app uses and renders minimal static
// HTML carrying the Phase 5 meta tags, so crawlers see real content without
// executing JS. Deliberately excludes everything from the interactive app
// shell (auth, chat socket, persistent player) to stay a thin, dependency
// -free render path that cannot hang on those concerns.

// No keep-warm ping exists for the Render backend anywhere in this project
// (checked before writing this file) — a cold backend instance is an
// accepted, documented risk: the 3s timeout below still guarantees a fast
// SPA-shell fallback rather than a hung crawler request, it just means the
// enriched render is skipped on cold starts until Render wakes up.
const BACKEND_TIMEOUT_MS = 3000;
const CANONICAL_ORIGIN = "https://music.darrenak.id.vn";
const SITE_NAME = "DMusic";
const DEFAULT_DESCRIPTION =
  "Stream albums and artists on DMusic — discover songs, playlists and more.";
const DEFAULT_IMAGE = `${CANONICAL_ORIGIN}/logoamnhac.png`;

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

const fetchWithTimeout = async (url, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {signal: controller.signal});
  } finally {
    clearTimeout(timer);
  }
};

const renderShell = ({
  title,
  description,
  canonicalPath,
  image,
  ogType,
  heading,
  body,
  jsonLd,
}) => {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonicalUrl = `${CANONICAL_ORIGIN}${canonicalPath}`;
  const metaDescription = description?.trim() || DEFAULT_DESCRIPTION;
  const metaImage = image
    ? image.startsWith("http")
      ? image
      : `${CANONICAL_ORIGIN}${image.startsWith("/") ? "" : "/"}${image}`
    : DEFAULT_IMAGE;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(metaDescription)}" />
<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
<meta property="og:type" content="${escapeHtml(ogType)}" />
<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
<meta property="og:title" content="${escapeHtml(fullTitle)}" />
<meta property="og:description" content="${escapeHtml(metaDescription)}" />
<meta property="og:image" content="${escapeHtml(metaImage)}" />
<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(fullTitle)}" />
<meta name="twitter:description" content="${escapeHtml(metaDescription)}" />
<meta name="twitter:image" content="${escapeHtml(metaImage)}" />
<script type="application/ld+json">${serializeJsonLd(jsonLd)}</script>
</head>
<body>
<h1>${escapeHtml(heading)}</h1>
${body}
</body>
</html>`;
};

const FALLBACK_SPA_SHELL = `<!doctype html>
<html lang="en" class="dark">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${SITE_NAME}</title>
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
</body>
</html>`;

// Render failures (bad slug, backend timeout, unexpected shape) must never
// surface as a crash or a hang — always degrade to the plain SPA shell so a
// crawler or browser hitting this path in error still gets a normal page.
const serveSpaFallback = async (req, res) => {
  try {
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const response = await fetchWithTimeout(
      `${protocol}://${host}/index.html`,
      BACKEND_TIMEOUT_MS
    );
    const html = await response.text();
    res.status(200).setHeader("Content-Type", "text/html; charset=utf-8").send(html);
  } catch {
    res
      .status(200)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(FALLBACK_SPA_SHELL);
  }
};

const renderHome = (res) => {
  const siteJsonLd = buildSiteJsonLd();
  res
    .status(200)
    .setHeader("Content-Type", "text/html; charset=utf-8")
    .send(
      renderShell({
        title: "DMusic — Stream Music Online",
        description: siteJsonLd.description,
        canonicalPath: "/",
        image: null,
        ogType: "website",
        heading: "DMusic — Stream Music Online",
        body: `<p>${escapeHtml(siteJsonLd.description)}</p>`,
        jsonLd: siteJsonLd,
      })
    );
};

const renderAlbum = async (req, res, backendUrl, slug) => {
  const response = await fetchWithTimeout(
    `${backendUrl}/api/albums/${slug}`,
    BACKEND_TIMEOUT_MS
  );
  if (!response.ok) {
    res
      .status(404)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send("Album not found");
    return;
  }

  const album = await response.json();
  const description = [
    `${album.title} by ${album.artist}`,
    album.genre,
    album.description,
  ]
    .filter(Boolean)
    .join(" — ");
  const songListHtml = (album.songs || [])
    .map((song) => `<li>${escapeHtml(song.title)}</li>`)
    .join("");
  const genreLine = album.genre ? ` • ${escapeHtml(album.genre)}` : "";
  const descriptionLine = album.description
    ? `<p>${escapeHtml(album.description)}</p>`
    : "";

  res
    .status(200)
    .setHeader("Content-Type", "text/html; charset=utf-8")
    .send(
      renderShell({
        title: `${album.title} by ${album.artist}`,
        description,
        canonicalPath: `/albums/${album.slug}`,
        image: album.imageUrl,
        ogType: "music.album",
        heading: album.title,
        body: `<p>${escapeHtml(album.artist)} • ${album.releaseYear}${genreLine}</p>${descriptionLine}<ul>${songListHtml}</ul>`,
        jsonLd: buildAlbumJsonLd(album),
      })
    );
};

const renderArtist = async (req, res, backendUrl, slug) => {
  const response = await fetchWithTimeout(
    `${backendUrl}/api/artists/${slug}`,
    BACKEND_TIMEOUT_MS
  );
  if (!response.ok) {
    res
      .status(404)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send("Artist not found");
    return;
  }

  const artist = await response.json();
  const totalSongs =
    artist.albums.reduce((sum, album) => sum + album.songCount, 0) +
    artist.standaloneSongs.length;
  const description = `${artist.name} on DMusic — ${artist.albums.length} album${
    artist.albums.length === 1 ? "" : "s"
  }, ${totalSongs} song${totalSongs === 1 ? "" : "s"}.`;
  const albumsHtml = artist.albums
    .map((album) => `<li>${escapeHtml(album.title)} (${album.releaseYear})</li>`)
    .join("");

  res
    .status(200)
    .setHeader("Content-Type", "text/html; charset=utf-8")
    .send(
      renderShell({
        title: artist.name,
        description,
        canonicalPath: `/artists/${artist.slug}`,
        image: artist.albums[0]?.imageUrl,
        ogType: "profile",
        heading: artist.name,
        body: `<ul>${albumsHtml}</ul>`,
        jsonLd: buildArtistJsonLd(artist),
      })
    );
};

export default async function handler(req, res) {
  const {type, slug} = req.query;
  const backendUrl =
    process.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:5000";

  try {
    if (type === "home") {
      renderHome(res);
      return;
    }

    if (type === "album" && slug) {
      await renderAlbum(req, res, backendUrl, slug);
      return;
    }

    if (type === "artist" && slug) {
      await renderArtist(req, res, backendUrl, slug);
      return;
    }

    await serveSpaFallback(req, res);
  } catch {
    await serveSpaFallback(req, res);
  }
}
