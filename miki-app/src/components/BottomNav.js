import React, { useState } from "react";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import { useNavigate } from "react-router-dom";   // ✅ importar navigate
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";   // Caja
import LocalShippingIcon from '@mui/icons-material/LocalShipping';             // Proveedores
import SearchIcon from "@mui/icons-material/Search";             // Buscar
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart"; //Agregar productos
import MenuIcon from "@mui/icons-material/Menu";                 // Menú
import SuppliersSheet from "../modules/suppliers/SuppliersSheet";
import CashSheet from "../modules/cash/CashSheet";
import ProductSheet from "../modules/products/ProductSheet";
import MenuSheet from "../modules/menu/MenuSheet";

export default function BottomNav() {
    const [value, setValue] = useState(0);
    const [showSuppliers, setShowSuppliers] = useState(false);
    const [showCash, setShowCash] = useState(false);
    const [showProducts, setShowProducts] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const navigate = useNavigate(); // ✅ hook para navegar

    return (
        <>
            <BottomNavigation
                showLabels
                value={value}
                onChange={(event, newValue) => setValue(newValue)}
                sx={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: "#930fff",
                    borderTopLeftRadius: "16px", // esquina superior izquierda 
                    borderTopRightRadius: "16px", // esquina superior derecha 
                    overflow: "hidden", // 👈 asegura que el contenido respete el borde redondeado

                }}
            >
                <BottomNavigationAction
                    label="Buscar"
                    icon={<SearchIcon />}
                    onClick={() => navigate("/")}
                    sx={{ color: "white" }}  // ✅ redirige a la pantalla principal
                />
                <BottomNavigationAction
                    label="Caja"
                    icon={<PointOfSaleIcon />}
                    onClick={() => setShowCash(true)}
                    sx={{ color: "white" }}
                />
                <BottomNavigationAction
                    label="Proveedores"
                    icon={<LocalShippingIcon />}
                    onClick={() => setShowSuppliers(true)}
                    sx={{ color: "white" }}
                />

                <BottomNavigationAction
                    label="Productos"
                    icon={<AddShoppingCartIcon />}
                    onClick={() => setShowProducts(true)}
                    sx={{ color: "white" }}
                />
                <BottomNavigationAction
                    label="Menú"
                    icon={<MenuIcon />}
                    onClick={() => setShowMenu(true)}
                    sx={{ color: "white" }}
                />
            </BottomNavigation>

            {/* Sheets */}
            <SuppliersSheet open={showSuppliers} onClose={() => setShowSuppliers(false)} />
            <CashSheet open={showCash} onClose={() => setShowCash(false)} />
            <ProductSheet open={showProducts} onClose={() => setShowProducts(false)} />
            <MenuSheet open={showMenu} onClose={() => setShowMenu(false)} />
        </>
    );
}
