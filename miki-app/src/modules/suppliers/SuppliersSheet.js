import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    Stack
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useNavigate } from "react-router-dom";

export default function SuppliersSheet({ open, onClose }) {
    const navigate = useNavigate();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            PaperProps={{
                style: {
                    position: "fixed",
                    bottom: 0,
                    margin: 0,
                    width: "100%",
                    borderTopLeftRadius: "16px",
                    borderTopRightRadius: "16px",
                    paddingBottom: "20px"
                }
            }}
        >
            <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>
                Opciones de Proveedores
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<PeopleIcon />}
                        onClick={() => {
                            console.log("Ver proveedores");
                            onClose();
                            navigate("/suppliers"); // 👉 redirige a la lista
                        }}
                        sx={{ borderRadius: "12px", padding: "12px" }}
                    >
                        Ver Proveedores
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddCircleIcon />}
                        onClick={() => {
                            onClose();
                            navigate("/suppliers/add"); // 👉 redirige al formulario
                        }}
                        sx={{ borderRadius: "12px", padding: "12px" }}
                    >
                        Agregar Proveedor
                    </Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
