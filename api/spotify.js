export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const REDIRECT_URI = "https://mellowwei.github.io/Ai-Q-3/";

  // State → playlist mapping (Mellow's curation)
  const STATE_PLAYLISTS = {
    baseline:   { query: "427hz binaural focus ambient",     mood: "427Hz Baseline" },
    overloaded: { query: "hyperpop adrenaline peak energy",  mood: "Hyperpop Peak Traversal" },
    numb:       { query: "breakbeat drum bass re-entry",     mood: "Breakbeat Re-entry" },
    anxious:    { query: "ambient techno calm stabilize",    mood: "Ambient Techno Stabilization" },
    focus:      { query: "focus deep work instrumental",     mood: "427Hz Focus Lock" },
    void:       { query: "darkwave gothic shadow introspect",mood: "Darkwave Shadow Integration" }
  };

  // GET /api/spotify?action=auth — returns Spotify OAuth URL
  if (req.method === "GET" && req.query.action === "auth") {
    const scopes = [
      "streaming",
      "user-read-email",
      "user-read-private",
      "user-read-playback-state",
      "user-modify-playback-state",
      "playlist-read-private"
    ].join(" ");

    const authUrl = "https://accounts.spotify.com/authorize?" + new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      scope: scopes,
      redirect_uri: REDIRECT_URI,
      state: "aiq_spotify_auth"
    });

    return res.status(200).json({ authUrl });
  }

  // POST /api/spotify?action=token — exchange code for token
  if (req.method === "POST" && req.query.action === "token") {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: "code required" });

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64")
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI
      })
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) return res.status(400).json({ error: tokenData.error_description });
    return res.status(200).json(tokenData);
  }

  // POST /api/spotify?action=refresh — refresh access token
  if (req.method === "POST" && req.query.action === "refresh") {
    const { refresh_token } = req.body || {};
    if (!refresh_token) return res.status(400).json({ error: "refresh_token required" });

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64")
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token
      })
    });

    const tokenData = await tokenRes.json();
    return res.status(200).json(tokenData);
  }

  // GET /api/spotify?action=recommend&state=void&token=xxx — get playlist for state
  if (req.method === "GET" && req.query.action === "recommend") {
    const { state = "baseline", token } = req.query;
    if (!token) return res.status(400).json({ error: "token required" });

    const playlist = STATE_PLAYLISTS[state] || STATE_PLAYLISTS.baseline;

    // Search Spotify for playlists matching the state mood
    const searchRes = await fetch(
      "https://api.spotify.com/v1/search?" + new URLSearchParams({
        q: playlist.query,
        type: "playlist",
        limit: 3
      }),
      { headers: { Authorization: "Bearer " + token } }
    );

    const searchData = await searchRes.json();

    if (searchData.error) {
      return res.status(401).json({ error: searchData.error.message });
    }

    const playlists = searchData.playlists?.items?.filter(Boolean).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      url: p.external_urls?.spotify,
      image: p.images?.[0]?.url,
      uri: p.uri
    })) || [];

    return res.status(200).json({
      state,
      mood: playlist.mood,
      playlists
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
