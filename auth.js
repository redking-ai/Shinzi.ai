import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCfRMspgRtP-d3Jnha8DK7q4X8Buhj6qHA",
  authDomain: "shinzi-ai.firebaseapp.com",
  projectId: "shinzi-ai",
  storageBucket: "shinzi-ai.firebasestorage.app",
  messagingSenderId: "650971065920",
  appId: "1:650971065920:web:cce30c99c3a9572b95f9a5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

provider.setCustomParameters({ prompt: "select_account" });

const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

async function signInUser() {
  try {
    if (isMobile) {
      await signInWithRedirect(auth, provider);
    } else {
      const result = await signInWithPopup(auth, provider);
      console.log("Popup login success:", result.user.email);
    }
  } catch (err) {
    if (err.code !== "auth/popup-closed-by-user") {
      console.error("Login error:", err);
      alert("Login failed: " + err.message);
    }
  }
}

async function signOutUser() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Logout error:", err);
  }
}

window.ShinziAuth = {
  signIn: signInUser,
  signOut: signOutUser,
  get currentUser() { return auth.currentUser; }
};

// Handle redirect result on page load
getRedirectResult(auth)
  .then((result) => {
    if (result?.user) {
      console.log("Redirect login success:", result.user.email);
    }
  })
  .catch((err) => {
    if (err.code !== "auth/no-auth-event") {
      console.error("Redirect result error:", err);
    }
  });

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginTrigger");
  const logoutBtn = document.getElementById("logoutBtn");
  const userProfile = document.getElementById("userProfile");
  const userPhoto = document.getElementById("userPhoto");
  const userAvatar = document.getElementById("userAvatar");

  if (loginBtn) loginBtn.addEventListener("click", signInUser);
  if (logoutBtn) logoutBtn.addEventListener("click", signOutUser);

  onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user?.email || "logged out");
    if (user) {
      loginBtn.style.display = "none";
      userProfile.style.display = "flex";

      if (user.photoURL) {
        userPhoto.src = user.photoURL;
        userPhoto.classList.remove("hidden");
        userAvatar.style.display = "none";
      } else {
        const initials = (user.displayName || "U")
          .split(" ")
          .map(n => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        userAvatar.textContent = initials;
        userAvatar.style.display = "grid";
        userPhoto.classList.add("hidden");
      }

      window.dispatchEvent(new CustomEvent("shinzi-auth-changed", { detail: { user } }));
    } else {
      loginBtn.style.display = "";
      userProfile.style.display = "none";
      window.dispatchEvent(new CustomEvent("shinzi-auth-changed", { detail: { user: null } }));
    }
  });
});