import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

/* ================= CONFIG ================= */

// CORS seguro (evita erro no Vercel)
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
}));

app.use(express.json());

/* ================= VALIDAÇÃO DE ENV ================= */

if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL não definida");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY não definida");
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY não definida");
}

/* ================= CLIENTES ================= */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

/* ================= IA ================= */

app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, user_id, historico } = req.body;

    if (!texto) {
      return res.json({ resposta: "Fale comigo..." });
    }

    /* ================= MEMÓRIA BANCO ================= */
    let memoriaTexto = "";

    try {
      const { data: memoria } = await supabase
        .from("memoria_ia")
        .select("texto")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(5);

      memoriaTexto = memoria?.map(m => m.texto).join("\n") || "";
    } catch (err) {
      console.log("Erro ao buscar memória:", err.message);
    }

    /* ================= HISTÓRICO CHAT ================= */
    const historicoTexto = historico
      ?.map(m => `${m.tipo === "user" ? "Usuário" : "IA"}: ${m.texto}`)
      .join("\n") || "";

    /* ================= PROMPT ================= */
    const promptSistema = `
Você é uma IA terapêutica, empática e acolhedora.

Regras:
- Fale como um humano, não como robô
- Seja emocional, mas não exagerado
- Faça perguntas inteligentes
- Ajude a pessoa a refletir
- Use o histórico para continuidade

Memória do usuário:
${memoriaTexto}

Histórico da conversa:
${historicoTexto}
`;

    /* ================= OPENAI ================= */
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: promptSistema },
        {
          role: "user",
          content: `Estou me sentindo ${emocao}. ${texto}`,
        },
      ],
    });

    const resposta =
      completion?.choices?.[0]?.message?.content ||
      "Estou aqui com você.";

    /* ================= SALVAR MEMÓRIA ================= */
    try {
      await supabase.from("memoria_ia").insert({
        user_id,
        texto,
      });
    } catch (err) {
      console.log("Erro ao salvar memória:", err.message);
    }

    return res.json({ resposta });

  } catch (err) {
    console.error("ERRO IA:", err);

    return res.status(200).json({
      resposta: "Tive um pequeno erro, mas continuo aqui com você.",
    });
  }
});

/* ================= ADMIN ================= */

app.get("/admin-metricas", async (req, res) => {
  try {
    const { count: usuarios } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: registros } = await supabase
      .from("registros_emocionais")
      .select("*", { count: "exact", head: true });

    const { count: ia } = await supabase
      .from("memoria_ia")
      .select("*", { count: "exact", head: true });

    return res.json({
      usuarios: usuarios || 0,
      registros: registros || 0,
      ia: ia || 0,
    });

  } catch (err) {
    console.error("Erro admin:", err);

    return res.json({
      usuarios: 0,
      registros: 0,
      ia: 0,
    });
  }
});

/* ================= FALLBACK ================= */

// evita crash silencioso
app.use((err, req, res, next) => {
  console.error("Erro global:", err.stack);
  res.status(500).json({ error: "Erro interno" });
});

/* ================= START ================= */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});
