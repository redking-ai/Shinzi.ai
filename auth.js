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

// 🔐 SIGN IN
async function signInUser() {
  const isMobile =
    /Android|iPhone|iPad/i.test(navigator.userAgent) ||
    window.matchMedia("(max-width: 768px)").matches;

  if (isMobile) {
    await signInWithRedirect(auth, provider);
  } else {
    await signInWithPopup(auth, provider);
  }
}

// 🔐 SIGN OUT
async function signOutUser() {
  await signOut(auth);
  location.reload();
}

// 🚀 MAIN
document.addEventListener("DOMContentLoaded", async () => {

  // 🔥 FIX: handle redirect login
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      console.log("Login success:", result.user);
    }
  } catch (error) {
    console.error("Redirect error:", error);
  }

  const loginBtn = document.getElementById("loginTrigger");
  const logoutBtn = document.getElementById("logoutBtn");
  const userProfile = document.getElementById("userProfile");

  if (loginBtn) {
    loginBtn.onclick = signInUser;
  }

  if (logoutBtn) {
    logoutBtn.onclick = signOutUser;
  }

  // 👤 AUTH STATE
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User logged in:", user.email);

      if (loginBtn) loginBtn.style.display = "none";
      if (userProfile) userProfile.style.display = "flex";

    } else {
      console.log("No user");

      if (loginBtn) loginBtn.style.display = "block";
      if (userProfile) userProfile.style.display = "none";
    }
  });

});