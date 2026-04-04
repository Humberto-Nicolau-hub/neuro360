const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

/*
🚀 CONFIGURAÇÃO DIRETA (SEM VARIÁVEL DE AMBIENTE)
*/
const SUPABASE_URL = "https://qodzwxgabuadsnp1cscl.supabase.co";
const SUPABASE_KEY = "sb_publishable_JGrrfoRg8fko94mFIGpyQ_mDmSxo5K";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/*
🧠 GERAR MENSAGEM INTELIGENTE
*/
function gerarMensagem(lista) {
  if (!lista || lista.length === 0) {
    return "Vamos começar sua jornada hoje?";
  }

  let negativos = ["ansioso", "desmotivado", "frustrado"];

  let qtd = lista.filter(item =>
    negativos.includes(item.estado)
  ).length;

  if (qtd > lista.length / 2) {
    return "⚠️ Seu padrão emocional está em queda. Volte hoje e ajuste isso.";
  }

  return "📈 Você está evoluindo. Continue hoje para manter sua sequência.";
}

/*
🔥 ROTA PRINCIPAL (TESTE)
*/
app.get("/", (req, res) => {
  res.send("Neuro360 Backend Rodando 🚀");
});

/*
🔥 ROTA DE TESTE SUPABASE
*/
app.get("/teste", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("feedbacks")
      .select("*")
      .limit(5);

    if (error) {
      return res.status(500).json({ erro: error.message });
    }

    res.json({
      ok: true,
      dados: data
    });

  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

/*
🔥 ROTA DE MENSAGEM INTELIGENTE
*/
app.post("/mensagem", async (req, res) => {
  try {
    const { email } = req.body;

    const { data, error } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", email);

    if (error) {
      return res.status(500).json({ erro: error.message });
    }

    const mensagem = gerarMensagem(data || []);

    res.json({
      ok: true,
      mensagem
    });

  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

/*
🚀 INICIAR SERVIDOR
*/
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Servidor rodando 🚀");
});
