export { launchBrowser, createContext } from "./browser.js";
export { startAfipLogin, completeAfipLogin } from "./login.js";
export { solveCaptcha, refreshCaptcha } from "./captcha.js";
export { fetchComprobantes } from "./scraper.js";
export { executeSiradigFlow } from "./siradig-flow.js";
export { fetchSiradigPresentaciones, fetchSiradigDetail } from "./siradig-scraper.js";
export { fetchCasasParticulares } from "./casas-particulares-scraper.js";
export { fetchMirequaPercepciones, filterPercepciones35 } from "./mirequa-scraper.js";
export { fetchAportesEnLinea, fetchAportesDetalle } from "./aportes-scraper.js";
export type {
  Deduction, ArcaLoginResult, ArcaComprobante,
  SiradigPresentacion, SiradigDeduccion, SiradigBorrador,
  SiradigDetail, SiradigCargaFamilia, SiradigOtroEmpleador, SiradigDeduccion3, SiradigRetencion4,
  CasasParticularesWorker, CasasParticularesPayment, CasasParticularesSummary,
  MirequaRetencion, MirequaResult,
  AportesMensual, AportesDetallePeriodo, AportesEnLineaResult,
} from "./types.js";
