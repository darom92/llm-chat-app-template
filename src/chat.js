/**
 * Asistente WorkinBrands: respuesta completa de una vez (sin streaming).
 */

const chatMessages = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");
const suggestions = document.getElementById("suggestions");

let chatHistory = [
	{
		role: "assistant",
		content: "¡Hola! Soy el asistente de WorkinBrands. ¿En qué puedo ayudarte?",
	},
];
let isProcessing = false;
// Evita enviar el mismo contacto varias veces
let leadSent = false;

// Enviar con el formulario (botón o Enter)
chatForm.addEventListener("submit", (e) => {
	e.preventDefault();
	sendMessage();
});

// Enter envía, Shift+Enter hace salto de línea
userInput.addEventListener("keydown", (e) => {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		chatForm.requestSubmit();
	}
});

// Preguntas rápidas
document.querySelectorAll(".chip").forEach((chip) => {
	chip.addEventListener("click", () => sendMessage(chip.dataset.question));
});

async function sendMessage(text) {
	const message = (typeof text === "string" ? text : userInput.value).trim();
	if (message === "" || isProcessing) return;

	setBusy(true);
	suggestions.hidden = true;

	addMessageToChat("user", message);
	userInput.value = "";
	chatHistory.push({ role: "user", content: message });

	typingIndicator.classList.add("visible");

	try {
		const response = await fetch("/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ messages: chatHistory, leadSent }),
		});

		const data = await response.json();
		if (!response.ok || typeof data.response !== "string") {
			throw new Error(data.error || "Failed to get response");
		}

		if (data.leadSent) leadSent = true;

		addMessageToChat("assistant", data.response);
		chatHistory.push({ role: "assistant", content: data.response });
	} catch (error) {
		console.error("Error:", error);
		addMessageToChat(
			"assistant",
			"Lo siento, ha ocurrido un error. Inténtalo de nuevo en unos minutos.",
		);
	} finally {
		typingIndicator.classList.remove("visible");
		setBusy(false);
		userInput.focus();
	}
}

function setBusy(busy) {
	isProcessing = busy;
	userInput.disabled = busy;
	sendButton.disabled = busy;
}

/**
 * Añade un mensaje. textContent evita que el texto se interprete como HTML.
 */
function addMessageToChat(role, content) {
	const messageEl = document.createElement("div");
	messageEl.className = `message ${role}-message`;
	const paragraph = document.createElement("p");
	paragraph.textContent = content;
	messageEl.appendChild(paragraph);
	chatMessages.appendChild(messageEl);
	chatMessages.scrollTop = chatMessages.scrollHeight;
}
