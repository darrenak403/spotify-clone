const SITE_NAME = "Evon";
const CANONICAL_ORIGIN = "https://music.darrenak.id.vn";
const DEFAULT_DESCRIPTION =
  "Stream albums and artists on Evon — discover songs, playlists and more.";
const DEFAULT_IMAGE = `${CANONICAL_ORIGIN}/DMusic-Banner.png`;

interface SeoProps {
  title: string;
  description?: string | null;
  canonicalPath: string;
  image?: string | null;
  type?: "website" | "music.album" | "profile";
}

const Seo = ({
  title,
  description,
  canonicalPath,
  image,
  type = "website",
}: SeoProps) => {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonicalUrl = `${CANONICAL_ORIGIN}${canonicalPath}`;
  const metaDescription = description?.trim() || DEFAULT_DESCRIPTION;
  const metaImage = image
    ? image.startsWith("http")
      ? image
      : `${CANONICAL_ORIGIN}${image.startsWith("/") ? "" : "/"}${image}`
    : DEFAULT_IMAGE;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={canonicalUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </>
  );
};

export default Seo;
