const KEY_CLIENTES = "lm_clientes";
const KEY_PREGUNTAS = "lm_preguntas";
const KEY_VOTOS = "lm_votos";

function get(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) {
    console.error("Error leyendo localStorage:", e);
    return [];
  }
}

function set(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}


function registrarCliente(data) {
  let lista = get(KEY_CLIENTES);

  if (!validarEmail(data.email)) {
    throw "Correo inválido";
  }

  if (lista.find(c => c.email === data.email)) {
    throw "Este correo ya está registrado";
  }

  lista.push(data);
  set(KEY_CLIENTES, lista);
}

function validarEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}


function registrarPregunta(titulo, opciones) {
  if (!titulo || titulo.length < 3) {
    throw "El título es demasiado corto";
  }

  if (!opciones || opciones.length < 2) {
    throw "Debes incluir al menos 2 opciones";
  }

  let lista = get(KEY_PREGUNTAS);
  let id = Date.now();

  lista.push({
    id,
    titulo,
    opciones: opciones.map((o, i) => ({
      id: id + "_" + i,
      texto: o
    }))
  });

  set(KEY_PREGUNTAS, lista);
}


function editarPregunta(id, nuevoTitulo, nuevasOpciones) {
  let lista = get(KEY_PREGUNTAS);
  let pregunta = lista.find(p => p.id == id);

  if (!pregunta) throw "Pregunta no encontrada";

  pregunta.titulo = nuevoTitulo;
  pregunta.opciones = nuevasOpciones.map((o, i) => ({
    id: id + "_" + i,
    texto: o
  }));

  set(KEY_PREGUNTAS, lista);
}


function eliminarPregunta(id) {
  let lista = get(KEY_PREGUNTAS);
  let nuevaLista = lista.filter(p => p.id != id);
  set(KEY_PREGUNTAS, nuevaLista);

  limpiarVotosHuérfanos();
}

function limpiarVotosHuérfanos() {
  let preguntas = get(KEY_PREGUNTAS);
  let votos = get(KEY_VOTOS);

  let preguntasIDs = preguntas.map(p => p.id);

  votos.forEach(v => {
    for (let key in v.respuestas) {
      if (!preguntasIDs.includes(parseInt(key))) {
        delete v.respuestas[key];
      }
    }
  });

  set(KEY_VOTOS, votos);
}


function puedeVotar(email) {
  let clientes = get(KEY_CLIENTES);

  if (!clientes.find(c => c.email === email)) {
    return { ok: false, msg: "Este correo no está registrado para la encuesta" };
  }

  let votos = get(KEY_VOTOS);
  if (votos.find(v => v.email === email)) {
    return { ok: false, msg: "Este correo ya votó" };
  }

  return { ok: true };
}

function guardarVoto(email, respuestas) {
  let votos = get(KEY_VOTOS);

  votos.push({
    email,
    fecha: new Date().toISOString(),
    respuestas
  });

  set(KEY_VOTOS, votos);
}


function generarReporte() {
  let preguntas = get(KEY_PREGUNTAS);
  let votos = get(KEY_VOTOS);

  let reporte = preguntas.map(p => {
    let conteo = {};

    p.opciones.forEach(o => conteo[o.id] = 0);

    votos.forEach(v => {
      let elegido = v.respuestas[p.id];
      if (elegido && conteo[elegido] !== undefined) {
        conteo[elegido]++;
      }
    });

    return {
      titulo: p.titulo,
      opciones: p.opciones,
      conteo
    };
  });

  return {
    totalVotos: votos.length,
    detalle: reporte
  };
}
