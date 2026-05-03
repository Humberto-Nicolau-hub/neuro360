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
const chatRef = useRef(null);

const isPremium = plano === "premium" || isAdmin;

/* ================= LOGOUT ================= */
const logout = async () => {
  await supabase.auth.signOut();
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
    (_, session) => setSession(session)
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
  try {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Erro no login");
  } finally {
    setLoading(false);
  }
};

/* ================= CADASTRO ================= */
const cadastrar = async () => {
  try {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert("Erro ao cadastrar");
    else {
      alert("Conta criada!");
      setModoCadastro(false);
    }
  } finally {
    setLoading(false);
  }
};

/* ================= 🔥 UPGRADE STRIPE ================= */
const handleUpgrade = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/criar-checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Erro ao iniciar pagamento");
    }
  } catch {
    alert("Erro pagamento");
  }
};

/* ================= USER ================= */
const buscarUsuario = async () => {
  try {
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

  } catch (err) {
    console.log("Erro user:", err);
  }
};

/* ================= REGISTROS ================= */
const buscarRegistros = async () => {
  try {
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

  } catch {
    console.log("Erro gráfico");
  }
};

/* ================= ADMIN ================= */
const carregarMetricas = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/admin-metricas`);
    const data = await res.json();
    setMetricas(data);
  } catch (err) {
    console.log("Erro métricas:", err);
  }
};

/* ================= IA ================= */
const falarComIA = async () => {

  if (!texto || !session?.user) return;

  const novoChat = [...chat, { tipo: "user", texto }];
  setChat(novoChat);
  setTexto("");
  setLoading(true);

  try {
    const res = await fetch(`${BACKEND_URL}/ia`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        texto,
        emocao,
        user_id: session.user.id,
        historico: novoChat
      })
    });

    const data = await res.json();

    if (data.limite) {
      alert("Você atingiu o limite do plano free 🚀");
    }

    setChat([...novoChat, { tipo:"ia", texto: data.resposta }]);

    buscarRegistros();

  } catch {
    setChat([...novoChat, { tipo:"ia", texto:"Erro na IA." }]);
  }

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
          🚀 Upgrade
        </button>
      )}

      {isAdmin && <p style={{color:"#facc15"}}>ADMIN 👑</p>}

      <button onClick={logout} style={styles.logout}>
        Sair
      </button>

      {/* 🔥 PAINEL ADMIN */}
      {isAdmin && metricas && (
        <div style={styles.adminBox}>
          <h4>📊 Admin</h4>
          <p>Usuários: {metricas.usuarios}</p>
          <p>Registros: {metricas.registros}</p>
          <p>IA: {metricas.ia}</p>
        </div>
      )}
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
      </div>

      <div style={styles.inputBar}>
        <select value={emocao} onChange={e=>setEmocao(e.target.value)}>
          {EMOCOES.map(e => <option key={e}>{e}</option>)}
        </select>

        <input value={texto} onChange={(e)=>setTexto(e.target.value)} placeholder="Digite..."/>
        <button onClick={falarComIA}>{loading ? "..." : "Enviar"}</button>
      </div>

      {grafico.length > 0 && <EvolucaoChart data={grafico}/>}

    </div>
  </div>
);
}

const styles = {
  app:{display:"flex",height:"100vh",background:"#0f172a",color:"#fff"},
  sidebar:{width:200,background:"#020617",padding:20},
  main:{flex:1,display:"flex",flexDirection:"column"},
  chatBox:{flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:10},
  bubble:{padding:12,borderRadius:10,maxWidth:"60%"},
  inputBar:{display:"flex",gap:10,padding:10,background:"#1e293b"},
  input:{flex:1,padding:10},
  loginContainer:{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh",background:"#0f172a"},
  loginCard:{background:"#1e293b",padding:30,borderRadius:10,display:"flex",flexDirection:"column",gap:10,width:300},
  button:{padding:10,background:"#22c55e",border:"none",borderRadius:5,color:"#fff"},
  link:{cursor:"pointer",color:"#38bdf8"},
  logout:{marginTop:20,background:"#ef4444",border:"none",padding:10,borderRadius:5,color:"#fff",cursor:"pointer"},
  upgrade:{marginTop:10,background:"#22c55e",border:"none",padding:10,borderRadius:5,color:"#000",cursor:"pointer"},
  adminBox:{marginTop:20,background:"#111",padding:10,borderRadius:8,fontSize:12}
};
