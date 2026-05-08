export default function preverEstadoEmocional(memoria = []) {

  if (!memoria.length) {

    return {
      risco: "baixo",
      tendencia: "estavel",
      alerta: false,
      resumo:
        "Sem dados suficientes."
    };
  }

  const ultimos =
    memoria.slice(0, 5);

  let scoreNegativo = 0;

  for (const item of ultimos) {

    const freq =
      item.frequencia_hawkins || 100;

    if (freq < 150) {
      scoreNegativo += 2;
    }

    else if (freq < 250) {
      scoreNegativo += 1;
    }
  }

  let risco = "baixo";
  let tendencia = "estavel";
  let alerta = false;
  let resumo =
    "Estado emocional estável.";

  if (scoreNegativo >= 8) {

    risco = "alto";

    tendencia =
      "queda emocional";

    alerta = true;

    resumo =
      "Detectada possível recaída emocional.";
  }

  else if (
    scoreNegativo >= 4
  ) {

    risco = "medio";

    tendencia =
      "instabilidade emocional";

    resumo =
      "Oscilações emocionais identificadas.";
  }

  return {
    risco,
    tendencia,
    alerta,
    resumo
  };
}
