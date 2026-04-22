import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import EvolucaoChart from "./EvolucaoChart";

const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZHp3eGdhYnVhZHNucGxjc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0Njc4NDMsImV4cCI6MjA5MDA0Mzg0M30.GMxoMDJha-vJg0j32koiR8D2oNMUHs39bTs3LAw8cn4"
);

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("Ansioso");
  const [resposta, setResposta] = useState("");
  const [relatorio, setRelatorio] = useState("");
  const [plano, setPlano] = useState("free");
  const [grafico, setGrafico] = useState([]);
  const [loading, setLoading] = useState(false);

  const topRef = useRef(null);

  const scrollTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const buscarPlano = async (user_id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/plano/${user_id}`);
      const data = await res.json();
      return data.plano || "free";
    } catch {
      return "free";
    }
  };

  const carregarGrafico = async (user_id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/evolucao/${user_id}`);
      const data = await res.json();
      setGrafico(Array.isArray(data) ? data : []);
    } catch {
      setGrafico([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionData = data.session;

      setSession(sessionData);

      if (sessionData?.user) {
        const user_id = sessionData.user.id;

        const planoAtual = await buscarPlano(user_id);
        setPlano(planoAtual);

        await carregarGrafico(user_id);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setSession(session);

        if (session?.user) {
          const user_id = session.user.id;

          const planoAtual = await buscarPlano(user_id);
          setPlano(planoAtual);

          await carregarGrafico(user_id);
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async () => {
    if (!email) return alert("Digite um email");

    const password = "123456";

    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.session) return;

    await supabase.auth.signUp({ email, password });

    alert("Conta criada ou logada!");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  const falarComIA = async () => {
    if (!texto) return alert("Descreva o que está sentindo");

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/ia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto,
          emocao,
          user_id: session?.user?.id,
        }),
      });

      const data = await res.json();

      setResposta(data.resposta || "");

      if (data.plano) setPlano(data.plano);

      if (session?.user?.id) {
        await carregarGrafico(session.user.id);
      }

      scrollTop();
    } catch {
      alert("Erro IA");
    }

    setLoading(false);
  };

  const gerarRelatorio = async () => {
    if (plano !== "premium") {
      return alert("🔒 Premium apenas");
    }

    try {
      const res = await fetch(`${BACKEND_URL}/relatorio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session?.user?.id,
        }),
      });

      const data = await res.json();
      setRelatorio(data.relatorio || "");

      scrollTop();
    } catch {
      alert("Erro relatório");
    }
  };

  const irParaPagamento = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
        }),
      });

      const data = await res.json();
      window.location.href = data.url;
    } catch {
      alert("Erro pagamento");
    }
  };

  const isAdmin =
    session?.user?.email === "contatobetaoofertas@gmail.com";

  if (!session) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>NeuroMapa360</h1>

          <input
            style={styles.input}
            placeholder="Seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button style={styles.button} onClick={login}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <div ref={topRef}></div>

      <div style={styles.container}>
        <div style={styles.appBox}>
          <h1>NeuroMapa360</h1>

          <p><strong>Plano:</strong> {plano.toUpperCase()}</p>

          <button style={styles.logout} onClick={logout}>
            Sair
          </button>

          {isAdmin && <div style={styles.adminBox}>🔐 Admin ativo</div>}

          {plano === "free" && (
            <button style={styles.upgrade} onClick={irParaPagamento}>
              Upgrade Premium
            </button>
          )}

          <select
            style={styles.input}
            value={emocao}
            onChange={(e) => setEmocao(e.target.value)}
          >
            <option>Ansioso</option>
            <option>Triste</option>
            <option>Feliz</option>
            <option>Estressado</option>
          </select>

          <input
            style={styles.input}
            placeholder="Descreva como você está"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />

          <button style={styles.button} onClick={falarComIA}>
            {loading ? "Pensando..." : "Falar com IA"}
          </button>

          <button style={styles.secondary} onClick={gerarRelatorio}>
            Gerar Relatório
          </button>

          {resposta && (
            <div style={styles.responseBox}>
              <h3>Resposta da IA</h3>
              <p>{resposta}</p>
            </div>
          )}

          {relatorio && (
            <div style={styles.responseBox}>
              <h3>Relatório</h3>
              <p>{relatorio}</p>
            </div>
          )}

          {grafico.length > 0 && (
            <div style={styles.responseBox}>
              <h3>Evolução Emocional</h3>
              <EvolucaoChart data={grafico} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
