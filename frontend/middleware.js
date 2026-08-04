const BOT_UA_PATTERN =
  /Googlebot|Bingbot|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|TelegramBot|WhatsApp|Discordbot|redditbot|Applebot|Pinterest|SkypeUriPreview/i;

export const config = {
  matcher: ["/", "/albums/:slug", "/artists/:slug"],
};

export default function middleware(request) {
  const userAgent = request.headers.get("user-agent") || "";
  if (!BOT_UA_PATTERN.test(userAgent)) return;

  const url = new URL(request.url);
  const renderUrl = new URL("/api/render", url.origin);

  if (url.pathname === "/") {
    renderUrl.searchParams.set("type", "home");
  } else if (url.pathname.startsWith("/albums/")) {
    renderUrl.searchParams.set("type", "album");
    renderUrl.searchParams.set("slug", url.pathname.slice("/albums/".length));
  } else if (url.pathname.startsWith("/artists/")) {
    renderUrl.searchParams.set("type", "artist");
    renderUrl.searchParams.set("slug", url.pathname.slice("/artists/".length));
  } else {
    return;
  }

  return new Response(null, {
    headers: { "x-middleware-rewrite": renderUrl.toString() },
  });
}
