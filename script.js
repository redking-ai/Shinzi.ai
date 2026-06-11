const PROXY_URL = "https://shinzi-proxy.onrender.com";

const ADMIN_EMAILS = [
  "sboficial226@gmail.com",
  "somahaldar355@gmail.com",
  "redkng510@gmail.com"
];

// Clean 1-to-1 Single Model Setup
let selectedModel = "deepseek/deepseek-v4-flash:free"; 
let isCoderMode = false;
let isAdmin = false;
let unlimitedMode = false;
let pendingAttachments = [];

const MSG_LIMIT = 30;
const STORAGE_KEY = "shinzi_msg_data";
const UNLIMITED_KEY = "shinzi_unlimited";

function getMsgData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, date: new Date().toDateString() };
    return JSON.parse(raw);
  } catch { return { count: 0, date: new Date().toDateString() }; }
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

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 200);
  }, 2200);
}

// Fixed to target the selected single model directly
async function sendToProxy(messages) {
  const modelToUse = isCoderMode ? "qwen/qwen3-coder:free" : selectedModel;

  const response = await fetch(`${PROXY_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, model: modelToUse })
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
  const plusBtn = document.getElementById("plusBtn");
  const plusMenu = document.getElementById("plusMenu");
  const photoInput = document.getElementById("photoInput");
  const cameraInput = document.getElementById("cameraInput");
  const fileInput = document.getElementById("fileInput");
  const inputTop = document.getElementById("inputTop");
  const coderTag = document.getElementById("coderTag");
  const coderTagClose = document.getElementById("coderTagClose");

  const conversationHistory = [];
  let isWaiting = false;

  unlimitedMode = localStorage.getItem(UNLIMITED_KEY) === "true";

  // ── Model Dropdown Controller ──
  if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("hidden");
    });

    document.querySelectorAll(".model-option").forEach((btn) => {
      btn.addEventListener("click", function() {
        selectedModel = this.getAttribute("data-model");
        if (selectedModelName) {
          selectedModelName.textContent = this.getAttribute("data-name");
        }
        document.querySelectorAll(".model-option").forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        dropdownMenu.classList.add("hidden");
        console.log("Active model switched to:", selectedModel);
      });
    });
  }

  // Close dropdown or menus on global body clicks
  document.addEventListener("click", (e) => {
    const wrapper = document.getElementById("modelDropdownWrapper");
    if (wrapper && !wrapper.contains(e.target)) {
      dropdownMenu.classList.add("hidden");
    }
    plusMenu.classList.add("hidden");
  });

  // ── Plus button ──
  plusBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    plusMenu.classList.toggle("hidden");
  });
  plusMenu.addEventListener("click", (e) => e.stopPropagation());

  document.getElementById("optPhoto").addEventListener("click", () => {
    plusMenu.classList.add("hidden");
    photoInput.click();
  });
  document.getElementById("optCamera").addEventListener("click", () => {
    plusMenu.classList.add("hidden");
    cameraInput.click();
  });
  document.getElementById("optFiles").addEventListener("click", () => {
    plusMenu.classList.add("hidden");
    fileInput.click();
  });
  document.getElementById("optCoding").addEventListener("click", () => {
    plusMenu.classList.add("hidden");
    enableCoderMode();
  });
  document.getElementById("optBuildWeb").addEventListener("click", () => {
    plusMenu.classList.add("hidden");
    chatInput.value = "Help me build a website: ";
    chatInput.focus();
  });

  // ── Coder mode ──
  function enableCoderMode() {
    isCoderMode = true;
    coderTag.classList.remove("hidden");
    chatInput.placeholder = "Ask Shinzi Coder...";
  }
  function disableCoderMode() {
    isCoderMode = false;
    coderTag.classList.add("hidden");
    chatInput.placeholder = "Ask anything...";
  }
  coderTagClose.addEventListener("click", disableCoderMode);

  // ── Photo / Camera input ──
  function handleImageFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target.result;
        pendingAttachments.push({ type: "image", url, name: file.name });
        const wrap = document.createElement("div");
        wrap.className = "preview-img";
        wrap.innerHTML = `<img src="${url}" alt="preview"><button class="remove-preview">×</button>`;
        wrap.querySelector(".remove-preview").addEventListener("click", () => {
          pendingAttachments = pendingAttachments.filter(a => a.url !== url);
          wrap.remove();
        });
        inputTop.appendChild(wrap);
      };
      reader.readAsDataURL(file);
    });
  }

  photoInput.addEventListener("change", () => {
    handleImageFiles(photoInput.files);
    photoInput.value = "";
  });
  cameraInput.addEventListener("change", () => {
    handleImageFiles(cameraInput.files);
    cameraInput.value = "";
  });

  // ── File input ──
  fileInput.addEventListener("change", () => {
    Array.from(fileInput.files).forEach(file => {
      pendingAttachments.push({ type: "file", name: file.name });
      const wrap = document.createElement("div");
      wrap.className = "preview-file";
      wrap.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span>${file.name}</span>
        <button class="remove-preview" style="position:absolute;top:4px;right:4px;">×</button>`;
      wrap.querySelector(".remove-preview").addEventListener("click", () => {
        pendingAttachments = pendingAttachments.filter(a => a.name !== file.name);
        wrap.remove();
      });
      inputTop.appendChild(wrap);
    });
    fileInput.value = "";
  });

  // ── Admin panel ──
  adminBtn.addEventListener("click", () => {
    adminPanel.classList.remove("hidden");
    updateAdminInfo();
  });
  closeAdmin.addEventListener("click", () => adminPanel.classList.add("hidden"));
  adminPanel.addEventListener("click", (e) => {
    if (e.target === adminPanel) adminPanel.classList.add("hidden");
  });

  function updateAdminInfo() {
    const data = getMsgData();
    const today = new Date().toDateString();
    const count = data.date === today ? data.count : 0;
    document.getElementById("adminMsgCount").textContent = count;
    document.getElementById("adminMode").textContent = unlimitedMode ? "Unlimited" : "Normal (30/day)";
    document.getElementById("adminCurrentModel").textContent = selectedModelName ? selectedModelName.textContent : "Unknown";
    document.getElementById("adminLimitStatus").textContent = unlimitedMode
      ? "Unlimited mode is ON"
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
    showToast("Daily count reset!");
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
    if (confirm("Reset all Shinzi AI data?")) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(UNLIMITED_KEY);
      unlimitedMode = false;
      updateAdminInfo();
      showToast("All data reset!");
    }
  });

  // ── Chat ──
  function getAuthUser() { return window.ShinziAuth?.currentUser || null; }
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

  function addUserMessage(text) {
    showChatArea();
    const msg = document.createElement("div");
    msg.className = "msg user-msg";

    if (pendingAttachments.length > 0) {
      const imgs = pendingAttachments.filter(a => a.type === "image");
      const files = pendingAttachments.filter(a => a.type === "file");
      if (imgs.length > 0) {
        const imgRow = document.createElement("div");
        imgRow.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;";
        imgs.forEach(a => {
          const i = document.createElement("img");
          i.src = a.url;
          i.style.cssText = "width:80px;height:80px;object-fit:cover;border-radius:8px;";
          imgRow.appendChild(i);
        });
        msg.appendChild(imgRow);
      }
      files.forEach(a => {
        const f = document.createElement("div");
        f.style.cssText = "font-size:0.78rem;color:#aaa;margin-bottom:4px;";
        f.textContent = "📎 " + a.name;
        msg.appendChild(f);
      });
      inputTop.innerHTML = "";
      pendingAttachments = [];
    }

    if (text) {
      const t = document.createElement("span");
      t.textContent = text;
      msg.appendChild(t);
    }

    chatWindow.appendChild(msg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function addAiMessage(text) {
    showChatArea();

    const wrap = document.createElement("div");
    wrap.className = "ai-msg-wrap";

    const msg = document.createElement("div");
    msg.className = "msg ai-msg";
    msg.textContent = text;

    const actions = document.createElement("div");
    actions.className = "msg-actions";
    actions.innerHTML = `
      <button class="msg-action-btn" data-action="copy" title="Copy">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>
      <button class="msg-action-btn" data-action="like" title="Like">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
      </button>
      <button class="msg-action-btn" data-action="dislike" title="Dislike">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
      </button>
      <button class="msg-action-btn" data-action="share" title="Share">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      </button>`;

    actions.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === "copy") {
        navigator.clipboard.writeText(msg.textContent).then(() => showToast("Copied!"));
      } else if (action === "like" || action === "dislike") {
        showToast("Thanks for your feedback!");
      } else if (action === "share") {
        if (navigator.share) {
          navigator.share({ text: msg.textContent }).catch(() => {});
        } else {
          navigator.clipboard.writeText(msg.textContent).then(() => showToast("Copied to clipboard!"));
        }
      }
    });

    wrap.appendChild(msg);
    wrap.appendChild(actions);
    chatWindow.appendChild(wrap);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return msg;
  }

  function setTypingState(on) {
    sendBtn.disabled = on;
    chatInput.disabled = on;
  }

  // ── FIXED SEND MESSAGE LOGIC (WITH FULL MULTIMODAL VISION SUPPORT) ──
  async function sendMessage(rawText) {
    const text = rawText.trim();
    if ((!text && pendingAttachments.length === 0) || isWaiting) return;
    if (!ensureLoggedIn()) return;
    if (!checkAndIncrementMsgCount()) {
      showToast("Daily limit reached. Come back tomorrow!");
      return;
    }

    isWaiting = true;
    setTypingState(true);
    chatInput.value = "";

    // 1. Capture the image base64 links before addUserMessage clears the array!
    const attachedImages = pendingAttachments.filter(a => a.type === "image");

    // 2. Render the user UI chat bubbles
    addUserMessage(text);

    // 3. Construct the payload for OpenRouter
    let userPayloadContent = text;

    if (attachedImages.length > 0) {
      userPayloadContent = [];
      // If there is written text alongside the image, add it first
      if (text) {
        userPayloadContent.push({ type: "text", text: text });
      }
      // Loop through and append each image in OpenRouter's vision standard format
      attachedImages.forEach(img => {
        userPayloadContent.push({
          type: "image_url",
          image_url: { url: img.url } // Contains the raw data:image/... base64 string
        });
      });
    }

    // 4. Push organized multi-modal block to history
    if (text || attachedImages.length > 0) {
      conversationHistory.push({ role: "user", content: userPayloadContent });
    }

    const loadingMsg = addAiMessage("Thinking...");
    loadingMsg.classList.add("typing");

    try {
      const reply = await sendToProxy(conversationHistory);
      conversationHistory.push({ role: "assistant", content: reply });
      loadingMsg.textContent = reply;
      loadingMsg.classList.remove("typing");
    } catch (err) {
      loadingMsg.textContent = err.message || "Something went wrong. Please try again.";
      loadingMsg.classList.remove("typing");
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
      if (prompt === "Generate code") enableCoderMode();
      sendMessage(prompt);
    });
  });

  sendBtn.addEventListener("click", () => sendMessage(chatInput.value));
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); sendMessage(chatInput.value); }
  });

  window.addEventListener("shinzi-auth-changed", (e) => {
    const user = e.detail?.user;
    if (user) {
      isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase());
      adminBtn.classList.toggle("hidden", !isAdmin);
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
