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

  // 🔐 Sessão
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
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
    try {
      await supabase.auth.signInWithOtp({ email });
      alert("Verifique seu email 📩");
    } catch (err) {
      alert("Erro no login");
    }
  };

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

      if (!res.ok) {
        throw new Error(data.erro || "Erro no servidor");
      }

      setResposta(data.resposta);
    } catch (err) {
      alert("Erro ao conectar com IA");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔐 LOGIN SCREEN
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
        <button onClick={login}>Entrar / Cadastrar</button>
      </div>
    );
  }

  // 🚀 APP PRINCIPAL
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6 flex justify-center">

      <div className="w-full max-w-3xl">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow p-5 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">NeuroMapa360</h1>
            <p className="text-sm text-gray-500">{session.user.email}</p>
          </div>

          <button
            onClick={limparSessao}
            className="bg-gray-200 px-4 py-2 rounded-lg text-sm"
          >
            Trocar usuário
          </button>
        </div>

        {/* PREMIUM */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-2xl shadow mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">
              Desbloqueie sua evolução emocional
            </h2>
            <p className="text-sm opacity-90">
              Memória emocional + IA personalizada
            </p>
          </div>

          <button
            onClick={() =>
              window.open("https://buy.stripe.com/test_6oU7sKeRr9mzgU22wvfIs00", "_blank")
            }
            className="bg-white text-black px-4 py-2 rounded-lg font-semibold"
          >
            Premium ⭐
          </button>
        </div>

        {/* INPUT */}
        <div className="bg-white p-6 rounded-2xl shadow mb-6">

          <h3 className="text-lg font-semibold mb-4">
            Como você está se sentindo?
          </h3>

          <div className="flex gap-3 mb-4">
            <select
              value={emocao}
              onChange={(e) => setEmocao(e.target.value)}
              className="p-2 border rounded w-1/3"
            >
              <option>Ansioso</option>
              <option>Triste</option>
              <option>Feliz</option>
              <option>Cansado</option>
            </select>

            <input
              className="p-2 border rounded w-full"
              placeholder="Descreva como você está"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </div>

          <button
            onClick={falarComIA}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
          >
            {loading ? "Processando..." : "Falar com IA"}
          </button>
        </div>

        {/* RESPOSTA */}
        {resposta && (
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="text-lg font-semibold mb-3">
              Sua análise:
            </h3>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {resposta}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
