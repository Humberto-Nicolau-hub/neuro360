import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// 🔐 Cliente ADMIN
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔐 Middleware de autenticação
async function autenticarUsuario(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ erro: "Token não enviado" });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ erro: "Token inválido" });
  }

  // Cliente com RLS
  const supabaseUser = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  req.user = data.user;
  req.supabase = supabaseUser;

  next();
}

// 🚀 Rota IA
app.post("/ia", autenticarUsuario, async (req, res) => {
  try {
    const { texto } = req.body;
    const user = req.user;
    const supabase = req.supabase;

    if (!texto) {
      return res.status(400).json({ erro: "Texto não enviado" });
    }

    const resposta = `Entendi que você está se sentindo: ${texto}. Vamos trabalhar isso juntos.`;

    const { error } = await supabase
      .from("feedbacks")
      .insert([
        {
          user_id: user.id,
          usuario: user.email,
          estado: texto,
          resposta: resposta,
        },
      ]);

    if (error) {
      console.error("Erro Supabase:", error);
      return res.status(500).json({ erro: "Erro ao salvar" });
    }

    return res.json({ resposta });

  } catch (err) {
    console.error("Erro geral:", err);
    return res.status(500).json({ erro: "Erro interno" });
  }
});

// 📊 Rota dados
app.get("/dados", autenticarUsuario, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("feedbacks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ erro: error.message });
    }

    return res.json(data);

  } catch (err) {
    return res.status(500).json({ erro: "Erro ao buscar dados" });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
