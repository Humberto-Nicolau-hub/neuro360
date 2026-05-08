const mapaHawkins = {

  vergonha: {
    frequencia: 20,
    nivel: "Destrutivo"
  },

  culpa: {
    frequencia: 30,
    nivel: "Autopunição"
  },

  apatia: {
    frequencia: 50,
    nivel: "Desesperança"
  },

  tristeza: {
    frequencia: 75,
    nivel: "Sofrimento"
  },

  medo: {
    frequencia: 100,
    nivel: "Ansiedade"
  },

  desejo: {
    frequencia: 125,
    nivel: "Compulsão"
  },

  raiva: {
    frequencia: 150,
    nivel: "Frustração"
  },

  orgulho: {
    frequencia: 175,
    nivel: "Defesa do ego"
  },

  coragem: {
    frequencia: 200,
    nivel: "Virada emocional"
  },

  neutralidade: {
    frequencia: 250,
    nivel: "Estabilidade"
  },

  disposicao: {
    frequencia: 310,
    nivel: "Abertura"
  },

  aceitacao: {
    frequencia: 350,
    nivel: "Maturidade emocional"
  },

  razao: {
    frequencia: 400,
    nivel: "Consciência racional"
  },

  amor: {
    frequencia: 500,
    nivel: "Expansão emocional"
  },

  alegria: {
    frequencia: 540,
    nivel: "Elevação"
  },

  paz: {
    frequencia: 600,
    nivel: "Consciência elevada"
  }
};

export default function calcularFrequenciaHawkins(emocao) {

  const chave =
    emocao?.toLowerCase();

  return (
    mapaHawkins[chave] || {
      frequencia: 100,
      nivel: "Indefinido"
    }
  );
}
