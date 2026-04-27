import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your Firebase Config (Verified)
const firebaseConfig = {
    apiKey: "AIzaSyCfRMspgRtP-d3Jnha8DK7q4X8Buhj6qHA",
    authDomain: "shinzi-ai.firebaseapp.com",
    projectId: "shinzi-ai",
    storageBucket: "shinzi-ai.firebasestorage.app",
    messagingSenderId: "650971065920",
    appId: "1:650971065920:web:cce30c99c3a9572b95f9a5",
    measurementId: "G-P28XFTCSCX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- FREE TIER LOGIC ---
let messageCount = 0;
const MAX_FREE_MESSAGES = 30; // Based on your Free Tier plan

// --- UI Logic ---
window.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginTrigger');
    const userProfile = document.getElementById('userProfile');
    const userPhoto = document.getElementById('userPhoto');
    const logoutBtn = document.getElementById('logoutBtn');
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');

    // 1. Google Sign-In Logic
    if (loginBtn) {
        loginBtn.onclick = () => {
            signInWithPopup(auth, provider)
                .then((result) => {
                    console.log("Logged in as:", result.user.displayName);
                })
                .catch((error) => {
                    console.error("Auth Error:", error);
                    alert("Login failed. Make sure your domain is authorized in Firebase!");
                });
        };
    }

    // 2. Logout Logic
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            signOut(auth).then(() => {
                window.location.reload();
            });
        };
    }

    // 3. The "Silent Watcher" - Detects if user is logged in or out
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is logged in: Swap button for profile photo
            if (loginBtn) loginBtn.style.display = "none";
            if (userProfile) userProfile.style.display = "flex";
            if (userPhoto) userPhoto.src = user.photoURL;
            console.log("Auth State: User Active");
        } else {
            // User is logged out: Show sign-in button
            if (loginBtn) loginBtn.style.display = "block";
            if (userProfile) userProfile.style.display = "none";
            console.log("Auth State: No User");
        }
    });

    // 4. Message Limit Checker
    if (sendBtn) {
        sendBtn.onclick = () => {
            if (!auth.currentUser) {
                alert("Please Sign In first to message Shinzi AI!");
                return;
            }

            if (messageCount >= MAX_FREE_MESSAGES) {
                alert("You've reached the 30-message limit for today! Upgrade to Shinzi+ for more.");
                return;
            }

            // If we are under the limit, we would call the Gemini 3 Flash API here
            const message = chatInput.value;
            if (message.trim() !== "") {
                messageCount++;
                console.log(`Messages used: ${messageCount}/${MAX_FREE_MESSAGES}`);
                chatInput.value = ""; // Clear input
            }
        };
    }
});