// ----- CONFIGURACIÓN (desde JSON) -----
let CONFIG = {
    empresa: {
        nombre: "InnoCR",
        direccion: "100 metros norte de la escuela, San José",
        telefono: "8888-8888",
        correo: "prueba@empresa.com",
        sitioWeb: "www.empresa.com",
        logo: "img/logo.jpg"  // Ruta relativa para que cargue en la página de factura
    },
    proforma: {
        numero: "2026071301",
        iva: 13   // 13%
    }
};

// ----- ESTADO INICIAL - PROFORMA VACÍA (solo una línea en blanco) -----
let items = [
    { desc: '', cantidad: 1, precio: 0.00 }
];

// ----- DOM REFS -----
const itemsBody = document.getElementById('itemsBody');
const subtotalSpan = document.getElementById('subtotalDisplay');
const ivaSpan = document.getElementById('ivaDisplay');
const totalSpan = document.getElementById('totalDisplay');
const clienteInput = document.getElementById('clienteInput');
const fechaInput = document.getElementById('fechaInput');
const monedaSelect = document.getElementById('monedaSelect');
const descuentoInput = document.getElementById('descuentoInput');
const proformaNumSpan = document.getElementById('proformaNum');
const clientePrint = document.getElementById('clientePrint');
const fechaPrint = document.getElementById('fechaPrint');
const monedaPrint = document.getElementById('monedaPrint');
const descuentoPrint = document.getElementById('descuentoPrint');
const printItemsBody = document.getElementById('printItemsBody');

// ----- UTILITY: formateo de moneda -----
function getCurrencySymbol() {
    return monedaSelect.value === 'USD' ? '$' : '₡';
}

function formatCurrency(value) {
    const symbol = getCurrencySymbol();
    const formatted = value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return symbol + formatted;
}

// ----- RENDERIZAR TABLA Y TOTALES -----
function renderItems() {
    let html = '';
    items.forEach((item, index) => {
        const totalItem = item.cantidad * item.precio;
        html += `<tr data-index="${index}">
            <td><input type="text" class="desc-input" value="${escapeHtml(item.desc)}" placeholder="Descripción del producto" /></td>
            <td><input type="number" class="cant-input" value="${item.cantidad}" min="0" step="1" /></td>
            <td><input type="number" class="precio-input" value="${item.precio}" min="0" step="0.01" /></td>
            <td class="item-total">${formatCurrency(totalItem)}</td>
            <td><button class="btn-eliminar" data-index="${index}"><i class="fas fa-trash-alt"></i></button></td>
        </tr>`;
    });
    itemsBody.innerHTML = html;

    actualizarTotales();
    renderPrintData();
    renderPrintSummary();

    document.querySelectorAll('.desc-input').forEach((inp, idx) => {
        inp.addEventListener('input', (e) => {
            items[idx].desc = e.target.value;
            renderPrintData();
        });
    });
    document.querySelectorAll('.cant-input').forEach((inp, idx) => {
        inp.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            items[idx].cantidad = isNaN(val) || val < 0 ? 0 : val;
            
            // Actualizar total de la fila en tiempo real en el DOM
            const row = inp.closest('tr');
            const totalCell = row.querySelector('.item-total');
            if (totalCell) {
                const totalItem = items[idx].cantidad * items[idx].precio;
                totalCell.textContent = formatCurrency(totalItem);
            }
            
            actualizarTotales();
            renderPrintData();
        });
        inp.addEventListener('blur', () => {
            renderItems();
        });
    });
    document.querySelectorAll('.precio-input').forEach((inp, idx) => {
        inp.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            items[idx].precio = isNaN(val) || val < 0 ? 0 : val;
            
            // Actualizar total de la fila en tiempo real en el DOM
            const row = inp.closest('tr');
            const totalCell = row.querySelector('.item-total');
            if (totalCell) {
                const totalItem = items[idx].cantidad * items[idx].precio;
                totalCell.textContent = formatCurrency(totalItem);
            }
            
            actualizarTotales();
            renderPrintData();
        });
        inp.addEventListener('blur', () => {
            renderItems();
        });
    });
    document.querySelectorAll('.btn-eliminar').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(btn.getAttribute('data-index'), 10);
            if (items.length > 1) {
                items.splice(index, 1);
                renderItems();
            } else {
                alert('Debe haber al menos un ítem en la proforma.');
            }
        });
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}

function formatInputValue(value) {
    const numericValue = parseFloat(value || 0);
    if (isNaN(numericValue)) return '';
    return formatCurrency(numericValue);
}

function renderPrintData() {
    if (clientePrint) clientePrint.textContent = clienteInput.value || 'Cliente';
    if (fechaPrint) fechaPrint.textContent = fechaInput.value || 'Fecha';
    if (monedaPrint) monedaPrint.textContent = monedaSelect.value === 'USD' ? 'USD' : 'CRC';
    if (descuentoPrint) {
        const subtotal = items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0);
        const pct = parseFloat(descuentoInput.value) || 0;
        const discountAmount = subtotal * (pct / 100);
        descuentoPrint.textContent = pct > 0 ? `${pct.toFixed(2)}% (${formatCurrency(discountAmount)})` : '0.00%';
    }
}

function renderPrintSummary() {
    if (!printItemsBody) return;

    const rowsHtml = items.map(item => {
        const totalItem = item.cantidad * item.precio;
        return `<tr>
            <td>${escapeHtml(item.desc || 'Sin descripción')}</td>
            <td>${item.cantidad}</td>
            <td>${formatCurrency(item.precio)}</td>
            <td>${formatCurrency(totalItem)}</td>
        </tr>`;
    }).join('');

    printItemsBody.innerHTML = rowsHtml;
}

// ----- ACTUALIZAR TOTALES (descuento en porcentaje, aplicado al subtotal) -----
function actualizarTotales() {
    let subtotal = 0;
    items.forEach(item => {
        subtotal += item.cantidad * item.precio;
    });

    const ivaPorcentaje = CONFIG.proforma.iva / 100;
    const descuentoPorcentaje = parseFloat(descuentoInput.value) || 0;
    const descuentoMonto = subtotal * (descuentoPorcentaje / 100);
    const subtotalConDescuento = Math.max(0, subtotal - descuentoMonto);
    const iva = subtotalConDescuento * ivaPorcentaje;
    const total = subtotalConDescuento + iva;

    subtotalSpan.textContent = formatCurrency(subtotal);
    ivaSpan.textContent = formatCurrency(iva);
    totalSpan.textContent = formatCurrency(total);
    renderPrintData();
}

// ----- AÑADIR FILA -----
function addRow() {
    items.push({ desc: '', cantidad: 1, precio: 0.00 });
    renderItems();
    const inputs = document.querySelectorAll('.desc-input');
    if (inputs.length) {
        inputs[inputs.length - 1].focus();
        inputs[inputs.length - 1].select();
    }
}

// ----- REINICIAR (proforma vacía con una línea) -----
function resetProforma() {
    items = [
        { desc: '', cantidad: 1, precio: 0.00 }
    ];
    clienteInput.value = '';
    fechaInput.value = getTodayDate();
    descuentoInput.value = '0';
    monedaSelect.value = 'CRC';
    renderItems();
}

// ----- OBTENER FECHA ACTUAL -----
function getTodayDate() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

// ----- IMPRIMIR (con corrección de formato) -----
function imprimirProforma() {
    // Sincronizar datos desde inputs a items
    const descInputs = document.querySelectorAll('.desc-input');
    const cantInputs = document.querySelectorAll('.cant-input');
    const precioInputs = document.querySelectorAll('.precio-input');

    descInputs.forEach((inp, i) => {
        if (items[i]) items[i].desc = inp.value;
    });
    cantInputs.forEach((inp, i) => {
        const val = parseFloat(inp.value);
        if (items[i]) items[i].cantidad = isNaN(val) || val < 0 ? 0 : val;
    });
    precioInputs.forEach((inp, i) => {
        const val = parseFloat(inp.value);
        if (items[i]) items[i].precio = isNaN(val) || val < 0 ? 0 : val;
    });

    // Re-renderizar para actualizar totales
    renderItems();

    // Imprimir
    window.print();
}

// ----- INICIALIZACIÓN -----
async function init() {
    try {
        const response = await fetch('data/config.json');
        if (response.ok) {
            const data = await response.json();
            CONFIG = {
                empresa: { ...CONFIG.empresa, ...data.empresa },
                proforma: { ...CONFIG.proforma, ...data.proforma }
            };
            if (CONFIG.empresa.logo && CONFIG.empresa.logo.startsWith('/')) {
                CONFIG.empresa.logo = CONFIG.empresa.logo.substring(1);
            }
        }
    } catch (e) {
        console.warn("No se pudo cargar data/config.json, usando valores por defecto.", e);
    }

    proformaNumSpan.textContent = CONFIG.proforma.numero;

    // Actualizar información de contacto en el header
    const contactInfo = document.querySelector('.contact-info');
    if (contactInfo) {
        const telefonoSpan = contactInfo.querySelector('.fa-phone')?.parentElement;
        const correoSpan = contactInfo.querySelector('.fa-envelope')?.parentElement;
        const webSpan = contactInfo.querySelector('.fa-globe')?.parentElement;

        if (telefonoSpan) telefonoSpan.innerHTML = `<i class="fas fa-phone"></i> ${CONFIG.empresa.telefono}`;
        if (correoSpan) correoSpan.innerHTML = `<i class="fas fa-envelope"></i> ${CONFIG.empresa.correo}`;
        if (webSpan) webSpan.innerHTML = `<i class="fas fa-globe"></i> ${CONFIG.empresa.sitioWeb}`;
    }

    // Logo - Usar la ruta completa del JSON
    const logoImg = document.getElementById('logoPreview');
    if (logoImg) {
        logoImg.src = CONFIG.empresa.logo;  // Usar la ruta exacta del JSON
        logoImg.alt = CONFIG.empresa.nombre;
        logoImg.onerror = function () {
            // Si no carga la imagen, mostrar el nombre de la empresa
            this.style.display = 'none';
            const h1Element = document.querySelector('.company-info h1');
            if (h1Element) {
                h1Element.textContent = CONFIG.empresa.nombre;
            }
        };
    }

    // Fecha por defecto: hoy
    fechaInput.value = getTodayDate();

    // Render inicial (proforma vacía)
    renderItems();

    // Eventos
    document.getElementById('addRowBtn').addEventListener('click', addRow);
    document.getElementById('resetBtn').addEventListener('click', resetProforma);
    document.getElementById('printBtn').addEventListener('click', imprimirProforma);

    // Cambio de moneda o descuento → recalcular
    clienteInput.addEventListener('input', renderPrintData);
    fechaInput.addEventListener('change', renderPrintData);
    monedaSelect.addEventListener('change', () => {
        actualizarTotales();
        renderPrintData();
    });
    descuentoInput.addEventListener('input', () => {
        actualizarTotales();
    });
    descuentoInput.addEventListener('blur', () => {
        const rawValue = parseFloat(descuentoInput.value || 0);
        descuentoInput.value = isNaN(rawValue) ? '0.00' : rawValue.toFixed(2);
        actualizarTotales();
    });
}

// Ejecutar al cargar
init();