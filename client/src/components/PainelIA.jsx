export default function PainelIA({
conversa,
mensagem,
setMensagem,
enviarMensagem,
loading,
chatEndRef

}){

return(

<div style={styles.chatContainer}>

<h2 style={styles.titulo}>
IA Terapêutica pronta
</h2>

<div style={styles.chatArea}>

{

loading

?

<p
style={{
color:"#67e8f9",
fontWeight:"bold",
textAlign:"center"
}}
>

IA analisando...

</p>

:

conversa.length > 0

?

conversa.map((msg,index)=>(

<div

key={index}

style={{

padding:"12px",
marginBottom:10,

borderRadius:14,

background:

msg.tipo==="usuario"

? "rgba(34,211,238,.15)"

: "rgba(255,255,255,.05)"

}}

>

<b>

{msg.tipo==="usuario"

? "Você"

: "Neuro360 IA"}

:</b>

<br/>

{msg.texto}

</div>

))

:


<div style={styles.estadoVazio}>

Escolha um estado emocional acima ou escreva como está se sentindo para iniciar sua jornada emocional.

</div>

}

<div ref={chatEndRef}></div>

</div>

<div style={styles.inputArea}>

<input
value={mensagem}
onChange={(e)=>
setMensagem(
e.target.value
)
}
placeholder="Compartilhe como você está se sentindo..."
style={styles.input}
/>

<button
onClick={enviarMensagem}
style={styles.botao}
>

Enviar

</button>

</div>

</div>

);

}

const styles={

chatContainer:{
display:"flex",
flexDirection:"column",
gap:10,
flex:1
},

titulo:{
textAlign:"center",
color:"#67e8f9"
},

chatArea:{
background:
"rgba(30,41,59,.55)",
padding:16,
borderRadius:18,
minHeight:120,
maxHeight:220,
overflowY:"auto"
},

estadoVazio:{
minHeight:50,
padding:"4px 20px",
display:"flex",
alignItems:"center",
justifyContent:"center",
textAlign:"center"
},

inputArea:{
display:"flex",
gap:8,
minHeight:55
},

input:{
flex:1,
padding:"12px",
borderRadius:14,
border:"none"
},

botao:{
width:120,
minWidth:120,
flexShrink:0,
border:"none",
borderRadius:14,
background:
"linear-gradient(90deg,#22d3ee,#67e8f9)",
cursor:"pointer",
fontWeight:"bold"
}

};