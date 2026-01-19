import React, { useState } from "react";
import { TextField, Button, Stack, Typography, Snackbar, Alert } from "@mui/material";
import axios from "axios";
import { validateSupplier } from "../utils/validators";

export default function AddSupplier() {
    const [name, setName] = useState("");
    const [contact, setContact] = useState("");
    const [address, setAddress] = useState("");
    const [info, setInfo] = useState("");

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const showSnackbar = (msg, severity = "success") => {
        setSnackbarMessage(msg);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleSubmit = () => {
        const supplierData = {
            name,
            contact,
            address,
            notes: info // mapear info a notes para el validador
        };

        const error = validateSupplier(supplierData);
        if (error) {
            showSnackbar(error, "error");
            return;
        }

        axios.post("http://localhost:4000/suppliers", {
            name: name.trim(),
            contact: contact.trim(),
            address: address.trim(),
            info: info.trim()
        })
            .then(() => {
                showSnackbar("Proveedor agregado con éxito", "success");
                setName(""); setContact(""); setAddress(""); setInfo("");
            })
            .catch(err => {
                console.error(err);
                showSnackbar("Error al guardar proveedor", "error");
            });
    };

    return (
        <div style={{ padding: 20 }}>
            <Typography variant="h5" gutterBottom>Agregar Proveedor</Typography>
            <Stack spacing={2}>
                <TextField label="Nombre" value={name} onChange={e => setName(e.target.value)} fullWidth required />
                <TextField label="Contacto (teléfono)" value={contact} onChange={e => setContact(e.target.value)} fullWidth />
                <TextField label="Dirección" value={address} onChange={e => setAddress(e.target.value)} fullWidth multiline rows={2} />
                <TextField label="Otra información" value={info} onChange={e => setInfo(e.target.value)} fullWidth multiline rows={3} />
                <Button variant="contained" color="success" onClick={handleSubmit}>Guardar Proveedor</Button>
            </Stack>

            <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)}>{snackbarMessage}</Alert>
            </Snackbar>
        </div>
    );
}
