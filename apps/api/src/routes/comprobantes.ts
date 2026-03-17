import type { FastifyPluginAsync } from "fastify";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy-init Gemini client
let geminiClient: GoogleGenerativeAI | null = null;
function getGeminiClient(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!key) return null;
  if (!geminiClient) geminiClient = new GoogleGenerativeAI(key);
  return geminiClient;
}

// Lazy-init Anthropic client (fallback)
let anthropicClient: any = null;
async function getAnthropicClient(): Promise<any | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!anthropicClient) {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

/** Supported image MIME types */
const SUPPORTED_MIME: Record<string, string> = {
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
  "image/gif": "image/gif",
  "application/pdf": "application/pdf",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const EXTRACTION_PROMPT = `Sos un experto en comprobantes fiscales argentinos (facturas, tickets, recibos).

Analizá esta imagen y devolvé un JSON con los datos extraídos.

PRIMERO determiná si la imagen es un comprobante fiscal válido (factura, ticket, recibo, nota de crédito, resumen de cuenta, etc.).
Si NO es un comprobante (selfie, foto de paisaje, meme, screenshot random, etc.), devolvé:
{"esComprobante": false, "motivo": "breve explicación de qué es la imagen"}

Si SÍ es un comprobante, extraé estos campos:
{
  "esComprobante": true,
  "tipo": "Factura A" | "Factura B" | "Factura C" | "Ticket" | "Recibo" | "Nota de Crédito" | "Resumen",
  "proveedor": "RAZÓN SOCIAL o nombre del emisor",
  "cuitEmisor": "XX-XXXXXXXX-X o solo números, del emisor",
  "cuitReceptor": "XX-XXXXXXXX-X o solo números, del receptor/cliente (si aparece)",
  "fecha": "DD/MM/AAAA",
  "numero": "número de comprobante (ej: 0001-00012345)",
  "montoTotal": 12345.67,
  "montoNeto": 10000.00,
  "iva": 2100.00,
  "items": ["descripción breve de cada ítem facturado"],
  "condicionIva": "Responsable Inscripto" | "Monotributista" | "Consumidor Final" | etc,
  "confianza": 0.0 a 1.0
}

REGLAS:
- "cuitEmisor" es el CUIT del que EMITE la factura (el proveedor/prestador)
- "cuitReceptor" es el CUIT del que RECIBE/paga (el cliente)
- Si algún campo no se lee bien, poné null
- "confianza" indica qué tan legible y completa está la imagen (1.0 = perfecta, 0.5 = borrosa pero se lee algo, 0.0 = ilegible)
- Devolvé SOLO el JSON, sin markdown ni explicación
- Los montos son en pesos argentinos (ARS)
- Si ves un QR de ARCA/AFIP, es buena señal de que es comprobante fiscal válido`;

/** Call Gemini 2.0 Flash (free tier) */
async function callGemini(base64: string, mimeType: string): Promise<string> {
  const client = getGeminiClient();
  if (!client) throw new Error("NO_GEMINI_KEY");

  const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: base64,
      },
    },
    { text: EXTRACTION_PROMPT },
  ]);

  return result.response.text();
}

/** Call Claude Vision (paid fallback) */
async function callClaude(base64: string, mimeType: string): Promise<string> {
  const client = await getAnthropicClient();
  if (!client) throw new Error("NO_ANTHROPIC_KEY");

  let content: any[];
  if (mimeType === "application/pdf") {
    content = [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } } as any,
      { type: "text", text: EXTRACTION_PROMPT },
    ];
  } else {
    content = [
      { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
      { type: "text", text: EXTRACTION_PROMPT },
    ];
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((b: any) => b.type === "text");
  if (!textBlock) throw new Error("No text response from Claude");
  return textBlock.text;
}

const comprobanteRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(import("@fastify/multipart"), {
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  });

  fastify.post("/comprobantes/scan", async (request, reply) => {
    const hasGemini = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY);
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

    if (!hasGemini && !hasAnthropic) {
      return reply.code(500).send({
        ok: false,
        error: "No hay API key configurada. Configurá GEMINI_API_KEY (gratis) o ANTHROPIC_API_KEY.",
      });
    }

    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ ok: false, error: "No se recibió archivo" });
    }

    const mimeType = SUPPORTED_MIME[data.mimetype];
    if (!mimeType) {
      return reply.code(400).send({
        ok: false,
        error: `Formato no soportado: ${data.mimetype}. Usá JPG, PNG, WebP o PDF.`,
      });
    }

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length === 0) {
      return reply.code(400).send({ ok: false, error: "Archivo vacío" });
    }
    if (buffer.length > MAX_FILE_SIZE) {
      return reply.code(400).send({ ok: false, error: "Archivo demasiado grande (máx 10 MB)" });
    }

    const base64 = buffer.toString("base64");
    fastify.log.info({ size: buffer.length, mime: mimeType }, "Processing comprobante scan");

    try {
      let rawText: string;
      let provider: string;

      // Try Gemini first (free), fallback to Claude
      if (hasGemini) {
        try {
          rawText = await callGemini(base64, mimeType);
          provider = "gemini";
        } catch (geminiErr: any) {
          fastify.log.warn(geminiErr, "Gemini failed, trying Claude fallback");
          if (hasAnthropic) {
            rawText = await callClaude(base64, mimeType);
            provider = "claude";
          } else {
            throw geminiErr;
          }
        }
      } else {
        rawText = await callClaude(base64, mimeType);
        provider = "claude";
      }

      // Parse JSON from response (strip markdown code fences if present)
      let jsonStr = rawText.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      }

      let parsed: any;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        fastify.log.warn({ raw: rawText }, "Failed to parse LLM response as JSON");
        return reply.code(500).send({
          ok: false,
          error: "No se pudo interpretar la respuesta",
          raw: rawText,
        });
      }

      fastify.log.info(
        { esComprobante: parsed.esComprobante, proveedor: parsed.proveedor, cuit: parsed.cuitEmisor, provider },
        "Comprobante scan result",
      );

      return { ok: true, data: parsed, provider };
    } catch (err: any) {
      fastify.log.error(err, "Vision API error");

      if (err?.message === "NO_GEMINI_KEY" || err?.message === "NO_ANTHROPIC_KEY") {
        return reply.code(500).send({ ok: false, error: "API key no configurada" });
      }
      if (err?.status === 401) {
        return reply.code(500).send({ ok: false, error: "API key inválida" });
      }
      if (err?.status === 429) {
        return reply.code(429).send({ ok: false, error: "Demasiadas solicitudes, esperá un momento" });
      }

      return reply.code(500).send({
        ok: false,
        error: "No pudimos procesar este comprobante. Verificá que sea una imagen clara y volvé a intentar.",
      });
    }
  });
};

export default comprobanteRoutes;
