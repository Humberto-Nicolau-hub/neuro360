export function calcularMediaHawkins(
historicoCompleto,
estadoAtual
){

return historicoCompleto.length
? Math.round(

historicoCompleto.reduce(
(acc,item)=>
acc + (item.score_hawkins || 0),
0
)

/

historicoCompleto.length

)

: estadoAtual.hawkins;

}

export function calcularMediaScore(
historicoCompleto,
estadoAtual
){

return historicoCompleto.length
? Math.round(

historicoCompleto.reduce(
(acc,item)=>
acc+(item.score||0),
0
)

/

historicoCompleto.length

)

: estadoAtual.score;

}

export function gerarTendencia(
historicoCompleto
){

if(!historicoCompleto?.length){

return "Aguardando dados emocionais";

}

const ultimos =
historicoCompleto.slice(0,5);

const estadoAtual =
ultimos[0];

const primeiro =
ultimos[ultimos.length - 1];

const hawkinsAtual =
estadoAtual?.score_hawkins || 0;

const hawkinsInicial =
primeiro?.score_hawkins || 0;

const diferenca =
hawkinsAtual - hawkinsInicial;

/* ==========================
OSCILAÇÃO
========================== */

const emocoesDiferentes =
new Set(
ultimos.map(
item => item.emocao
)
).size;

if(
emocoesDiferentes >= 4
){

return "⚠️ Oscilação emocional recente";

}

/* ==========================
QUEDA RECENTE
========================== */

if(
diferenca <= -100
){

return "📉 Queda emocional recente";

}

/* ==========================
CONTRAÇÃO
========================== */

if(
hawkinsAtual < 200
){

return "🔄 Processo de reorganização emocional";

}

/* ==========================
TRANSIÇÃO
========================== */

if(
hawkinsAtual >= 200 &&
hawkinsAtual < 300
){

return "📈 Evolução emocional positiva";

}

/* ==========================
EXPANSÃO
========================== */

if(
hawkinsAtual >= 300 &&
hawkinsAtual < 500
){

return "🚀 Expansão emocional consistente";

}

/* ==========================
ALTA PERFORMANCE
========================== */

if(
hawkinsAtual >= 500
){

return "⭐ Consciência emocional elevada";

}

return "⚖️ Estabilidade emocional";

}

export function gerarEstabilidade(
mediaHawkins
){

return mediaHawkins>=300

? "Estabilidade crescente"

: "Processo de reorganização emocional";

}

export function gerarAlerta(
historicoCompleto,
mediaHawkins
){

const ultimas =
historicoCompleto
.slice(-5)
.map(item=>item.emocao);

const diferentes =
new Set(ultimas).size;

if(diferentes>=4){

return{
tipo:"alerta",
texto:
"Oscilação emocional elevada detectada."
};

}

if(mediaHawkins>=300){

return{
tipo:"positivo",
texto:
"Estabilidade emocional crescente."
};

}

return{
tipo:"atencao",
texto:
"Processo gradual de reorganização emocional."
};

}