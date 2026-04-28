const API_KEY = "AIzaSyACkBU3NDE09HjAlOCJWfq4NFFmIEdHBtw";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatWindow = document.getElementById('chatWindow');
const welcomeScreen = document.getElementById('welcomeScreen');
const suggestions = document.getElementById('suggestions');

function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}-message`;
    msgDiv.innerText = text;
    chatWindow.appendChild(msgDiv);
    chatWindow.style.display = "flex";
    welcomeScreen.style.display = "none";
    suggestions.style.display = "none";
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function askGemini(prompt) {
    appendMessage('user', prompt);
    chatInput.value = "";

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;
        appendMessage('ai', aiText);
    } catch (error) {
        appendMessage('ai', "Error connecting to Shinzi AI. Check your API key.");
    }
}

sendBtn.onclick = () => {
    if (chatInput.value.trim() !== "") askGemini(chatInput.value);
};

chatInput.onkeypress = (e) => {
    if (e.key === "Enter" && chatInput.value.trim() !== "") askGemini(chatInput.value);
};

// This connects the HTML buttons to the code
window.setPrompt = (text) => {
    askGemini(text);
};