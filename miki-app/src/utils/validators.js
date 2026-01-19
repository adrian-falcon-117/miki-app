// src/utils/validators.js

// --- Productos ---
export const validateProduct = (data) => {
    if (!data.barcode || data.barcode.length < 5) {
        return "El código de barras debe tener al menos 5 caracteres";
    }
    if (!data.name || data.name.trim() === "") {
        return "El nombre del producto es obligatorio";
    }
    /*if (!data.purchasePrice || parseFloat(data.purchasePrice) <= 0) {
        return "El precio de compra debe ser mayor a 0";
    }*/
    if (data.incrementValue === "" || parseFloat(data.incrementValue) < 0) {
        return "El incremento no puede ser negativo";
    }
    /*if (data.stock === "" || parseInt(data.stock, 10) < 0 || !Number.isInteger(Number(data.stock))) {
        return "El stock debe ser un número entero mayor o igual a 0";
    }*/
    if ((data.description || "").length > 500) {
        return "La descripción no puede superar 500 caracteres";
    }
    return null;
};

// --- Proveedores ---
export const validateEmail = (value) => {
    if (!value) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const validatePhone = (value) => {
    if (!value) return true;
    const digits = value.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 20;
};

export const validateTaxId = (value) => {
    if (!value) return true;
    return /^[\d-]{8,15}$/.test(value);
};

export const validateSupplier = (data) => {
    if (!data.name || data.name.trim() === "") {
        return "El nombre del proveedor es obligatorio";
    }
    if (!validatePhone(data.contact)) {
        return "Teléfono inválido (7-20 dígitos)";
    }
    if (!validateEmail(data.email)) {
        return "Email inválido";
    }
    if (!validateTaxId(data.taxId)) {
        return "CUIT/CUIL inválido";
    }
    if ((data.address || "").length > 200) {
        return "La dirección no puede superar 200 caracteres";
    }
    if ((data.notes || "").length > 500) {
        return "Las notas no pueden superar 500 caracteres";
    }
    return null;
};
