import { useEffect, useRef } from "react";

const WIDGET_ID = import.meta.env.VITE_MSG91_WIDGET_ID || "";
const TOKEN_AUTH = import.meta.env.VITE_MSG91_TOKEN_AUTH || "";
const SCRIPT_URLS = [
  "https://verify.msg91.com/otp-provider.js",
  "https://verify.phone91.com/otp-provider.js",
];

const loadOtpScript = () => {
  if (window.initSendOTP) {
    return Promise.resolve();
  }

  if (window.__msg91ScriptPromise) {
    return window.__msg91ScriptPromise;
  }

  window.__msg91ScriptPromise = new Promise((resolve, reject) => {
    let index = 0;

    const attempt = () => {
      const script = document.createElement("script");
      script.src = SCRIPT_URLS[index];
      script.async = true;
      script.onload = () => {
        if (window.initSendOTP) {
          resolve();
          return;
        }

        window.__msg91ScriptPromise = null;
        reject(new Error("MSG91 widget loaded but failed to initialize."));
      };
      script.onerror = () => {
        index += 1;
        if (index < SCRIPT_URLS.length) {
          attempt();
          return;
        }
        window.__msg91ScriptPromise = null;
        reject(new Error("Unable to load MSG91 widget."));
      };
      document.head.appendChild(script);
    };

    attempt();
  });

  return window.__msg91ScriptPromise;
};

const OTPWidget = ({ identifier, onSuccess, onFailure }) => {
  const successRef = useRef(onSuccess);
  const failureRef = useRef(onFailure);

  useEffect(() => {
    successRef.current = onSuccess;
    failureRef.current = onFailure;
  }, [onFailure, onSuccess]);

  useEffect(() => {
    if (!identifier) return;

    if (!WIDGET_ID || !TOKEN_AUTH) {
      failureRef.current?.(
        new Error("MSG91 widget is not configured. Add VITE_MSG91_WIDGET_ID and VITE_MSG91_TOKEN_AUTH.")
      );
      return;
    }

    let isCancelled = false;

    const configuration = {
      widgetId: WIDGET_ID,
      tokenAuth: TOKEN_AUTH,
      identifier,
      exposeMethods: false,
      success: (data) => {
        if (!isCancelled) {
          successRef.current?.(data);
        }
      },
      failure: (error) => {
        if (!isCancelled) {
          failureRef.current?.(error);
        }
      },
    };

    loadOtpScript()
      .then(() => {
        if (!isCancelled && typeof window.initSendOTP === "function") {
          window.initSendOTP(configuration);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          failureRef.current?.(error);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [identifier]);

  return null;
};

export default OTPWidget;
