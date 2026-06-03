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
historicoCompleto,
mediaHawkins
){

if(!historicoCompleto?.length){

return "Aguardando dados emocionais";
}

const ultimos =
historicoCompleto
.slice(0,5);

const primeiro =
ultimos[ultimos.length - 1];

const ultimo =
ultimos[0];

const hawkinsInicial =
primeiro?.score_hawkins || 0;

const hawkinsFinal =
ultimo?.score_hawkins || 0;

const diferenca =
hawkinsFinal -
hawkinsInicial;

/* ==========================
EVOLUÇÃO
========================== */

if(
diferenca >= 100
){

return "📈 Evolução emocional positiva";
}

/* ==========================
EXPANSÃO
========================== */

if(
mediaHawkins >= 300
){

return "🚀 Expansão emocional consistente";
}

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
ESTABILIDADE
========================== */

if(
Math.abs(diferenca) <= 30
){

return "⚖️ Estabilidade emocional";
}

/* ==========================
PADRÃO PADRÃO
========================== */

return "🔄 Processo de fortalecimento emocional";

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