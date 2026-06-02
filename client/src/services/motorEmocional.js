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
mediaScore
){

return mediaScore>=70

? "Evolução positiva"

: mediaScore>=50

? "Oscilação moderada"

: "Momento de fortalecimento emocional";

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