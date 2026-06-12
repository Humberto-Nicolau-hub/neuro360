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

const hawkinsAtual =
estadoAtual?.score_hawkins || 0;


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
hawkinsAtual < 200
){
   return "🔄 Processo de reorganização emocional";
}

if(
hawkinsAtual >= 200 &&
hawkinsAtual < 300
){
   return "📈 Evolução emocional positiva";
}

if(
hawkinsAtual >= 300 &&
hawkinsAtual < 500
){
   return "🚀 Expansão emocional consistente";
}

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

    if(mediaHawkins >= 500){

return{
tipo:"positivo",
texto:
"Consciência emocional elevada e estável."
};

}

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