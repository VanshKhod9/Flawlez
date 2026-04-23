import { useEffect, useRef, useState } from "react";
import { googleAuthenticate } from "../api";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

let googleScriptPromise;

const loadGoogleScript = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign-in is only available in the browser."));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Unable to load Google sign-in.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Unable to load Google sign-in."));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

export default function GoogleAuthButton({
  buttonText = "continue_with",
  dividerLabel = "or continue with",
  onAuthSuccess,
}) {
  const buttonRef = useRef(null);
  const successRef = useRef(onAuthSuccess);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    successRef.current = onAuthSuccess;
  }, [onAuthSuccess]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setStatus("Google sign-in is not configured yet.");
      return undefined;
    }

    let cancelled = false;

    const renderButton = async () => {
      try {
        const google = await loadGoogleScript();
        if (cancelled || !buttonRef.current || !google?.accounts?.id) {
          return;
        }

        const width = Math.min(420, Math.max(220, Math.floor(buttonRef.current.offsetWidth || 360)));
        buttonRef.current.innerHTML = "";

        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (!response?.credential) {
              setStatus("Google sign-in was not completed.");
              return;
            }

            setLoading(true);
            setStatus("");

            try {
              const authResponse = await googleAuthenticate(response.credential);
              await successRef.current?.(authResponse);
            } catch (error) {
              setStatus(error.message || "Google sign-in failed.");
            } finally {
              setLoading(false);
            }
          },
        });

        google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          text: buttonText,
          shape: "pill",
          logo_alignment: "left",
          width,
        });
      } catch (error) {
        if (!cancelled) {
          setStatus(error.message || "Unable to load Google sign-in.");
        }
      }
    };

    renderButton();
    const handleResize = () => renderButton();
    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleResize);
    };
  }, [buttonText]);

  return (
    <div className="auth-provider-stack">
      <div className="auth-divider">
        <span>{dividerLabel}</span>
      </div>
      <div className={`auth-google-shell ${loading ? "loading" : ""}`}>
        <div ref={buttonRef} className="auth-google-button" />
      </div>
      {loading ? <p className="auth-google-status">Signing you in with Google...</p> : null}
      {status ? <p className="auth-google-status error">{status}</p> : null}
    </div>
  );
}
