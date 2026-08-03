// Vercel serverless function that proxies /sitemap.xml on the canonical
// domain (referenced by robots.txt, per Phase 3) through to the DB-driven
// sitemap route on the Render backend, so the sitemap's URL never needs to
// expose the backend's own host.
export default async function handler(req, res) {
  const backendUrl =
    process.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:5000";

  try {
    const response = await fetch(`${backendUrl}/api/sitemap.xml`);
    if (!response.ok) {
      res.status(502).send("Sitemap unavailable");
      return;
    }

    const xml = await response.text();
    res.setHeader("Content-Type", "application/xml").status(200).send(xml);
  } catch {
    res.status(502).send("Sitemap unavailable");
  }
}
