// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Referencias al DOM
const loginView = document.getElementById("login-view");
const gameView = document.getElementById("game-view");
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const userName = document.getElementById("user-name");

// Variable global para el caso actual
let casoActual = null;

// Escuchar autenticación
onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginView.classList.add("hidden");
    gameView.classList.remove("hidden");
    userName.textContent = user.displayName;
    await cargarNuevoCaso();
  } else {
    loginView.classList.remove("hidden");
    gameView.classList.add("hidden");
  }
});

// Eventos Login / Logout
btnLogin.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
  }
});

btnLogout.addEventListener("click", () => signOut(auth));

// Obtener un caso aleatorio desde Firestore
async function obtenerCasoRandom() {
  try {
    const querySnapshot = await getDocs(collection(db, "casos"));
    const casosList = [];

    querySnapshot.forEach((doc) => {
      casosList.push({ id: doc.id, ...doc.data() });
    });

    if (casosList.length === 0) {
      console.warn("No hay datos en la colección 'casos'");
      return null;
    }

    const indiceRandom = Math.floor(Math.random() * casosList.length);
    return casosList[indiceRandom];

  } catch (error) {
    console.error("Error al obtener datos de Firestore:", error);
    return null;
  }
}

// Cargar y mostrar el nuevo caso
async function cargarNuevoCaso() {
  document.getElementById("question-text").textContent = "Cargando caso...";
  document.getElementById("submitted-answer").textContent = "...";
  document.getElementById("feedback").textContent = "";

  casoActual = await obtenerCasoRandom();

  if (casoActual) {
    document.getElementById("question-text").textContent = casoActual.pregunta;
    document.getElementById("submitted-answer").textContent = casoActual.respuesta_propuesta;
  } else {
    document.getElementById("question-text").textContent = "No se encontraron casos en Firestore";
  }
}

// Lógica para evaluar la elección del jugador
function evaluar(eleccionUsuario) {
  if (!casoActual) return;

  const feedback = document.getElementById("feedback");

  if (eleccionUsuario === casoActual.es_correcta) {
    feedback.textContent = "🎯 ¡Excelente veredicto! Acertaste.";
    feedback.className = "mt-4 text-center font-bold text-emerald-400";
  } else {
    feedback.textContent = "❌ Veredicto equivocado.";
    feedback.className = "mt-4 text-center font-bold text-red-400";
  }

  // Cargar otro caso automáticamente tras 2 segundos
  setTimeout(() => {
    cargarNuevoCaso();
  }, 2000);
}

// Eventos de los botones de juzgar
document.getElementById("btn-correct").addEventListener("click", () => evaluar(true));
document.getElementById("btn-incorrect").addEventListener("click", () => evaluar(false));