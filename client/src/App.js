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

  const limparSessao = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  const login = async () => {
    await supabase.auth.signInWithOtp({ email });
    alert("Verifique seu email 📩");
  };

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
    } catch (err) {
      alert("Erro ao conectar com IA");
    } finally {
      setLoading(false);
    }
  };

  // LOGIN
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-md w-96">
          <h1 className="text-2xl font-bold mb-4 text-center">
            NeuroMapa360
          </h1>

          <input
            className="w-full p-2 border rounded mb-4"
            placeholder="Seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            onClick={login}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Entrar / Cadastrar
          </button>
        </div>
      </div>
    );
  }

  // APP
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">NeuroMapa360</h1>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {session.user.email}
          </span>

          <button
            onClick={limparSessao}
            className="text-sm bg-gray-200 px-3 py-1 rounded"
          >
            Trocar usuário
          </button>
        </div>
      </div>

      {/* BOTÃO PREMIUM */}
      <div className="mb-6">
        <button className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-xl shadow">
          ⭐ Upgrade para Premium
        </button>
      </div>

      {/* CARD INPUT */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6 max-w-xl">
        <h3 className="text-lg font-semibold mb-4">
          Como você está se sentindo?
        </h3>

        <select
          value={emocao}
          onChange={(e) => setEmocao(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        >
          <option>Ansioso</option>
          <option>Triste</option>
          <option>Feliz</option>
          <option>Cansado</option>
        </select>

        <input
          className="w-full p-2 border rounded mb-4"
          placeholder="Descreva como você está"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />

        <button
          onClick={falarComIA}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Processando..." : "Falar com IA"}
        </button>
      </div>

      {/* CARD RESPOSTA */}
      {resposta && (
        <div className="bg-white p-6 rounded-2xl shadow max-w-xl">
          <h3 className="text-lg font-semibold mb-2">Resposta:</h3>
          <p className="text-gray-700 whitespace-pre-line">
            {resposta}
          </p>
        </div>
      )}
    </div>
  );
}
