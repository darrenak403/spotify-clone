// Shared JSON-LD builders used by both the live React app (Seo-adjacent
// pages) and the bot-facing render function (frontend/api/render.js), so
// the two never drift apart. Every value here must also be present in the
// page's own visible content — no field is invented here that isn't
// already shown to a real visitor.

const CANONICAL_ORIGIN = "https://music.darrenak.id.vn";
const SITE_NAME = "DMusic";
const SITE_DESCRIPTION =
  "Stream trending songs, curated playlists and albums for free on DMusic.";

export const buildSiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: CANONICAL_ORIGIN,
  description: SITE_DESCRIPTION,
});

export const buildAlbumJsonLd = (album) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    name: album.title,
    url: `${CANONICAL_ORIGIN}/albums/${album.slug}`,
    byArtist: {
      "@type": "MusicGroup",
      name: album.artist,
    },
  };

  if (album.genre) jsonLd.genre = album.genre;
  if (album.description) jsonLd.description = album.description;
  if (album.releaseYear) jsonLd.datePublished = String(album.releaseYear);

  if (album.songs?.length) {
    jsonLd.track = album.songs.map((song) => ({
      "@type": "MusicRecording",
      name: song.title,
    }));
  }

  return jsonLd;
};

export const buildArtistJsonLd = (artist) => ({
  "@context": "https://schema.org",
  "@type": "MusicGroup",
  name: artist.name,
  url: `${CANONICAL_ORIGIN}/artists/${artist.slug}`,
  album: artist.albums.map((album) => ({
    "@type": "MusicAlbum",
    name: album.title,
    url: `${CANONICAL_ORIGIN}/albums/${album.slug}`,
  })),
});

// JSON.stringify only — never hand-built string concatenation — and escape
// any literal `</script>` sequence so admin-entered free text (album
// description, etc.) can never prematurely close the script tag.
export const serializeJsonLd = (jsonLd) =>
  JSON.stringify(jsonLd).replace(/</g, "\\u003c");
