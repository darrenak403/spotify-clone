// Vercel serverless function (auto-detected from the `api/` folder, no
// framework-specific config needed). Handles old UUID-based album links by
// looking up the album's slug on the backend and issuing a real HTTP 301 to
// the canonical slug URL, per phase-01's redirect requirement — this must
// happen before the SPA loads so non-JS crawlers see the redirect too.
export default async function handler(req, res) {
  const {id} = req.query;
  const backendUrl =
    process.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:5000";

  try {
    const response = await fetch(`${backendUrl}/api/albums/${id}`);
    if (!response.ok) {
      res.status(404).send("Album not found");
      return;
    }

    const album = await response.json();
    if (!album.slug) {
      res.status(404).send("Album not found");
      return;
    }

    res.setHeader("Location", `/albums/${album.slug}`);
    res.status(301).send("Redirecting");
  } catch {
    res.status(502).send("Album lookup failed");
  }
}
