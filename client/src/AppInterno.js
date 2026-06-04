import { useState, useEffect, useRef } from "react";

const API_URL =
"https://neuro360-api.onrender.com";

import AdminDashboard from "./AdminDashboard";

import { supabase }
  from "./supabaseClient";

import GraficoEvolucao from "./components/GraficoEvolucao";

import Sidebar from "./components/Sidebar";

import DashboardCards from "./components/DashboardCards";

import PainelIA from "./components/PainelIA";

import {

calcularMediaHawkins,
calcularMediaScore,
gerarTendencia,
gerarEstabilidade,
gerarAlerta

}

from "./services/motorEmocional";

import {
promptSystemNeuro360
}
from "./services/promptSystemNeuro360";

export default function AppInterno({
usuario,
onLogout,
virarPremium,
premium,
plano
}) {

  const [mensagem, setMensagem] =
  useState("");

  const [dadosGrafico, setDadosGrafico] =
useState([]);

  const [conversa,setConversa] =
useState([]);

const chatEndRef = useRef(null);

  const [loading, setLoading] =
    useState(false);

  const [mostrarAdmin, setMostrarAdmin] =
    useState(false);

  const [saindo, setSaindo] =
    useState(false);

  const [emocaoSelecionada,
    setEmocaoSelecionada] =
      useState("");

  const [historicoCompleto,
    setHistoricoCompleto] =
      useState([]);

  const [estadoAtual,
setEstadoAtual] =
useState({
  score: 0,
  hawkins: 0,
  consciencia: "",
  trilha: "",
  emocao: ""
});

  const chatAreaRef =
useRef(null);

const carregouHistorico =
useRef(false);


  /* =========================================
     MAPA EMOCIONAL
  ========================================= */

  const mapaEmocional = {

    Ansioso: {
      score: 45,
      hawkins: 100,
      consciencia: "Sobrevivência",
      trilha: "Acalmar a mente",
    },

    Cansado: {
      score: 55,
      hawkins: 150,
      consciencia: "Recuperação",
      trilha: "Energia vital",
    },

    Confuso: {
      score: 50,
      hawkins: 180,
      consciencia: "Desorganização",
      trilha: "Clareza mental",
    },

    Deprimido: {
      score: 25,
      hawkins: 50,
      consciencia: "Contração",
      trilha: "Reconstrução emocional",
    },

    Desmotivado: {
      score: 40,
      hawkins: 125,
      consciencia: "Estagnação",
      trilha: "Ação progressiva",
    },

    Esperançoso: {
      score: 75,
      hawkins: 310,
      consciencia: "Expansão",
      trilha: "Fortalecimento emocional",
    },

    Feliz: {
      score: 90,
      hawkins: 540,
      consciencia: "Alegria",
      trilha: "Potencialização",
    },

    Motivado: {
      score: 95,
      hawkins: 600,
      consciencia: "Alta performance",
      trilha: "Execução estratégica",
    },

    Procrastinador: {
      score: 35,
      hawkins: 140,
      consciencia: "Bloqueio",
      trilha: "Produtividade emocional",
    },

    Raiva: {
      score: 30,
      hawkins: 150,
      consciencia: "Reatividade",
      trilha: "Controle emocional",
    },

    "Sem foco": {
      score: 48,
      hawkins: 170,
      consciencia: "Dispersão",
      trilha: "Foco consciente",
    },

    Triste: {
      score: 38,
      hawkins: 75,
      consciencia: "Introspecção",
      trilha: "Elevação emocional",
    },
  };
  /* =========================================
   TRILHAS AUTOMÁTICAS
========================================= */

const trilhasAutomaticas = {

Ansioso:{
respiracao:"Respiração 4-4-6",
pnl:"Observe qual pensamento ocupa mais espaço na sua mente neste momento.",
microacao:"Liste 3 coisas que estão sob seu controle agora."
},

Cansado:{
respiracao:"Respiração profunda lenta",
pnl:"O que seu corpo está tentando comunicar?",
microacao:"Faça uma pausa consciente de 3 minutos."
},

Confuso:{
respiracao:"Respiração de estabilização",
pnl:"Qual é a única prioridade realmente importante agora?",
microacao:"Escreva uma única ação simples."
},

Desmotivado:{
respiracao:"Respiração energizante",
pnl:"O que faria diferença se fosse concluído hoje?",
microacao:"Realize uma tarefa pequena em menos de 5 minutos."
},

Esperançoso:{
respiracao:"Respiração consciente",
pnl:"Qual recurso interno está ajudando você?",
microacao:"Anote algo positivo que percebeu hoje."
},

Feliz:{
respiracao:"Respiração de gratidão",
pnl:"O que fortaleceu esse estado emocional?",
microacao:"Compartilhe algo positivo."
},

Motivado:{
respiracao:"Respiração energizante",
pnl:"Qual ação gera maior impacto agora?",
microacao:"Comece imediatamente."
},

Procrastinador:{
respiracao:"Respiração curta guiada",
pnl:"O que está gerando resistência?",
microacao:"Faça a primeira etapa da tarefa."
},

Raiva:{
respiracao:"Respiração lenta 4-6",
pnl:"O que precisa ser protegido ou comunicado?",
microacao:"Espere 2 minutos antes de agir."
},

"Sem foco":{
respiracao:"Respiração de atenção",
pnl:"Qual pensamento está dispersando sua energia?",
microacao:"Desligue uma distração."
},

Triste:{
respiracao:"Respiração lenta acolhedora",
pnl:"Qual necessidade emocional precisa de atenção?",
microacao:"Escreva algo pelo qual sente gratidão."
}

};


  /* =========================================
     INSIGHTS INTELIGENTES
  ========================================= */

  const emocaoPredominante =
    historicoCompleto.length
      ? historicoCompleto.reduce((acc, atual) => {

          acc[atual.emocao] =
            (acc[atual.emocao] || 0) + 1;

          return acc;

        }, {})
      : {};

  const emocaoMaisFrequente =
historicoCompleto.length > 0
? Object.keys(
emocaoPredominante
).reduce(
(a,b)=>
emocaoPredominante[a] >
emocaoPredominante[b]
? a
: b
)
: estadoAtual.emocao;

  const mediaHawkins =
calcularMediaHawkins(
historicoCompleto,
estadoAtual
);

  const mediaScore =
calcularMediaScore(
historicoCompleto,
estadoAtual
);

  const tendenciaEmocional =
gerarTendencia(
historicoCompleto,
mediaHawkins
);

  const estabilidadeEmocional =
gerarEstabilidade(
mediaHawkins
);
      const alertaEmocional =
gerarAlerta(
historicoCompleto,
mediaHawkins
);

const mensagensMicroVitoria = {

  Ansioso:
    "Você observou o que sente em vez de ignorar. Essa percepção já representa avanço.",

  Cansado:
    "Seu corpo e sua mente estão enviando sinais importantes. Reconhecê-los é um passo valioso.",

  Confuso:
    "Mesmo em meio à confusão, você decidiu buscar clareza. Isso é movimento.",

  Deprimido:
    "Permitir-se continuar presente, mesmo em dias difíceis, já demonstra força.",

  Desmotivado:
    "Você identificou seu estado emocional. Isso já representa movimento.",

  Esperançoso:
    "Sua percepção emocional mostra sinais positivos de fortalecimento.",

  Feliz:
    "Valorizar momentos positivos fortalece seu equilíbrio emocional.",

  Motivado:
    "Seu padrão atual demonstra energia positiva e potencial de realização.",

  Procrastinador:
    "Reconhecer bloqueios internos é o primeiro passo para superá-los.",

  Raiva:
    "Você está percebendo sua energia emocional em vez de reagir automaticamente.",

  "Sem foco":
    "Você reconheceu sua dispersão e isso já inicia um processo de reorganização.",

  Triste:
    "Você acolheu sua emoção em vez de ignorá-la. Isso já é evolução."
};

const microVitoria =
mensagensMicroVitoria[
estadoAtual.emocao
] ||
"Pequenos avanços emocionais constroem grandes transformações.";

  const recomendacaoIA =
    mediaHawkins >= 300
      ? "Continue fortalecendo hábitos emocionais positivos."
      : "Permita-se avançar um passo de cada vez. Evolução emocional é processo.";

      function gerarDiagnosticoAdaptativo() {

        console.log(
"HISTORICO COMPLETO:",
historicoCompleto
);

console.log(
"TAMANHO HISTORICO:",
historicoCompleto?.length
);

const ultimasEmocoes =
historicoCompleto
.slice(0,10)
.map(item => item.emocao);

const frequencia = {};

ultimasEmocoes.forEach(emocao => {

frequencia[emocao] =
(frequencia[emocao] || 0) + 1;

});

const emocaoAtual =
ultimasEmocoes[0];

const ocorrencias =
frequencia[
emocaoAtual
] || 0;

console.log(
"EMOCAO ATUAL:",
emocaoAtual
);

console.log(
"OCORRENCIAS:",
ocorrencias
);

console.log(
"MEDIA HAWKINS:",
mediaHawkins
);

/* ==========================
   ANSIEDADE RECORRENTE
========================== */

if (
emocaoAtual === "Ansioso" &&
ocorrencias >= 4
) {

return "Ansiedade recorrente detectada. O sistema identifica um padrão repetitivo de antecipação mental. Priorize estabilização emocional antes de decisões importantes.";

}

/* ==========================
   TRISTEZA PROLONGADA
========================== */

if (
emocaoAtual === "Triste" &&
ocorrencias >= 3
) {

return "Há sinais de contração emocional prolongada. O foco atual deve ser fortalecimento gradual de energia emocional.";

}

/* ==========================
   EXPANSÃO
========================== */

if (
mediaHawkins >= 300
) {
 
  return "Seu histórico demonstra expansão emocional consistente. Continue fortalecendo hábitos positivos.";

}

/* ==========================
   TRANSIÇÃO
========================== */

return "Seu histórico demonstra processo gradual de reorganização emocional.";

}

const diagnosticoAdaptativo =
gerarDiagnosticoAdaptativo();

console.log(
"DIAGNOSTICO:",
diagnosticoAdaptativo
);

      function gerarTrilhaAdaptativa() {

const trilhaBase =
trilhasAutomaticas[
estadoAtual.emocao
];

if (!trilhaBase) {

return null;

}

/* ==========================
   ESTADO CRÍTICO
========================== */

if (mediaHawkins <= 150) {

return {

respiracao:
trilhaBase.respiracao,

pnl:
"Neste momento o foco não é desempenho. O foco é estabilização emocional e segurança interna.",

microacao:
"Escolha apenas uma pequena ação possível para as próximas 2 horas."

};

}

/* ==========================
   ESTADO DE TRANSIÇÃO
========================== */

if (
mediaHawkins > 150 &&
mediaHawkins < 300
) {

return {

respiracao:
trilhaBase.respiracao,

pnl:
trilhaBase.pnl,

microacao:
"Execute uma ação simples que gere sensação de progresso."

};

}

/* ==========================
   ESTADO DE EXPANSÃO
========================== */

return {

respiracao:
trilhaBase.respiracao,

pnl:
"Você demonstra recursos emocionais disponíveis. Direcione essa energia para crescimento e realização.",

microacao:
"Defina uma meta concreta para hoje e avance imediatamente."

};

}
      
      const trilhaAtual =
gerarTrilhaAdaptativa();

  useEffect(() => {

if (usuario === undefined) return;

if (!usuario) {

const timer = setTimeout(() => {
window.location="/";
},3000);

return () => clearTimeout(timer);

}

}, [usuario]);

if(usuario === undefined){

return(

<div
style={{
height:"100vh",
display:"flex",
justifyContent:"center",
alignItems:"center",
background:"#020617",
color:"#fff",
fontSize:22
}}
>

Carregando NeuroMapa360...

</div>

);

}


  /* =========================================
     AUTO SCROLL
  ========================================= */

  useEffect(()=>{

chatEndRef?.current?.scrollIntoView({
behavior:"smooth"
});

},[
conversa,
loading
]);

  /* =========================================
     CARREGAR HISTÓRICO
  ========================================= */

  useEffect(()=>{

if(
usuario?.id &&
!carregouHistorico.current
){

carregouHistorico.current = true;

carregarHistoricoEmocional();

}

},[usuario]);

  async function carregarHistoricoEmocional() {

    try {

      const { data, error } =
  await supabase
    .from("historico_emocional")
    .select("*")
    .eq(
      "user_id",
      usuario?.id
    )
    .order(
      "created_at",
      { ascending: false }
    )
    .limit(20);

    console.log(
  "USUARIO LOGADO:",
  usuario?.id
);

console.log(
  "REGISTROS ENCONTRADOS:",
  data
);

console.log(
  "ERRO:",
  error
);

console.log(
  "DATA:",
  data
);

      if (!data?.length) {

        setDadosGrafico([
  { dia: "1", hawkins: 72 },
  { dia: "2", hawkins: 76 },
  { dia: "3", hawkins: 81 },
  { dia: "4", hawkins: 82 },
]);

        return;
      }

      setHistoricoCompleto(data);

      const ultimoRegistro = data[0];

if (ultimoRegistro) {

  /* =========================================
   EMOÇÃO DOMINANTE DO HISTÓRICO
========================================= */

const dadosMapa =
mapaEmocional[
ultimoRegistro.emocao
];

if (dadosMapa) {

  setEstadoAtual({

    emocao:
      ultimoRegistro.emocao,

    score:
      dadosMapa.score,

    hawkins:
      dadosMapa.hawkins,

    consciencia:
      dadosMapa.consciencia,

    trilha:
      dadosMapa.trilha

  });

}

      const formatado =
data.map(
(item, index) => ({
  dia: String(index + 1),
  hawkins:
    item.score_hawkins || 50
})
);

setDadosGrafico(formatado);

} // fecha if (ultimoRegistro)

} catch (erro) {

      console.log(erro);
    }
  }

  /* =========================================
     ADMIN
  ========================================= */

  const isAdmin =
    usuario?.admin === true;

  const planoUsuario =
isAdmin
? "ADMIN PREMIUM"
: (
usuario?.plano || "FREE"
).toUpperCase();

  /* =========================================
     LOGOUT
  ========================================= */

  async function sair() {

   if (saindo) return;

   try {

      setSaindo(true);

      // encerra sessão Supabase corretamente
      await supabase.auth.signOut();

      // limpa apenas dados locais
      localStorage.clear();
      sessionStorage.clear();

      // avisa componente pai
      if(onLogout){

         onLogout();

      }

   } catch(erro){

      console.log(
         "Erro logout:",
         erro
      );

   } finally {

      setSaindo(false);

   }

}

async function virarPremium(){

try{

const response =
await fetch(
`${API_URL}/api/assinar-premium`,
{
method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

user_id:
usuario?.id ||

localStorage.getItem(
"user_id"
)

})

}
);

if (!response.ok) {

throw new Error(
"Erro na API"
);

}

const data =
await response.json();

if(response.ok){

alert(
"Plano PREMIUM ativado!"
);

// atualiza localmente o usuário
usuario.premium = true;
usuario.plano = "PREMIUM";

// força renderização sem recarregar página
setEstadoAtual(prev => ({...prev}));

}else{

alert(
data.erro ||
"Erro ao ativar Premium"
);

}

}catch(err){

console.log(err);

alert(
"Erro de conexão"
);

}

}


  /* =========================================
     SALVAR EMOÇÃO
  ========================================= */

  async function salvarEmocao(emocao) {

  try {

    const dados = mapaEmocional[emocao];

    await supabase
      .from("historico_emocional")
      .insert([
        {
          user_id: usuario?.id,
          email: usuario?.email || null,
          emocao: emocao,
          score_hawkins: dados.hawkins,
          mensagem: `Estado emocional selecionado: ${emocao}`,
          resposta_ia: "Registro emocional automático"
        }
      ]);

    setEstadoAtual({
      emocao,
      score: dados.score,
      hawkins: dados.hawkins,
      consciencia: dados.consciencia,
      trilha: dados.trilha
    });

    await carregarHistoricoEmocional();

  } catch (erro) {

    console.log(
      "ERRO SALVAR EMOCAO:",
      erro
    );

  }

}

  /* =========================================
     REENQUADRAMENTO PNL
  ========================================= */

  function gerarMensagemEvolutiva(
  emocao
) {

  const mensagens = {

    Ansioso:
      "Percebo sinais de sobrecarga emocional neste momento. Ansiedade costuma surgir quando a mente tenta antecipar muitos cenários ao mesmo tempo. Vamos reduzir o ritmo e trazer foco ao presente.",

    Desmotivado:
      "Nem todo período pede aceleração. Algumas fases representam reorganização interna antes do próximo movimento.",

    Triste:
      "Reconhecer tristeza não significa fraqueza. Identificar o que sente já é um passo importante de consciência emocional.",

    Confuso:
      "Quando pensamentos competem entre si, a clareza diminui. Organizar o que realmente importa pode gerar direção.",

    Raiva:
      "Existe energia dentro dessa emoção. Direcionada corretamente, ela pode se transformar em decisão e mudança.",

    Feliz:
      "Momentos positivos fortalecem equilíbrio emocional e merecem ser valorizados.",

    Motivado:
      "Seu estado atual demonstra impulso emocional positivo e maior potencial de realização.",

    Esperançoso:
      "A esperança normalmente aparece quando algo começa a se reorganizar internamente."
  };

  return (
    mensagens[emocao] ||
    "Toda evolução emocional começa quando você observa o que sente."
  );

}
  /* =========================================
     CHAT IA
  ========================================= */

  async function enviarMensagem() {

if (!mensagem.trim()) return;

/* ==============================
   BLOQUEIO FREE
============================== */

if(!premium){

const mensagensHoje = Number(

localStorage.getItem(
"mensagensHoje"
)

|| 0

);

if(mensagensHoje >= 10){

alert(
"Limite diário FREE atingido. Faça upgrade para PREMIUM."
);

return;

}

localStorage.setItem(

"mensagensHoje",

mensagensHoje + 1

);

}

/* ==============================
   CONTINUA FLUXO NORMAL
============================== */

const texto = mensagem;

setConversa(prev=>[

...prev,

{
tipo:"usuario",
texto
}

]);

setMensagem("");

setLoading(true);

try{

  console.log("USUARIO COMPLETO:", usuario);

console.log("USER_ID:", usuario?.id);

console.log(
  "LOCAL STORAGE:",
  localStorage.getItem("user_id")
);

const response = await fetch(

`${API_URL}/api/chat`,

{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

mensagem:texto,

user_id:
usuario?.id ||
localStorage.getItem("user_id"),

systemPrompt:
promptSystemNeuro360,

perfil:planoUsuario,

premium:
isAdmin ||
usuario?.premium,

email:
usuario?.email,

emocaoAtual:
estadoAtual.emocao,

scoreAtual:
estadoAtual.score,

hawkinsAtual:
estadoAtual.hawkins,

emocaoPredominante:
emocaoMaisFrequente,

mediaScore,

mediaHawkins,

tendenciaEmocional,

estabilidadeEmocional,

microVitoria,

ultimasEmocoes:
historicoCompleto
.slice(-5)
.map(item=>item.emocao),

historicoConversa:
conversa.slice(-8),

historicoDetalhado:
historicoCompleto
.slice(-5)
.map(item=>({

emocao:item.emocao,
score:item.score_hawkins,
hawkins:item.score_hawkins

}))

})

}

);

if (!response.ok) {

throw new Error(
"Erro na API"
);

}

const data =
await response.json();

const { error } =
await supabase
  .from("historico_emocional")
  .insert([
    {
      user_id: usuario?.id,
      email: usuario?.email || "anonimo",
      emocao: estadoAtual.emocao,
      score_hawkins: estadoAtual.hawkins,
      mensagem: texto,
      resposta_ia: data?.resposta || ""
    }
  ]);

console.log(
  "ERRO HISTORICO:",
  JSON.stringify(error, null, 2)
);

console.log(
  "RESPOSTA IA:",
  data
);

setDadosGrafico((prev) => [
  ...prev,
  {
    dia: String(prev.length + 1),
    hawkins: data?.hawkins || 100
  }
]);

const respostaIA =

data?.resposta ||

gerarMensagemEvolutiva(
estadoAtual.emocao
);

setConversa(prev=>[

...prev,

{
tipo:"ia",
texto:respostaIA
}

]);

}
catch(err){

console.log(
"Erro IA:",
err
);

}
finally{

setLoading(false);

}

}

  /* =========================================
     ADMIN DASHBOARD
  ========================================= */

  if (
    mostrarAdmin &&
    isAdmin
  ) {

    return (
      <AdminDashboard
        user={usuario}
        onVoltar={() =>
          setMostrarAdmin(false)
        }
      />
    );
  }

  /* =========================================
     EMOÇÕES
  ========================================= */

  const emocoes = [
    {
      nome: "Ansioso",
      cor: "#f59e0b",
    },
    {
      nome: "Cansado",
      cor: "#38bdf8",
    },
    {
      nome: "Confuso",
      cor: "#06b6d4",
    },
    {
      nome: "Deprimido",
      cor: "#3b82f6",
    },
    {
      nome: "Desmotivado",
      cor: "#0ea5e9",
    },
    {
      nome: "Esperançoso",
      cor: "#14b8a6",
    },
    {
      nome: "Feliz",
      cor: "#facc15",
    },
    {
      nome: "Motivado",
      cor: "#22c55e",
    },
    {
      nome: "Procrastinador",
      cor: "#06b6d4",
    },
    {
      nome: "Raiva",
      cor: "#ec4899",
    },
    {
      nome: "Sem foco",
      cor: "#22d3ee",
    },
    {
      nome: "Triste",
      cor: "#3b82f6",
    },
  ];

  return (

    <div style={styles.container}>

      <Sidebar
usuario={usuario}
plano={planoUsuario}
isAdmin={isAdmin}
estadoAtual={estadoAtual}
saindo={saindo}
sair={sair}
setMostrarAdmin={setMostrarAdmin}
virarPremium={virarPremium}
/>

      <main style={styles.main}>

     <DashboardCards
estadoAtual={estadoAtual}
/>

      <div style={styles.insightsGrid}>
<div style={styles.insightCard}>
     

<h4>
Emoção predominante
</h4>

<p>
{emocaoMaisFrequente}
</p>

</div>

          <div style={styles.insightCard}>
            <h4>
              Tendência emocional
            </h4>
            <p>
              {tendenciaEmocional}
            </p>
          </div>

          <div style={styles.insightCard}>
            <h4>
              Estabilidade emocional
            </h4>
            <p>
              {estabilidadeEmocional}
            </p>
          </div>

          <div style={styles.insightCard}>
            <h4>
              Microvitória
            </h4>
            <p>
              {microVitoria}
            </p>
          </div>
          <div style={styles.insightCard}>

<h4>

🚨 Alerta emocional

</h4>

<p>

{alertaEmocional.texto}

</p>

</div>

<div style={styles.insightCard}>

<h4>

🧠 Diagnóstico Adaptativo

</h4>

<p>

{diagnosticoAdaptativo}

</p>

</div>

        </div>

        <div style={styles.recomendacaoCard}>

{trilhaAtual && (

<div
style={{
fontSize:11,
marginBottom:8,
color:"#67e8f9",
lineHeight:1.6
}}
>

🫁 {trilhaAtual.respiracao}

<br/>

🧠 {trilhaAtual.pnl}

<br/>

⚡ {trilhaAtual.microacao}

</div>

)}

<h3
style={{
margin:"0",
fontSize:18
}}
>
Insight evolutivo IA
</h3>

<p
style={{
margin:"2px 0",
fontSize:13,
lineHeight:"20px",
whiteSpace:"normal",
overflow:"visible"
}}
>
{recomendacaoIA}
</p>

<div
style={{
fontSize:12,
color:"#22d3ee",
fontWeight:"bold"
}}
>
Média Hawkins: {mediaHawkins}
</div>

        </div>
                <div
style={{
display:"flex",
justifyContent:"space-between",
fontSize:11,
opacity:.7,
padding:"0 10px",
marginTop:-4,
marginBottom:10
}}
>

<span>Contração</span>
<span>Transição</span>
<span>Expansão</span>

</div>

<div
style={{
minHeight:85,
maxHeight:85,
marginBottom:8,
overflow:"hidden",
flexShrink:0
}}
>
<GraficoEvolucao dados={dadosGrafico} />
</div>

<h3
style={{
marginBottom:10,
marginTop:6
}}
>
Selecione seu estado emocional
</h3>
        

        <div style={styles.emocoes}>

          {emocoes.map((emocao) => {

            const ativo =
              emocaoSelecionada ===
              emocao.nome;

            return (

              <button
                key={emocao.nome}

                onClick={async () => {

                  setEmocaoSelecionada(
                    emocao.nome
                  );

                  setMensagem(
                    `Estou me sentindo ${emocao.nome}`
                  );

                  await salvarEmocao(
                    emocao.nome
                  );
                }}

                style={{
                  ...styles.emocaoBtn,

                  border:
                    `2px solid ${emocao.cor}`,

                  background: ativo
? `linear-gradient(
90deg,
${emocao.cor},
${emocao.cor}dd
)`
: "transparent",

color: ativo
? "#081018"
: "#ffffff",

boxShadow: ativo
? `0 0 25px ${emocao.cor}`
: `0 0 10px ${emocao.cor}55`,

transform: ativo
? "scale(1.05)"
: "scale(1)",

fontWeight:
ativo
? 700
: 500,
                }}
              >
                {emocao.nome}
              </button>
            );
          })}

        </div>

        <PainelIA
conversa={conversa}
mensagem={mensagem}
setMensagem={setMensagem}
enviarMensagem={enviarMensagem}
loading={loading}
chatEndRef={chatEndRef}
/>

      </main>

    </div>
  );
}

const styles = {

  container:{
   display:"flex",

   width:"100%",

   height:"100vh",

   background:"#020617",

   color:"white",

   fontFamily:"Inter,sans-serif",

   overflow:"hidden",
},

  sidebar:{
width:"260px",
flexShrink:0,
background:"linear-gradient(180deg,#071226,#0f172a)",
padding:24,
display:"flex",
flexDirection:"column",
gap:18,
borderRight:"1px solid #1e293b",
height:"100vh",
boxSizing:"border-box",
overflowY:"auto",
overflowX:"hidden",
paddingBottom:25,
},

  avatar: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    background:
      "linear-gradient(90deg,#22d3ee,#67e8f9)",
    boxShadow:
      "0 0 25px #22d3ee",
  },

  logo: {
    fontSize: 28,
    fontWeight: "bold",
  },

  sub: {
    color: "#4ade80",
    fontWeight: "bold",
  },

  plano: {
    color: "#facc15",
    fontWeight: "bold",
  },

  master: {
    background:
      "linear-gradient(90deg,#facc15,#f59e0b)",
    color: "#111827",
    padding: "10px 14px",
    borderRadius: 30,
    fontWeight: "bold",
    textAlign: "center",
    boxShadow:
      "0 0 20px rgba(250,204,21,0.4)",
  },

  adminBtn: {
    border: "none",
    background:
      "linear-gradient(90deg,#facc15,#f59e0b)",
    color: "#111827",
    fontWeight: "bold",
    padding: "14px",
    borderRadius: 14,
    cursor: "pointer",
    boxShadow:
      "0 0 20px rgba(250,204,21,0.35)",
  },

  infoCard:{
   background:"rgba(17,24,39,0.85)",
   padding:12,
   borderRadius:20,
   lineHeight:1.6,
   border:"1px solid #1e293b",

   overflow:"hidden",
   wordBreak:"break-word",
},

  logout:{
marginTop:"auto",

 marginBottom:18,

width:"100%",

height:44,

border:"none",

borderRadius:14,

background:
"linear-gradient(90deg,#fb7185,#f472b6)",

color:"white",

fontWeight:"bold",

cursor:"pointer",

flexShrink:0,
},

  main:{
   flex:1,

   padding:"10px 16px",

   display:"flex",

   flexDirection:"column",

   height:"100vh",

   minHeight:0,

   overflowY:"auto",

   overflowX:"hidden",

   gap:6,
},

  topCards:{
   display:"grid",
   gridTemplateColumns:"repeat(3,minmax(150px,1fr))",
   gap:12,
},

  card:{
   flex:1,
   background:
   "linear-gradient(180deg,#0b1120,#111827)",
   padding:6,
minHeight:60,
   borderRadius:18,
   border:"1px solid #1e293b",
   boxShadow:"0 0 30px rgba(34,211,238,0.08)"
},

  insightsGrid:{
display:"grid",

gridTemplateColumns:
"repeat(auto-fit,minmax(180px,1fr))",

gap:10,

flexShrink:0,

alignItems:"stretch",
},

  insightCard: {
  background:
    "linear-gradient(180deg,#111827,#0f172a)",
  padding:6,
  borderRadius:12,
  minHeight:30,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
},

  recomendacaoCard:{
background:
"linear-gradient(90deg,#0f172a,#111827)",

padding:"6px 10px",

borderRadius:18,

minHeight:120,

maxHeight:120,

   overflow:"visible",

   flexShrink:0,
},

  hawkinsInfo: {
    marginTop: 10,
    color: "#22d3ee",
    fontWeight: "bold",
  },

  graphCard:{
background:
"linear-gradient(180deg,#0b1120,#111827)",
borderRadius:20,
padding:1,

height:34,
minHeight:34,
maxHeight:34,

border:"1px solid #1e293b",
flexShrink:0,
overflow:"hidden",
},

  emocoes:{
display:"flex",
gap:6,
flexWrap:"wrap",
flexShrink:0,

marginBottom:1,

overflow:"visible",
},

  emocaoBtn:{

borderRadius:30,

padding:"4px 10px",

cursor:"pointer",

fontWeight:"bold",

fontSize:13,

minWidth:70,

whiteSpace:"nowrap",

transition:"0.3s",

background:"transparent",

flexShrink:1,

},

  chatContainer:{
   flex:1,

   display:"flex",

   flexDirection:"column",

   minHeight:180,

   maxHeight:180,

   overflow:"hidden",

   background:
   "linear-gradient(180deg,#0b1120,#111827)",

   borderRadius:24,

   border:"1px solid #1e293b",

   marginTop:2,

   flexShrink:0,
},

  chatArea:{
   flex:1,

   padding:12,

   display:"flex",

   flexDirection:"column",

   gap:14,

   overflowY:"auto",

   overflowX:"hidden",

   minHeight:0,

   scrollbarWidth:"thin",
},
estadoVazio:{
display:"flex",

flexDirection:"column",

justifyContent:"center",

alignItems:"center",

height:"100%",

padding:"4px 20px",

textAlign:"center",

borderRadius:18,

background:"rgba(255,255,255,.03)",

minHeight:50,
},
  msg:{

maxWidth:"75%",

padding:"14px 18px",

borderRadius:18,

lineHeight:1.7,

whiteSpace:"pre-wrap",

fontSize:14,

wordBreak:"break-word",

overflow:"visible",

boxShadow:
"0 0 20px rgba(0,0,0,0.25)",

transition:
"all .3s ease",
},
    inputArea:{
display:"flex",

alignItems:"center",

gap:8,

padding:"8px",

borderTop:"1px solid #1e293b",

minHeight:55,

flexShrink:0,
},

  input:{
flex:1,

minWidth:0,

height:38,

borderRadius:16,

border:"1px solid #1e293b",

background:"#020617",

color:"white",

paddingLeft:16,

outline:"none",

fontSize:16,
},

  send:{
width:110,

height:38,

border:"none",

borderRadius:16,

background:
"linear-gradient(90deg,#14b8a6,#22d3ee)",

color:"white",

fontWeight:700,

fontSize:14,

cursor:"pointer",

transition:"0.3s",

boxShadow:
"0 0 25px rgba(34,211,238,0.4)"
},
};