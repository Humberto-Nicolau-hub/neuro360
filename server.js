import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Supabase Admin (usa SERVICE ROLE KEY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔐 Middleware de autenticação REAL
async function autenticarUsuario(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ erro: "Token não enviado" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ erro: "Token inválido" });
  }

  req.user = data.user;
  next();
}

// 🚀 Rota da IA protegida
app.post("/ia", autenticarUsuario, async (req, res) => {
  const { texto } = req.body;
  const user = req.user;

  try {
    // 💡 Simulação IA (substituir depois)
    const resposta = `Entendi que você está se sentindo: ${texto}. Vamos trabalhar isso juntos.`;

    // 🔥 SALVANDO COM USER_ID CORRETO
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
      console.error(error);
      return res.status(500).json({ erro: "Erro ao salvar" });
    }

    res.json({ resposta });
  } catch (err) {
    res.status(500).json({ erro: "Erro interno" });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
