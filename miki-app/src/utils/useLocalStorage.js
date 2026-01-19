import { useState, useEffect } from "react";

/**
 * Hook reutilizable para sincronizar estado con localStorage
 * @param {string} key - clave en localStorage
 * @param {any} initialValue - valor inicial si no existe en localStorage
 */
export default function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    // cada vez que cambia storedValue, lo guardamos en localStorage
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (err) {
            console.error("Error guardando en localStorage:", err);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
}
