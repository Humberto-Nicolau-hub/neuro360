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
emocoesDiferentes >= 4 &&
hawkinsAtual < 300
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
hawkinsAtual
){

return hawkinsAtual >= 300

? "Estabilidade crescente"

: "Processo de reorganização emocional";

}

export function gerarAlerta(
historicoCompleto
){

if(!historicoCompleto?.length){

return{
tipo:"atencao",
texto:"Aguardando dados emocionais."
};

}

const estadoAtual =
historicoCompleto[0];

const hawkinsAtual =
estadoAtual?.score_hawkins || 0;

const ultimas =
historicoCompleto
.slice(0,5)
.map(item=>item.emocao);

const diferentes =
new Set(ultimas).size;

/* ALTA CONSCIÊNCIA */

if(hawkinsAtual >= 500){

return{
tipo:"positivo",
texto:
"Consciência emocional elevada e estável."
};

}

/* OSCILAÇÃO */

if(
diferentes >= 4 &&
hawkinsAtual < 300
){

return{
tipo:"alerta",
texto:
"Oscilação emocional elevada detectada."
};

}

/* EXPANSÃO */

if(hawkinsAtual >= 300){

return{
tipo:"positivo",
texto:
"Estabilidade emocional crescente."
};

}

/* CONTRAÇÃO */

return{
tipo:"atencao",
texto:
"Processo gradual de reorganização emocional."
};

}