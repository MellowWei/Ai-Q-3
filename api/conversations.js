import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { userId = "anonymous", conversationId } = req.query;

  // GET - list all conversations for a user
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("conversations")
      .select("conversation_id, title, updated_at, created_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ conversations: data || [] });
  }

  // DELETE - delete a conversation
  if (req.method === "DELETE") {
    if (!conversationId) return res.status(400).json({ error: "conversationId required" });
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  // PATCH - rename a conversation
  if (req.method === "PATCH") {
    if (!conversationId) return res.status(400).json({ error: "conversationId required" });
    const { title } = req.body || {};
    if (!title) return res.status(400).json({ error: "title required" });

    const { error } = await supabase
      .from("conversations")
      .update({ title })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
 conversations.js
