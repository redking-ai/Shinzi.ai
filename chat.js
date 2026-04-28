const API_KEY = "AIzaSyACkBU3NDE09HjAlOCJWfq4NFFmIEdHBtw";
const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";

const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatWindow = document.getElementById('chatWindow');
const welcomeScreen = document.getElementById('welcomeScreen');
const suggestions = document.getElementById('suggestions');

// Function to handle the actual API call
async function sendMessage(text) {
    if (!text.trim()) return;

    // UI Updates: Hide welcome, show chat
    welcomeScreen.style.display = 'none';
    suggestions.style.display = 'none';
    chatWindow.style.display = 'flex';

    // Add User Message
    addMessage('user', text);
    chatInput.value = '';
    
    // Add Loading State
    const loadingId = addMessage('ai', 'Thinking...');

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: text }] }]
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            updateMessage(loadingId, aiText);
        } else {
            throw new Error('Invalid API Response');
        }
    } catch (error) {
        console.error("API Error:", error);
        updateMessage(loadingId, "I'm sorry, I encountered an error. Please check your connection or API key.");
    }
}

// UI Helper: Add message bubble
function addMessage(role, text) {
    const id = Date.now();
    const msgDiv = document.createElement('div');
    msgDiv.id = id;
    msgDiv.className = `msg ${role}-msg`;
    msgDiv.innerText = text;
    chatWindow.appendChild(msgDiv);
    
    // Scroll to bottom
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return id;
}

// UI Helper: Update existing bubble (for loading -> response)
function updateMessage(id, text) {
    const msgDiv = document.getElementById(id);
    if (msgDiv) {
        msgDiv.innerText = text;
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
}

// Handle Suggestion Cards
window.handleSuggestion = (text) => {
    sendMessage(text);
};

// Event Listeners
sendBtn.addEventListener('click', () => sendMessage(chatInput.value));

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage(chatInput.value);
});