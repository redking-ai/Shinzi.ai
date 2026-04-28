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
  apiKey: "PASTE_YOUR_REAL_FIREBASE_API_KEY_HERE",
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

window.ShinziAuth = {
  auth,
  currentUser: null,
  signIn: async () => {
    const isMobile =
      window.matchMedia("(max-width: 768px)").matches ||
      navigator.maxTouchPoints > 0;

    if (isMobile) {
      await signInWithRedirect(auth, provider);
      return;
    }

    return signInWithPopup(auth, provider);
  },
  signOut: () => signOut(auth)
};

function initialsFromUser(user) {
  const name = (user?.displayName || user?.email || "SB").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function syncAuthUI(user) {
  const loginBtn = document.getElementById("loginTrigger");
  const userProfile = document.getElementById("userProfile");
  const userPhoto = document.getElementById("userPhoto");
  const userAvatar = document.getElementById("userAvatar");

  if (!loginBtn || !userProfile || !userPhoto || !userAvatar) return;

  if (user) {
    loginBtn.classList.add("hidden");
    userProfile.classList.remove("hidden");
    userAvatar.textContent = initialsFromUser(user);

    if (user.photoURL) {
      userPhoto.src = user.photoURL;
      userPhoto.classList.remove("hidden");
      userAvatar.classList.add("hidden");
    } else {
      userPhoto.removeAttribute("src");
      userPhoto.classList.add("hidden");
      userAvatar.classList.remove("hidden");
    }
  } else {
    loginBtn.classList.remove("hidden");
    userProfile.classList.add("hidden");
    userPhoto.removeAttribute("src");
    userPhoto.classList.add("hidden");
    userAvatar.classList.remove("hidden");
    userAvatar.textContent = "SB";
  }
}

function emitAuthChange(user) {
  window.ShinziAuth.currentUser = user;
  window.dispatchEvent(new CustomEvent("shinzi-auth-changed", { detail: { user } }));
}

document.addEventListener("DOMContentLoaded", async () => {
  const loginBtn = document.getElementById("loginTrigger");
  const logoutBtn = document.getElementById("logoutBtn");

  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      console.log("Redirect login success:", result.user);
    }
  } catch (error) {
    console.error("Redirect error:", error);
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      try {
        await window.ShinziAuth.signIn();
      } catch (error) {
        console.error("Login failed:", error);
        alert("Login failed. Check Firebase setup and authorized domains.");
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await window.ShinziAuth.signOut();
      } catch (error) {
        console.error("Logout failed:", error);
        alert("Sign out failed.");
      }
    });
  }

  onAuthStateChanged(auth, (user) => {
    syncAuthUI(user);
    emitAuthChange(user);
  });
});