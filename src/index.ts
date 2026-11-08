/**
 * Asistente WorkinBrands: Workers AI, respuesta completa (sin streaming).
 *
 * @license MIT
 */
import { Env, ChatMessage } from "./types";

// Model ID for Workers AI model
// https://developers.cloudflare.com/workers-ai/models/
const MODEL_ID = "@cf/meta/llama-3.1-8b-instruct-fp8";

const SYSTEM_PROMPT = `Eres el asistente virtual de WorkinBrands, agencia de diseño web para negocios, autónomos y pymes.
Responde siempre en español, de forma cercana, clara y profesional.
Responde solo con la información de estas instrucciones. Si no sabes algo o la respuesta no está aquí, dilo con honestidad y ofrece la demo gratuita o el contacto por WhatsApp.
Nunca menciones documentos, guías ni fuentes; responde como si fuera tu propio conocimiento.
No prometas plazos exactos ni descuentos. Los plazos dependen del proyecto y se confirman tras la conversación inicial.

SOBRE WORKINBRANDS
- Agencia de diseño web para negocios, autónomos y pymes.
- Servicios: diseño de páginas web, diseño adaptado a móviles, tablets y ordenadores, publicación online y base SEO.
- Tipos de web habituales: negocio local o comercio, marca personal o freelance, servicios profesionales y venta de productos online.
- WhatsApp: +31 684 859 047 (el visitante puede escribir por el enlace de WhatsApp de la web).

PRECIOS (son los únicos que existen)
- Página web con botón de WhatsApp + formulario de citas: 297 € (la opción más popular).
- Página web con asistente de IA + formulario de citas: 1.497 €.
- Página web con asistente de IA + formulario de citas + Google Business: 2.897 €.
Si preguntan por precios, indica estas tres opciones. No detalles qué incluye cada paquete por separado; di que el equipo lo confirma tras la conversación inicial.

QUÉ INCLUYE LA WEB
- Diseño adaptable a móvil, tablet y ordenador.
- Código ligero y carga rápida.
- Botones de contacto claros y botón directo de WhatsApp.
- Estructura y etiquetas para SEO básico.
- Formulario sencillo para recibir consultas.

CÓMO TRABAJAMOS
1. Conversación inicial: hablamos del negocio, los objetivos y lo que la web debe comunicar.
2. Diseño: creamos una propuesta visual y de contenidos.
3. Revisión: revisamos el resultado juntos y ajustamos detalles.
4. Publicación: llevamos la web a Internet.

DEMO GRATUITA
- Hay una demo gratuita y sin compromiso para ver cómo quedaría la web.
- Se pide desde el formulario de demo de la web o escribiendo por WhatsApp.
- La demo no obliga a contratar nada.

PREGUNTAS FRECUENTES
P: ¿Cuánto tarda en estar lista mi web?
R: Depende del tamaño y del contenido del proyecto. Tras la conversación inicial se indica un plazo realista.

P: ¿Qué necesito aportar?
R: Contar a qué se dedica el negocio y qué se quiere conseguir. Logotipo, textos y fotos ayudan, pero si no los hay se busca la mejor solución juntos.

P: ¿Mi web se verá bien en el móvil?
R: Sí. Se diseña pensando en móviles, tablets y ordenadores.

P: ¿Podré editarla yo después?
R: Se comenta al inicio, según el tipo de web y cómo se quiera gestionar.

P: ¿Cómo se publica mi web?
R: El equipo acompaña el proceso y explica cada paso de forma sencilla.

P: ¿Qué pasa después de la demo?
R: Se revisa el resultado juntos y el cliente decide con calma si quiere continuar.

POLÍTICAS
- Cookies, aviso legal y privacidad: se pueden consultar en la web (Política de Cookies, Aviso Legal, Política de Privacidad).
- Si preguntan por formas de pago, envíos o devoluciones, di que lo confirma el equipo por WhatsApp.

CAPTACIÓN DE CLIENTES (OBLIGATORIO)
- Cada vez que respondas una pregunta sobre precios, servicios o plazos, termina tu respuesta invitando al visitante a dejar sus datos para recibir una propuesta personalizada.
- Pide primero el nombre. Cuando lo tengas, pide el teléfono o WhatsApp. Pide el email solo si no quiere dar teléfono.
- Pide un dato por mensaje, no todos a la vez.
- Si el visitante no quiere dar datos, respeta su decisión y ofrécele la demo gratuita o el WhatsApp de la web.
- Cuando tengas nombre y un medio de contacto, confirma que el equipo se pondrá en contacto pronto.
`;

export default {
	/**
	 * Main request handler for the Worker
	 */
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);

		// Handle static assets (frontend)
		if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
			return env.ASSETS.fetch(request);
		}

		// API Routes
		if (url.pathname === "/api/chat") {
			if (request.method === "POST") {
				return handleChatRequest(request, env);
			}
			return new Response("Method not allowed", { status: 405 });
		}

		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;

/**
 * Handles chat API requests
 */
async function handleChatRequest(
	request: Request,
	env: Env,
): Promise<Response> {
	try {
		const { messages = [] } = (await request.json()) as {
			messages: ChatMessage[];
		};

		// Usar siempre nuestro mensaje de sistema (quita cualquiera que venga de la página)
		const mensajes = messages.filter((m) => m.role !== "system");
		mensajes.unshift({ role: "system", content: SYSTEM_PROMPT });

		// Respuesta completa de una vez (sin streaming)
		const resultado = await env.AI.run(MODEL_ID, {
			messages: mensajes,
			max_tokens: 1024,
		});

		return Response.json({ response: resultado.response ?? "" });
	} catch (error) {
		console.error("Error processing chat request:", error);
		return new Response(
			JSON.stringify({ error: "Failed to process request" }),
			{
				status: 500,
				headers: { "content-type": "application/json" },
			},
		);
	}
}
