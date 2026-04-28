const API_KEY = "AIzaSyACkBU3NDE09HjAlOCJWfq4NFFmIEdHBtw";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatWindow = document.getElementById('chatWindow');
const welcomeScreen = document.getElementById('welcomeScreen');
const suggestions = document.getElementById('suggestions');

// Function to add messages to the screen
function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}-message`;
    msgDiv.innerText = text;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function askGemini(prompt) {
    // 1. Hide welcome screen and show chat
    welcomeScreen.style.display = "none";
    suggestions.style.display = "none";
    chatWindow.style.display = "flex";

    // 2. Show User Message
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

        // 3. Show AI Message
        appendMessage('ai', aiText);
    } catch (error) {
        appendMessage('ai', "Sorry, I'm having trouble connecting to my brain right now.");
        console.error(error);
    }
}

// Listen for Send button click
sendBtn.onclick = () => {
    if (chatInput.value.trim() !== "") {
        askGemini(chatInput.value);
    }
};

// Listen for "Enter" key
chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && chatInput.value.trim() !== "") {
        askGemini(chatInput.value);
    }
});

// Make suggestions clickable
window.setPrompt = (text) => {
    chatInput.value = text;
    askGemini(text);
};