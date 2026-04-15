import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZHp3eGdhYnVhZHNucGxjc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0Njc4NDMsImV4cCI6MjA5MDA0Mzg0M30.GMxoMDJha-vJg0j32koiR8D2oNMUHs39bTs3LAw8cn4"
);

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("Ansioso");
  const [resposta, setResposta] = useState("");
  const [loading, setLoading] = useState(false);
  const [plano, setPlano] = useState("free");
  const [score, setScore] = useState(0);

  // 🔐 Sessão
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // 🔄 Trocar usuário
  const limparSessao = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  // 🔐 Login
  const login = async () => {
    await supabase.auth.signInWithOtp({ email });
    alert("Verifique seu email 📩");
  };

  // 🧠 CALCULAR SCORE
  const calcularScore = async () => {
    if (!session?.user?.id) return;

    const { data } = await supabase
      .from("registros")
      .select("emocao")
      .eq("user_id", session.user.id);

    if (!data) return;

    let total = 0;

    data.forEach((item) => {
      if (item.emocao === "Feliz") total += 2;
      if (item.emocao === "Cansado") total += 0;
      if (item.emocao === "Triste") total -= 1;
      if (item.emocao === "Ansioso") total -= 2;
    });

    setScore(total);
  };

  useEffect(() => {
    calcularScore();
  }, [session]);

  // 🤖 IA
  const falarComIA = async () => {
    try {
      setLoading(true);

      const res = await fetch("https://neuro360-tkyx.onrender.com/ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texto,
          emocao,
          user_id: session?.user?.id,
        }),
      });

      const data = await res.json();

      setResposta(data.resposta);
      setPlano(data.plano || "free");

      calcularScore(); // 🔥 atualiza score

    } catch {
      alert("Erro IA");
    } finally {
      setLoading(false);
    }
  };

  // 🔐 LOGIN
  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h1>NeuroMapa360</h1>
        <input
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br /><br />
        <button onClick={login}>Entrar</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6 flex justify-center">

      <div className="w-full max-w-3xl">

        {/* HEADER */}
        <div className="bg-white p-5 rounded-2xl shadow mb-6">
          <h1 className="text-2xl font-bold">NeuroMapa360</h1>
          <p>{session.user.email}</p>
          <p>Plano: {plano}</p>
          <p className="mt-2 font-semibold">
            Score emocional: {score}
          </p>

          <button
            onClick={limparSessao}
            className="mt-3 bg-gray-200 px-4 py-2 rounded"
          >
            Trocar usuário
          </button>
        </div>

        {/* PREMIUM */}
        {plano !== "premium" && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-2xl shadow mb-6 flex justify-between items-center">
            <div>
              <h2>Desbloqueie o Premium</h2>
              <p>IA avançada + análise emocional</p>
            </div>

            <button
              onClick={() =>
                window.open("https://buy.stripe.com/test_6oU7sKeRr9mzgU22wvfIs00", "_blank")
              }
              className="bg-white text-black px-4 py-2 rounded"
            >
              Premium ⭐
            </button>
          </div>
        )}

        {/* INPUT */}
        <div className="bg-white p-6 rounded-2xl shadow mb-6">
          <select
            value={emocao}
            onChange={(e) => setEmocao(e.target.value)}
          >
            <option>Ansioso</option>
            <option>Triste</option>
            <option>Feliz</option>
            <option>Cansado</option>
          </select>

          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Digite..."
          />

          <button onClick={falarComIA}>
            {loading ? "..." : "Enviar"}
          </button>
        </div>

        {/* RESPOSTA */}
        {resposta && (
          <div className="bg-white p-6 rounded-2xl shadow">
            {resposta}
          </div>
        )}
      </div>
    </div>
  );
}
