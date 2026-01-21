//useFormattedDateTime
import { useState, useEffect } from "react";

export default function useSaleDateTime() {
    const [dateTime, setDateTime] = useState(() => getSaleDateTime());

    useEffect(() => {
        // Actualiza cada minuto para mantener la hora sincronizada
        const interval = setInterval(() => {
            setDateTime(getSaleDateTime());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return dateTime;
}

// Función utilitaria interna
function getSaleDateTime() {
    const now = new Date();

    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    return { date, time };
}
