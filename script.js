const PROXY_URL = "https://shinzi-proxy.onrender.com";

const ADMIN_EMAILS = [
  "sboficial226@gmail.com",
  "somahaldar355@gmail.com",
  "redkng510@gmail.com"
];

let selectedModel = "openrouter/owl-alpha";
let isAdmin = false;
let unlimitedMode = false;

const MSG_LIMIT = 30;
const STORAGE_KEY = "shinzi_msg_data";
const UNLIMITED_KEY = "shinzi_unlimited";

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
  if (unlimitedMode) return true;
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
    body: JSON.stringify({ messages, model: selectedModel })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || `Server error: ${response.status}`);
  if (!data.reply) throw new Error("No reply from server");
  return data.reply;
}

document.addEventListener("DOMContentLoaded", () => {
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const chatWindow = document.getElementById("chatWindow");
  const welcomeScreen = document.getElementById("welcomeScreen");
  const suggestions = document.getElementById("suggestions");
  const dropdownBtn = document.getElementById("modelDropdownBtn");
  const dropdownMenu = document.getElementById("modelDropdownMenu");
  const selectedModelName = document.getElementById("selectedModelName");
  const adminBtn = document.getElementById("adminBtn");
  const adminPanel = document.getElementById("adminPanel");
  const closeAdmin = document.getElementById("closeAdmin");
  const toggleUnlimitedBtn = document.getElementById("toggleUnlimitedBtn");
  const resetLimitBtn = document.getElementById("resetLimitBtn");
  const clearChatBtn = document.getElementById("clearChatBtn");
  const clearStorageBtn = document.getElementById("clearStorageBtn");

  const conversationHistory = [];
  let isWaiting = false;

  // Load unlimited mode from storage
  unlimitedMode = localStorage.getItem(UNLIMITED_KEY) === "true";

  // Model dropdown
  dropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", () => {
    dropdownMenu.classList.add("hidden");
  });

  document.querySelectorAll(".model-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedModel = btn.dataset.model;
      selectedModelName.textContent = btn.dataset.name;
      document.querySelectorAll(".model-option").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      dropdownMenu.classList.add("hidden");
      if (adminPanel && !adminPanel.classList.contains("hidden")) {
        document.getElementById("adminCurrentModel").textContent = btn.dataset.name;
      }
    });
  });

  document.querySelector(".model-option")?.classList.add("active");

  // Admin panel
  adminBtn.addEventListener("click", () => {
    adminPanel.classList.remove("hidden");
    updateAdminInfo();
  });

  closeAdmin.addEventListener("click", () => {
    adminPanel.classList.add("hidden");
  });

  adminPanel.addEventListener("click", (e) => {
    if (e.target === adminPanel) adminPanel.classList.add("hidden");
  });

  function updateAdminInfo() {
    const data = getMsgData();
    const today = new Date().toDateString();
    const count = data.date === today ? data.count : 0;
    document.getElementById("adminMsgCount").textContent = count;
    document.getElementById("adminMode").textContent = unlimitedMode ? "Unlimited" : "Normal (30/day)";
    document.getElementById("adminCurrentModel").textContent = selectedModelName.textContent;
    document.getElementById("adminLimitStatus").textContent = unlimitedMode
      ? "Unlimited mode is ON — no message limit"
      : `Normal mode — ${count}/30 messages used today`;
    toggleUnlimitedBtn.textContent = unlimitedMode ? "Disable Unlimited" : "Enable Unlimited";
  }

  toggleUnlimitedBtn.addEventListener("click", () => {
    unlimitedMode = !unlimitedMode;
    localStorage.setItem(UNLIMITED_KEY, unlimitedMode.toString());
    updateAdminInfo();
  });

  resetLimitBtn.addEventListener("click", () => {
    saveMsgData({ count: 0, date: new Date().toDateString() });
    updateAdminInfo();
    alert("Daily message count reset!");
  });

  clearChatBtn.addEventListener("click", () => {
    chatWindow.innerHTML = "";
    conversationHistory.length = 0;
    welcomeScreen.style.display = "";
    suggestions.style.display = "";
    chatWindow.style.display = "none";
    adminPanel.classList.add("hidden");
  });

  clearStorageBtn.addEventListener("click", () => {
    if (confirm("Reset all Shinzi AI data? This cannot be undone.")) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(UNLIMITED_KEY);
      unlimitedMode = false;
      updateAdminInfo();
      alert("All data reset!");
    }
  });

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
    if (user) {
      // Check if admin
      isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase());
      if (isAdmin) {
        adminBtn.classList.remove("hidden");
      } else {
        adminBtn.classList.add("hidden");
      }
    } else {
      isAdmin = false;
      adminBtn.classList.add("hidden");
      adminPanel.classList.add("hidden");
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