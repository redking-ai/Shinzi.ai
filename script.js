const PROXY_URL = "https://shinzi-proxy.onrender.com";

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
  if (data.date !== today) data = { count: 0, date: today };
  if (data.count >= MSG_LIMIT) return false;
  data.count++;
  saveMsgData(data);
  return true;
}

async function sendToProxy(messages) {
  const response = await fetch(`${PROXY_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || `Server error: ${response.status}`);
  }

  if (!data.reply) {
    throw new Error("No reply from server");
  }

  return data.reply;
}

document.addEventListener("DOMContentLoaded", () => {
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const chatWindow = document.getElementById("chatWindow");
  const welcomeScreen = document.getElementById("welcomeScreen");
  const suggestions = document.getElementById("suggestions");

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
    conversationHistory.push({ role: "user", content: text });

    const loadingBubble = addMessage("ai", "Thinking...");
    loadingBubble.classList.add("typing");

    try {
      const reply = await sendToProxy(conversationHistory);
      conversationHistory.push({ role: "assistant", content: reply });
      updateMessage(loadingBubble, reply);
      loadingBubble.classList.remove("typing");
    } catch (err) {
      console.error("Chat error:", err);
      updateMessage(loadingBubble, "Something went wrong. Please try again.");
      loadingBubble.classList.remove("typing");
      conversationHistory.pop();
    } finally {
      isWaiting = false;
      setTypingState(false);
      chatInput.focus();
    }
  }

  document.querySelectorAll(".suggestion-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prompt = btn.dataset.prompt || "";
      if (!prompt || !ensureLoggedIn()) return;
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