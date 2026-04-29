const GEMINI_API_KEY = "AIzaSyASEmxQcddG-E97vXdb0W9clwqM16wt-BQ";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const MSG_LIMIT = 30;
const STORAGE_KEY = "shinzi_msg_data";

function getMsgData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, date: new Date().toDateString() };
    return JSON.parse(raw);
  } catch {
    return { count: 0, date: new Date().toDateString() };
  }
}

function saveMsgData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function checkAndIncrementMsgCount() {
  let data = getMsgData();
  const today = new Date().toDateString();
  if (data.date !== today) {
    data = { count: 0, date: today };
  }
  if (data.count >= MSG_LIMIT) return false;
  data.count++;
  saveMsgData(data);
  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const chatWindow = document.getElementById("chatWindow");
  const welcomeScreen = document.getElementById("welcomeScreen");
  const suggestions = document.getElementById("suggestions");

  // Conversation history for multi-turn context
  const conversationHistory = [];
  let isWaiting = false;

  function getAuthUser() {
    return window.ShinziAuth?.currentUser || null;
  }

  function ensureLoggedIn() {
    if (getAuthUser()) return true;
    window.ShinziAuth?.signIn();
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

    const canSend = checkAndIncrementMsgCount();
    if (!canSend) {
      alert("You have reached the 30 message daily limit. Come back tomorrow.");
      return;
    }

    isWaiting = true;
    setTypingState(true);
    chatInput.value = "";

    addMessage("user", text);
    conversationHistory.push({ role: "user", parts: [{ text }] });

    const loadingBubble = addMessage("ai", "Thinking...");
    loadingBubble.classList.add("typing");

    try {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: conversationHistory
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || `HTTP ${response.status}`);
      }

      const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiText) throw new Error("Empty response from Gemini");

      conversationHistory.push({ role: "model", parts: [{ text: aiText }] });
      updateMessage(loadingBubble, aiText);
      loadingBubble.classList.remove("typing");
    } catch (err) {
      console.error("Gemini error:", err);
      updateMessage(loadingBubble, "Sorry, something went wrong: " + err.message);
      loadingBubble.classList.remove("typing");
      // Remove failed user message from history
      conversationHistory.pop();
    } finally {
      isWaiting = false;
      setTypingState(false);
      chatInput.focus();
    }
  }

  // Suggestion cards
  document.querySelectorAll(".suggestion-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prompt = btn.dataset.prompt || "";
      if (!prompt) return;
      if (!ensureLoggedIn()) return;
      sendMessage(prompt);
    });
  });

  sendBtn.addEventListener("click", () => sendMessage(chatInput.value));

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage(chatInput.value);
    }
  });

  // Auth state changes from auth.js
  window.addEventListener("shinzi-auth-changed", (e) => {
    const user = e.detail?.user;
    if (!user) {
      welcomeScreen.style.display = "";
      suggestions.style.display = "";
      chatWindow.style.display = "none";
      chatWindow.innerHTML = "";
      conversationHistory.length = 0;
      chatInput.value = "";
      isWaiting = false;
      setTypingState(false);
    }
  });
});