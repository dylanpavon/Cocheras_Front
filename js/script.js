const API_URL = "https://localhost:7230";

document.addEventListener("DOMContentLoaded", () => {
  const page = window.location.pathname.split("/").pop();

  if (page === "clientes.html") {
    // Código específico para la página de clientes
    cargarCondicionIVA();
    cargarTipoDocumento();
    cargarCliente();
  } else if (page === "facturacion.html") {
    // Código específico para la página de facturación
    cargarFecha();
    cargarTipoVehiculo();
    cargarMarcas();
    getAllLugares();
    cargarAbonos();
    cargarTiposFactura();
    cargarFormasPago();
    document
      .getElementById("descuento")
      .addEventListener("input", validarRango);
    document.getElementById("recargo").addEventListener("input", validarRango);
    document
      .getElementById("descuento")
      .addEventListener("input", descuentoOrecargo);
    document
      .getElementById("recargo")
      .addEventListener("input", descuentoOrecargo);
    document
      .getElementById("descuento")
      .addEventListener("input", calcularTotal);
    document.getElementById("recargo").addEventListener("input", calcularTotal);
    document
      .getElementById("fechaHoraSalida")
      .addEventListener("input", validarFecha);
  } else if (page === "login.html") {
    // Código específico para la página de login
  } else if (page === "" || page === "index.html") {
    // Código específico para la página de index
    new ParkingGarage();
    zoomFotos();
    cargarTipoVehiculo();
    cargarLugaresDisponibles();
    cargarMarcas();
    setInterval(updateParkingSpots, 10000);
    document
      .getElementById("patente")
      .addEventListener("blur", buscarVehiculoPorPatente);
  } else if (page === "reportes.html") {
    cargarFacturas();
  }
});

// DASHBOARD
class ParkingGarage {
  constructor() {
    this.spots = {
      upper: Array.from({ length: 20 }, (_, i) => ({
        id: `PA${i + 1}`,
        isOccupied: false,
      })),
      lower: Array.from({ length: 20 }, (_, i) => ({
        id: `PB${i + 1}`,
        isOccupied: false,
      })),
    };
    this.init();
  }

  init() {
    this.renderLevel("upper");
    this.renderLevel("lower");
    updateParkingSpots();
    this.updateAvailableSpots();
  }

  renderLevel(level) {
    const container = document.getElementById(`${level}Level`);
    container.innerHTML = "";

    this.spots[level].forEach((spot) => {
      const col = document.createElement("div");
      col.className = "col-4 col-md-3 col-lg-3";

      const spotElement = document.createElement("div");
      spotElement.id = spot.id; // Asigna el id al div del spot
      spotElement.className = `parking-spot ${
        spot.isOccupied ? "occupied" : "available"
      }`;

      // Confirmar si el innerHTML se establece correctamente
      spotElement.innerHTML = `
                <i class="bi bi-car-front-fill"></i>
                <strong>${spot.id}</strong>
                <small>${spot.isOccupied ? "Ocupado" : "Disponible"}</small>
            `;

      col.appendChild(spotElement);
      container.appendChild(col);
    });
  }

  /*toggleSpot(level, spotId) {
    const spot = this.spots[level].find((s) => s.id === spotId);
    if (spot) {
      spot.isOccupied = !spot.isOccupied;
      this.renderLevel(level);
      this.updateAvailableSpots();
    }
  }*/

  //Método para llevar la cuenta
  updateAvailableSpots() {
    const totalSpots = this.spots.upper.length + this.spots.lower.length;
    const occupiedSpots = [...this.spots.upper, ...this.spots.lower].filter(
      (spot) => spot.isOccupied
    ).length;

    document.getElementById("availableSpots").textContent =
      totalSpots - occupiedSpots;
  }
}

//Actualizar Lugares
function updateParkingSpots() {
  fetch(`${API_URL}/api/Lugar`) //GetAll Lugares
    .then((response) => response.json())
    .then((data) => {
      data.forEach((spot) => {
        let spotElement = document.getElementById(spot.id_lugar);
        if (spot.seccion_uno && spot.seccion_dos) {
          spotElement.classList.remove("available");
          spotElement.classList.add("occupied");
          spotElement.innerHTML = `
                <i class="bi bi-car-front-fill"></i>
                <strong>${spot.id_lugar}</strong>
                <small>${
                  spot.seccion_uno && spot.seccion_dos
                    ? "Ocupado"
                    : "Disponible"
                }</small>
            `;
        } else {
          spotElement.classList.remove("occupied");
          spotElement.classList.add("available");
          spotElement.innerHTML = `
                <i class="bi bi-car-front-fill"></i>
                <strong>${spot.id_lugar}</strong>
                <small>${
                  spot.seccion_uno && spot.seccion_dos
                    ? "Ocupado"
                    : "Disponible"
                }</small>
            `;
        }
      });
    })
    .catch((error) =>
      console.error("Ocurrió un lugar al cargar los Lugares", error)
    );
}
async function ocuparLugar(idLugar) {
  // Realiza la solicitud PUT a la API
  await fetch(`${API_URL}/api/Lugar?id=${idLugar}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: idLugar,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al actualizar el lugar");
      }
      return;
    })
    .then((data) => {
      console.log("Lugar actualizado correctamente:", data);
    })
    .catch((error) => {
      console.error("Error en la actualización del lugar:", error);
    });
}
// INGRESO VEHICULOS

async function buscarVehiculoPorPatente() {
  const patente = document.getElementById("patente").value.trim();

  if (patente) {
    try {
      const response = await fetch(
        `${API_URL}/api/Vehiculo/patente/${patente}`
      );

      if (response.ok) {
        const data = await response.json();

        if (data) {
          // Completar campos con datos del vehículo encontrado
          document.getElementById("idVehiculo").value = data.id_vehiculo;
          const vehiculo1 = buscarVehiculoPorID(data.id_vehiculo);
          document.getElementById("tipoVehiculo").value =
            vehiculo1.id_tipo_vehiculo;

          document.getElementById("marca").disabled = true;
          document.getElementById("modelo").disabled = true;
          document.getElementById("tipoVehiculo").disabled = true;
          document.getElementById("color").disabled = true;
        }
      } else {
        // Si no se encuentra el vehículo, habilitar los campos para la carga normal
        habilitarCampos();
      }
    } catch (error) {
      console.error("Error al buscar la patente:", error);
    }
  }
}
function habilitarCampos() {
  document.getElementById("marca").disabled = false;
  document.getElementById("marca").value = "";
  document.getElementById("modelo").disabled = false;
  document.getElementById("modelo").value = "";
  document.getElementById("tipoVehiculo").disabled = false;
  document.getElementById("tipoVehiculo").value = "";
  document.getElementById("color").disabled = false;
  document.getElementById("color").value = "";
}
function handleMarcaChange(select) {
  const marcaInput = document.getElementById("marcaInput");
  if (select.value === "otro") {
    marcaInput.style.display = "block";
    marcaInput.required = true;
  } else {
    marcaInput.style.display = "none";
    marcaInput.required = false;
  }
}

function handleModeloChange(select) {
  const modeloInput = document.getElementById("modeloInput");
  if (select.value === "otro") {
    modeloInput.style.display = "block";
    modeloInput.required = true;
  } else {
    modeloInput.style.display = "none";
    modeloInput.required = false;
  }
}

function cargarLugaresDisponibles() {
  fetch(`${API_URL}/api/Lugar/disponibles`)
    .then((response) => response.json())
    .then((lugares) => {
      const lugarSelect = document.getElementById("lugar");
      lugarSelect.innerHTML =
        '<option value="">Seleccionar lugar disponible</option>';
      const lugaresOrdenados = lugares
        .filter(
          (lugar) => lugar.seccion_uno === false && lugar.seccion_dos === false
        )
        .sort((a, b) => {
          const [letraA, numeroA] = [
            a.id_lugar.slice(0, 2),
            parseInt(a.id_lugar.slice(2)),
          ];
          const [letraB, numeroB] = [
            b.id_lugar.slice(0, 2),
            parseInt(b.id_lugar.slice(2)),
          ];

          // Ordena por letras, y luego por números en caso de ser iguales
          if (letraA < letraB) return -1;
          if (letraA > letraB) return 1;
          return numeroA - numeroB;
        });

      // Insertar los lugares ordenados en el select
      lugaresOrdenados.forEach((lugar) => {
        const option = document.createElement("option");
        option.value = lugar.id_lugar;
        option.textContent = lugar.id_lugar;
        lugarSelect.appendChild(option);
      });
    })
    .catch((error) =>
      console.error("Error al cargar lugares disponibles:", error)
    );
}

async function registrarRemito() {
  const fecha_entrada = new Date().toISOString();
  const id_lugar = document.getElementById("lugar").value;
  const patente = document.getElementById("patente").value.trim();
  const marca =
    document.getElementById("marca").value === "otro"
      ? document.getElementById("marcaInput").value
      : document.getElementById("marca").value;
  const modelo =
    document.getElementById("modelo").value === "otro"
      ? document.getElementById("modeloInput").value
      : document.getElementById("modelo").value;
  const tipoVehiculo = document.getElementById("tipoVehiculo").value;
  const color = document.getElementById("color").value.trim();

  if (!patente || !marca || !modelo || !tipoVehiculo || !color || !id_lugar) {
    alert("Por favor, complete todos los campos.");
    return;
  }

  let id_vehiculo = 0;

  if (document.getElementById("idVehiculo").value != "") {
    id_vehiculo = parseInt(document.getElementById("idVehiculo").value, 10);
  } else {
    id_vehiculo = await registrarVehiculo();
  }

  const remitoData = {
    id_vehiculo,
    id_lugar,
    fecha_entrada,
  };

  try {
    const response = await fetch(`${API_URL}/api/Remito`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(remitoData),
    });
    if (response.ok) {
      console.log("Remito registrado: ", remitoData);
      document.getElementById("ingVh").reset();
      await ocuparLugar(id_lugar);
      await cargarLugaresDisponibles();
      alert(`Ingreso vehículo dominio: ${patente}`);
      //Obtener el ID del Vehículo registrado
      try {
        const response = await fetch(`${API_URL}/api/Remito/Remito/MaxID`);
        if (!response.ok) throw new Error("Error al cargar el ID del Remito");
        const IdRemito = await response.text();
        alert(`Remito Nro: ${IdRemito}`);
      } catch (error) {
        console.error("Error al obtener el ID del Remito", error);
        alert("Ocurrió un error al obtener el ID del Remito");
      }
    } else {
      alert("Error al generar el Remito");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Ocurrió un error al intentar generar el Remito");
  }
}
async function registrarVehiculo() {
  const patente = document.getElementById("patente").value.trim();
  const marca =
    document.getElementById("marca").value === "otro"
      ? document.getElementById("marcaInput").value
      : document.getElementById("marca").value;
  const id_modelo =
    document.getElementById("modelo").value === "otro"
      ? document.getElementById("modeloInput").value
      : document.getElementById("modelo").value;
  const id_tipo_vehiculo = document.getElementById("tipoVehiculo").value;
  const color = document.getElementById("color").value.trim();

  if (marca === document.getElementById("marcaInput").value) {
    marca = await registrarMarca();
  }
  if (id_modelo === document.getElementById("modeloInput").value) {
    id_modelo = await registrarModelo(marca);
  }

  const vhData = {
    patente,
    color,
    id_tipo_vehiculo,
    id_modelo,
  };

  try {
    const response = await fetch(`${API_URL}/api/Vehiculo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vhData),
    });
    if (response.ok) {
      console.log("Vehículo registrado:", vhData);
      //Obtener el ID del Vehículo registrado
      try {
        const response = await fetch(`${API_URL}/MaxID`);
        if (!response.ok) throw new Error("Error al cargar el ID del Vehículo");
        const IdVeh = parseInt(await response.text(), 10);
        return IdVeh;
      } catch (error) {
        console.error("Error al obtener el ID del Vehículo", error);
        alert("Ocurrió un error al obtener el del Vehículo");
      }
    } else {
      alert("Error al agregar el vehículo");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Ocurrió un error al intentar agregar el vehículo");
  }
}
async function registrarMarca() {
  const nombre_marca = document.getElementById("marcaInput").value;
  try {
    const response = await fetch(`${API_URL}/api/Marca`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nombre_marca),
    });
    if (response.ok) {
      console.log("Marca registrada:", nombre_marca);

      //Obtener el ID de la Marca registrada
      try {
        const response = await fetch(`${API_URL}/MaxIDMarca`);
        if (!response.ok) throw new Error("Error al cargar el ID de la Marca");
        const IdMarca = parseInt(await response.text(), 10);
        return IdMarca;
      } catch (error) {
        console.error("Error al obtener el ID de la Marca", error);
        alert("Ocurrió un error al obtener el ID de la Marca");
      }
    } else {
      alert("Error al agregar la marca");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Ocurrió un error al intentar agregar la marca");
  }
}
async function registrarModelo(id_marca) {
  const descripcion = document.getElementById("modeloInput").value;
  const modelo = {
    descripcion,
    id_marca,
  };
  try {
    const response = await fetch(`${API_URL}/api/Modelo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(modelo),
    });
    if (response.ok) {
      console.log("Modelo registrado:", modelo);
      //Obtener el ID del Modelo registrado
      try {
        const response = await fetch(`${API_URL}/MaxIDModelo`);
        if (!response.ok) throw new Error("Error al cargar el ID del Modelo");
        const IdModelo = parseInt(await response.text(), 10);
        return IdModelo;
      } catch (error) {
        console.error("Error al obtener el ID del Modelo", error);
        alert("Ocurrió un error al obtener el ID del Modelo");
      }
    } else {
      alert("Error al agregar el modelo");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Ocurrió un error al intentar agregar el modelo");
  }
}
let tiposVhData = [];
async function cargarTipoVehiculo() {
  try {
    const response = await fetch(`${API_URL}/api/TipoVehiculo`);
    if (!response.ok) throw new Error("Error al cargar Tipos de Vehículo");
    const tiposVh = await response.json();
    const selectTiposVh = document.getElementById("tipoVehiculo");
    tiposVhData = tiposVh;
    tiposVh.forEach((tiposVh) => {
      const option = document.createElement("option");
      option.value = tiposVh.id_tipo_vehiculo; // ID como valor
      option.textContent = `${tiposVh.descripcion} - $${tiposVh.precio}/hs`; // Descripcion como texto
      selectTiposVh.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar Tipos de Vehículo:", error);
    alert("Ocurrió un error al cargar los Tipos de Vehículo");
  }
}
async function cargarMarcas() {
  try {
    const response = await fetch(`${API_URL}/api/Marca`);
    if (!response.ok) throw new Error("Error al cargar Marcas");
    const marcas = await response.json();
    const selectMarcas = document.getElementById("marca");
    marcas.forEach((marca) => {
      const option = document.createElement("option");
      option.value = marca.id_marca; // ID como valor
      option.textContent = marca.nombre_marca; // Descripcion como texto
      selectMarcas.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar las Marcas:", error);
    alert("Ocurrió un error al cargar las Marcas");
  }
}

// CLIENTES

async function registrarCliente() {
  const apellido = document.getElementById("apellido").value.trim();
  const nombre = document.getElementById("nombre").value.trim();
  const id_tipo_doc = document.getElementById("tipoDocumento").value;
  const nro_documento = document.getElementById("nroDocumento").value.trim();
  const direccion = document.getElementById("direccion").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();
  const id_iva_condicion = document.getElementById("condicionIva").value;
  const form = document.getElementById("formCliente");

  // Validar que los campos obligatorios no estén vacíos
  if (
    !apellido ||
    !nombre ||
    !id_tipo_doc ||
    !nro_documento ||
    !direccion ||
    !telefono ||
    !email ||
    !id_iva_condicion
  ) {
    alert("Por favor, complete todos los campos obligatorios.");
    return;
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Ingrese un correo electrónico válido.");
    return;
  }

  // Preparar datos para envío
  const clienteData = {
    apellido,
    nombre,
    id_tipo_doc,
    nro_documento,
    direccion,
    telefono,
    email,
    id_iva_condicion,
  };

  try {
    const response = await fetch(`${API_URL}/api/Cliente`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(clienteData),
    });
    if (response.ok) {
      alert(`Cliente registrado: ${apellido}, ${nombre}`);
      await cargarCliente();
      form.reset();
    } else {
      alert("Error al agregar el cliente");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Ocurrió un error al intentar agregar el cliente");
  }
}

async function cargarCliente() {
  try {
    const response = await fetch(`${API_URL}/api/Cliente`);
    if (!response.ok) throw new Error("Error al cargar Cliente");
    let clientes = await response.json();
    const tablaClientes = document.getElementById("tablaClientes");
    tablaClientes.innerHTML = "";
    clientes = clientes.sort((a, b) => b.id_cliente - a.id_cliente);
    clientes.forEach((cte) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                  <td scope="col" style="display: none;">${cte.id_cliente}</td>
                  <td scope="col">${cte.apellido}</td>
                  <td scope="col">${cte.nombre}</td>
                  <td scope="col">${cte.nro_documento}</td>
                  <td scope="col">${cte.telefono}</td>
                  <td scope="col">${cte.e_mail}</td>
                  <td scope="col">${cte.direccion}</td>
                  <td scope="col">${cte.iva}</td>
                  <td scope="col">
                    <button class="btn" onclick="editarCliente(${cte.id_cliente})">
                      <i class="bi bi-pencil"></i>
                    </button>
                  </td>
      `;
      tablaClientes.appendChild(tr);
    });
  } catch (error) {
    console.error("Error al cargar Cliente:", error);
    alert("Ocurrió un error al cargar los Cliente");
  }
}
async function editarCliente(idCliente) {
  const id = document.getElementById("idCliente");
  const apellido = document.getElementById("apellido");
  const nombre = document.getElementById("nombre");
  const id_tipo_doc = document.getElementById("tipoDocumento");
  const nro_documento = document.getElementById("nroDocumento");
  const direccion = document.getElementById("direccion");
  const telefono = document.getElementById("telefono");
  const e_mail = document.getElementById("email");
  const id_iva_condicion = document.getElementById("condicionIva");
  const boton = document.getElementById("aceptar");
  //Completar formulario
  try {
    const response = await fetch(`${API_URL}/api/Cliente/${idCliente}`);
    if (response.ok) {
      const data = await response.json();
      if (data) {
        id.value = data.id_cliente;
        apellido.value = data.apellido;
        nombre.value = data.nombre;
        nro_documento.value = data.nro_documento;
        direccion.value = data.direccion;
        telefono.value = data.telefono;
        e_mail.value = data.e_mail;

        for (let option of id_tipo_doc.options) {
          if (option.text === data.tipo_doc) {
            option.selected = true;
            break;
          }
        }

        for (let option of id_iva_condicion.options) {
          if (option.text === data.iva) {
            option.selected = true;
            break;
          }
        }
      }
      boton.textContent = "Editar";
      boton.onclick = confirmarEdicion;

      let btn_cancelar = document.createElement("button");
      btn_cancelar.className = "btn btn-secondary";
      btn_cancelar.type = "button";
      btn_cancelar.id = "cancelar";
      btn_cancelar.innerHTML = `<a href="/clientes.html" style="color: white; text-decoration: none">Cancelar</a>`;
      document.getElementById("botones").appendChild(btn_cancelar);
    } else {
      alert("Ocurrió un error al cargar el cliente");
    }
  } catch (error) {
    console.error("Error en la búsqueda del cliente:", error);
  }
}

async function confirmarEdicion() {
  const id_cliente = parseInt(document.getElementById("idCliente").value, 10);
  const apellido = document.getElementById("apellido").value.trim();
  const nombre = document.getElementById("nombre").value.trim();
  const id_tipo_doc = document.getElementById("tipoDocumento").value;
  const nro_documento = document.getElementById("nroDocumento").value.trim();
  const direccion = document.getElementById("direccion").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();
  const id_iva_condicion = document.getElementById("condicionIva").value;
  const form = document.getElementById("formCliente");
  const boton = document.getElementById("aceptar");

  // Validar que los campos obligatorios no estén vacíos
  if (
    !id_cliente ||
    !apellido ||
    !nombre ||
    !id_tipo_doc ||
    !nro_documento ||
    !direccion ||
    !telefono ||
    !email ||
    !id_iva_condicion
  ) {
    alert("Por favor, complete todos los campos obligatorios.");
    return;
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Ingrese un correo electrónico válido.");
    return;
  }

  // Preparar datos para envío
  const clienteData = {
    id_cliente,
    apellido,
    nombre,
    id_tipo_doc,
    nro_documento,
    direccion,
    telefono,
    email,
    id_iva_condicion,
  };

  try {
    const response = await fetch(`${API_URL}/api/Cliente/${id_cliente}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(clienteData),
    });
    if (response.ok) {
      alert(`Cliente Modificado: ${apellido}, ${nombre}`);
      await cargarCliente();
      form.reset();
      boton.textContent = "Registrar";
      boton.onclick = registrarCliente;
      const botones = document.getElementById("botones");
      const cancelar = document.getElementById("cancelar");

      if (cancelar) {
        botones.removeChild(cancelar);
      }
    } else {
      alert("Error al editar el cliente");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Ocurrió un error al intentar agregar el cliente");
  }
}

function eliminarCliente(idCliente) {
  // Lógica para confirmar y eliminar el cliente con el ID especificado
  if (confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
    console.log("Eliminar cliente con ID:", idCliente);
    // Aquí podrías llamar a una API para eliminar el cliente
  }
}
// Cargar en el select
async function cargarCondicionIVA() {
  try {
    const response = await fetch(`${API_URL}/api/CondicionesIVA`);
    if (!response.ok) throw new Error("Error al cargar Condición IVA");
    const condiciones = await response.json();
    const selectCondiciones = document.getElementById("condicionIva");
    condiciones.forEach((condicion) => {
      const option = document.createElement("option");
      option.value = condicion.id_iva_condicion; // ID como valor
      option.textContent = condicion.descripcion; // Descripcion como texto
      selectCondiciones.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar Condición IVA:", error);
    alert("Ocurrió un error al cargar los Condición IVA");
  }
}

// Cargar en el select
async function cargarTipoDocumento() {
  try {
    const response = await fetch(`${API_URL}/api/TipoDoc`);
    if (!response.ok) throw new Error("Error al cargar Tipos de Documento");
    const tiposDoc = await response.json();
    const selectTiposDoc = document.getElementById("tipoDocumento");
    tiposDoc.forEach((tiposDoc) => {
      const option = document.createElement("option");
      option.value = tiposDoc.id_tipo_doc; // ID como valor
      option.textContent = tiposDoc.descripcion; // Descripcion como texto
      selectTiposDoc.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar Tipos de Documento:", error);
    alert("Ocurrió un error al cargar los Tipos de Documento");
  }
}
// FACTURACION

function cargarFecha() {
  // Inicializa el formulario
  document.getElementById("fecha").value = new Date().toISOString();
  const fechaVisible = document.getElementById("fechaVisible");
  fechaVisible.value = formatearFecha(document.getElementById("fecha").value);
}
function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

let abonosData = [];
async function cargarAbonos() {
  try {
    const response = await fetch(`${API_URL}/api/Abono`);
    if (!response.ok) throw new Error("Error al cargar Abonos");
    const abonos = await response.json();
    abonosData = abonos;
    const selectAbonos = document.getElementById("abono");
    abonos.forEach((abono) => {
      const option = document.createElement("option");
      option.value = abono.id_abono;
      option.textContent = abono.descripcion;
      selectAbonos.appendChild(option);
    });
    selectAbonos.addEventListener("change", actualizarPrecioAbono);
  } catch (error) {
    console.error("Error al cargar Abonos:", error);
    alert("Ocurrió un error al cargar los Abonos");
  }
}

async function actualizarPrecioAbono() {
  const selectAbonos = document.getElementById("abono");
  const precioInput = document.getElementById("precio");
  const abonoSeleccionado = selectAbonos.value;

  const abono = abonosData.find(
    (item) => item.id_abono === parseInt(abonoSeleccionado)
  );
  if (abono) {
    precioInput.value = abono.precio;
  } else {
    const selectTipoVh = document.getElementById("tipoVehiculo");
    const TipoVhSeleccionado = selectTipoVh.value;

    const tipoVh = tiposVhData.find(
      (item) => item.id_tipo_vehiculo === parseInt(TipoVhSeleccionado)
    );
    if (tipoVh) {
      precioInput.value = calcularPrecioEstadia(tipoVh.precio);
    }
  }
  calcularTotal();
}
function descuentoOrecargo() {
  let descuento = document.getElementById("descuento").value;
  let recargo = document.getElementById("recargo").value;

  if (descuento) {
    recargo = "";
    document.getElementById("recargo").value = "";
  }
  if (recargo) {
    descuento = "";
    document.getElementById("descuento").value = "";
  }
}
function calcularTotal() {
  const precio = parseFloat(document.getElementById("precio").value) || 0;
  let descuento = document.getElementById("descuento").value;
  let recargo = document.getElementById("recargo").value;
  const totalInput = document.getElementById("total");

  let total = precio;

  if (descuento) {
    descuento = parseFloat(document.getElementById("descuento").value) || 0;
    total -= precio * (descuento / 100);
    recargo = "";
  }

  if (recargo) {
    recargo = parseFloat(document.getElementById("recargo").value) || 0;
    total += precio * (recargo / 100);
    descuento = "";
  }
  totalInput.value = total.toFixed(2);
}
function calcularPrecioEstadia(precioHora) {
  const fechaEntrada = new Date(
    document.getElementById("fechaHoraEntrada").value
  );
  const fechaSalida = new Date(
    document.getElementById("fechaHoraSalida").value
  );

  if (!fechaEntrada || !fechaSalida || precioHora <= 0) {
    alert(
      "Por favor, ingrese una fecha de entrada, salida, y un precio válido."
    );
    return;
  }

  // Diferencia en milisegundos entre las dos fechas
  const diferenciaMs = fechaSalida - fechaEntrada;
  // Convertir diferencia a horas
  const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);

  // Redondear la diferencia hacia arriba si supera la media hora
  const horasCobrables = Math.ceil(diferenciaHoras * 2) / 2;

  // Calcular el precio total
  const precioTotal = horasCobrables * precioHora;
  return precioTotal.toFixed(2);
}
function validarRango(event) {
  let value = parseInt(event.target.value, 10);

  if (value < 1) {
    event.target.value = 1;
  } else if (value > 100) {
    event.target.value = 100;
  }
}
function validarFecha() {
  const fechaEntrada = document.getElementById("fechaHoraEntrada").value;
  const fechaSalidaInput = document.getElementById("fechaHoraSalida");

  if (fechaSalidaInput.value < fechaEntrada) {
    alert("La fecha de salida no puede ser anterior a la de entrada.");
    fechaSalidaInput.value = fechaEntrada;
  }
}

async function cargarTiposFactura() {
  try {
    const response = await fetch(`${API_URL}/api/TipoFactura`);
    if (!response.ok) throw new Error("Error al cargar Tipos Factura");
    const tipoFact = await response.json();
    const selectTiposFact = document.getElementById("tipoFactura");
    tipoFact.forEach((tipoFact) => {
      const option = document.createElement("option");
      option.value = tipoFact.id_tipo_factura; // ID como valor
      option.textContent = tipoFact.descripcion; // Descripcion como texto
      selectTiposFact.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar Tipos Factura:", error);
    alert("Ocurrió un error al cargar los Tipos Factura");
  }
}
async function cargarFormasPago() {
  try {
    const response = await fetch(`${API_URL}/api/FormaPago`);
    if (!response.ok) throw new Error("Error al cargar Formas de Pago");
    const formasPago = await response.json();
    const selectFormasPago = document.getElementById("formaPago");
    formasPago.forEach((formaPago) => {
      const option = document.createElement("option");
      option.value = formaPago.id_forma_pago; // ID como valor
      option.textContent = formaPago.descripcion; // Descripcion como texto
      selectFormasPago.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar Formas de Pago:", error);
    alert("Ocurrió un error al cargar las Formas de Pago");
  }
}
function getAllLugares() {
  fetch(`${API_URL}/api/Lugar`)
    .then((response) => response.json())
    .then((lugares) => {
      const lugarSelect = document.getElementById("lugar");
      lugarSelect.innerHTML = '<option value="">Seleccionar lugar</option>';

      const lugaresOrdenados = lugares.sort((a, b) => {
        const [letraA, numeroA] = [
          a.id_lugar.slice(0, 2),
          parseInt(a.id_lugar.slice(2)),
        ];
        const [letraB, numeroB] = [
          b.id_lugar.slice(0, 2),
          parseInt(b.id_lugar.slice(2)),
        ];

        // Ordena por letras, y luego por números en caso de ser iguales
        if (letraA < letraB) return -1;
        if (letraA > letraB) return 1;
        return numeroA - numeroB;
      });

      // Llenar el select con los lugares ordenados
      lugaresOrdenados.forEach((lugar) => {
        const option = document.createElement("option");
        option.value = lugar.id_lugar;
        option.textContent = lugar.id_lugar;
        lugarSelect.appendChild(option);
      });
    })
    .catch((error) => console.error("Error al cargar lugares:", error));
}

// Validación solo numérica
function validateNumericInput(input) {
  input.value = input.value.replace(/\D/g, "");
}

// Función para buscar cliente asincrónicamente
async function buscarCliente() {
  const nroDocumento = document.getElementById("nroDocumento").value;
  if (!nroDocumento) return alert("Ingrese un número de documento.");
  try {
    const response = await fetch(
      `${API_URL}/api/Cliente/documento/${nroDocumento}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data) {
        document.getElementById(
          "cliente"
        ).value = `${data.apellido} ${data.nombre}`;
        document.getElementById("clienteID").value = data.id_cliente;
      }
    } else {
      alert("Debe registrar al nuevo cliente");
      window.location.href = "/clientes.html";
    }
  } catch (error) {
    console.error("Error en la búsqueda del cliente:", error);
  }
}
// Función para alternar opciones de servicio
function toggleServicioOptions() {
  const tipoServicio = document.getElementById("tipoServicio").value;
  document.getElementById("remitoSection").style.display =
    tipoServicio === "remito" ? "block" : "none";

  document.getElementById("patenteAbonoSection").style.display =
    tipoServicio.includes("Existente") ? "block" : "none";

  document.getElementById("detalleFactura").style.display =
    tipoServicio === "" ? "none" : "block";

  if (tipoServicio === "abonoNuevo") {
    document.getElementById("fechaHoraEntrada").disabled = false;
    document.getElementById("lugar").disabled = false;
    document.getElementById("abono").disabled = false;
    document.getElementById("patente").disabled = false;
    document.getElementById("tipoVehiculo").disabled = false;
    document.getElementById("marca").disabled = false;
    document.getElementById("modelo").disabled = false;
    document.getElementById("color").disabled = false;
    document.getElementById("precio").disabled = true;
  }
}

// Función para buscar un remito y autocompletar datos
async function buscarRemito() {
  const remito = document.getElementById("remito").value;
  if (!remito) return alert("Ingrese un número de remito.");

  await fetch(`${API_URL}/api/Remito/${remito}`)
    .then((response) => response.json())
    .then((data) => {
      if (data) {
        autocompletarDetalleFacturaRemito(data);
        document.getElementById("fechaHoraEntrada").disabled = true;
        document.getElementById("lugar").disabled = true;
        document.getElementById("abono").disabled = true;
        document.getElementById("patente").disabled = true;
        document.getElementById("tipoVehiculo").disabled = true;
        document.getElementById("marca").disabled = true;
        document.getElementById("modelo").disabled = true;
        document.getElementById("color").disabled = true;
      }
    })
    .catch((error) => alert("REMITO NO ENCONTRADO"));
}

// Función para buscar una patente en caso de abono existente
async function buscarPatente() {
  const patente = document.getElementById("patenteAbono").value;
  if (!patente) return alert("Ingrese una patente.");

  try {
    const response = await fetch(`${API_URL}/api/Vehiculo/patente/${patente}`);

    if (!response.ok) {
      throw new Error("VEHÍCULO NO ENCONTRADO");
    }

    const data = await response.json();
    autocompletarDetalleFacturaAbono(data);
  } catch (error) {
    alert("VEHÍCULO NO ENCONTRADO");
  }
}

// Función para autocompletar la sección de detalle de la factura

async function autocompletarDetalleFacturaRemito(data) {
  document.getElementById("idVehiculo").value = data.id_vehiculo;
  const vehiculo = buscarVehiculoPorID(data.id_vehiculo);
  document.getElementById("fechaHoraEntrada").value = data.fecha_entrada;
  document.getElementById("lugar").value = data.id_lugar;
  document.getElementById("tipoVehiculo").value = vehiculo.id_tipo_vehiculo;
  document.getElementById("abono").value = 0;
}
// Función para autocompletar la sección de detalle de la factura
function autocompletarDetalleFacturaAbono(data) {
  document.getElementById("idVehiculo").value = data.id_vehiculo;
  const vehiculo = buscarVehiculoPorID(data.id_vehiculo);
  document.getElementById("tipoVehiculo").value = vehiculo.id_tipo_vehiculo;

  document.getElementById("fechaHoraEntrada").disabled = false;
  document.getElementById("lugar").disabled = false;
  document.getElementById("abono").disabled = false;
  document.getElementById("patente").disabled = true;
  document.getElementById("tipoVehiculo").disabled = true;
  document.getElementById("marca").disabled = true;
  document.getElementById("modelo").disabled = true;
  document.getElementById("color").disabled = true;
  document.getElementById("precio").disabled = true;
}
async function buscarVehiculoPorID(id) {
  await fetch(`${API_URL}/api/Vehiculo/${id}`)
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("patente").value = data.patente;
      document.getElementById("tipoVehiculo").value = data.id_tipo_vehiculo;
      buscarModeloPorID(data.id_modelo);
      document.getElementById("color").value = data.color;
    })
    .catch((error) => console.error("Error al cargar el vehículo:", error));
}
async function buscarModeloPorID(id) {
  await fetch(`${API_URL}/api/Modelo/modelo/${id}`)
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("marca").value = data.id_marca;
      cargarModelos();
    })
    .catch((error) => console.error("Error al cargar el modelo:", error));
}
// Función para cargar modelos según la marca seleccionada
async function cargarModelos() {
  const marca = document.getElementById("marca").value;
  const modeloSelect = document.getElementById("modelo");

  if (marca === "otro") {
    const option = document.createElement("option");
    option.value = "otro";
    modeloSelect.appendChild(option);
  } else {
    await fetch(`${API_URL}/api/Modelo/buscar/${marca}`)
      .then((response) => response.json())
      .then((data) => {
        modeloSelect.innerHTML = "";
        data.forEach((modelo) => {
          const option = document.createElement("option");
          option.value = modelo.id_modelo;
          option.text = modelo.descripcion;
          modeloSelect.appendChild(option);
        });
      })

      .catch((error) => console.error("Error al cargar modelos:", error));
  }
}
async function registrarFactura() {
  const fecha = new Date().toISOString();
  const id_cliente = parseInt(document.getElementById("clienteID").value, 10);
  const id_tipo_factura = parseInt(
    document.getElementById("tipoFactura").value,
    10
  );
  const id_forma_pago = parseInt(
    document.getElementById("formaPago").value,
    10
  );
  const id_usuario = 1;
  const fecha_entrada = document.getElementById("fechaHoraEntrada").value;
  const fecha_salida = document.getElementById("fechaHoraSalida").value;
  const id_vehiculo = parseInt(document.getElementById("idVehiculo").value, 10);
  const id_lugar = document.getElementById("lugar").value;
  const id_abono = parseInt(document.getElementById("abono").value, 10);
  const precio = parseFloat(document.getElementById("total").value);
  const descuento = parseInt(document.getElementById("descuento").value, 10);
  const recargo = parseInt(document.getElementById("recargo").value, 10);

  const form = document.getElementById("formFactura");

  // Validar que los campos obligatorios no estén vacíos
  if (
    !fecha ||
    !id_cliente ||
    !id_tipo_factura ||
    !id_forma_pago ||
    !fecha_entrada ||
    !fecha_salida ||
    !id_vehiculo ||
    !precio ||
    !id_lugar
  ) {
    alert("Por favor, complete todos los campos obligatorios.");
    return;
  }

  // Envolver detallE_FACTURAs en un array
  const detallE_FACTURAs = [
    {
      fecha_entrada,
      fecha_salida,
      id_vehiculo,
      id_lugar,
      id_abono,
      precio,
      descuento,
      recargo,
    },
  ];
  //if(id_abono){detallE_FACTURAs.id_abono = id_abono;}
  // Preparar datos para envío
  const facturaData = {
    fecha,
    id_cliente,
    id_tipo_factura,
    id_forma_pago,
    id_usuario,
    detallE_FACTURAs, // Ahora es un array de objetos
  };

  try {
    const response = await fetch(`${API_URL}/api/Factura`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(facturaData),
    });
    if (response.ok) {
      console.log("Factura registrada:", facturaData);
      alert("Factura Registrada Correctamente");
      await ocuparLugar(id_lugar);
      form.reset();
    } else {
      alert("Error al agregar la Factura");
    }
  } catch (error) {
    console.error("Error:", error);
    //alert('Ocurrió un error al intentar agregar la Factura');
  }
}
async function cargarFacturas() {
  try {
    const response = await fetch(`${API_URL}/api/Factura`);
    if (!response.ok) throw new Error("Error al cargar las Facturas");
    let facturas = await response.json();
    const tablaFacturas = document.getElementById("tablaFacturas");
    tablaFacturas.innerHTML = "";
    facturas.forEach((fact) => {
      const tr = document.createElement("tr");
      const fecha = formatearFecha(fact.fecha);
      tr.innerHTML = `
                  <td scope="col">${fact.id_factura}</td>
                  <td scope="col">${fecha}</td>
                  <td scope="col">${fact.id_tipo_factura}</td>
                  <td scope="col">${fact.id_forma_pago}</td>
                  <td scope="col">${fact.id_cliente}</td>
                  <td scope="col">${fact.id_usuario}</td>
                  <td scope="col">${fact.detallE_FACTURAs[0].precio}</td>
      `;
      tablaFacturas.appendChild(tr);
    });
  } catch (error) {
    console.error("Error al cargar Cliente:", error);
    alert("Ocurrió un error al cargar los Cliente");
  }
}
//ACERCA DE

//Script para abrir la imagen completa

function zoomFotos() {
  const zoomableImages = document.querySelectorAll(".zoomable-image");

  zoomableImages.forEach(function (image) {
    image.addEventListener("click", function () {
      const zoomedContainer = document.createElement("div");
      zoomedContainer.classList.add("zoomed-image-container");

      const zoomedImage = document.createElement("img");
      zoomedImage.classList.add("zoomed-image");
      zoomedImage.src = image.src;
      zoomedImage.alt = image.alt;

      zoomedContainer.appendChild(zoomedImage);
      document.body.appendChild(zoomedContainer);

      zoomedContainer.addEventListener("click", function () {
        zoomedContainer.remove();
      });
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          zoomedContainer.remove();
        }
      });
    });
  });
}

//CONFIRMA CIERRE SESION
document
  .getElementById("logoutBtn")
  .addEventListener("click", function (event) {
    event.preventDefault(); // Previene la acción por defecto

    // Mostrar la confirmación
    const confirmLogout = confirm("¿Estás seguro de que deseas cerrar sesión?");

    // Si el usuario confirma, redirigir al login
    if (confirmLogout) {
      window.location.href = "/login.html";
    }
  });

/**
 * Cuando se logea almacenar el usuario y el rol , ademas el token
 * en cada endpoint enviar el token
 *
 * modificar la tabla
 *
 *
 *
 */

async function loginUsuario() {
  const usuario1 = document.getElementById("usuario").value;
  const contrasenia = document.getElementById("contrasenia").value;

  try {
    const response = await fetch(
      `https://localhost:7230/api/Usuario/PostLogin`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usuario1: usuario1, contrasenia: contrasenia }),
      }
    );
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("token", data.token);
      window.location.href = "/";

      alert("Login exitoso");
    } else {
      alert("Error de autenticación");
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
    //alert("Error de conexión con el servidor");
  }
}
