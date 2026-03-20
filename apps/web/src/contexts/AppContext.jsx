import { createContext, useContext, useState, useEffect, useRef } from "react";
import { currentPeriodo, currentPeriodoCode } from "../utils/periodo";

const AppContext = createContext(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

/**
 * Clasificador de comprobantes para deducción de Ganancias (SiRADIG).
 *
 * Deducciones admitidas (Ley 20.628 y modificatorias):
 * - Art. 82 inc. h): Amortización de equipamiento y herramientas de trabajo
 *   (computadoras, muebles de oficina, herramientas profesionales, indumentaria laboral)
 * - Art. 81 inc. a): Intereses de créditos hipotecarios (vivienda propia, tope $20.000/mes)
 * - Art. 81 inc. b): Seguros de vida y retiro
 * - Art. 81 inc. c): Donaciones a entidades exentas (fundaciones, asociaciones civiles)
 * - Art. 81 inc. g): Honorarios médicos y paramédicos (40% del total, con tope)
 * - Art. 81 inc. h): Cuotas medicina prepaga / obra social
 * - Art. 16 Ley 26.063: Servicio doméstico (personal de casas particulares)
 * - RG 4003: Alquileres de vivienda (hasta 40% del alquiler, con tope)
 * - Indumentaria y equipamiento de trabajo (uniformes, ropa de seguridad, EPP)
 * - Gastos de movilidad, viáticos y material de estudio (si el convenio colectivo los prevé)
 *
 * NO deducibles:
 * - Alimentos, supermercados, delivery, consumo personal
 * - Servicios domiciliarios (luz, gas, agua, internet, cable)
 * - Combustible, peajes, estacionamiento (salvo viático probado)
 * - Entretenimiento, restaurantes, bares, esparcimiento
 * - Indumentaria no laboral (ropa casual, calzado común)
 * - Transporte público (SUBE, tren, colectivo)
 */
/**
 * Topes anuales de deducción — Ganancias 2026 (primer semestre).
 * Se actualizan semestralmente por ARCA según inflación (art. 25 Ley 27.743).
 */
/**
 * Mínimo no imponible y deducción especial — Art. 23 y 24, Ley 20.628
 * Valores 2026 primer semestre (actualizables por ARCA/RG vigente).
 * El "piso" para pagar Ganancias = (GNI + deducción especial) / 12 / 0.83
 * Si el sueldo bruto mensual es menor a este piso, NO paga Ganancias.
 */
export const gananciasConfig2026 = {
  gniAnual: 5151802.50,           // Ganancia No Imponible anual
  deduccionEspecialAnual: 24728649.96, // Deducción especial 4ta categoría
  aportesRate: 0.17,              // Aportes obligatorios (~17% del bruto)
  // Piso mensual bruto para pagar Ganancias (calculado):
  get pisoMensualBruto() {
    return (this.gniAnual + this.deduccionEspecialAnual) / 12 / (1 - this.aportesRate);
  },
  // Fuente y fecha de actualización
  fuente: "RG ARCA - Valores primer semestre 2026",
  ultimaActualizacion: "2026-01-01",
};

export const topesAnuales2026 = {
  // GNI 2026 S1 = $5,151,802.50 anual
  servicio_domestico:   { tope: 5151802.50, tipo: "anual", desc: "Tope = Ganancia No Imponible (GNI)" },
  seguro_vida:          { tope: 753472.14, tipo: "anual", desc: "Tope anual actualizable" },
  seguro_mixto:         { tope: 753472.14, tipo: "anual", desc: "Comparte tope con seguro de vida" },
  seguro_retiro:        { tope: 753472.14, tipo: "anual", desc: "Comparte tope con seguro de vida" },
  honorarios_medicos:   { porcentaje: 0.40, porcentajeGanNeta: 0.05, desc: "40% del monto, tope 5% de ganancia neta (compartido con prepaga y donaciones)" },
  prepaga:              { porcentajeGanNeta: 0.05, desc: "Tope 5% de ganancia neta (compartido con honorarios médicos y donaciones)" },
  donaciones:           { porcentajeGanNeta: 0.05, desc: "Tope 5% de ganancia neta (compartido con honorarios médicos y prepaga)" },
  alquiler:             { porcentaje: 0.40, tope: 5151802.50, tipo: "anual", desc: "40% del alquiler, tope = GNI anual" },
  hipotecario:          { tope: 20000, tipo: "anual", desc: "Tope $20.000/año (congelado desde 2001)" },
  gastos_sepelio:       { tope: 996.23, tipo: "anual", desc: "Tope $996,23/año (congelado)" },
  vehiculo_corredores:  { porcentaje: 0.01, desc: "Hasta 1% de remuneraciones (vehículo propio)" },
  educacion:            { tope: 2060721.00, tipo: "anual", desc: "40% del GNI — gastos educativos hijos hasta 24 años" },
  indumentaria_equipamiento: { desc: "Sin tope — debe ser obligatorio para el trabajo y no reembolsado" },
  ropa_trabajo:              { desc: "Sin tope — debe ser obligatorio para el trabajo y no reembolsado" },
};

/**
 * Cargas de familia — Art. 23 inc. b, Ley 20.628
 * Valores anuales 2026 primer semestre (actualizados por ARCA).
 * Aplican si el familiar no tiene ingresos propios > Mínimo No Imponible.
 */
export const cargasFamiliaMontos2026 = {
  conyuge:           { anual: 6912735.72, mensual: 576061.31, label: "Cónyuge / Unión convivencial" },
  hijo:              { anual: 3480913.02, mensual: 290076.09, label: "Hijo/a menor de 18 años" },
  hijo_incapacitado: { anual: 3480913.02, mensual: 290076.09, label: "Hijo/a incapacitado/a (sin límite de edad)" },
};

/**
 * Escala del Art. 94 — Tramos de alícuotas Ganancias 4ta categoría 2026.
 * Ganancia neta imponible acumulada → tasa marginal.
 */
export const escalaGanancias2026 = [
  { desde: 0,           hasta: 1191204.84,  fijo: 0,           tasa: 0.05 },
  { desde: 1191204.84,  hasta: 2382409.68,  fijo: 59560.24,    tasa: 0.09 },
  { desde: 2382409.68,  hasta: 3573614.52,  fijo: 166768.68,   tasa: 0.12 },
  { desde: 3573614.52,  hasta: 4764819.36,  fijo: 309713.26,   tasa: 0.15 },
  { desde: 4764819.36,  hasta: 9529638.72,  fijo: 488394.00,   tasa: 0.19 },
  { desde: 9529638.72,  hasta: 14294458.08, fijo: 1393709.77,  tasa: 0.23 },
  { desde: 14294458.08, hasta: 19059277.44, fijo: 2489597.32,  tasa: 0.27 },
  { desde: 19059277.44, hasta: 28588916.16, fijo: 3796498.44,  tasa: 0.31 },
  { desde: 28588916.16, hasta: Infinity,    fijo: 6750695.34,  tasa: 0.35 },
];

const classifyTicket = (t) => {
  const name = (t.provider || "").toLowerCase();
  const tipo = (t.type || "").toLowerCase();
  const amount = t.amount || 0;

  // ── NOTAS DE CRÉDITO: Ajustan montos (se restan) ──
  if (/nota de cr[eé]dito|nota cr[eé]dito/.test(tipo))
    return { status: "approved", reason: "Nota de crédito – se resta del total de deducciones del emisor original", siradigCategory: "nota_credito", isNotaCredito: true };

  // ── RECHAZADOS: Gastos personales no deducibles ──

  // Supermercados y alimentos
  if (/coto|carrefour|walmart|vea |disco |jumbo|superm|almac[eé]n|diarco|makro|dia |changomas|la anonima|vital|maxiconsumo|yaguar/.test(name))
    return { status: "rejected", reason: "Supermercado/alimentos – gasto personal", siradigCategory: null };

  // Delivery y comida
  if (/rappi|pedidosya|glovo|uber eats|mcdonalds|burger|starbucks|mostaza|grido|havanna|freddo/.test(name))
    return { status: "rejected", reason: "Delivery/gastronomía – gasto personal", siradigCategory: null };

  // Servicios domiciliarios
  if (/edenor|edesur|edemsa|edersa|epec|metrogas|camuzzi|gas ban|gas nea|litoral gas|aysa|absa|aguas|cablevisi[oó]n|fibertel|telecom|personal |claro |movistar|tuenti|directv|flow |telecentro/.test(name))
    return { status: "rejected", reason: "Servicio domiciliario – no deducible", siradigCategory: null };

  // Peajes y transporte personal
  if (/autopista|peaje|ausa|aubasa|ausol|cvsa|cocavial|sube |ecobici/.test(name))
    return { status: "rejected", reason: "Peaje/transporte – gasto personal", siradigCategory: null };

  // Combustible
  if (/ypf|shell|axion|puma energy|gulf|petrobras|oil combustible/.test(name))
    return { status: "rejected", reason: "Combustible – gasto personal", siradigCategory: null };

  // Entretenimiento y esparcimiento
  if (/cine|hoyts|cinemark|spotify|netflix|disney|hbo|amazon prime|playstation|steam|xbox|parque|gimnasio|megatlon|sportclub|fiter/.test(name))
    return { status: "rejected", reason: "Entretenimiento – no deducible", siradigCategory: null };

  // Indumentaria casual / moda
  if (/zara|h&m|rapsodia|kosiuko|levis|nike |adidas|reebok|puma |dexter|moov|grimoldi|paruolo|prune|isadora|ay not dead|cuesta blanca|paula cahen/.test(name))
    return { status: "rejected", reason: "Indumentaria casual – no deducible", siradigCategory: null };

  // Kioscos, farmacias (uso personal), bazares
  if (/kiosco|maxikiosco|drugstore|open 25|farmacity|farm\. |bazar/.test(name))
    return { status: "rejected", reason: "Consumo personal – no deducible", siradigCategory: null };

  // Restaurantes, bares, cafeterías
  if (/restaurante|resto |bar |pub |cafe |cafeter[ií]a|rotiser[ií]a|pizzer[ií]a|parrilla|sushi|comedor/.test(name))
    return { status: "rejected", reason: "Gastronomía – gasto personal", siradigCategory: null };

  // ── APROBADOS: Deducciones permitidas por normativa ──

  // Medicina prepaga y obras sociales (Art. 81 inc. h)
  if (/osde|swiss medical|galeno|medicus|omint|medif[eé]|hospital|sanatorio|cl[ií]nica|laboratorio|sancor salud|accord salud|uni[oó]n personal|obra social|prepaga|osprera|osecac|osdepym|osplad|ioma|pami|iosfa|osba|osuthgra|ospjn|ospoce/.test(name))
    return { status: "approved", reason: "Prepaga/obra social – deducible (Art. 81 inc. h)", siradigCategory: "prepaga" };

  // Honorarios médicos (Art. 81 inc. g) – 40% del monto
  if (/m[eé]dic[oa]|odont[oó]log|kinesio|fonoaudi|psic[oó]log|nutrici|oftalmol|traumat|dermat|ginec[oó]|pediatr|cardiol|neurol|urol|oncol|endocrin|reumat|dr\. |dra\. |consul?torio|laboratorio cl[ií]nic/.test(name))
    return { status: "approved", reason: "Honorarios médicos – deducible 40% (Art. 81 inc. g)", siradigCategory: "honorarios_medicos" };

  // Seguros de vida y retiro (Art. 81 inc. b)
  if (/seguro de vida|seguros de retiro|la caja seguros|sancor seguros|zurich|mapfre|allianz|smg seguros|prevenci[oó]n|provincia seguros|naci[oó]n seguros|met life|metlife|prudential/.test(name))
    return { status: "approved", reason: "Seguro de vida/retiro – deducible (Art. 81 inc. b)", siradigCategory: "seguro_vida" };

  // Seguros mixtos / ahorro (Art. 81 inc. b) — primas de ahorro
  if (/seguro mixto|ahorro.*seguro|seguro.*ahorro|plan de ahorro|capitaliza/.test(name))
    return { status: "approved", reason: "Seguro mixto/ahorro – deducible (Art. 81 inc. b)", siradigCategory: "seguro_mixto" };

  // Planes de retiro privados (Art. 81 inc. b)
  if (/retiro privado|plan.*retiro|pensi[oó]n privad|fondo.*retiro|retiro complementario/.test(name))
    return { status: "approved", reason: "Plan de retiro privado – deducible (Art. 81 inc. b)", siradigCategory: "seguro_retiro" };

  // Sociedades de Garantía Recíproca - SGR (Art. 81 inc. d)
  if (/garant[ií]a rec[ií]proca|sgr |sociedad.*garant|fondo de riesgo sgr/.test(name))
    return { status: "approved", reason: "Aporte SGR – deducible (Art. 81 inc. d)", siradigCategory: "sgr" };

  // Intereses hipotecarios (Art. 81 inc. a) — créditos para vivienda
  if (/hipotecar|cr[eé]dito vivienda|pr[eé]stamo vivienda|banco hipotecario|procrear|intereses? hipotecar/.test(name))
    return { status: "approved", reason: "Intereses hipotecarios – deducible con tope anual (Art. 81 inc. a)", siradigCategory: "hipotecario" };

  // Servicio doméstico (Ley 26.063 art. 16)
  if (/servicio dom[eé]stico|personal de casas|emplead[oa] dom[eé]stic|casas particulares/.test(name))
    return { status: "approved", reason: "Servicio doméstico – deducible (Ley 26.063 art. 16)", siradigCategory: "servicio_domestico" };

  // Donaciones a entidades exentas (Art. 81 inc. c)
  if (/fundaci[oó]n|asociaci[oó]n civil|cruz roja|c[aá]ritas|unicef|greenpeace|m[eé]dicos sin fronteras|donaci[oó]n|techo |luchemos por la vida/.test(name))
    return { status: "approved", reason: "Donación a entidad exenta – hasta 5% de ganancia neta (Art. 81 inc. c)", siradigCategory: "donaciones" };

  // Gastos de sepelio (Art. 22 inc. d)
  if (/sepelio|funerar|cocherf|sepelios|servicio f[uú]nebre/.test(name))
    return { status: "approved", reason: "Gastos de sepelio – deducible con tope anual (Art. 22 inc. d)", siradigCategory: "gastos_sepelio" };

  // Educación técnica específica (plataformas de capacitación laboral)
  if (/coderhouse|platzi|digital house|acamica|henry|soy henry|educaci[oó]n it|educacion ejecutiva/.test(name))
    return { status: "approved", reason: "Capacitación laboral – deducible (Art. 82)", siradigCategory: "educacion" };

  // Educación genérica — solo deducible si vinculada al trabajo, requiere verificación
  if (/universidad|facultad|instituto|educaci[oó]n|capacitaci[oó]n|curso|udemy|coursera|maestr[ií]a|posgrado|diplomatura/.test(name))
    return { status: "pending", reason: "Educación – solo deducible si está vinculada al trabajo (Art. 82). Verificar", siradigCategory: "educacion" };

  // Equipamiento informático específico (marcas tech puras)
  if (/tech|software|digital|sistemas|inform[aá]tic|comput|developer|studio|design|media|cloud|data|code|web|logitech|corsair|razer|microsoft|adobe|google cloud|aws/.test(name))
    return { status: "approved", reason: "Equipamiento/tecnología – herramienta de trabajo (Art. 82 inc. h)", siradigCategory: "indumentaria_equipamiento" };

  // Electrónicas/retail — podrían ser electrodomésticos (TV, heladera) o herramientas de trabajo
  if (/garbarino|fravega|musimundo|compumundo|megatone|naldo|cetrogar|samsung|apple|lenovo|dell |hp |asus|acer|intel/.test(name))
    return { status: "pending", reason: "Electrónica – solo deducible si es herramienta de trabajo (Art. 82 inc. h). Verificar producto", siradigCategory: "indumentaria_equipamiento" };

  // Muebles de oficina
  if (/mueble|escritorio|silla ergon|mobiliario|oficina|easy |sodimac|home depot/.test(name))
    return { status: "pending", reason: "Muebles – deducible si es uso laboral (Art. 82 inc. h). Confirmar destino", siradigCategory: "indumentaria_equipamiento" };

  // Librerías y material de estudio/trabajo
  if (/librer[ií]a|papeler[ií]a|ateneo|cúspide|yenny|librería|tinta|cartridge|toner/.test(name))
    return { status: "approved", reason: "Material de trabajo – deducible (Art. 82 inc. h)", siradigCategory: "indumentaria_equipamiento" };

  // Cuotas sindicales (Art. 82 inc. a)
  if (/sindicato|sindical|gremio|gremial|uom |uocra|smata|utedyc|upcn|ate |suteba|sadop|luz y fuerza|bancarios|sec |uatre|fatsa|sanidad/.test(name))
    return { status: "approved", reason: "Cuota sindical – deducible (Art. 82 inc. a)", siradigCategory: "cuota_sindical" };

  // Colegios profesionales
  if (/colegio de|consejo profesional|matr[ií]cula|colegio p[uú]blico/.test(name))
    return { status: "approved", reason: "Matrícula profesional – deducible (Art. 82)", siradigCategory: "colegios_profesionales" };

  // Aportes jubilatorios voluntarios (Art. 81 inc. d)
  if (/aporte voluntario|jubilaci[oó]n voluntar|fondo de retiro|retiro complementario|caja complementaria|previsi[oó]n social/.test(name))
    return { status: "approved", reason: "Aporte jubilatorio voluntario – deducible (Art. 81 inc. d)", siradigCategory: "aportes_jubilatorios" };

  // Indumentaria laboral específica (uniformes, seguridad)
  if (/uniforme|ropa de trabajo|calzado de seguridad|epp|elementos de protecci[oó]n|indumentaria laboral/.test(name))
    return { status: "approved", reason: "Indumentaria laboral – deducible (Art. 82 inc. h)", siradigCategory: "indumentaria_equipamiento" };

  // ── PENDIENTES: Requieren evaluación adicional ──

  // Percepciones — RG 4815 (USD), RG 3450 (tarjeta exterior), aduaneras
  if (/percepci[oó]n.*rg.?4815|rg.?4815|d[oó]lar ahorro|compra.*moneda extranjera|percep.*usd/.test(name) || (/percepci[oó]n/.test(tipo) && /usd|d[oó]lar|moneda/.test(name)))
    return { status: "approved", reason: "Percepción compra USD (RG 4815) – recuperable vía SiRADIG", siradigCategory: "percepciones_usd" };
  if (/percepci[oó]n.*rg.?3450|rg.?3450|tarjeta.*exterior|compra.*exterior|percep.*tarjeta/.test(name))
    return { status: "approved", reason: "Percepción compra exterior con tarjeta (RG 3450) – recuperable vía SiRADIG", siradigCategory: "percepciones_tarjeta" };
  if (/percepci[oó]n.*aduana|aduana.*percep|importaci[oó]n.*percep/.test(name))
    return { status: "approved", reason: "Percepción aduanera – recuperable vía SiRADIG", siradigCategory: "percepciones_aduana" };
  if (/percepci[oó]n|impuesto pa[ií]s|adelanto ganancias|ret\.? ganancias/.test(name) || /percepci[oó]n/.test(tipo))
    return { status: "pending", reason: "Percepción – verificar tipo (USD/tarjeta/aduana) para clasificar correctamente", siradigCategory: "percepciones_usd" };

  // Impuesto al cheque (Ley 25.413) — 34% computable como pago a cuenta
  if (/imp(uesto)?.*(d[eé]bito|cr[eé]dito).*bancar|ley.?25\.?413|imp.*cheque|d[eé]b.*cr[eé]d.*banc/.test(name))
    return { status: "approved", reason: "Impuesto al cheque – 34% computable como pago a cuenta (Ley 25.413)", siradigCategory: "impuesto_cheque" };

  // Corredores y viajantes de comercio — vehículos (Art. 82 inc. d)
  if (/corredor|viajante de comercio|comisionista|representante comercial/.test(name))
    return { status: "approved", reason: "Gastos de movilidad – corredores/viajantes (Art. 82 inc. d)", siradigCategory: "vehiculo_corredores" };

  // Intereses de corredores y viajantes (Art. 82 inc. d)
  if (/inter[eé]s.*corredor|inter[eé]s.*viajante|financiaci[oó]n.*veh[ií]culo.*comerci/.test(name))
    return { status: "approved", reason: "Intereses corredores/viajantes (Art. 82 inc. d)", siradigCategory: "intereses_corredores" };

  // Vehículo afectado a trabajo — amortización
  if (/amortizaci[oó]n.*veh[ií]culo|amortizaci[oó]n.*rodado|auto.*trabajo|veh[ií]culo.*laboral/.test(name))
    return { status: "pending", reason: "Vehículo para trabajo – verificar afectación laboral (Art. 82 inc. h)", siradigCategory: "vehiculo_corredores" };

  // Alquileres (RG 4003 – hasta 40%)
  if (/alquiler|inmobiliaria|propiedad|locaci[oó]n|inquilino/.test(name))
    return { status: "pending", reason: "Alquiler – deducible hasta 40%, vivienda habitual (RG 4003). Verificar contrato", siradigCategory: "alquiler" };

  // Marketplaces – depende del producto
  if (/mercadolibre|mercado libre|amazon|tienda oficial|linio|dexter online|dafiti/.test(name))
    return { status: "pending", reason: "Marketplace – solo si es equipamiento laboral. Verificar compra", siradigCategory: "por_confirmar" };

  // Seguros genéricos (puede ser auto, hogar, etc.)
  if (/seguro|asegurad|la segunda|federaci[oó]n patronal|rivadavia|san crist[oó]bal|berkley/.test(name))
    return { status: "pending", reason: "Seguro – solo deducible si es de vida o retiro (Art. 81 inc. b). Verificar póliza", siradigCategory: "por_confirmar" };

  // Bancos — podrían ser intereses hipotecarios
  if (/banco |bco\.|bnk|santander|bbva|galicia|macro|naci[oó]n|provincia|ciudad|hsbc|icbc|supervielle|patagonia|comafi|itau/.test(name))
    return { status: "pending", reason: "Banco – verificar si son intereses hipotecarios (Art. 81 inc. a) u otro concepto", siradigCategory: "por_confirmar" };

  // Facturas tipo C (monotributistas)
  if (/factura c|fact\.? c/.test(tipo))
    return { status: "pending", reason: "Factura C (monotributista) – deducible si el gasto es admitido. Verificar rubro", siradigCategory: "por_confirmar" };

  // Persona jurídica genérica (SRL, SA, etc.)
  if (/s\.r\.l\.?|srl|s\.a\.?(?:\s|$)|sociedad an[oó]nima|sociedad de responsabilidad|ltda|s\.c\.a|s\.a\.s/.test(name))
    return { status: "pending", reason: "Empresa – verificar rubro para determinar deducibilidad", siradigCategory: "por_confirmar" };

  // Persona física (nombre corto, posible profesional)
  const words = name.trim().split(/\s+/);
  if (words.length >= 2 && words.length <= 4 && /^[a-záéíóúñ]+$/i.test(words[0]))
    return { status: "pending", reason: "Posible profesional – verificar si es honorario médico u otro servicio deducible", siradigCategory: "por_confirmar" };

  // Default
  return { status: "pending", reason: "Verificar rubro del proveedor para determinar deducibilidad", siradigCategory: "por_confirmar" };
};

export const steps = ["Inicio", "Comprobantes", "Análisis", "SiRADIG"];
export const statusConfig = {
  approved: { label: "Aplica",      bg: "#ecfdf5", text: "#059669", border: "#a7f3d0", dot: "#10b981" },
  rejected: { label: "No aplica",   bg: "#fef2f2", text: "#dc2626", border: "#fecaca", dot: "#ef4444" },
  pending:  { label: "A confirmar", bg: "#fffbeb", text: "#d97706", border: "#fde68a", dot: "#f59e0b" },
  loaded:   { label: "Cargado",     bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe", dot: "#3b82f6" },
};

/**
 * Categorías alineadas con F.572 Web real de ARCA (SiRADIG).
 * Cada key mapea a una sección/subsección del formulario.
 *
 * SECCIÓN 1: Cargas de familia
 * SECCIÓN 2: Pluriempleo (otros empleadores)
 * SECCIÓN 3: Deducciones y desgravaciones (16 tipos en ARCA)
 * SECCIÓN 4: Retenciones, Percepciones y Pagos a Cuenta (5 tipos en ARCA)
 * SECCIÓN 5: Beneficios (jubilado/pensionado — no aplica empleados activos)
 */
export const siradigCategories = {
  // ── SECCIÓN 3: Deducciones y desgravaciones (exacto F.572) ──
  prepaga:                    { label: "Cuotas Médico-Asistenciales",                    icon: "🏥",  shortLabel: "Prepaga/Obra Social", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", articulo: "Art. 81 inc. h", seccion: 3 },
  honorarios_medicos:         { label: "Gastos médicos y paramédicos",                   icon: "👨‍⚕️", shortLabel: "Honorarios médicos",  color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", articulo: "Art. 81 inc. g – 40% deducible", seccion: 3 },
  seguro_vida:                { label: "Primas de Seguro para muerte/riesgo de muerte",  icon: "🛡️",  shortLabel: "Seguro vida",         color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", articulo: "Art. 81 inc. b", seccion: 3 },
  seguro_mixto:               { label: "Primas de Ahorro - Seguros Mixtos",              icon: "🛡️",  shortLabel: "Seguro mixto",        color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", articulo: "Art. 81 inc. b", seccion: 3 },
  seguro_retiro:              { label: "Aportes a Planes de Seguro de Retiro Privados",  icon: "🏦",  shortLabel: "Retiro privado",      color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", articulo: "Art. 81 inc. b", seccion: 3 },
  donaciones:                 { label: "Donaciones a entidades exentas",                 icon: "🎁",  shortLabel: "Donaciones",           color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", articulo: "Art. 81 inc. c – hasta 5% gan. neta", seccion: 3 },
  hipotecario:                { label: "Intereses préstamo hipotecario",                 icon: "🏦",  shortLabel: "Hipotecario",          color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", articulo: "Art. 81 inc. a – con tope anual", seccion: 3 },
  gastos_sepelio:             { label: "Gastos de sepelio",                              icon: "⚱️",  shortLabel: "Sepelio",              color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", articulo: "Art. 22 inc. d – con tope anual", seccion: 3 },
  indumentaria_equipamiento:  { label: "Equipamiento para uso en el trabajo",           icon: "💻",  shortLabel: "Equipamiento",         color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", articulo: "Art. 82 inc. h", seccion: 3 },
  ropa_trabajo:               { label: "Ropa de trabajo",                              icon: "👔",  shortLabel: "Ropa trabajo",         color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", articulo: "Art. 82 inc. h", seccion: 3 },
  alquiler:                   { label: "Alquiler de inmuebles - casa habitación",        icon: "🏠",  shortLabel: "Alquiler",             color: "#d97706", bg: "#fffbeb", border: "#fde68a", articulo: "RG 4003 – 40% deducible", seccion: 3 },
  servicio_domestico:         { label: "Deducción del personal doméstico",               icon: "🏡",  shortLabel: "Serv. doméstico",      color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", articulo: "Ley 26.063 art. 16", seccion: 3 },
  sgr:                        { label: "Aporte a sociedades de garantía recíproca",      icon: "🤝",  shortLabel: "SGR",                  color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", articulo: "Art. 81 inc. d", seccion: 3 },
  fondos_comunes_inversion:   { label: "Fondos comunes de inversión",                    icon: "📊",  shortLabel: "FCI",                  color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", articulo: "Art. 81 inc. d", seccion: 3, keywords: ["fondo comun", "fci", "inversion", "cuotaparte"] },
  vehiculo_corredores:        { label: "Vehículos de corredores y viajantes",            icon: "🚗",  shortLabel: "Vehículo corredor",    color: "#d97706", bg: "#fffbeb", border: "#fde68a", articulo: "Art. 82 inc. d", seccion: 3 },
  intereses_corredores:       { label: "Intereses de corredores y viajantes",            icon: "💰",  shortLabel: "Int. corredores",      color: "#d97706", bg: "#fffbeb", border: "#fde68a", articulo: "Art. 82 inc. d", seccion: 3 },
  educacion:                  { label: "Gastos de Educación",                            icon: "📚",  shortLabel: "Educación",            color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", articulo: "Art. 82", seccion: 3 },
  otras_deducciones:          { label: "Otras deducciones",                              icon: "📋",  shortLabel: "Otras deducciones",    color: "#d97706", bg: "#fffbeb", border: "#fde68a", articulo: "Varios", seccion: 3 },

  // ── SECCIÓN 4: Retenciones, Percepciones y Pagos a Cuenta (exacto F.572) ──
  impuesto_cheque:            { label: "Impuesto sobre créditos y débitos",              icon: "🏧",  shortLabel: "Imp. cheque",          color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", articulo: "Ley 25.413 – 34% pago a cuenta", seccion: 4 },
  percepciones_aduana:        { label: "Percepciones / Retenciones aduaneras",           icon: "🛃",  shortLabel: "Percep. aduana",       color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", articulo: "Recupero vía SiRADIG", seccion: 4 },
  pago_cuenta_3819:           { label: "Pago a Cuenta RG 3819/2015 - Cancelac. Efectivo",icon: "💵", shortLabel: "Pago cta. efectivo",   color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", articulo: "RG 3819/2015", seccion: 4 },
  pago_cuenta_5617:           { label: "Pago a Cuenta RG (ARCA) 5617/2024",             icon: "💵",  shortLabel: "Pago cta. 5617",       color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", articulo: "RG 5617/2024", seccion: 4 },
  autorretenciones_5683:      { label: "Autorretenciones RG (ARCA) 5683/2025",          icon: "💵",  shortLabel: "Autoret. 5683",        color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", articulo: "RG 5683/2025", seccion: 4 },

  // ── SECCIÓN 1: Cargas de familia ──
  cargas_familia:             { label: "Cargas de familia",                              icon: "👨‍👩‍👧‍👦", shortLabel: "Cargas de familia",    color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe", articulo: "Art. 23 inc. b", seccion: 1 },

  // ── SECCIÓN 2: Pluriempleo ──
  pluriempleo:                { label: "Ingresos otros empleadores",                     icon: "🏢",  shortLabel: "Pluriempleo",          color: "#dc2626", bg: "#fef2f2", border: "#fecaca", articulo: "Art. 14 RG 4003 – OBLIGATORIO informar", seccion: 2 },

  // ── Categorías de Mis Retenciones (auto-fill desde mirequa) ──
  percepciones_usd:           { label: "Percepciones compra USD (Régimen 594)",          icon: "💵",  shortLabel: "Percepciones USD",     color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", articulo: "RG 4815 – régimen 594", seccion: 4 },
  percepciones_tarjeta:       { label: "Percepciones tarjeta exterior (Régimen 596)",    icon: "💳",  shortLabel: "Percep. tarjeta ext.", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", articulo: "RG 3450 – régimen 596", seccion: 4 },

  // ── Categorías auxiliares (no van directo al F.572 pero ayudan al clasificador) ──
  cuota_sindical:             { label: "Cuotas sindicales",                              icon: "🏛️",  shortLabel: "Sindicato",            color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", articulo: "Art. 82 inc. a – la retiene el empleador", seccion: null },
  aportes_jubilatorios:       { label: "Aportes jubilatorios voluntarios",               icon: "🏦",  shortLabel: "Aportes voluntarios",  color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", articulo: "Art. 81 inc. d", seccion: 3 },
  colegios_profesionales:     { label: "Cuotas de colegios profesionales",               icon: "🎓",  shortLabel: "Matrícula",            color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", articulo: "Art. 82 – va en Otras deducciones", seccion: 3 },
  viaticos_movilidad:         { label: "Viáticos y movilidad",                           icon: "🚗",  shortLabel: "Viáticos",             color: "#d97706", bg: "#fffbeb", border: "#fde68a", articulo: "Art. 82 inc. e – según CCT", seccion: null },
  nota_credito:               { label: "Notas de crédito (ajustes)",                     icon: "↩️",  shortLabel: "Notas de crédito",     color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", articulo: "Resta del total del emisor", seccion: null },
  por_confirmar:              { label: "Pendiente de revisión",                          icon: "❓",  shortLabel: "A confirmar",          color: "#d97706", bg: "#fffbeb", border: "#fde68a", articulo: "Verificar con contador", seccion: null },
};

export const fmt = (n) => "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2 });

/** Corte del día 10: deducciones cargadas después del 10 aplican al mes siguiente */
export const getCutoffInfo = () => {
  const today = new Date();
  const day = today.getDate();
  const daysLeft = day <= 10 ? 10 - day : 0;
  return { day, pastCutoff: day > 10, daysLeft };
};

export const cardStyle = {
  background: "rgba(255, 255, 255, 0.75)",
  backdropFilter: "blur(20px) saturate(1.4)",
  WebkitBackdropFilter: "blur(20px) saturate(1.4)",
  border: "1px solid rgba(139, 92, 246, 0.08)",
  borderRadius: 20,
  boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 8px 32px rgba(124,58,237,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
  padding: "20px 24px",
};

export function AppProvider({ children }) {
  const [screen, setScreen] = useState("login");

  /* login */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState(null);
  const [emailSent, setEmailSent] = useState(false);

  /* connect-arca */
  const [cuit, setCuit] = useState("");
  const [claveFiscal, setClaveFiscal] = useState("");
  const [showClave, setShowClave] = useState(false);
  const [arcaConnecting, setArcaConnecting] = useState(false);
  const [arcaConnected, setArcaConnected] = useState(false);
  const [arcaError, setArcaError] = useState(null);

  /* ARCA 3-phase connection */
  const [arcaPhase, setArcaPhase] = useState("cuit");
  const [captchaImage, setCaptchaImage] = useState(null);
  const [captchaSessionId, setCaptchaSessionId] = useState(null);
  const [captchaSolution, setCaptchaSolution] = useState("");
  const [arcaErrMsg, setArcaErrMsg] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "https://deduxi-api.onrender.com";

  /* app */
  const [step, setStep] = useState(0);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [editingClave, setEditingClave] = useState(false);
  const [newClaveFiscal, setNewClaveFiscal] = useState("");
  const [showNewClave, setShowNewClave] = useState(false);
  const [savingClave, setSavingClave] = useState(false);
  const [claveSaved, setClaveSaved] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [presentProgress, setPresentProgress] = useState(0);
  const [arcaStatus, setArcaStatus] = useState("draft");
  const [showRectModal, setShowRectModal] = useState(false);
  const [rectifying, setRectifying] = useState(false);
  const [isRectificativa, setIsRectificativa] = useState(false);
  const [rectVersion, setRectVersion] = useState(1);
  const [ticketActions, setTicketActions] = useState({});
  const [ticketEdits, setTicketEdits] = useState({});
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [confirmingTicketId, setConfirmingTicketId] = useState(null);
  // Helper: read persisted value only if a CUIT session exists
  const _load = (key, fallback) => {
    if (!localStorage.getItem("deduxi_cuit")) return fallback;
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; }
  };
  const _loadNum = (key) => {
    if (!localStorage.getItem("deduxi_cuit")) return 0;
    return parseFloat(localStorage.getItem(key)) || 0;
  };

  const [tickets, setTickets] = useState(() => {
    const t = _load("deduxi_tickets", []);
    return Array.isArray(t) ? t.filter(tk => tk.source !== "casas-particulares") : [];
  });
  const [arcaFetched, setArcaFetched] = useState(() => localStorage.getItem("deduxi_arca_fetched") === "1");
  const [addedTickets, setAddedTickets] = useState([]);
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [openDatosSection, setOpenDatosSection] = useState(null);
  const [newTicketForm, setNewTicketForm] = useState({ provider: "", cuitProv: "", date: "", amount: "", number: "", type: "Factura B" });
  const [ticketFile, setTicketFile] = useState(null);
  const [ticketFilePreview, setTicketFilePreview] = useState(null);
  const [rrhhEmail, setRrhhEmail] = useState("");
  const [rrhhSaved, setRrhhSaved] = useState(false);
  const [savingRrhh, setSavingRrhh] = useState(false);

  /* Cargas de familia (Art. 23 inc. b) — declaración manual */
  // Each entry: { tipo: "conyuge"|"hijo"|"hijo_incapacitado", cuil: "", porcentaje: 100, mesDesde: 1, mesHasta: 12 }
  const [cargasFamilia, setCargasFamilia] = useState(() => {
    const c = _load("deduxi_cargas_familia", []);
    if (Array.isArray(c)) return c;
    // Legacy migration
    const arr = [];
    if (c.conyuge) arr.push({ tipo: "conyuge", cuil: "", porcentaje: 100, mesDesde: 1, mesHasta: 12 });
    for (let i = 0; i < (c.hijos || 0); i++) arr.push({ tipo: "hijo", cuil: "", porcentaje: 100, mesDesde: 1, mesHasta: 12 });
    for (let i = 0; i < (c.hijosIncapacitados || 0); i++) arr.push({ tipo: "hijo_incapacitado", cuil: "", porcentaje: 100, mesDesde: 1, mesHasta: 12 });
    return arr;
  });
  // Legacy compat getters
  const cargasConyuge = cargasFamilia.some(c => c.tipo === "conyuge");
  const setCargasConyuge = (val) => {
    if (val) setCargasFamilia(prev => [...prev, { tipo: "conyuge", cuil: "", porcentaje: 100, mesDesde: 1, mesHasta: 12 }]);
    else setCargasFamilia(prev => prev.filter(c => c.tipo !== "conyuge"));
  };
  const cargasHijos = cargasFamilia.filter(c => c.tipo === "hijo").length;
  const setCargasHijos = (n) => {
    setCargasFamilia(prev => {
      const others = prev.filter(c => c.tipo !== "hijo");
      const hijos = Array.from({ length: n }, (_, i) => prev.filter(c => c.tipo === "hijo")[i] || { tipo: "hijo", cuil: "", porcentaje: 100, mesDesde: 1, mesHasta: 12 });
      return [...others, ...hijos];
    });
  };
  const cargasHijosIncapacitados = cargasFamilia.filter(c => c.tipo === "hijo_incapacitado").length;
  const setCargasHijosIncapacitados = (n) => {
    setCargasFamilia(prev => {
      const others = prev.filter(c => c.tipo !== "hijo_incapacitado");
      const hijos = Array.from({ length: n }, (_, i) => prev.filter(c => c.tipo === "hijo_incapacitado")[i] || { tipo: "hijo_incapacitado", cuil: "", porcentaje: 100, mesDesde: 1, mesHasta: 12 });
      return [...others, ...hijos];
    });
  };

  /* Cuota sindical (Art. 82 inc. a) — monto mensual del recibo */
  const [cuotaSindical, setCuotaSindical] = useState(() => _loadNum("deduxi_cuota_sindical"));
  const [cuotaSindicalDesde, setCuotaSindicalDesde] = useState(1);
  const [cuotaSindicalHasta, setCuotaSindicalHasta] = useState(12);

  /* Sueldo bruto mensual — para estimar tasa marginal real */
  const [sueldoBruto, setSueldoBruto] = useState(() => _loadNum("deduxi_sueldo_bruto"));

  /* Pluriempleo (Art. 14 RG 4003) — ingresos de otros empleadores */
  const [pluriempleo, setPluriempleo] = useState(() => _load("deduxi_pluriempleo", []));
  // Each entry: { cuitEmpleador, razonSocial, sueldoBrutoMensual, aporteSegSocial, aporteObraSocial, aporteSindical, retencionGanancias }

  /* Alquiler vivienda (RG 4003) — datos del contrato */
  const defaultAlquiler = { activo: false, cuitLocador: "", nombreLocador: "", montoMensual: 0, tipoContrato: "vivienda", mesDesde: 1, mesHasta: 12 };
  const [alquilerData, setAlquilerData] = useState(() => _load("deduxi_alquiler", defaultAlquiler));

  /* Casas Particulares (domestic workers) */
  const [casasWorkers, setCasasWorkers] = useState([]);
  const [casasPayments, setCasasPayments] = useState([]);
  const [casasTotalDeducible, setCasasTotalDeducible] = useState(0);
  const [casasLoading, setCasasLoading] = useState(false);
  const [casasFetched, setCasasFetched] = useState(false);
  const [casasDebug, setCasasDebug] = useState([]);
  // Manual domestic workers (when not imported from ARCA)
  const [casasManual, setCasasManual] = useState([]);
  // Each: { cuil, montoMensual, mesDesde, mesHasta }

  /* Retenciones, percepciones y pagos a cuenta (Sección 4 F.572) */
  const [retenciones, setRetenciones] = useState(() => _load("deduxi_retenciones", []));
  // Each: { tipo: "imp_cheque"|"percep_aduana"|"pago_cuenta_3819"|"pago_cuenta_5617"|"autoret_5683"|"otra", descripcion, cuitAgente, monto, periodo }
  const [retencionesLoading, setRetencionesLoading] = useState(false);
  const [retencionesFetched, setRetencionesFetched] = useState(false);

  /* Aportes en Línea (payroll data: sueldo bruto, empleadores) */
  const [aportesEmpleador, setAportesEmpleador] = useState("");
  const [aportesCuitEmpleador, setAportesCuitEmpleador] = useState("");
  const [aportesPeriodos, setAportesPeriodos] = useState([]);
  const [aportesLoading, setAportesLoading] = useState(false);
  const [aportesFetched, setAportesFetched] = useState(false);

  /* SiRADIG previous presentations (imported detail) */
  const [siradigDetail, setSiradigDetail] = useState(null);
  const [siradigLoading, setSiradigLoading] = useState(false);
  const [siradigFetched, setSiradigFetched] = useState(false);
  const [siradigDebug, setSiradigDebug] = useState([]);
  /* SiRADIG presentations history (list of submitted F.572) */
  const [siradigPresentaciones, setSiradigPresentaciones] = useState([]);
  const [siradigPresLoading, setSiradigPresLoading] = useState(false);
  const [siradigPresFetched, setSiradigPresFetched] = useState(false);

  /* User name from ARCA (set after aportes fetch) */
  const [arcaUserName, setArcaUserName] = useState(localStorage.getItem("deduxi_user_name") || "");

  /* Derive avatar initials from ARCA name, email, or CUIT */
  const getAvatarInitials = () => {
    if (arcaUserName) {
      // "PARRAQUINI AGUSTIN" → "AP" (first letter of each word)
      const parts = arcaUserName.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    }
    if (loginEmail) {
      const prefix = loginEmail.split("@")[0];
      return prefix.slice(0, 2).toUpperCase();
    }
    if (cuit) return "\u{1F464}";
    return "U";
  };
  const getDisplayName = () => {
    if (arcaUserName) {
      // "PARRAQUINI AGUSTIN" → "Agustin Parraquini"
      const parts = arcaUserName.trim().split(/\s+/);
      if (parts.length >= 2) {
        const name = parts.slice(1).map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
        const surname = parts[0].charAt(0) + parts[0].slice(1).toLowerCase();
        return `${name} ${surname}`;
      }
      return arcaUserName.charAt(0) + arcaUserName.slice(1).toLowerCase();
    }
    if (cuit) {
      const d = cuit.replace(/\D/g, "");
      if (d.length === 11) return `${d.slice(0,2)}-${d.slice(2,10)}-${d.slice(10)}`;
      return cuit;
    }
    return loginEmail || "Usuario";
  };
  const avatarInitials = getAvatarInitials();
  const displayName = getDisplayName();

  /* responsive */
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  /* Restore session screen from localStorage (data is loaded via lazy initializers above) */
  useEffect(() => {
    const saved = localStorage.getItem("deduxi_screen");
    if (saved === "app" || saved === "connect-arca") setScreen(saved);
    const savedCuit = localStorage.getItem("deduxi_cuit");
    if (savedCuit && saved === "app") setCuit(savedCuit);
  }, []);
  useEffect(() => {
    localStorage.setItem("deduxi_screen", screen);
  }, [screen]);
  useEffect(() => {
    // Never persist casas-particulares tickets — that data lives in its own section
    const toSave = tickets.filter(t => t.source !== "casas-particulares");
    localStorage.setItem("deduxi_tickets", JSON.stringify(toSave));
  }, [tickets]);
  useEffect(() => {
    localStorage.setItem("deduxi_cargas_familia", JSON.stringify(cargasFamilia));
  }, [cargasFamilia]);
  useEffect(() => {
    localStorage.setItem("deduxi_pluriempleo", JSON.stringify(pluriempleo));
  }, [pluriempleo]);
  useEffect(() => {
    localStorage.setItem("deduxi_alquiler", JSON.stringify(alquilerData));
  }, [alquilerData]);
  useEffect(() => {
    localStorage.setItem("deduxi_sueldo_bruto", sueldoBruto.toString());
  }, [sueldoBruto]);
  useEffect(() => {
    localStorage.setItem("deduxi_cuota_sindical", cuotaSindical.toString());
  }, [cuotaSindical]);
  useEffect(() => {
    localStorage.setItem("deduxi_retenciones", JSON.stringify(retenciones));
  }, [retenciones]);

  // Autoguardado feedback
  const [savedFeedback, setSavedFeedback] = useState(false);
  const savedTimerRef = useRef(null);
  const showSavedFeedback = () => {
    setSavedFeedback(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSavedFeedback(false), 1500);
  };
  // Trigger feedback on user data changes (debounced)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const t = setTimeout(showSavedFeedback, 800);
    return () => clearTimeout(t);
  }, [sueldoBruto, cuotaSindical, cargasFamilia, alquilerData, pluriempleo]);

  // Aplica porcentajes de deducibilidad y topes anuales según normativa vigente
  // Ley 20.628, RG ARCA — valores 2026 S1
  const approvedTickets = tickets.filter(t => t.status === "approved" || t.status === "loaded");
  const totalApproved = (() => {
    const byCategory = {};
    // Paso 1: Aplicar porcentaje individual (ej: honorarios médicos → 40%)
    for (const t of approvedTickets) {
      const cat = t.siradigCategory;
      const topeInfo = cat && topesAnuales2026[cat];
      let deducible = t.amount;
      if (topeInfo?.porcentaje) {
        deducible = t.amount * topeInfo.porcentaje;
      }
      if (cat) {
        byCategory[cat] = (byCategory[cat] || 0) + deducible;
      }
    }
    // Paso 2: Aplicar topes anuales individuales (cap mensual = tope / 12)
    for (const [cat, sum] of Object.entries(byCategory)) {
      const topeInfo = topesAnuales2026[cat];
      if (topeInfo?.tope) {
        const topeMensual = topeInfo.tope / 12;
        byCategory[cat] = Math.min(sum, topeMensual);
      }
    }
    // Paso 3: Tope compartido del 5% ganancia neta para honorarios_medicos + prepaga + donaciones
    // Estas 3 categorías compiten por el mismo 5% de la ganancia neta
    const categs5pct = ["honorarios_medicos", "prepaga", "donaciones"];
    const sum5pct = categs5pct.reduce((acc, c) => acc + (byCategory[c] || 0), 0);
    if (sum5pct > 0 && sueldoBruto > 0) {
      // Ganancia neta estimada mensual: bruto - 17% aportes
      const ganNeta = sueldoBruto * 0.83;
      const tope5pctMensual = ganNeta * 0.05;
      if (sum5pct > tope5pctMensual) {
        // Reducir proporcionalmente las 3 categorías
        const ratio = tope5pctMensual / sum5pct;
        for (const c of categs5pct) {
          if (byCategory[c]) byCategory[c] = byCategory[c] * ratio;
        }
      }
    }
    // Paso 4: Sumar todo
    return Math.max(0, Object.values(byCategory).reduce((a, b) => a + b, 0));
  })();
  const totalRejected = tickets.filter(t => t.status === "rejected").reduce((a, b) => a + b.amount, 0);
  const totalPending  = tickets.filter(t => t.status === "pending").reduce((a, b) => a + b.amount, 0);
  const resolvedCount = tickets.filter(t => t.status === "approved" || t.status === "loaded" || t.status === "rejected").length;

  // Cargas de familia — deducción mensual (con porcentaje 50%/100%)
  const cargasFamiliaMensual = cargasFamilia.reduce((acc, c) => {
    const montos = c.tipo === "conyuge" ? cargasFamiliaMontos2026.conyuge
      : c.tipo === "hijo_incapacitado" ? cargasFamiliaMontos2026.hijo_incapacitado
      : cargasFamiliaMontos2026.hijo;
    return acc + montos.mensual * ((c.porcentaje || 100) / 100);
  }, 0);

  // Alquiler — deducción mensual (40% del monto, tope = GNI anual / 12)
  const alquilerTopeAnual = topesAnuales2026.alquiler.tope;
  const alquilerTopeMensual = alquilerTopeAnual / 12;
  const alquilerDeduccionMensual = alquilerData.activo ? Math.min(Math.round(alquilerData.montoMensual * 0.40), alquilerTopeMensual) : 0;

  // Total de deducciones mensuales (comprobantes + cargas familia + cuota sindical + alquiler + casas particulares)
  const casasMensualCalc = casasTotalDeducible || 0;
  const totalDeduccionesMensual = totalApproved + cargasFamiliaMensual + cuotaSindical + alquilerDeduccionMensual + casasMensualCalc;

  // Cálculo de ahorro con escala real si hay sueldo bruto, sino estimación al 27%
  const calcularAhorroReal = () => {
    if (!sueldoBruto || sueldoBruto <= 0) {
      // Sin sueldo → estimación conservadora al 27%
      return { ahorro: Math.round(totalDeduccionesMensual * 0.27), tasaEfectiva: 0.27, metodo: "estimado" };
    }
    // Ganancia neta mensual simplificada: bruto - 17% aportes obligatorios - MNI mensual
    const aportes = sueldoBruto * gananciasConfig2026.aportesRate;
    const mniMensual = gananciasConfig2026.gniAnual / 12;
    const deduccionEspecial = gananciasConfig2026.deduccionEspecialAnual / 12;
    const gananciaNetaSin = Math.max(0, sueldoBruto - aportes - mniMensual - deduccionEspecial);
    const gananciaNetaCon = Math.max(0, gananciaNetaSin - totalDeduccionesMensual);
    // Calcular impuesto con y sin deducciones usando escala
    const calcImpuesto = (gn) => {
      const gnAnual = gn * 12;
      for (const tramo of escalaGanancias2026) {
        if (gnAnual <= tramo.hasta) {
          return (tramo.fijo + (gnAnual - tramo.desde) * tramo.tasa) / 12;
        }
      }
      const last = escalaGanancias2026[escalaGanancias2026.length - 1];
      return (last.fijo + (gnAnual - last.desde) * last.tasa) / 12;
    };
    const impuestoSin = calcImpuesto(gananciaNetaSin);
    const impuestoCon = calcImpuesto(gananciaNetaCon);
    const ahorro = Math.round(impuestoSin - impuestoCon);
    const tasaEfectiva = totalDeduccionesMensual > 0 ? (ahorro / totalDeduccionesMensual) : 0;
    return {
      ahorro, tasaEfectiva, metodo: "real",
      sueldoNeto: Math.round(sueldoBruto - aportes - impuestoCon),
      sueldoNetoSin: Math.round(sueldoBruto - aportes - impuestoSin),
      impuestoSin: Math.round(impuestoSin),
      impuestoCon: Math.round(impuestoCon),
      gananciaNetaSin: Math.round(gananciaNetaSin),
    };
  };
  const ahorroCalc = calcularAhorroReal();
  const monthlySaving = ahorroCalc.ahorro;

  // Detect if user's salary is below the Ganancias threshold
  const noAlcanzadoPorGanancias = sueldoBruto > 0 && sueldoBruto < gananciasConfig2026.pisoMensualBruto;

  /** Clear ALL user-specific data from state and localStorage */
  const clearAllUserData = () => {
    setTickets([]); setCargasFamilia([]); setPluriempleo([]);
    setAlquilerData(defaultAlquiler);
    setSueldoBruto(0); setCuotaSindical(0); setRetenciones([]);
    setCasasManual([]); setSiradigDetail(null); setSiradigFetched(false); setSiradigPresentaciones([]); setSiradigPresFetched(false);
    setRetencionesFetched(false); setArcaFetched(false); setAportesFetched(false);
    setCasasFetched(false); setCasasWorkers([]); setCasasPayments([]); setCasasTotalDeducible(0);
    setAportesPeriodos([]); setAportesEmpleador(""); setAportesCuitEmpleador("");
    setArcaUserName(""); setStep(0);
    // Clear localStorage
    ["deduxi_tickets", "deduxi_cargas_familia", "deduxi_pluriempleo", "deduxi_alquiler",
     "deduxi_sueldo_bruto", "deduxi_cuota_sindical", "deduxi_arca_fetched",
     "deduxi_user_name", "deduxi_retenciones", "deduxi_cuit"
    ].forEach(k => localStorage.removeItem(k));
  };

  const handleGoogleLogin = () => {
    setLoginLoading(true); setLoginMethod("google");
    setTimeout(() => { setLoginLoading(false); clearAllUserData(); setCuit(""); setClaveFiscal(""); setArcaPhase("cuit"); setArcaError(null); setArcaErrMsg(""); setScreen("connect-arca"); }, 600);
  };
  const handleEmailLogin = (e) => {
    e.preventDefault(); if (!loginEmail) return;
    setLoginLoading(true); setLoginMethod("email");
    setTimeout(() => { setLoginLoading(false); clearAllUserData(); setCuit(""); setClaveFiscal(""); setArcaPhase("cuit"); setArcaError(null); setArcaErrMsg(""); setScreen("connect-arca"); }, 600);
  };

  /* Phase 1: submit CUIT -> get CAPTCHA from real ARCA */
  const handleArcaStart = async () => {
    const cuitDigits = cuit.replace(/\D/g, "");
    if (cuitDigits.length !== 11) { setArcaError("cuit"); return; }

    // ── Clear previous user data if CUIT changed ──
    const prevCuit = localStorage.getItem("deduxi_cuit");
    if (prevCuit && prevCuit.replace(/\D/g, "") !== cuitDigits) {
      console.log(`[ARCA] CUIT changed from ${prevCuit} to ${cuitDigits}, clearing previous data`);
      clearAllUserData();
    }

    setArcaError(null);
    setArcaErrMsg("");
    setArcaUserName("");
    setArcaConnecting(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    try {
      const res = await fetch(`${API_URL}/api/arca/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuit }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (data.ok) {
        setCaptchaImage(data.captcha);
        setCaptchaSessionId(data.sessionId);
        setArcaPhase("captcha");
      } else {
        setArcaErrMsg(data.msg || "No pudimos conectar con ARCA.");
        if (data.error === "cuit_no_encontrado") setArcaError("cuit");
      }
    } catch (e) {
      if (e.name === "AbortError") {
        setArcaErrMsg("La conexión tardó demasiado. El servidor puede estar iniciando, intentá de nuevo en 30 segundos.");
      } else {
        setArcaErrMsg("Error de conexión. Verificá tu internet e intentá de nuevo.");
      }
    } finally {
      clearTimeout(timeout);
      setArcaConnecting(false);
    }
  };

  const [arcaDebugShot, setArcaDebugShot] = useState(null);
  const [arcaDebugInfo, setArcaDebugInfo] = useState(null);

  /* Phase 2: submit clave + CAPTCHA solution -> real ARCA login */
  const handleArcaComplete = async () => {
    if (!claveFiscal || (captchaImage && !captchaSolution)) return;
    setArcaErrMsg("");
    setArcaPhase("verifying");
    try {
      const res = await fetch(`${API_URL}/api/arca/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: captchaSessionId, clave: claveFiscal, captchaSolution, cuit }),
      });
      const data = await res.json();
      console.log("[ARCA complete response]", JSON.stringify(data).substring(0, 2000));
      if (data.compDebug) console.log("[ARCA debug]", data.compDebug.join("\n"));
      if (data.ok) {
        setArcaConnected(true);
        setScreen("app");
        setStep(0); // Always start at Inicio after login
        localStorage.setItem("deduxi_cuit", cuit);
        setClaveFiscal("");

        if (data.comprobantes && data.comprobantes.length > 0) {
          console.log(`[ARCA] ${data.comprobantes.length} comprobantes received from login`);
          const arcaTickets = data.comprobantes.map(c => ({
            id: c.id || `arca-${Math.random().toString(36).slice(2)}`,
            provider: c.razonSocial || "Emisor ARCA",
            amount: parseFloat((c.importeTotal || "0").toString().replace(/[^0-9.,]/g, "").replace(/\./g, "").replace(",", ".")) || 0,
            date: c.fecha || new Date().toISOString().slice(0, 10),
            type: c.tipo || "Factura",
            cuit: "",
            source: "arca",
            status: "pending",
            reason: "Pendiente de clasificación",
            number: c.nroComprobante || "",
          }));
          setTickets(prev => [...prev.filter(t => t.source !== "arca"), ...arcaTickets]);
        }
        if (data.compDebug) {
          console.log("[ARCA compDebug]", data.compDebug.join("\n"));
          setArcaDebugInfo({ debugLog: data.compDebug, compCount: data.comprobantes?.length || 0 });
        }
        setArcaFetched(true);
        localStorage.setItem("deduxi_arca_fetched", "1");

        // Fetch all secondary scrapers IN PARALLEL — each uses its own
        // extra page (createExtraPage on backend) so they don't conflict.
        Promise.allSettled([
          fetchAportesEnLinea(captchaSessionId),
          fetchCasasParticulares(captchaSessionId),
          fetchSiradigDetail(captchaSessionId),
          fetchRetencionesArca(captchaSessionId),
          fetchSiradigPresentaciones(captchaSessionId),
        ]).then(results => {
          results.forEach((r, i) => {
            if (r.status === "rejected") {
              const names = ["aportes", "casas", "siradig-detail", "retenciones"];
              console.warn(`[ARCA ${names[i]} auto-fetch failed]`, r.reason?.message || r.reason);
            }
          });
        });
      } else {
        if (data.error === "captcha_incorrecto") {
          if (data.captcha) setCaptchaImage(data.captcha);
          setCaptchaSolution("");
          setArcaErrMsg(data.msg || "Código incorrecto. Intentá de nuevo.");
          setArcaPhase("captcha");
        } else if (data.error === "sesion_expirada") {
          setArcaPhase("cuit");
          setArcaErrMsg("La sesión expiró. Ingresá tu CUIT de nuevo.");
        } else {
          setArcaError("clave");
          setArcaErrMsg(data.msg || "Clave fiscal incorrecta.");
          setArcaPhase("captcha");
        }
      }
    } catch (e) {
      setArcaErrMsg("Error de conexión. Intentá de nuevo.");
      setArcaPhase("captcha");
    }
  };

  /* Fetch comprobantes recibidos from ARCA portal after login */
  const fetchComprobantesFromArca = async (arcaSessionId) => {
    const periodo = currentPeriodoCode;
    try {
      const res = await fetch(`${API_URL}/api/arca/fetch-comprobantes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: arcaSessionId, periodo, cuit }),
      });
      const data = await res.json();
      console.log("[ARCA comprobantes]", JSON.stringify(data).slice(0, 1500));
      if (data.debugLog) console.log("[ARCA debug log]", data.debugLog.join("\n"));
      if (data.ok && data.comprobantes && data.comprobantes.length > 0) {
        const arcaTickets = data.comprobantes.map(c => ({
          id: c.id || `arca-${Math.random().toString(36).slice(2)}`,
          provider: c.razonSocial || "Emisor ARCA",
          amount: parseFloat((c.importeTotal || "0").toString().replace(/[^0-9.,]/g, "").replace(/\./g, "").replace(",", ".")) || 0,
          date: c.fecha || new Date().toISOString().slice(0, 10),
          type: c.tipo || "Factura",
          cuit: "",
          source: "arca",
          status: "pending",
          reason: "Pendiente de clasificación",
          number: c.nroComprobante || "",
        }));
        setTickets(prev => [...prev.filter(t => t.source !== "arca"), ...arcaTickets]);
      }
      if (data.debug || data.debugLog) {
        if (data.shot) setArcaDebugShot(data.shot);
        setArcaDebugInfo({
          title: data.title, url: data.urlAfterNav, bodyPreview: data.pageBodyPreview,
          debugLog: data.debugLog, dateInputs: data.dateInputs,
          compCount: data.comprobantes?.length || 0,
        });
      }
    } catch (e) {
      console.error("[ARCA comprobantes error]", e.message);
    } finally {
      setArcaFetched(true);
      localStorage.setItem("deduxi_arca_fetched", "1");
    }
  };

  /* Refresh CAPTCHA image */
  const handleRefreshCaptcha = async () => {
    try {
      const res = await fetch(`${API_URL}/api/arca/refresh-captcha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: captchaSessionId }),
      });
      const data = await res.json();
      if (data.ok && data.captcha) { setCaptchaImage(data.captcha); setCaptchaSolution(""); }
      else { setArcaPhase("cuit"); setArcaErrMsg("La sesión expiró. Ingresá tu CUIT de nuevo."); }
    } catch (_) {}
  };

  /* Fetch Casas Particulares (domestic workers) from ARCA */
  const fetchCasasParticulares = async (arcaSessionId) => {
    setCasasLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/arca/fetch-casas-particulares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: arcaSessionId, cuit }),
      });
      const data = await res.json();
      console.log("[ARCA casas-particulares]", JSON.stringify(data).slice(0, 2000));
      if (data.debug) {
        console.log("[ARCA casas debug]", data.debug.join("\n"));
        setCasasDebug(data.debug);
      }
      if (data.ok) {
        setCasasWorkers(data.workers || []);
        setCasasPayments(data.payments || []);
        setCasasTotalDeducible(data.totalDeducible || 0);
        setCasasFetched(true);

        // NOTE: Casas Particulares data is shown in its own section on Inicio,
        // NOT mixed into the comprobantes/tickets analysis flow.
      }
    } catch (e) {
      console.error("[ARCA casas-particulares error]", e.message);
    } finally {
      setCasasLoading(false);
    }
  };

  /* Fetch Aportes en Línea (payroll: sueldo bruto + pluriempleo) from ARCA */
  const fetchAportesEnLinea = async (arcaSessionId) => {
    setAportesLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/arca/fetch-aportes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: arcaSessionId, cuit }),
      });
      const data = await res.json();
      console.log("[ARCA aportes-en-linea]", JSON.stringify(data).slice(0, 2000));
      if (data.aportesDebug) {
        console.log("[ARCA aportes debug]", data.aportesDebug.join("\n"));
      }
      if (data.ok) {
        setAportesEmpleador(data.empleador || "");
        setAportesCuitEmpleador(data.cuitEmpleador || "");
        setAportesPeriodos(data.periodos || []);
        setAportesFetched(true);

        // Set user's real name from ARCA if available
        if (data.empleadoNombre) {
          setArcaUserName(data.empleadoNombre);
          localStorage.setItem("deduxi_user_name", data.empleadoNombre);
        }

        // Auto-fill sueldo bruto from the most recent period
        // Always update if ARCA returns a value (overwrite placeholder)
        if (data.periodos?.length > 0) {
          // Find the most recent period with actual salary data
          const sorted = [...data.periodos].sort((a, b) => {
            const [am, ay] = (a.periodo || "").split("/").map(Number);
            const [bm, by] = (b.periodo || "").split("/").map(Number);
            return (by * 12 + bm) - (ay * 12 + am);
          });
          const latest = sorted.find(p => p.remuneracionBruta > 0) || sorted[0];
          const remuBruta = latest?.remuneracionBruta || 0;
          if (remuBruta > 0) {
            setSueldoBruto(remuBruta);
            localStorage.setItem("deduxi_sueldo_bruto", remuBruta.toString());
            console.log(`[ARCA] Auto-set sueldo bruto: ${remuBruta} from ${latest.periodo}`);
          }
        }

        // Auto-detect single employer: if ARCA found exactly one employer,
        // the user does NOT need pluriempleo. We show the employer info in the section.
        // Pluriempleo is only needed if they have ADDITIONAL employers beyond this one.
      }
    } catch (e) {
      console.error("[ARCA aportes-en-linea error]", e.message);
    } finally {
      setAportesLoading(false);
    }
  };

  /* Fetch SiRADIG previous F.572 detail and pre-populate all sections */
  const fetchSiradigDetail = async (arcaSessionId) => {
    setSiradigLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/arca/fetch-siradig-detail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: arcaSessionId, cuit }),
      });
      const data = await res.json();
      console.log("[ARCA siradig-detail]", JSON.stringify(data).slice(0, 3000));
      if (data.detail?.debug) {
        console.log("[ARCA siradig debug]", data.detail.debug.join("\n"));
        setSiradigDebug(data.detail.debug);
      }
      if (data.ok && data.detail) {
        const d = data.detail;
        setSiradigDetail(d);
        setSiradigFetched(true);

        // ── Auto-populate Section 1: Cargas de familia ──
        // Use functional setState to avoid stale closure values
        if (d.cargasFamilia && d.cargasFamilia.length > 0) {
          const imported = d.cargasFamilia.map(c => ({
            tipo: c.tipo === "conyuge" || /c[oó]nyuge|conviviente/i.test(c.tipo) ? "conyuge"
              : /incapacitad/i.test(c.tipo) ? "hijo_incapacitado" : "hijo",
            cuil: (c.cuil || "").replace(/\D/g, ""),
            porcentaje: c.porcentaje || 100,
            mesDesde: c.mesDesde || 1,
            mesHasta: c.mesHasta || 12,
          }));
          setCargasFamilia(prev => {
            if (prev.length > 0) { console.log("[SiRADIG] Cargas already set, skipping import"); return prev; }
            console.log(`[SiRADIG] Imported ${imported.length} cargas de familia`);
            return imported;
          });
        }

        // ── Auto-populate Section 2: Otros empleadores (pluriempleo) ──
        if (d.otrosEmpleadores && d.otrosEmpleadores.length > 0) {
          const imported = d.otrosEmpleadores.map(e => ({
            cuitEmpleador: e.cuit || "",
            razonSocial: e.razonSocial || "",
            sueldoBrutoMensual: e.sueldoBruto || 0,
            retencionGanancias: e.retencionGanancias || 0,
            aporteSegSocial: e.aporteSegSocial || 0,
            aporteObraSocial: e.aporteObraSocial || 0,
            aporteSindical: e.aporteSindical || 0,
          }));
          setPluriempleo(prev => {
            if (prev.length > 0) { console.log("[SiRADIG] Pluriempleo already set, skipping import"); return prev; }
            console.log(`[SiRADIG] Imported ${imported.length} otros empleadores`);
            return imported;
          });
        }

        // ── Auto-populate Section 3: Deducciones ──
        if (d.deducciones3 && d.deducciones3.length > 0) {
          // Convert deducciones to tickets for the comprobantes flow
          const siradigTickets = d.deducciones3
            .filter(ded => ded.montoAnual > 0 || ded.montoMensual > 0)
            .map((ded, idx) => ({
              id: `siradig-prev-${idx}-${Date.now()}`,
              provider: ded.descripcion || ded.concepto || "SiRADIG importado",
              amount: ded.montoMensual > 0 ? ded.montoMensual : Math.round(ded.montoAnual / 12),
              date: new Date().toISOString().slice(0, 10),
              type: "SiRADIG importado",
              cuit: ded.cuitPrestador || "",
              source: "siradig-import",
              status: "loaded",
              reason: `Importado de F.572 anterior — ${ded.concepto}`,
              siradigCategory: ded.categoriaDeduxi || "otras_deducciones",
              number: "",
              mesDesde: ded.mesDesde || 1,
              mesHasta: ded.mesHasta || 12,
              montoAnual: ded.montoAnual,
            }));

          if (siradigTickets.length > 0) {
            setTickets(prev => {
              // Remove any previously imported SiRADIG tickets, keep others
              const filtered = prev.filter(t => t.source !== "siradig-import");
              return [...filtered, ...siradigTickets];
            });
            console.log(`[SiRADIG] Imported ${siradigTickets.length} deducciones as tickets`);
          }

          // Also populate specific fields:
          // Alquiler — use functional setState for freshness
          const alquilerDed = d.deducciones3.find(ded => ded.categoriaDeduxi === "alquiler");
          if (alquilerDed) {
            setAlquilerData(prev => {
              if (prev.activo) { console.log("[SiRADIG] Alquiler already set, skipping import"); return prev; }
              console.log("[SiRADIG] Imported alquiler data");
              return {
                activo: true,
                cuitLocador: alquilerDed.cuitPrestador || "",
                nombreLocador: alquilerDed.descripcion || "",
                // SiRADIG stores the deductible amount (40%), we need the original
                montoMensual: alquilerDed.montoMensual > 0
                  ? Math.round(alquilerDed.montoMensual / 0.4)
                  : Math.round(alquilerDed.montoAnual / 12 / 0.4),
                tipoContrato: "vivienda",
                mesDesde: alquilerDed.mesDesde || 1,
                mesHasta: alquilerDed.mesHasta || 12,
              };
            });
          }
        }

        // ── Auto-populate Section 4: Retenciones ──
        if (d.retenciones4 && d.retenciones4.length > 0) {
          const imported = d.retenciones4.map(r => ({
            tipo: mapRetencionTipo(r.categoriaDeduxi || r.tipo),
            descripcion: r.descripcion || r.tipo || "",
            cuitAgente: r.cuitAgente || "",
            monto: r.monto || 0,
            periodo: r.periodo || "",
          }));
          setRetenciones(prev => {
            if (prev.length > 0) { console.log("[SiRADIG] Retenciones already set, skipping import"); return prev; }
            console.log(`[SiRADIG] Imported ${imported.length} retenciones`);
            return imported;
          });
        }

        // Update status indicators
        if (d.estado) {
          if (/presentad/i.test(d.estado)) setArcaStatus("sent");
          if (d.tipo && /rectificativ/i.test(d.tipo)) {
            setIsRectificativa(true);
            const vMatch = d.tipo.match(/\d+/);
            if (vMatch) setRectVersion(parseInt(vMatch[0]));
          }
        }
      }
    } catch (e) {
      console.error("[ARCA siradig-detail error]", e.message);
    } finally {
      setSiradigLoading(false);
    }
  };

  /* Fetch retenciones/percepciones from Mirequa (ARCA) */
  const fetchRetencionesArca = async (arcaSessionId) => {
    setRetencionesLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/arca/fetch-retenciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: arcaSessionId, cuit }),
      });
      const data = await res.json();
      console.log("[ARCA retenciones/mirequa]", JSON.stringify(data).slice(0, 2000));
      if (data.mirequaDebug) console.log("[ARCA mirequa debug]", data.mirequaDebug.join("\n"));

      if (data.ok && data.percepciones35 && data.percepciones35.length > 0) {
        // percepciones35 = retenciones at 35% rate (deductible from Ganancias)
        const imported = data.percepciones35.map(r => ({
          tipo: mapMirequaTipo(r.regimen || r.descripcion || ""),
          descripcion: r.descripcion || r.regimen || "",
          cuitAgente: r.cuitAgente || "",
          monto: r.importe || 0,
          periodo: r.fecha || "",
          source: "mirequa",
        }));
        setRetenciones(prev => {
          // Only auto-populate if user hasn't added manual entries
          if (prev.length > 0 && prev.some(r => r.source !== "mirequa")) {
            console.log("[Mirequa] Retenciones already have manual entries, skipping import");
            return prev;
          }
          console.log(`[Mirequa] Imported ${imported.length} percepciones/retenciones`);
          return imported;
        });
        setRetencionesFetched(true);
      } else if (data.ok) {
        console.log("[Mirequa] No percepciones al 35% found");
        setRetencionesFetched(true);
      }
    } catch (e) {
      console.error("[ARCA retenciones/mirequa error]", e.message);
    } finally {
      setRetencionesLoading(false);
    }
  };

  // Helper: map Mirequa regimen to our internal tipo
  const mapMirequaTipo = (regimen) => {
    const lower = regimen.toLowerCase();
    if (/cr[eé]dito|d[eé]bito|cheque/i.test(lower)) return "imp_cheque";
    if (/aduana/i.test(lower)) return "percep_aduana";
    if (/3819/i.test(lower)) return "pago_cuenta_3819";
    if (/5617/i.test(lower)) return "pago_cuenta_5617";
    if (/5683|autorret/i.test(lower)) return "autoret_5683";
    return "otra";
  };

  // Helper: map SiRADIG retención category to our internal tipo
  const mapRetencionTipo = (cat) => {
    const map = {
      impuesto_cheque: "imp_cheque",
      percepciones_aduana: "percep_aduana",
      pago_cuenta_3819: "pago_cuenta_3819",
      pago_cuenta_5617: "pago_cuenta_5617",
      autorretenciones_5683: "autoret_5683",
      percepciones_usd: "otra",
      percepciones_tarjeta: "otra",
    };
    return map[cat] || "otra";
  };

  /* Fetch list of SiRADIG presentations (F.572 history) */
  const fetchSiradigPresentaciones = async (arcaSessionId) => {
    setSiradigPresLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/arca/fetch-siradig`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: arcaSessionId, cuit }),
      });
      const data = await res.json();
      console.log("[ARCA siradig-presentaciones]", JSON.stringify(data).slice(0, 2000));
      if (data.siradigDebug) console.log("[ARCA siradig pres debug]", data.siradigDebug.join("\n"));
      if (data.ok && data.presentaciones) {
        setSiradigPresentaciones(data.presentaciones);
        setSiradigPresFetched(true);
        console.log(`[SiRADIG] Found ${data.presentaciones.length} presentaciones`);
      }
    } catch (e) {
      console.error("[ARCA siradig-presentaciones error]", e.message);
    } finally {
      setSiradigPresLoading(false);
    }
  };

  const handleArcaConnect = handleArcaStart;
  const handleUpdateClave = () => {
    if (!newClaveFiscal) return;
    setSavingClave(true);
    setTimeout(() => {
      setSavingClave(false); setClaveSaved(true); setNewClaveFiscal(""); setEditingClave(false);
      setTimeout(() => setClaveSaved(false), 3500);
    }, 1600);
  };
  const handlePresent = () => {
    setPresenting(true); setPresentProgress(0);
    const iv = setInterval(() => {
      setPresentProgress(p => {
        if (p >= 100) { clearInterval(iv); setPresenting(false); setArcaStatus("draft"); return 100; }
        return p + 3;
      });
    }, 90);
  };
  const handleRectificar = () => {
    setRectifying(true);
    setTimeout(() => {
      setRectifying(false); setShowRectModal(false);
      setIsRectificativa(true); setRectVersion(v => v + 1);
      setUploaded(false); setAnalyzed(false); setAnalyzing(false);
      setPresenting(false); setPresentProgress(0); setArcaStatus("pending");
      setStep(1);
    }, 1800);
  };

  const value = {
    screen, setScreen,
    loginEmail, setLoginEmail, loginLoading, setLoginLoading, loginMethod, setLoginMethod, emailSent, setEmailSent,
    cuit, setCuit, claveFiscal, setClaveFiscal, showClave, setShowClave,
    arcaConnecting, setArcaConnecting, arcaConnected, setArcaConnected, arcaError, setArcaError,
    arcaPhase, setArcaPhase, captchaImage, setCaptchaImage, captchaSessionId, setCaptchaSessionId,
    captchaSolution, setCaptchaSolution, arcaErrMsg, setArcaErrMsg,
    API_URL,
    step, setStep, showProfilePanel, setShowProfilePanel,
    editingClave, setEditingClave, newClaveFiscal, setNewClaveFiscal, showNewClave, setShowNewClave,
    savingClave, setSavingClave, claveSaved, setClaveSaved,
    dragging, setDragging, uploaded, setUploaded, analyzing, setAnalyzing, analyzed, setAnalyzed,
    presenting, setPresenting, presentProgress, setPresentProgress,
    arcaStatus, setArcaStatus, showRectModal, setShowRectModal, rectifying, setRectifying,
    isRectificativa, setIsRectificativa, rectVersion, setRectVersion,
    ticketActions, setTicketActions, ticketEdits, setTicketEdits, editingTicketId, setEditingTicketId, confirmingTicketId, setConfirmingTicketId,
    tickets, setTickets, arcaFetched, setArcaFetched,
    addedTickets, setAddedTickets, showAddTicket, setShowAddTicket, openDatosSection, setOpenDatosSection,
    newTicketForm, setNewTicketForm, ticketFile, setTicketFile, ticketFilePreview, setTicketFilePreview,
    rrhhEmail, setRrhhEmail, rrhhSaved, setRrhhSaved, savingRrhh, setSavingRrhh,
    avatarInitials, displayName, isMobile, savedFeedback,
    totalApproved, totalRejected, totalPending, monthlySaving, resolvedCount,
    arcaDebugShot, setArcaDebugShot, arcaDebugInfo, setArcaDebugInfo,
    handleGoogleLogin, handleEmailLogin, handleArcaStart, handleArcaComplete,
    handleRefreshCaptcha, handleArcaConnect, handleUpdateClave, handlePresent, handleRectificar,
    fetchComprobantesFromArca, fetchCasasParticulares, fetchSiradigDetail, fetchRetencionesArca, classifyTicket,
    casasWorkers, casasPayments, casasTotalDeducible, casasLoading, casasFetched, casasDebug, casasManual, setCasasManual,
    retenciones, setRetenciones, retencionesLoading, retencionesFetched,
    aportesEmpleador, aportesCuitEmpleador, aportesPeriodos, aportesLoading, aportesFetched,
    siradigDetail, siradigLoading, siradigFetched, siradigDebug,
    siradigPresentaciones, siradigPresLoading, siradigPresFetched, fetchSiradigPresentaciones,
    cargasFamilia, setCargasFamilia,
    cargasConyuge, setCargasConyuge, cargasHijos, setCargasHijos,
    cargasHijosIncapacitados, setCargasHijosIncapacitados,
    cuotaSindical, setCuotaSindical, cuotaSindicalDesde, setCuotaSindicalDesde, cuotaSindicalHasta, setCuotaSindicalHasta,
    sueldoBruto, setSueldoBruto,
    pluriempleo, setPluriempleo,
    alquilerData, setAlquilerData, alquilerDeduccionMensual,
    cargasFamiliaMensual, totalDeduccionesMensual, ahorroCalc, noAlcanzadoPorGanancias,
    gananciasConfig: gananciasConfig2026,
    currentPeriodo, currentPeriodoCode,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppContext;
