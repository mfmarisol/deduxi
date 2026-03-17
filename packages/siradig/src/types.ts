export interface Deduction {
  tipoDeduccion: string;
  cuitPrestador: string;
  descripcion: string;
  monto: number;
  periodo: string;
}

export interface ArcaLoginResult {
  success: boolean;
  sessionId?: string;
  captchaRequired?: boolean;
  captchaBase64?: string;
  error?: string;
}

export interface ArcaComprobante {
  id: string;
  razonSocial: string;
  importeTotal: string;
  fecha: string;
  tipo: string;
  nroComprobante: string;
}

export interface SiradigPresentacion {
  periodo: string;          // "202603" or "03/2026"
  estado: string;           // "Presentada", "Borrador", etc.
  fechaPresentacion: string; // date of submission
  nroTransaccion: string;   // transaction number if presented
  tipo: string;             // "Original", "Rectificativa"
}

export interface SiradigBorrador {
  periodo: string;
  deducciones: SiradigDeduccion[];
  estado: string;           // "Borrador", "Presentada"
}

export interface SiradigDeduccion {
  concepto: string;         // "Cuota médico asistencial", "Alquiler", etc.
  descripcion: string;      // Detail text
  montoAnual: string;       // Annual amount
  cuitPrestador: string;    // Provider CUIT
}

/** Domestic worker (empleada doméstica / personal de casas particulares) */
export interface CasasParticularesWorker {
  cuil: string;             // Worker's CUIL
  nombre: string;           // Worker's name
  categoria: string;        // Job category (ej: "Personal para tareas generales")
  modalidad: string;        // "Con retiro" / "Sin retiro"
  fechaAlta: string;        // Registration date
  estado: string;           // "Activa", "Baja", etc.
}

/** Monthly payment record for a domestic worker */
export interface CasasParticularesPayment {
  periodo: string;          // "03/2026" or "202603"
  cuil: string;             // Worker's CUIL
  nombre: string;           // Worker's name
  remuneracion: number;     // Monthly salary paid
  aporteJubilatorio: number; // Retirement contribution
  obraSocial: number;       // Health insurance contribution
  art: number;              // ART (workplace insurance)
  totalPagado: number;      // Total paid (all concepts)
  fechaPago: string;        // Payment date
  nroRecibo: string;        // Receipt number
}

/** Summary for SiRADIG deduction */
export interface CasasParticularesSummary {
  workers: CasasParticularesWorker[];
  payments: CasasParticularesPayment[];
  totalDeducible: number;   // Accumulated deductible for current fiscal year
  totalAcumulado?: number;  // All-time total for reference
  latestPeriod?: string;    // Most recent paid period (mm/yyyy)
  debug: string[];
}

// ── Mis Retenciones (Mirequa) ──────────────────────────────────

/** A single perception/retention record from Mirequa */
export interface MirequaRetencion {
  cuitAgente: string;        // CUIT of the withholding/perception agent
  impuesto: number;          // Tax code (217 = Ganancias, 219 = Bienes Personales, 939 = Imp. PAIS)
  regimen: number;           // Regime code (594 = USD, 596 = tarjeta exterior, etc.)
  fechaRetencion: string;    // Date dd/mm/yyyy
  nroCertificado: string;    // Certificate number
  tipoOperacion: string;     // "RETENCION" | "PERCEPCION"
  importe: number;           // Amount (negative = refund/cancellation)
  nroComprobante: string;    // Invoice number (if available)
  fechaComprobante: string;  // Invoice date (if available)
  tipoComprobante: string;   // Invoice type (if available)
}

/** Result of a Mirequa query */
export interface MirequaResult {
  retenciones: MirequaRetencion[];
  totalImporte: number;      // Sum of all importes
  debug: string[];
}

// ── Aportes en Línea ───────────────────────────────────────────

/** Monthly payroll record from Aportes en Línea (summary view) */
export interface AportesMensual {
  periodo: string;           // "mm/yyyy"
  remuneracionBruta: number; // Gross salary declared by employer
  incluyeSAC: boolean;       // (*) if SAC is included
  aportesSegSocialDeclarado: number;
  aportesSegSocialDepositado: number;
  aportesObraSocialDeclarado: number;
  aportesObraSocialDepositado: number;
  obraSocialDestino: string; // Name + code of health insurance
  contribucionPatronal: string; // "PAGO" | "PAGO PARCIAL" | "IMPAGO" | "SIN INFORMACIÓN"
}

/** Detailed period breakdown from Aportes en Línea */
export interface AportesDetallePeriodo {
  periodo: string;
  basesImponibles: {
    remuneracionBruta: number;
    imponibleSegSocial: number;
    imponibleObraSocial: number;
  };
  deducciones: {
    concepto: string;          // "Aportes jubilatorios", "Aportes INSSJP", etc.
    declarado: number;
    depositado: number;
    organismoDestino: string;  // "ANSeS", "INSSJP (PAMI)", etc.
    observaciones: string;
  }[];
  totalDeclarado: number;
  totalDepositado: number;
  empleador: string;           // Employer name
  cuitEmpleador: string;       // Employer CUIT
}

/** Full result from Aportes en Línea */
export interface AportesEnLineaResult {
  empleador: string;
  cuitEmpleador: string;
  empleadoNombre: string;
  periodos: AportesMensual[];
  debug: string[];
}
