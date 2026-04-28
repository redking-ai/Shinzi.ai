import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

// 🔑 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCfRMspgRtP-d3Jnha8DK7q4X8Buhj6qHA",
  authDomain: "shinzi-ai.firebaseapp.com",
  projectId: "shinzi-ai",
  storageBucket: "shinzi-ai.firebasestorage.app",
  messagingSenderId: "650971065920",
  appId: "1:650971065920:web:cce30c99c3a9572b95f9a5",
  measurementId: "G-P28XFTCSCX"
};

// ✅ INIT
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 🌐 GLOBAL
window.ShinziAuth = {
  signIn: async () => {
    const isMobile = /Android|iPhone/i.test(navigator.userAgent);

    if (isMobile) {
      await signInWithRedirect(auth, provider);
    } else {
      await signInWithPopup(auth, provider);
    }
  },
  signOut: () => signOut(auth)
};

// 🔥 MAIN
document.addEventListener("DOMContentLoaded", async () => {

  // ✅ HANDLE REDIRECT RESULT
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      console.log("Logged in:", result.user.email);
    }
  } catch (err) {
    console.error("Redirect error:", err);
  }

  const loginBtn = document.getElementById("loginTrigger");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginBtn) {
    loginBtn.onclick = async () => {
      try {
        await window.ShinziAuth.signIn();
      } catch (err) {
        alert("Login failed");
        console.error(err);
      }
    };
  }

  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      await window.ShinziAuth.signOut();
      location.reload();
    };
  }

  // ✅ AUTH STATE
  onAuthStateChanged(auth, (user) => {
    console.log("User:", user);

    const loginBtn = document.getElementById("loginTrigger");
    const userProfile = document.getElementById("userProfile");

    if (user) {
      if (loginBtn) loginBtn.style.display = "none";
      if (userProfile) userProfile.style.display = "flex";
    } else {
      if (loginBtn) loginBtn.style.display = "block";
      if (userProfile) userProfile.style.display = "none";
    }
  });

});