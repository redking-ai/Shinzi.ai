const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const chatWindow = document.getElementById("chatWindow");
const welcomeScreen = document.getElementById("welcomeScreen");
const suggestions = document.getElementById("suggestions");

let isWaiting = false;

function getAuthUser() {
  return window.ShinziAuth?.currentUser || null;
}

function ensureLoggedIn() {
  if (getAuthUser()) return true;

  if (window.ShinziAuth?.signIn) {
    window.ShinziAuth.signIn().catch((error) => {
      console.error("Sign-in popup failed:", error);
      alert("Please sign in first.");
    });
  } else {
    alert("Please sign in first.");
  }
  return false;
}

function showChatArea() {
  welcomeScreen.style.display = "none";
  suggestions.style.display = "none";
  chatWindow.style.display = "flex";
}

function addMessage(role, text) {
  showChatArea();

  const msg = document.createElement("div");
  msg.className = `msg ${role}-msg`;
  msg.textContent = text;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return msg;
}

function setTypingState(on) {
  sendBtn.disabled = on;
  chatInput.disabled = on;
  sendBtn.style.opacity = on ? "0.6" : "1";
}

function updateMessage(node, text) {
  if (!node) return;
  node.textContent = text;
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function sendMessage(rawText) {
  const text = rawText.trim();
  if (!text || isWaiting) return;

  if (!ensureLoggedIn()) return;

  isWaiting = true;
  setTypingState(true);

  addMessage("user", text);
  chatInput.value = "";

  const loadingBubble = addMessage("ai", "Thinking...");
  loadingBubble.classList.add("typing");

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text }]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || `HTTP ${response.status}`);
    }

    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      throw new Error("Empty Gemini response");
    }

    updateMessage(loadingBubble, aiText);
    loadingBubble.classList.remove("typing");
  } catch (error) {
    console.error("Gemini error:", error);
    updateMessage(
      loadingBubble,
      "I am sorry, I encountered an error. Please check your Gemini API key, model name, or network connection."
    );
    loadingBubble.classList.remove("typing");
  } finally {
    isWaiting = false;
    setTypingState(false);
    chatInput.focus();
  }
}

function handleSuggestion(promptText) {
  if (!ensureLoggedIn()) return;
  chatInput.value = promptText;
  sendMessage(promptText);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".suggestion-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const promptText = button.dataset.prompt || "";
      handleSuggestion(promptText);
    });
  });

  sendBtn.addEventListener("click", () => {
    sendMessage(chatInput.value);
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage(chatInput.value);
    }
  });

  window.addEventListener("shinzi-auth-changed", (event) => {
    const user = event.detail?.user;
    if (!user) {
      welcomeScreen.style.display = "";
      suggestions.style.display = "";
      chatWindow.style.display = "none";
      chatWindow.innerHTML = "";
      chatInput.value = "";
      isWaiting = false;
      setTypingState(false);
    }
  });
});