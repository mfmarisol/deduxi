export enum SiradigStep {
  INITIAL = "INITIAL",
  LOGIN = "LOGIN",
  CAPTCHA = "CAPTCHA",
  FILL_FORM = "FILL_FORM",
  SUBMIT = "SUBMIT",
  DONE = "DONE",
}

export interface DeductionPayload {
  tipoDeduccion: string;
  cuitPrestador: string;
  descripcion: string;
  monto: number;
  periodo: string;
}

export interface SiradigJobData {
  userId: number;
  taxpayerId: number;
  cuit: string;
  deductions: DeductionPayload[];
  step: SiradigStep;
  sessionId?: string;
}

export interface SiradigJobResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}
