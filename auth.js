import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your Firebase Config
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

// Logic for Login Button
const loginBtn = document.getElementById('loginTrigger'); // Ensure your button has this ID

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("User signed in:", result.user);
                window.location.href = "dashboard.html"; // Redirect after login
            }).catch((error) => {
                console.error("Auth Error:", error);
            });
    });
}

// Logic to check if user is already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        // If on homepage and logged in, send to dashboard
        if (window.location.pathname.includes("index.html") || window.location.pathname === "/") {
            window.location.href = "dashboard.html";
        }
    }
});