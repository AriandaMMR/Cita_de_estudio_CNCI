const $ = id => document.getElementById(id);
const clave = "cnci-citas-estudio-v1";
const campos = ["fecha", "inicio", "fin", "materia", "tarea"];
let seleccion = 0;
let guardado;
try { guardado = JSON.parse(localStorage.getItem(clave)); } catch {}

const zonaLocal =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Mexico_City";

for(let i=0;i<3;i++){
  const tarjeta=$("tarjeta").content.cloneNode(true);
  tarjeta.querySelectorAll(".selector-hora").forEach(selector => {
  selector.add(new Option("Elige la hora", ""));

  for (let minutos = 0; minutos < 1440; minutos += 15) {
    const hora = Math.floor(minutos / 60);
    const minuto = minutos % 60;

    const valor =
      String(hora).padStart(2, "0") + ":" +
      String(minuto).padStart(2, "0");

    const etiqueta =
      (hora % 12 || 12) + ":" +
      String(minuto).padStart(2, "0") +
      (hora < 12 ? " a. m." : " p. m.");

    selector.add(new Option(etiqueta, valor));
  }
});
  campos.forEach(nombre=>{
    const control=tarjeta.querySelector('[name="'+nombre+'"]');
    const valor=guardado?.citas?.[i]?.[nombre];
    if(nombre==="hecho") control.checked=valor===true;
    else control.value=typeof valor==="string"?valor:"";
  });
  tarjeta.querySelector(".agendar").addEventListener("click",()=>abrirCalendario(i));
  $("citas").append(tarjeta);
}
function tarjetas(){return [...document.querySelectorAll(".cita")];}
function datos(){

  return {zona:zonaLocal,citas:tarjetas().map(tarjeta=>Object.fromEntries(campos.map(nombre=>{
    const control=tarjeta.querySelector('[name="'+nombre+'"]');
    return [nombre,nombre==="hecho"?control.checked:control.value];
  })))};
}
function guardar(){
  try {localStorage.setItem(clave,JSON.stringify(datos()));$("estado").textContent="Guardado en este dispositivo.";}
  catch {$("estado").textContent="El navegador no permite guardar. Puedes descargar tu agenda.";}
}
$("agenda").addEventListener("input",guardar);
$("agenda").addEventListener("change",guardar);

// Convierte una fecha de la zona elegida a UTC y comprueba horas inexistentes.
function instante(fecha,hora,zona){
  const objetivo=new Date(fecha+"T"+hora+":00Z").getTime();
  const formato=new Intl.DateTimeFormat("en-CA",{timeZone:zona,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"});
  let valor=objetivo;
  for(let i=0;i<4;i++){
    const partes=Object.fromEntries(formato.formatToParts(new Date(valor)).map(p=>[p.type,p.value]));
    const representado=Date.UTC(+partes.year,+partes.month-1,+partes.day,+partes.hour,+partes.minute,+partes.second);
    const diferencia=objetivo-representado;
    if(diferencia===0)return new Date(valor);
    valor+=diferencia;
  }
  throw Error("Ese horario no existe en la zona elegida. Selecciona otra hora.");
}
function preparar(indices){
  const agenda=datos();
  return indices.map(i=>{
    const tarjeta=tarjetas()[i];
    for(const control of tarjeta.querySelectorAll("input,textarea,select")){
      if(!control.reportValidity())throw Error("Completa los datos de tu cita "+(i+1)+".");
    }
    const cita=agenda.citas[i];
    if(!cita.materia.trim()||!cita.tarea.trim())throw Error("Escribe la materia y la tarea de tu cita "+(i+1)+".");
    if(cita.fin<=cita.inicio)throw Error("La hora de fin debe ser posterior al inicio en la cita "+(i+1)+".");
    return {...cita,inicioUTC:instante(cita.fecha,cita.inicio,agenda.zona),finUTC:instante(cita.fecha,cita.fin,agenda.zona),indice:i};
  });
}
function utc(fecha){return fecha.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");}


  

function abrirCalendario(i){
  try{
    const [cita]=preparar([i]);seleccion=i;
    const parametros=new URLSearchParams({action:"TEMPLATE",text:"Estudiar · "+cita.materia.trim(),dates:utc(cita.inicioUTC)+"/"+utc(cita.finUTC),details:cita.tarea.trim(),ctz:zonaLocal});
    $("google").href="https://calendar.google.com/calendar/render?"+parametros;
    $("detalle").textContent=cita.materia+" · "+cita.fecha+" · "+cita.inicio+"–"+cita.fin;
    $("opciones").showModal();
  }catch(error){$("estado").textContent=error.message;}
}

$("borrar").addEventListener("click",()=>{
  if(!confirm("¿Vaciar tus tres citas de esta página?"))return;
  $("agenda").reset();guardar();
});
$("agenda").addEventListener("submit",evento=>{
  evento.preventDefault();
  try{
    const citas=preparar([0,1,2]);
    const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1920;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#eef6ff";ctx.fillRect(0,0,1080,1920);
    function texto(valor,x,y,tamano,color="#073b78",peso=500){ctx.font=peso+" "+tamano+"px sans-serif";ctx.fillStyle=color;ctx.fillText(valor,x,y);}
    function lineas(valor,x,y,ancho,tamano,maximo){
      ctx.font="500 "+tamano+"px sans-serif";let fila="",filas=[];
      for(const palabra of valor.replace(/\s+/g," ").split(" ")){
        if(ctx.measureText(fila+" "+palabra).width>ancho&&fila){filas.push(fila);fila=palabra;}
        else fila+=(fila?" ":"")+palabra;
      }
      filas.push(fila);
      filas.slice(0,maximo).forEach((fila,i)=>texto(fila+(i===maximo-1&&filas.length>maximo?"…":""),x,y+i*(tamano+12),tamano));
    }
    texto("CNCI VIRTUAL",64,80,23,"#296aff",800);
    texto("Esta semana tengo",64,170,64,"#296aff",800);
    texto("una cita conmigo.",64,245,64,"#ff8133",800);
    texto("Tres momentos para avanzar en mis estudios.",64,305,29);
    citas.forEach((cita,i)=>{
      const y=365+i*465;
      ctx.fillStyle="white";ctx.beginPath();ctx.roundRect(56,y,968,430,28);ctx.fill();
      ctx.fillStyle=i===1?"#ff8133":"#296aff";ctx.fillRect(56,y+28,7,374);
      texto("Mi cita de estudio",90,y+65,35,"#296aff",800);
      texto(cita.fecha+"   "+cita.inicio+"–"+cita.fin,90,y+125,30);
      lineas(cita.materia,90,y+190,880,34,2);
      lineas(cita.tarea,90,y+285,880,28,3);
      
    });
    texto("#HábitosQueSuman",64,1850,31,"#296aff",800);
    texto($("zona").value,64,1890,20);
    canvas.toBlob(blob=>{if(blob)descargar(blob,"mi-agenda-estudio.png");else $("estado").textContent="No se pudo generar la imagen.";},"image/png");
  }catch(error){$("estado").textContent=error.message;}
});
