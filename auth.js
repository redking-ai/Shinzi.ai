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

// 🔑 Firebase config (your real one)
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

// 🔐 SIGN IN
async function signInUser() {
  try {
    const isMobile =
      /Android|iPhone|iPad/i.test(navigator.userAgent) ||
      window.matchMedia("(max-width: 768px)").matches;

    if (isMobile) {
      await signInWithRedirect(auth, provider);
    } else {
      await signInWithPopup(auth, provider);
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Login failed");
  }
}

// 🔐 SIGN OUT
async function signOutUser() {
  try {
    await signOut(auth);
    location.reload();
  } catch (err) {
    console.error("Logout error:", err);
  }
}

// 🚀 MAIN
document.addEventListener("DOMContentLoaded", async () => {

  const loginBtn = document.getElementById("loginTrigger");
  const logoutBtn = document.getElementById("logoutBtn");
  const userProfile = document.getElementById("userProfile");

  // 🔥 Handle redirect (VERY IMPORTANT FOR MOBILE)
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      console.log("Redirect login success:", result.user.email);
    }
  } catch (err) {
    console.error("Redirect error:", err);
  }

  // 👆 CLICK HANDLERS
  if (loginBtn) {
    loginBtn.onclick = signInUser;
  }

  if (logoutBtn) {
    logoutBtn.onclick = signOutUser;
  }

  // 👤 AUTH STATE (this controls UI)
  onAuthStateChanged(auth, (user) => {
    console.log("Auth state:", user);

    if (user) {
      // user logged in
      if (loginBtn) loginBtn.style.display = "none";
      if (userProfile) userProfile.style.display = "flex";

    } else {
      // user logged out
      if (loginBtn) loginBtn.style.display = "block";
      if (userProfile) userProfile.style.display = "none";
    }
  });

});