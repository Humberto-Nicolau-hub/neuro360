const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer"); // ✅ CORREÇÃO

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🔐 EMAIL CONFIG (GMAIL)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 🧠 GERAR MENSAGEM INTELIGENTE
function gerarMensagem(lista) {
  if (!lista || lista.length === 0) {
    return "Vamos começar sua jornada hoje?";
  }

  let negativos = ["ansioso","desmotivado","frustrado"];
  let qtd = lista.filter(i => negativos.includes(i.estado)).length;

  if (qtd > lista.length / 2) {
    return "⚠️ Seu padrão emocional está em queda. Volte hoje e ajuste isso.";
  }

  return "📈 Você está evoluindo. Continue hoje para manter sua sequência.";
}

// 📩 ENVIAR EMAIL
async function enviarEmail(destino, mensagem) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: destino,
    subject: "NeuroMapa360 - Sua evolução emocional",
    text: mensagem
  });
}

// 🔥 ROTA DE NOTIFICAÇÃO
app.post("/notificar", async (req, res) => {
  try {
    const { email } = req.body;

    const { data } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", email);

    const mensagem = gerarMensagem(data || []);

    await enviarEmail(email, mensagem);

    res.json({ ok: true, mensagem });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao enviar email" });
  }
});

app.get("/", (req, res) => {
  res.send("Neuro360 Notificações 🚀");
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Servidor rodando 🚀");
});
