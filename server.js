import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   🧪 ROTA TESTE PURA
========================= */

app.post("/ia", async (req, res) => {
  try {
    console.log("🔥 TESTE BACKEND PURO ATIVADO");
    console.log("📩 BODY RECEBIDO:", req.body);

    return res.json({
      resposta: "Backend funcionando sem banco 🚀"
    });

  } catch (err) {
    console.error("❌ ERRO:", err);
    return res.status(500).json({
      erro: "Erro interno"
    });
  }
});

/* =========================
   🚀 START SERVER
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server rodando na porta", PORT);
});
