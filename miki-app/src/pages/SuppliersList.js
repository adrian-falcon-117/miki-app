import React, { useEffect, useState } from "react";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, TextField, Snackbar, Alert, Dialog, DialogTitle,
    DialogContent, DialogActions, Button, Box, Stack, Typography, Divider,
    useTheme, useMediaQuery
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { validateSupplier } from "../utils/validators";
import useSnackbar from "../utils/useSnackbar";

export default function SuppliersList() {
    const [suppliers, setSuppliers] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({});
    const { open, message, severity, showSnackbar, closeSnackbar } = useSnackbar();

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = () => {
        axios.get("http://localhost:4000/suppliers")
            .then(res => setSuppliers(res.data || []))
            .catch(err => {
                console.error(err);
                showSnackbar("Error al cargar proveedores", "error");
            });
    };

    const startEdit = (s) => {
        setEditingId(s.id);
        setFormData({
            id: s.id,
            name: s.name ?? "",
            contact: s.contact ?? "",
            address: s.address ?? "",
            notes: s.info ?? ""
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({});
    };

    const saveEdit = () => {
        const supplierData = {
            name: formData.name,
            contact: formData.contact,
            address: formData.address,
            notes: formData.notes
        };

        const error = validateSupplier(supplierData);
        if (error) {
            showSnackbar(error, "error");
            return;
        }

        const payload = {
            name: formData.name.trim(),
            contact: formData.contact.trim(),
            address: formData.address.trim(),
            info: formData.notes.trim()
        };

        axios.put(`http://localhost:4000/suppliers/${editingId}`, payload)
            .then(() => {
                setSuppliers(prev => prev.map(s => s.id === editingId ? { id: editingId, ...payload } : s));
                showSnackbar("Proveedor actualizado con éxito", "success");
                cancelEdit();
            })
            .catch(err => {
                console.error(err);
                showSnackbar("Error al actualizar proveedor", "error");
            });
    };

    const confirmDelete = (id) => {
        setDeleteId(id);
        setConfirmOpen(true);
    };

    const handleDelete = () => {
        axios.delete(`http://localhost:4000/suppliers/${deleteId}`)
            .then(() => {
                setSuppliers(prev => prev.filter(s => s.id !== deleteId));
                showSnackbar("Proveedor eliminado", "success");
            })
            .catch(err => {
                console.error(err);
                showSnackbar("Error al eliminar proveedor", "error");
            })
            .finally(() => {
                setConfirmOpen(false);
                setDeleteId(null);
            });
    };

    return (
        <>
            {/* Desktop / Tablet: Table */}
            {!isMobile && (
                <TableContainer component={Paper} sx={{ marginTop: 2 }}>
                    {suppliers.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: "center" }}>
                            <Typography variant="h6" sx={{ color: "text.secondary" }}>
                                No hay proveedores agregados todavía
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2 }}>
                                <Typography variant="h6">Proveedores</Typography>
                            </Box>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Nombre</TableCell>
                                        <TableCell>Contacto</TableCell>
                                        <TableCell>Dirección</TableCell>
                                        <TableCell>Información</TableCell>
                                        <TableCell align="center">Acciones</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {suppliers.map((s) => (
                                        <TableRow key={s.id}>
                                            <TableCell>
                                                {editingId === s.id ? (
                                                    <TextField
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        variant="standard"
                                                        fullWidth
                                                    />
                                                ) : s.name}
                                            </TableCell>

                                            <TableCell>
                                                {editingId === s.id ? (
                                                    <TextField
                                                        value={formData.contact}
                                                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                                        variant="standard"
                                                        fullWidth
                                                    />
                                                ) : s.contact}
                                            </TableCell>

                                            <TableCell sx={{ maxWidth: 220, wordBreak: "break-word" }}>
                                                {editingId === s.id ? (
                                                    <TextField
                                                        value={formData.address}
                                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                        variant="standard"
                                                        fullWidth
                                                        multiline
                                                        rows={2}
                                                    />
                                                ) : s.address}
                                            </TableCell>

                                            <TableCell sx={{ maxWidth: 260, wordBreak: "break-word" }}>
                                                {editingId === s.id ? (
                                                    <TextField
                                                        value={formData.notes}
                                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                        variant="standard"
                                                        fullWidth
                                                        multiline
                                                        rows={2}
                                                    />
                                                ) : s.info}
                                            </TableCell>

                                            <TableCell align="center">
                                                {editingId === s.id ? (
                                                    <>
                                                        <IconButton color="success" onClick={saveEdit} size="small"><SaveIcon /></IconButton>
                                                        <IconButton color="error" onClick={cancelEdit} size="small"><CancelIcon /></IconButton>
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconButton color="primary" onClick={() => startEdit(s)} size="small"><EditIcon /></IconButton>
                                                        <IconButton color="error" onClick={() => confirmDelete(s.id)} size="small"><DeleteIcon /></IconButton>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </>
                    )}
                </TableContainer>
            )}

            {/* Mobile: Cards / List */}
            {isMobile && (
                <Box sx={{ mt: 2, px: 1 }}>
                    {suppliers.length === 0 ? (
                        <Paper elevation={2} sx={{ p: 3, textAlign: "center" }}>
                            <Typography variant="subtitle1" sx={{ color: "text.secondary" }}>
                                No hay proveedores agregados todavía
                            </Typography>
                        </Paper>
                    ) : (
                        <Stack spacing={2}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1 }}>
                                <Typography variant="h6">Proveedores</Typography>
                            </Box>

                            {suppliers.map((s) => (
                                <Paper key={s.id} elevation={2} sx={{ p: 2, borderLeft: "6px solid #1976d2" }}>
                                    <Stack spacing={1}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                {editingId === s.id ? (
                                                    <TextField
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        fullWidth
                                                        label="Nombre"
                                                    />
                                                ) : (
                                                    <Typography variant="subtitle1" sx={{ fontWeight: "bold", wordBreak: "break-word" }}>{s.name}</Typography>
                                                )}

                                                {editingId === s.id ? (
                                                    <TextField
                                                        value={formData.contact}
                                                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                                        fullWidth
                                                        label="Contacto"
                                                        sx={{ mt: 1 }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>{s.contact}</Typography>
                                                )}
                                            </Box>

                                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                                                {editingId === s.id ? (
                                                    <Box>
                                                        <IconButton color="success" onClick={saveEdit} size="small"><SaveIcon /></IconButton>
                                                        <IconButton color="error" onClick={cancelEdit} size="small"><CancelIcon /></IconButton>
                                                    </Box>
                                                ) : (
                                                    <Box>
                                                        <IconButton color="primary" onClick={() => startEdit(s)} size="small"><EditIcon /></IconButton>
                                                        <IconButton color="error" onClick={() => confirmDelete(s.id)} size="small"><DeleteIcon /></IconButton>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>

                                        <Divider />

                                        <Box>
                                            <Typography variant="caption" sx={{ color: "text.secondary" }}>Dirección</Typography>
                                            {editingId === s.id ? (
                                                <TextField
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    sx={{ mt: 0.5 }}
                                                />
                                            ) : (
                                                <Typography variant="body2" sx={{ mt: 0.5, wordBreak: "break-word" }}>{s.address}</Typography>
                                            )}
                                        </Box>

                                        <Box>
                                            <Typography variant="caption" sx={{ color: "text.secondary" }}>Información</Typography>
                                            {editingId === s.id ? (
                                                <TextField
                                                    value={formData.notes}
                                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    sx={{ mt: 0.5 }}
                                                />
                                            ) : (
                                                <Typography variant="body2" sx={{ mt: 0.5, wordBreak: "break-word" }}>{s.info}</Typography>
                                            )}
                                        </Box>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </Box>
            )}

            <Snackbar
                open={open}
                autoHideDuration={3000}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={severity} onClose={closeSnackbar}>
                    {message}
                </Alert>
            </Snackbar>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>¿Estás seguro de que deseas eliminar este proveedor?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)} color="primary">Cancelar</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
