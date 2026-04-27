import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCfRMspgRtP-d3Jnha8DK7q4X8Buhj6qHA",
    authDomain: "shinzi-ai.firebaseapp.com",
    projectId: "shinzi-ai",
    storageBucket: "shinzi-ai.firebasestorage.app",
    messagingSenderId: "650971065920",
    appId: "1:650971065920:web:cce30c99c3a9572b95f9a5",
    measurementId: "G-P28XFTCSCX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// DOM Elements
const loginBtn = document.getElementById('loginTrigger');
const userProfile = document.getElementById('userProfile');
const userPhoto = document.getElementById('userPhoto');
const logoutBtn = document.getElementById('logoutBtn');

// Sign In Logic
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        signInWithPopup(auth, provider)
            .catch((error) => console.error("Login Failed", error));
    });
}

// Sign Out Logic
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.reload();
        });
    });
}

// UI Sync Logic: Watch for User Login/Logout
onAuthStateChanged(auth, (user) => {
    if (user) {
        // USER IS LOGGED IN
        loginBtn.style.display = "none";      // Hide Sign In
        userProfile.style.display = "flex";   // Show Profile Area
        userPhoto.src = user.photoURL;        // Set Google Photo
        
        console.log("Welcome,", user.displayName);
    } else {
        // USER IS LOGGED OUT
        loginBtn.style.display = "block";
        userProfile.style.display = "none";
    }
});