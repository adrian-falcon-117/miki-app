// src/Modules/checkout/CheckoutSale.jsx
import React, { useState } from "react";
import {
    TextField,
    Button,
    Typography,
    Stack,
    Paper,
    List,
    ListItem,
    ListItemText
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useCashbox from "../utils/useCashbox";
import useSnackbar from "../utils/useSnackbar";

export default function CheckoutSale({ cart = [], onFinish }) {
    const [cash, setCash] = useState("");
    const [transfer, setTransfer] = useState("");
    const navigate = useNavigate();

    const { addSale, cashboxOpening, isOpen } = useCashbox();
    const { open: snackOpen, message: snackMessage, severity: snackSeverity, showSnackbar, closeSnackbar } = useSnackbar();

    // Calcular total según tipo de producto
    const totalCart = cart.reduce((sum, item) => {
        if (item.unitType === "unit") {
            return sum + (Number(item.quantity) || 0) * (Number(item.priceUsed) || 0);
        } else if (item.unitType === "kg") {
            return sum + (Number(item.quantityKg) || 0) * (Number(item.priceUsedPerKg) || 0);
        }
        return sum;
    }, 0);

    // Helpers numéricos
    const num = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };

    const paid = num(cash) + num(transfer);
    const change = paid - totalCart;

    // onFocus: completar el otro campo con lo que falta, SIN borrar lo que ya escribiste
    const handleFocusTransfer = () => {
        const cashVal = num(cash);
        const remaining = Math.max(0, totalCart - cashVal);
        if (transfer === "" || num(transfer) === 0) {
            setTransfer(String(remaining));
        }
    };

    const handleFocusCash = () => {
        const transferVal = num(transfer);
        const remaining = Math.max(0, totalCart - transferVal);
        if (cash === "" || num(cash) === 0) {
            setCash(String(remaining));
        }
    };

    // Confirmar venta: intenta backend, si falla hace fallback local usando addSale
    const handleConfirm = async () => {
        if (!isOpen || !cashboxOpening) {
            showSnackbar("No hay caja abierta. Abrí la caja antes de registrar la venta.", "warning");
            return;
        }

        let cashPaid = num(cash);
        let transferPaid = num(transfer);

        // Ajustes si la suma excede el total
        if (cashPaid + transferPaid > totalCart) {
            if (cashPaid >= totalCart) {
                cashPaid = totalCart;
                transferPaid = 0;
            } else {
                transferPaid = Math.max(0, totalCart - cashPaid);
            }
        }

        if (cashPaid === 0 && transferPaid === 0) {
            cashPaid = totalCart;
        }

        // Construir objeto de venta (compatible con el resto de la app)
        const salePayload = {
            id: Date.now(), // id temporal si el backend no responde
            description: cart.map(i => i.name).join(", "),
            amount: totalCart,
            cash: cashPaid,
            transfer: transferPaid,
            canceled: false,
            created_at: new Date().toISOString()
        };

        try {
            // Intentamos persistir en backend
            const res = await axios.post("http://localhost:4000/sales", {
                description: salePayload.description,
                amount: salePayload.amount,
                cash: salePayload.cash,
                transfer: salePayload.transfer,
                canceled: 0
            });

            // Si backend responde con la venta creada, la usamos
            const createdSale = res?.data || salePayload;

            // Agregamos la venta a la apertura local (useCashbox)
            addSale({
                id: createdSale.id ?? salePayload.id,
                description: createdSale.description ?? salePayload.description,
                amount: createdSale.amount ?? salePayload.amount,
                cash: createdSale.cash ?? salePayload.cash,
                transfer: createdSale.transfer ?? salePayload.transfer,
                canceled: createdSale.canceled === 1 || createdSale.canceled === "1" ? true : !!createdSale.canceled,
                created_at: createdSale.created_at ?? new Date().toISOString()
            });

            // Notificar a CashSales (evento global)
            window.dispatchEvent(new CustomEvent("sale:created", { detail: createdSale }));

            // Guardar historial local (opcional, mantiene compatibilidad con tu código previo)
            try {
                const history = JSON.parse(localStorage.getItem("salesHistory") || "[]");
                localStorage.setItem("salesHistory", JSON.stringify([...history, createdSale]));
            } catch (e) {
                console.warn("No se pudo guardar salesHistory en localStorage:", e);
            }

            // Limpiar carrito local
            try { localStorage.removeItem("cart"); } catch { }

            showSnackbar("Venta registrada ✅", "success");

            if (typeof onFinish === "function") {
                onFinish({ ...createdSale, change, cart });
            }

            navigate("/");
        } catch (err) {
            // Fallback local si falla el backend
            console.warn("Error registrando venta en backend, usando fallback local:", err);

            addSale(salePayload);

            // Notificar a CashSales
            window.dispatchEvent(new CustomEvent("sale:created", { detail: salePayload }));

            try {
                const history = JSON.parse(localStorage.getItem("salesHistory") || "[]");
                localStorage.setItem("salesHistory", JSON.stringify([...history, salePayload]));
            } catch (e) {
                console.warn("No se pudo guardar salesHistory en localStorage:", e);
            }

            try { localStorage.removeItem("cart"); } catch { }

            showSnackbar("Venta registrada localmente (sin backend) ✅", "warning");

            if (typeof onFinish === "function") {
                onFinish({ ...salePayload, change, cart });
            }

            navigate("/");
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <Typography variant="h5">Pago</Typography>

            <Paper
                elevation={3}
                sx={{ padding: 2, mt: 2, backgroundColor: "#2e7d32", color: "#fff" }}
            >
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Detalle de productos
                </Typography>
                <List>
                    {cart.map((item, idx) => (
                        <ListItem key={idx}>
                            <ListItemText
                                primary={`${item.name} – ${item.description} – ${item.unitType === "unit"
                                    ? `Cantidad: ${item.quantity}`
                                    : `Peso: ${Number(item.quantityKg || 0).toFixed(2)} kg`
                                    }`}
                                secondary={`Subtotal: $${item.unitType === "unit"
                                    ? ((Number(item.quantity) || 0) * (Number(item.priceUsed) || 0)).toFixed(2)
                                    : ((Number(item.quantityKg) || 0) * (Number(item.priceUsedPerKg) || 0)).toFixed(2)
                                    }`}
                            />
                        </ListItem>
                    ))}
                </List>

                <Typography variant="h6" sx={{ fontWeight: "bold", mt: 2 }}>
                    Total a pagar: ${totalCart.toFixed(2)}
                </Typography>
            </Paper>

            <Stack spacing={2} sx={{ mt: 2 }}>
                <TextField
                    label="Pago en efectivo"
                    type="number"
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                    onFocus={handleFocusCash}
                />
                <TextField
                    label="Pago por transferencia"
                    type="number"
                    value={transfer}
                    onChange={(e) => setTransfer(e.target.value)}
                    onFocus={handleFocusTransfer}
                />
            </Stack>

            <Typography
                sx={{
                    color: paid >= totalCart ? "limegreen" : "red",
                    fontWeight: "bold",
                    mt: 1
                }}
            >
                {paid >= totalCart
                    ? `Vuelto: $${change.toFixed(2)}`
                    : `Falta pagar: $${(totalCart - paid).toFixed(2)}`}
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate("/", { state: { cart } })}
                >
                    Seguir comprando
                </Button>

                <Button
                    variant="contained"
                    color="success"
                    onClick={handleConfirm}
                    disabled={paid < totalCart}
                >
                    Confirmar venta
                </Button>
            </Stack>

            {/* Snackbar centralizado */}
            <div>
                {/* El snackbar lo maneja useSnackbar; lo dejo aquí para que se muestre */}
                {/* Si tu useSnackbar ya renderiza el Snackbar globalmente, podés quitar este bloque */}
                {snackOpen && (
                    <Paper
                        elevation={0}
                        sx={{ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 1400 }}
                    >
                        <Typography sx={{ display: "none" }}>{/* placeholder para mantener JSX válido */}</Typography>
                    </Paper>
                )}
            </div>
        </div>
    );
}
