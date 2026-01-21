import React, { useState, useEffect, useRef } from "react";
import {
    TextField,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemText,
    Button,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    Paper,
    DialogActions,
    Snackbar,
    Alert,
    Box
} from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useLocation, useNavigate } from "react-router-dom";
import useSnackbar from "../utils/useSnackbar";

export default function SearchScreen({ onCheckout }) {
    const location = useLocation();
    const navigate = useNavigate();

    const { open, message, severity, showSnackbar, closeSnackbar } = useSnackbar();

    // Inicializar carrito: primero lo que venga por location.state, si no lo que haya en localStorage
    const [cart, setCart] = useState(() => {
        try {
            const fromCheckout = location.state?.cart || [];
            const saved = localStorage.getItem("cart");
            const localCart = saved ? JSON.parse(saved) : [];
            return (fromCheckout && fromCheckout.length > 0) ? fromCheckout : localCart;
        } catch (e) {
            console.error("Error parsing saved cart:", e);
            return [];
        }
    });

    // Búsqueda y selección
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Cantidades y precios
    const [quantity, setQuantity] = useState(""); // entero o ""
    const [weightInput, setWeightInput] = useState(""); // kg como string
    const [weightKg, setWeightKg] = useState(null); // kg como number
    const [totalPriceInput, setTotalPriceInput] = useState(""); // precio total como string
    const [lastEdited, setLastEdited] = useState(null); // "weight" | "total" | null

    // Scanner
    const [scannerOpen, setScannerOpen] = useState(false);
    const scannerRef = useRef(null);

    // Refs
    const weightRef = useRef(null);
    const quantityRef = useRef(null);
    const searchRef = useRef(null);

    // Estado para saber si la caja está abierta
    const [isCashboxOpen, setIsCashboxOpen] = useState(false);
    const LS_KEY = "cashbox_opening";

    // Leer estado de caja al montar y cuando cambie localStorage (otras pestañas)
    useEffect(() => {
        const read = () => {
            try {
                const raw = localStorage.getItem(LS_KEY);
                if (raw) {
                    const cb = JSON.parse(raw);
                    setIsCashboxOpen(!cb.closed_at);
                } else {
                    setIsCashboxOpen(false);
                }
            } catch (e) {
                console.error("Error leyendo cashbox_opening:", e);
                setIsCashboxOpen(false);
            }
        };

        read();

        const onStorage = (e) => {
            if (e.key === LS_KEY) read();
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // Si la caja está cerrada, limpiamos búsqueda/selección para evitar confusión
    useEffect(() => {
        if (!isCashboxOpen) {
            setQuery("");
            setSuggestions([]);
            setSelectedProduct(null);
            setScannerOpen(false);
            try {
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(() => { });
                    scannerRef.current = null;
                }
            } catch (e) { /* ignore */ }
        }
    }, [isCashboxOpen]);

    useEffect(() => {
        if (!query) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            try {
                const res = await axios.get(
                    `http://localhost:4000/products/search?q=${encodeURIComponent(query)}`
                );
                setSuggestions(res.data);
            } catch (err) {
                console.error("Error buscando productos:", err);
            }
        };

        fetchSuggestions();
    }, [query]);


    const closeScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(() => { });
            scannerRef.current = null;
        }
        setScannerOpen(false);
    };

    // Mantener localStorage sincronizado con cart
    useEffect(() => {
        try {
            localStorage.setItem("cart", JSON.stringify(cart));
        } catch (e) {
            console.error("Error saving cart to localStorage:", e);
        }
    }, [cart]);

    // Foco inicial en el input de búsqueda (si la caja está abierta)
    useEffect(() => {
        if (isCashboxOpen && searchRef.current) searchRef.current.focus();
    }, [isCashboxOpen]);

    // Buscar sugerencias (endpoint de búsqueda) — solo si la caja está abierta
    useEffect(() => {
        let cancelled = false;
        if (!isCashboxOpen) {
            setSuggestions([]);
            return () => { cancelled = true; };
        }

        if (query.length > 1) {
            axios.get(`http://localhost:4000/products`, { params: { search: query } })
                .then(res => {
                    if (!cancelled) {
                        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                        setSuggestions(data);
                    }
                })
                .catch(err => {
                    console.error(err);
                    if (!cancelled) setSuggestions([]);
                });
        } else {
            setSuggestions([]);
        }
        return () => { cancelled = true; };
    }, [query, isCashboxOpen]);

    const formatMoney = (n) => {
        if (n === null || isNaN(n)) return "";
        return Number(n).toFixed(2);
    };

    const handleSelectProduct = (product) => {
        if (!isCashboxOpen) {
            showSnackbar("Abra la caja primero para seleccionar productos", "error");
            navigate("/cash/open");
            return;
        }
        setSelectedProduct(product);
        setQuantity("");
        setWeightInput("");
        setWeightKg(null);
        setTotalPriceInput("");
        setLastEdited(null);
        setQuery("");
        setSuggestions([]);
    };

    useEffect(() => {
        if (!selectedProduct) return;
        if (selectedProduct.unitType === "kg") {
            if (weightRef.current) weightRef.current.focus();
        } else {
            if (quantityRef.current) quantityRef.current.focus();
        }
    }, [selectedProduct]);

    // ---------- Lógica para productos por unidad ----------
    const onQuantityChange = (raw) => {
        if (raw === "") {
            setQuantity("");
            return;
        }
        const parsed = parseInt(raw, 10);
        const qty = Number.isNaN(parsed) ? "" : parsed;

        // Validar stock
        if (selectedProduct && qty > selectedProduct.stock) {
            showSnackbar("Producto insuficiente en stock", "error");
            setQuantity(selectedProduct.stock); // opcional: fijar al máximo disponible
        } else {
            setQuantity(qty);
        }
    };

    // ---------- Lógica para productos por kilo ----------
    const onWeightChange = (raw) => {
        setLastEdited("weight");
        setWeightInput(raw);
        const parsed = raw === "" ? null : parseFloat(raw);
        const kg = parsed === null || isNaN(parsed) ? null : parsed;
        setWeightKg(kg);

        // Validar stock
        if (selectedProduct && kg !== null && kg > selectedProduct.stock) {
            showSnackbar("Producto insuficiente en stock", "error");
            setWeightKg(selectedProduct.stock); // opcional: fijar al máximo disponible
            setWeightInput(String(selectedProduct.stock));
        }

        const basePricePerKg = parseFloat(selectedProduct?.salePrice) || 0;
        if (kg !== null && !isNaN(kg)) {
            const total = kg * basePricePerKg;
            setTotalPriceInput(formatMoney(total));
        } else {
            setTotalPriceInput("");
        }
    };


    const onTotalPriceChange = (raw) => {
        setLastEdited("total");
        setTotalPriceInput(raw);
        const parsedTotal = raw === "" ? null : parseFloat(raw);
        const basePricePerKg = parseFloat(selectedProduct?.salePrice) || 0;

        if (parsedTotal !== null && !isNaN(parsedTotal) && basePricePerKg > 0) {
            const kg = parsedTotal / basePricePerKg;
            setWeightKg(kg);
            setWeightInput(kg.toFixed(3).replace(/\.?0+$/, ""));
        } else {
            setWeightKg(null);
            setWeightInput("");
        }
    };

    // ---------- Agregar al carrito (maneja ambos tipos) ----------
    const handleAddToCart = () => {
        if (!selectedProduct) return;

        // Si la caja está cerrada, impedir agregar y redirigir a apertura
        if (!isCashboxOpen) {
            showSnackbar("Abra la caja primero para poder agregar productos", "error");
            navigate("/cash/open");
            return;
        }

        if (selectedProduct.unitType === "unit") {
            const qty = parseInt(quantity, 10) || 0;
            if (qty <= 0) return;

            const priceUsed = Number(selectedProduct.salePrice) || 0;
            const existingIndex = cart.findIndex(item =>
                item.id === selectedProduct.id &&
                item.unitType === "unit" &&
                Number(item.priceUsed) === priceUsed
            );

            if (existingIndex >= 0) {
                const updated = [...cart];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: (Number(updated[existingIndex].quantity) || 0) + qty
                };
                setCart(updated);
            } else {
                setCart(prev => [...prev, {
                    id: selectedProduct.id,
                    name: selectedProduct.name,
                    description: selectedProduct.description,
                    unitType: "unit",
                    quantity: qty,
                    priceUsed: priceUsed,
                    originalPrice: priceUsed,
                    note: ""
                }]);
            }

        } else if (selectedProduct.unitType === "kg") {
            const kg = weightKg !== null && !isNaN(weightKg) ? weightKg : 0;
            if (kg <= 0) return;

            const parsedTotal = totalPriceInput !== "" ? parseFloat(totalPriceInput) : null;
            const basePricePerKg = parseFloat(selectedProduct.salePrice) || 0;

            let priceUsedPerKg;
            if (parsedTotal !== null && !isNaN(parsedTotal) && kg > 0) {
                priceUsedPerKg = parsedTotal / kg;
            } else {
                priceUsedPerKg = basePricePerKg;
            }

            const note = priceUsedPerKg !== basePricePerKg
                ? `Precio ajustado por kilo: $${basePricePerKg.toFixed(2)} → $${priceUsedPerKg.toFixed(2)}`
                : "";

            const existingIndex = cart.findIndex(item =>
                item.id === selectedProduct.id &&
                item.unitType === "kg" &&
                Number(item.priceUsedPerKg) === Number(priceUsedPerKg)
            );

            if (existingIndex >= 0) {
                const updated = [...cart];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantityKg: (Number(updated[existingIndex].quantityKg) || 0) + kg
                };
                setCart(updated);
            } else {
                setCart(prev => [...prev, {
                    id: selectedProduct.id,
                    name: selectedProduct.name,
                    description: selectedProduct.description,
                    unitType: "kg",
                    quantityKg: kg,
                    priceUsedPerKg: priceUsedPerKg,
                    originalPricePerKg: basePricePerKg,
                    note
                }]);
            }
        }

        // reset selección y foco
        setSelectedProduct(null);
        setQuantity("");
        setWeightInput("");
        setWeightKg(null);
        setTotalPriceInput("");
        setLastEdited(null);
        setQuery("");
        if (searchRef.current) searchRef.current.focus();
    };

    // Eliminar item del carrito (inmutable y actualiza localStorage inmediatamente)
    const handleRemoveFromCart = (index) => {
        setCart(prev => {
            const next = prev.filter((_, i) => i !== index);
            try { localStorage.setItem("cart", JSON.stringify(next)); } catch (e) { console.error(e); }
            return next;
        });
    };

    const playBeep = () => {
        try {
            const audio = new Audio("/sounds/beep.mp3");
            audio.play().catch(() => { /* ignore play errors */ });
        } catch (e) {
            console.error("Beep error:", e);
        }
    };

    const fetchProductByBarcode = async (barcode) => {
        if (!barcode) return null;
        try {
            const res = await axios.get("http://localhost:4000/products", { params: { barcode, search: barcode } });
            const raw = res.data;
            const list = Array.isArray(raw) ? raw : (raw?.data || []);
            const exact = list.find(p => String(p.barcode) === String(barcode));
            return exact || null;
        } catch (err) {
            console.error("Error buscando por barcode:", err);
            showSnackbar("Error al buscar producto por código", "error");
            return null;
        }
    };

    const startScanner = () => {
        // Si la caja está cerrada, impedir escaneo y redirigir a apertura
        if (!isCashboxOpen) {
            showSnackbar("Abra la caja primero para usar el escáner", "error");
            navigate("/cash/open");
            return;
        }

        setScannerOpen(true);
        setTimeout(() => {
            try {
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(() => { });
                    scannerRef.current = null;
                }
                const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
                scanner.render(
                    async (decodedText) => {
                        playBeep();
                        const product = await fetchProductByBarcode(decodedText);

                        if (product) {
                            handleSelectProduct(product);
                            if (product.unitType === "unit") {
                                setQuantity(1);
                            } else {
                                setWeightInput("");
                                setWeightKg(null);
                                setTotalPriceInput("");
                            }
                        } else {
                            setQuery(decodedText);
                            showSnackbar("Producto no encontrado", "warning");
                        }

                        try { scanner.clear().catch(() => { }); } catch (e) { /* ignore */ }
                        scannerRef.current = null;
                        setScannerOpen(false);

                        if (searchRef.current) searchRef.current.focus();
                    },
                    (error) => { /* ignore frame errors */ }
                );
                scannerRef.current = scanner;
            } catch (err) {
                console.error("Error iniciando escáner:", err);
                showSnackbar("No se pudo iniciar el escáner", "error");
                setScannerOpen(false);
            }
        }, 300);
    };

    // Total del carrito
    const totalCart = cart.reduce((sum, item) => {
        if (item.unitType === "unit") {
            return sum + (Number(item.quantity) || 0) * (Number(item.priceUsed) || 0);
        }
        return sum + (Number(item.quantityKg) || 0) * (Number(item.priceUsedPerKg) || 0);
    }, 0);

    // Checkout
    const handleCheckout = () => {
        if (!isCashboxOpen) {
            showSnackbar("Abra la caja primero ❌", "error");
            navigate("/cash/open");
            return;
        }

        if (typeof onCheckout === "function") {
            onCheckout(cart, totalCart);
        } else {
            navigate("/checkout", { state: { cart, totalCart } });
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <Typography style={{ paddingBottom: 10 }} variant="h5">Buscar producto</Typography>

            <TextField
                label="Nombre o código de barras"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                fullWidth
                inputRef={searchRef}
                disabled={!isCashboxOpen}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={startScanner} disabled={!isCashboxOpen}>
                                <CameraAltIcon />
                            </IconButton>
                        </InputAdornment>
                    )
                }}
            />
            <Paper
                elevation={2}
                sx={{
                    maxHeight: 200, // altura aprox. para 3 ítems (ajustá según tu diseño)
                    overflowY: "auto"
                }}
            >
                <List>
                    {suggestions.length === 0 && query && (
                        <ListItem>
                            <ListItemText
                                primary="No se encontraron productos"
                                secondary="Verifica el nombre o código de barras"
                            />
                        </ListItem>
                    )}

                    {suggestions.map((p) => (
                        <ListItem
                            button
                            key={p.id}
                            onClick={() => handleSelectProduct(p)}
                            disabled={!isCashboxOpen}
                        >
                            <ListItemText
                                primary={p.name}
                                secondary={`${p.description} — $${(Number(p.salePrice) || 0).toFixed(2)} ${p.unitType === "kg" ? "/kg" : "/u"
                                    }`}
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>


            {
                selectedProduct && (
                    <div style={{ marginTop: 20 }}>
                        <Typography>
                            {selectedProduct.name} — {selectedProduct.description} — Precio base: ${(Number(selectedProduct.salePrice) || 0).toFixed(2)} {selectedProduct.unitType === "kg" ? "/kg" : "/u"}
                        </Typography>

                        {selectedProduct.unitType === "unit" ? (
                            <div style={{ marginTop: 12 }}>
                                <TextField
                                    label="Cantidad"
                                    type="number"
                                    inputProps={{ step: "1", min: "0" }}
                                    value={quantity}
                                    onChange={(e) => onQuantityChange(e.target.value)}
                                    inputRef={quantityRef}
                                    size="small"
                                    style={{ marginRight: 12 }}
                                    disabled={!isCashboxOpen}
                                />
                                {quantity > 0 ? (
                                    <Typography sx={{ fontWeight: "bold", marginTop: 1 }}>
                                        Subtotal: ${(Number(quantity) * (Number(selectedProduct.salePrice) || 0)).toFixed(2)}
                                    </Typography>
                                ) : null}
                            </div>
                        ) : (
                            <div style={{ marginTop: 12 }}>
                                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                    <TextField
                                        label="Peso (kg)"
                                        type="number"
                                        inputProps={{ step: "0.001", min: "0" }}
                                        value={weightInput}
                                        onChange={(e) => onWeightChange(e.target.value)}
                                        inputRef={weightRef}
                                        size="small"
                                        style={{ marginRight: 8 }}
                                        disabled={!isCashboxOpen}
                                    />

                                    <TextField
                                        label="Precio total"
                                        type="number"
                                        inputProps={{ step: "0.01", min: "0" }}
                                        value={totalPriceInput}
                                        onChange={(e) => onTotalPriceChange(e.target.value)}
                                        size="small"
                                        disabled={!isCashboxOpen}
                                    />
                                </div>

                                <div>
                                    {weightKg !== null && !isNaN(weightKg) ? (
                                        <Typography sx={{ fontWeight: "bold", marginTop: 1 }}>
                                            Subtotal: ${(weightKg * (Number(selectedProduct.salePrice) || 0)).toFixed(2)}
                                        </Typography>
                                    ) : null}
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: 10 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleAddToCart}
                                sx={{ marginRight: 1 }}
                                disabled={
                                    !isCashboxOpen || (
                                        selectedProduct.unitType === "unit"
                                            ? !(quantity && Number(quantity) > 0)
                                            : !(weightKg && weightKg > 0)
                                    )
                                }
                            >
                                Agregar
                            </Button>
                            <Button variant="outlined" color="error" onClick={() => {
                                setSelectedProduct(null);
                                setQuantity("");
                                setWeightInput("");
                                setWeightKg(null);
                                setTotalPriceInput("");
                                setLastEdited(null);
                                if (searchRef.current) searchRef.current.focus();
                            }}>
                                Cancelar
                            </Button>
                            {!isCashboxOpen && (
                                <Typography variant="caption" sx={{ color: "error.main", display: "block", marginTop: 1 }}>
                                    Abra la caja primero para poder agregar productos
                                </Typography>
                            )}
                        </div>
                    </div>
                )
            }

            <Paper elevation={4} sx={{ marginTop: 3, padding: 2, backgroundColor: "#2e7d32", color: "#fff" }}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>Carrito</Typography>
                <List>
                    {cart.map((item, idx) => (
                        <ListItem
                            key={`${item.id}-${idx}`}
                            secondaryAction={
                                <IconButton
                                    edge="end"
                                    color="error"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFromCart(idx);
                                    }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            }
                        >
                            <ListItemText
                                primary={`${item.name} — ${item.description}`}
                                secondary={
                                    item.unitType === "unit"
                                        ? `${item.quantity} u × $${(Number(item.priceUsed) || 0).toFixed(2)} = $${((Number(item.quantity) || 0) * (Number(item.priceUsed) || 0)).toFixed(2)}`
                                        : `${(Number(item.quantityKg) || 0).toFixed(3)} kg × $${(Number(item.priceUsedPerKg) || 0).toFixed(2)} = $${(((Number(item.quantityKg) || 0) * (Number(item.priceUsedPerKg) || 0))).toFixed(2)}`
                                }
                            />
                            {item.note ? <div style={{ color: "#ffeb3b", marginLeft: 12 }}>{item.note}</div> : null}
                        </ListItem>
                    ))}
                </List>

                <Typography variant="h6" sx={{ fontWeight: "bold", marginTop: 2 }}>
                    Total del carrito: ${totalCart.toFixed(2)}
                </Typography>

                {cart.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                        <Button
                            variant="contained"
                            onClick={handleCheckout}
                            sx={{ marginTop: 2, width: "100%" }}
                            disabled={!isCashboxOpen}
                        >
                            Vender
                        </Button>
                        {!isCashboxOpen && (
                            <Typography
                                variant="caption"
                                sx={{ color: "error.main", mt: 1, display: "block", textAlign: "center" }}
                            >
                                Abra la caja primero para poder vender
                            </Typography>
                        )}
                    </div>
                )}
            </Paper>

            {/* Mensaje fijo al final si la caja está cerrada con botón para abrir caja */}
            {
                !isCashboxOpen && (
                    <Box sx={{ mt: 2 }}>
                        <Paper elevation={3} sx={{ p: 2, backgroundColor: "#ffebee" }}>
                            <Typography sx={{ color: "error.main", fontWeight: "bold", textAlign: "center", mb: 1 }}>
                                Abra la caja primero para poder vender
                            </Typography>
                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => navigate("/cash/open")}
                                >
                                    Abrir caja
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                )
            }

            <Dialog open={scannerOpen} onClose={closeScanner} fullWidth maxWidth="sm">
                <DialogTitle>Escanear código de barras</DialogTitle>
                <DialogContent>
                    <div id="reader" style={{ width: "100%" }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeScanner} color="primary">Cerrar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={open}
                autoHideDuration={3000}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert severity={severity} onClose={closeSnackbar}>
                    {message}
                </Alert>
            </Snackbar>
        </div >
    );
}

//Mejorar las busquedad para que sea mas precisa