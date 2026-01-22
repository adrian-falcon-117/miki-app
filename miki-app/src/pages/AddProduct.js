import React, { useState } from "react";
import {
    TextField,
    Button,
    Stack,
    Typography,
    InputAdornment,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    Alert
} from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import axios from "axios";
import { validateProduct } from "../utils/validators";
import useBarcodeScanner from "../utils/useBarcodeScanner";
import useSnackbar from "../utils/useSnackbar";

export default function AddProduct() {
    const { barcode, setBarcode, scannerOpen, openScanner, closeScanner } = useBarcodeScanner();
    const { open, message, severity, showSnackbar, closeSnackbar } = useSnackbar();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [incrementType, setIncrementType] = useState("percentage");
    const [incrementValue, setIncrementValue] = useState("");

    const handleAdd = () => {
        const productData = {
            barcode,
            name,
            description,
            incrementType,
            incrementValue
        };

        const error = validateProduct(productData);
        if (error) {
            showSnackbar(error, "error");
            return;
        }

        axios.post("http://localhost:4000/products", productData)
            .then(() => {
                showSnackbar("Producto agregado ✅", "success");
                // Reset form
                setBarcode("");
                setName("");
                setDescription("");
                setIncrementType("percentage");
                setIncrementValue("");
            })
            .catch(err => {
                showSnackbar("Error al agregar producto ❌", "error");
                console.error(err);
            });
    };

    return (
        <div style={{ padding: "20px" }}>
            <Typography style={{ paddingBottom: "10px" }} variant="h5">Agregar Producto</Typography>
            <Stack spacing={2}>
                <TextField
                    label="Código de barras"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    fullWidth
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={openScanner}>
                                    <CameraAltIcon />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />

                <TextField
                    label="Nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                />

                <TextField
                    label="Descripción"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                />

                <Stack direction="row" spacing={2}>
                    <TextField
                        label={incrementType === "percentage" ? "Incremento (%)" : "Incremento ($)"}
                        type="number"
                        value={incrementValue}
                        onChange={(e) => setIncrementValue(e.target.value)}
                        fullWidth
                    />
                    <FormControl sx={{ minWidth: 140 }}>
                        <InputLabel>Tipo</InputLabel>
                        <Select
                            value={incrementType}
                            onChange={(e) => setIncrementType(e.target.value)}
                        >
                            <MenuItem value="percentage">Porcentaje</MenuItem>
                            <MenuItem value="peso">Pesos</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>

                <Button variant="contained" color="success" onClick={handleAdd}>
                    Guardar Producto
                </Button>
            </Stack>

            {/* Snackbar reutilizable */}
            <Snackbar open={open}
                autoHideDuration={3000}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert severity={severity} onClose={closeSnackbar}>
                    {message}
                </Alert>
            </Snackbar>

            <Dialog open={scannerOpen} onClose={closeScanner} fullWidth maxWidth="sm">
                <DialogTitle>Escanear código de barras</DialogTitle>
                <DialogContent>
                    <div id="reader" style={{ width: "100%" }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeScanner} color="primary">Cerrar</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
