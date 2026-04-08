import { auth } from "/js/firebase.config.js";
import { signOut, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/** Único correo autorizado para acceder a la aplicación */
const CORREO_AUTORIZADO = "brayanmd4@gmail.com";

/** Muestra el overlay de carga */
function mostrarLoading() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.classList.remove('hidden');
}

/** Oculta el overlay de carga */
function ocultarLoading() {
    const overlay = document.getElementById("loadingOverlay");
    const appContainer = document.getElementById("appContainer");
    if (overlay && appContainer) {
        overlay.classList.add('hidden');
        appContainer.classList.add('loaded');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }
}

/**
 * Valida la sesión de usuario y ejecuta callback si está logueado.
 * Si no hay sesión, redirige al login.
 * Maneja la animación de carga.
 */
export function validarSesion({ onUserLogged, onError }) {
    mostrarLoading();
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Verificar que el correo sea el autorizado
            if (user.email !== CORREO_AUTORIZADO) {
                console.warn("Acceso denegado para:", user.email);
                await signOut(auth);
                window.location.href = "/app/login.html?error=acceso_denegado";
                return;
            }
            const data = {
                uid: user.uid,
                nombre: user.displayName || "Usuario",
                email: user.email,
            };
            if (onUserLogged) onUserLogged(data);
            ocultarLoading();
        } else {
            ocultarLoading();
            window.location.href = "/app/login.html";
            if (onError) onError();
        }
    });
}

/**
 * Cierra la sesión del usuario y redirige al login.
 */
export async function cerrarSesion() {
    await signOut(auth);
    window.location.href = "/app/login.html";
}
