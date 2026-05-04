// 🔥 IMPORTS (NÃO ALTERADO)
import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import EvolucaoChart from "./EvolucaoChart";

const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "sb_publishable_JGrrfcfRg8fko94mFIGpyQ_mDmSxo5K"
);

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";
const ADMIN_EMAIL = "contatobetaoofertas@gmail.com";

const EMOCOES = ["Ansioso","Triste","Feliz","Estressado","Desmotivado","Deprimido","Procrastinador"];

const MAPA = {
  Deprimido:1,
  Desmotivado:2,
  Triste:3,
  Ansioso:4,
  Estressado:5,
  Procrastinador:6,
  Feliz:8
};

export default function App() {

/* ================= STATES ================= */

const [session, setSession] = useState(null);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [modoCadastro, setModoCadastro] = useState(false);
const [loading, setLoading] = useState(false);

const [texto, setTexto] = useState("");
const [emocao, setEmocao] = useState("Ansioso");
const [grafico, setGrafico] = useState([]);

const [plano, setPlano] = useState("free");
const [isAdmin, setIsAdmin] = useState(false);
const [metricas, setMetricas] = useState(null);

const [chat, setChat] = useState([]);
const [modo, setModo] = useState("terapeutico");
const [modoProfundo, setModoProfundo] = useState(false);

const [mostrarCTA, setMostrarCTA] = useState(false);

const chatRef = useRef(null);

const isPremium = plano === "premium" || isAdmin;

/* ================= 🔥 PERSISTÊNCIA POR USUÁRIO ================= */

const getChatKey = () => {
  return session?.user?.id ? `chat_${session.user.id}` : null;
};

useEffect(() => {
  if (!session?.user) return;

  const key = getChatKey();
  const salvo = localStorage.getItem(key);

  if (salvo) setChat(JSON.parse(salvo));
}, [session]);

useEffect(() => {
  const key = getChatKey();
  if (key) localStorage.setItem(key, JSON.stringify(chat));
}, [chat, session]);

/* ================= LOGOUT (CORRIGIDO FORTE) ================= */

const logout = async () => {
  await supabase.auth.signOut();

  const key = getChatKey();
  if (key) localStorage.removeItem(key);

  setEmail("");
  setPassword("");
  setChat([]);
  setSession(null);
};

/* ================= SCROLL ================= */

useEffect(() => {
  chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
}, [chat]);

/* ================= AUTH ================= */

useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session);
  });

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_, session) => {
      setSession(session);
      setTexto("");
      setGrafico([]);
    }
  );

  return () => listener?.subscription?.unsubscribe();
}, []);

/* ================= USER ================= */

useEffect(() => {
  if (session?.user) {
    buscarUsuario();
    buscarRegistros();
    if (session.user.email === ADMIN_EMAIL) carregarMetricas();
  }
}, [session]);

/* ================= LOGIN ================= */

const login = async () => {
  setLoading(true);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert("Erro no login");
  setLoading(false);
};

/* ================= CADASTRO ================= */

const cadastrar = async () => {
  setLoading(true);
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) alert("Erro ao cadastrar");
  else {
    alert("Conta criada!");
    setModoCadastro(false);
  }
  setLoading(false);
};

/* ================= STRIPE ================= */

const handleUpgrade = async () => {
  const res = await fetch(`${BACKEND_URL}/criar-checkout`, { method: "POST" });
  const data = await res.json();
  if (data.url) window.location.href = data.url;
};

/* ================= USER ================= */

const buscarUsuario = async () => {
  const emailUser = session.user.email;

  let { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", emailUser)
    .maybeSingle();

  const admin = emailUser === ADMIN_EMAIL;

  if (!data) {
    const { data: novo } = await supabase
      .from("profiles")
      .insert([{ email: emailUser, plano: admin ? "premium":"free", is_admin: admin }])
      .select()
      .single();

    data = novo;
  }

  setPlano(admin ? "premium" : data?.plano || "free");
  setIsAdmin(admin || data?.is_admin || false);
};

/* ================= REGISTROS ================= */

const buscarRegistros = async () => {
  const { data } = await supabase
    .from("registros_emocionais")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: true });

  setGrafico(
    data?.map(d => ({
      data: new Date(d.created_at).toLocaleDateString(),
      valor: MAPA[d.emocao] || 5
    })) || []
  );
};

/* ================= ADMIN ================= */

const carregarMetricas = async () => {
  const res = await fetch(`${BACKEND_URL}/admin-metricas`);
  const data = await res.json();
  setMetricas(data);
};

/* ================= IA ================= */

const falarComIA = async () => {

  if (!texto || !session?.user) return;

  const textoLower = texto.toLowerCase();

  /* 🔥 ENCERRAMENTO */
  if (
    textoLower.includes("obrigado") ||
    textoLower.includes("valeu") ||
    textoLower.includes("tchau")
  ) {
    setChat(prev => [
      ...prev,
      { tipo: "user", texto },
      { tipo: "ia", texto: "Foi um prazer te ouvir. Estarei aqui sempre que precisar. 🌱" }
    ]);
    setTexto("");
    return;
  }

  const novoChat = [...chat, { tipo: "user", texto }];
  setChat(novoChat);
  setTexto("");
  setLoading(true);

  const res = await fetch(`${BACKEND_URL}/ia`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      texto,
      emocao,
      user_id: session.user.id,
      modo,
      modoProfundo
    })
  });

  const data = await res.json();

  setChat([...novoChat, { tipo:"ia", texto: data.resposta }]);

  if (!isPremium && modo === "terapeutico") {
    if (textoLower.includes("ansiedade") || textoLower.includes("triste")) {
      setMostrarCTA(true);
    }
  }

  buscarRegistros();
  setLoading(false);
};

/* ================= LOGIN UI ================= */

if (!session) {
  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <h2>NeuroMapa360</h2>

        <input style={styles.input} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input style={styles.input} type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)}/>

        <button style={styles.button} onClick={modoCadastro ? cadastrar : login}>
          {loading ? "Processando..." : modoCadastro ? "Criar Conta" : "Entrar"}
        </button>

        <p style={styles.link} onClick={()=>setModoCadastro(!modoCadastro)}>
          {modoCadastro ? "Já tem conta? Login" : "Criar conta"}
        </p>
      </div>
    </div>
  );
}

/* ================= APP ================= */

return (
  <div style={styles.app}>

    <div style={styles.sidebar}>
      <h2>Neuro360</h2>

      <p style={{color:"#22c55e"}}>
        Plano: {isPremium ? "Premium ✅" : "Free"}
      </p>

      {!isPremium && (
        <button onClick={handleUpgrade} style={styles.upgrade}>
          🚀 Desbloquear Premium
        </button>
      )}

      {isAdmin && <p style={{color:"#facc15"}}>ADMIN 👑</p>}

      {isAdmin && metricas && (
        <div style={{ marginTop: 20 }}>
          <h3>📊 Admin</h3>
          <p>Usuários: {metricas.usuarios}</p>
          <p>Registros: {metricas.registros}</p>
          <p>IA: {metricas.ia}</p>
        </div>
      )}

      {/* 🔥 SUPORTE REAL */}
      <a
        href="https://wa.me/5561993338458"
        target="_blank"
        rel="noreferrer"
        style={{display:"block",marginTop:15,color:"#38bdf8"}}
      >
        💬 Suporte
      </a>

      <button onClick={logout} style={styles.logout}>Sair</button>
    </div>

    <div style={styles.main}>
      <div ref={chatRef} style={styles.chatBox}>
        {chat.map((msg, i) => (
          <div key={i} style={{
            ...styles.bubble,
            alignSelf: msg.tipo === "user" ? "flex-end" : "flex-start",
            background: msg.tipo === "user" ? "#22c55e" : "#334155"
          }}>
            {msg.texto}
          </div>
        ))}

        {loading && (
          <div style={{...styles.bubble, background:"#334155"}}>
            🧠 IA está analisando...
          </div>
        )}
      </div>

      <div style={styles.inputBar}>
        <select value={emocao} onChange={e=>setEmocao(e.target.value)}>
          {EMOCOES.map(e => <option key={e}>{e}</option>)}
        </select>

        <input
          value={texto}
          onChange={(e)=>setTexto(e.target.value)}
          placeholder="Escreva o que está sentindo..."
        />

        <button onClick={falarComIA}>
          {loading ? "..." : "Enviar"}
        </button>
      </div>

      {grafico.length > 0 && <EvolucaoChart data={grafico}/>}
    </div>
  </div>
);
}

/* ================= STYLES ================= */

const styles = {
  app:{display:"flex",height:"100vh",background:"#0f172a",color:"#fff"},
  sidebar:{width:220,background:"#020617",padding:20},
  main:{flex:1,display:"flex",flexDirection:"column"},
  chatBox:{flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:10},
  bubble:{padding:12,borderRadius:10,maxWidth:"60%"},
  inputBar:{display:"flex",gap:10,padding:10,background:"#1e293b"},
  input:{padding:10},
  loginContainer:{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh",background:"#0f172a"},
  loginCard:{background:"#1e293b",padding:30,borderRadius:10,display:"flex",flexDirection:"column",gap:10,width:300},
  button:{padding:10,background:"#22c55e",border:"none",borderRadius:5,color:"#fff"},
  link:{cursor:"pointer",color:"#38bdf8"},
  logout:{marginTop:20,background:"#ef4444",border:"none",padding:10,borderRadius:5,color:"#fff",cursor:"pointer"},
  upgrade:{marginTop:10,background:"#22c55e",border:"none",padding:10,borderRadius:5,color:"#000",cursor:"pointer"}
};
