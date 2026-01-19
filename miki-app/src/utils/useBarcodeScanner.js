import { useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function useBarcodeScanner() {
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scannerInstance, setScannerInstance] = useState(null);
    const [barcode, setBarcode] = useState("");

    const openScanner = () => {
        setScannerOpen(true);

        setTimeout(() => {
            const scanner = new Html5Qrcode("reader");
            setScannerInstance(scanner); // ✅ guardamos la instancia real

            scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: 250 },
                (decodedText) => {
                    setBarcode(decodedText);
                    closeScanner(scanner); // cerramos al leer
                },
                (errorMessage) => {
                    console.warn("Error escaneando:", errorMessage);
                }
            ).catch(err => console.error("Error al iniciar escáner:", err));
        }, 300);
    };

    const closeScanner = (scanner = scannerInstance) => {
        if (scanner) {
            // ✅ aseguramos que sea un objeto Html5Qrcode
            if (typeof scanner.stop === "function") {
                scanner.stop()
                    .then(() => scanner.clear())
                    .catch(err => console.error("Error al detener escáner:", err));
            } else {
                console.error("scanner no es una instancia de Html5Qrcode");
            }
        }
        setScannerInstance(null);
        setScannerOpen(false);
    };

    return {
        barcode,
        setBarcode,
        scannerOpen,
        openScanner,
        closeScanner
    };
}
