export default function Sidebar({

usuario,
plano,
isAdmin,
estadoAtual,
saindo,
sair,
setMostrarAdmin

}){

return(

<aside style={styles.sidebar}>

<div style={styles.avatar}/>

<h1 style={styles.logo}>
NeuroMapa360
</h1>

<p style={styles.sub}>
IA Terapêutica Ativa
</p>

<div style={{

...styles.plano,

background:

(plano || "").includes("PREMIUM")

? "linear-gradient(90deg,#facc15,#f59e0b)"

: "rgba(255,255,255,.05)",

padding:"10px",

borderRadius:14,

textAlign:"center",

color:

(plano || "").includes("PREMIUM")

? "#111827"

: "#facc15"

}}>

{

(plano || "").includes("PREMIUM")

? "⭐ " + plano

: "FREE"

}

</div>

{
isAdmin && (

<>
<div style={styles.master}>
ADMIN MASTER
</div>

<button
onClick={()=>
setMostrarAdmin(true)
}
style={styles.adminBtn}
>
Painel Admin
</button>

</>

)
}

<div style={styles.infoCard}>

<div
style={{
overflow:"hidden",
textOverflow:"ellipsis",
whiteSpace:"normal",
wordBreak:"break-word"
}}
>

👤 {usuario?.email}

</div>

<div>
🧠 Emoção:
{" "}
{estadoAtual.emocao}
</div>

<div>
📊 Score:
{" "}
{estadoAtual.score}
</div>

<div>
🔥 Hawkins:
{" "}
{estadoAtual.hawkins}
</div>

<div>
🌐 Consciência:
{" "}
{estadoAtual.consciencia}
</div>

<div>
🛤️ Trilha:
{" "}
{estadoAtual.trilha}
</div>

</div>

<button
onClick={sair}
style={styles.logout}
>

{saindo
? "Saindo..."
: "Sair"}

</button>

</aside>

);

}

const styles={

sidebar:{
width:"260px",
flexShrink:0,
background:"linear-gradient(180deg,#071226,#0f172a)",
padding:24,
display:"flex",
flexDirection:"column",
gap:18,
borderRight:"1px solid #1e293b",
height:"100vh",
boxSizing:"border-box",
overflowY:"auto",
overflowX:"hidden",
paddingBottom:25,
},

avatar:{
width:80,
height:80,
borderRadius:"50%",
background:
"linear-gradient(90deg,#22d3ee,#67e8f9)",
boxShadow:
"0 0 25px #22d3ee",
},

logo:{
fontSize:28,
fontWeight:"bold",
},

sub:{
color:"#4ade80",
fontWeight:"bold",
},

plano:{
color:"#facc15",
fontWeight:"bold",
},

master:{
background:
"linear-gradient(90deg,#facc15,#f59e0b)",
color:"#111827",
padding:"10px 14px",
borderRadius:30,
fontWeight:"bold",
textAlign:"center",
},

adminBtn:{
border:"none",
background:
"linear-gradient(90deg,#facc15,#f59e0b)",
color:"#111827",
fontWeight:"bold",
padding:"14px",
borderRadius:14,
cursor:"pointer",
},

infoCard:{
background:"rgba(17,24,39,0.85)",
padding:12,
borderRadius:20,
lineHeight:1.6,
border:"1px solid #1e293b",
overflow:"hidden",
wordBreak:"break-word"
},

logout:{
marginTop:"auto",
marginBottom:18,
width:"100%",
height:44,
border:"none",
borderRadius:14,
background:
"linear-gradient(90deg,#fb7185,#f472b6)",
color:"white",
fontWeight:"bold",
cursor:"pointer",

flexShrink:0
}

};