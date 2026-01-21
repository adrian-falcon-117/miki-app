//useFormattedDateDMY
import { useCallback } from "react";

/**
 * Hook para formatear fechas en formato DD/MM/YYYY
 * @returns {function} formatDateDMY(dateString)
 */
export default function useFormattedDateDMY() {
    const formatDateDMY = useCallback((dateString) => {
        if (!dateString) return "";

        // Si viene en formato YYYY-MM-DD
        if (dateString.includes("-")) {
            const [year, month, day] = dateString.split("-");
            return `${day}/${month}/${year}`;
        }

        // Si viene como objeto Date o string ISO
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }, []);

    return formatDateDMY;
}
