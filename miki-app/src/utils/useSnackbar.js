import { useState, useCallback } from "react";

export default function useSnackbar() {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [severity, setSeverity] = useState("success");

    // Función para mostrar el snackbar
    const showSnackbar = useCallback((msg, sev = "success") => {
        setMessage(msg);
        setSeverity(sev);
        setOpen(true);
    }, []);

    // Función para cerrar el snackbar
    const closeSnackbar = useCallback(() => {
        setOpen(false);
    }, []);

    return {
        open,
        message,
        severity,
        showSnackbar,
        closeSnackbar
    };
}
