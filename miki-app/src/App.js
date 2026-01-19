import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import BottomNav from "./components/BottomNav";

// Módulos existentes
import CashModule from "./modules/cash/CashModule";
import SuppliersSheet from "./modules/suppliers/SuppliersSheet";
import CashSheet from "./modules/cash/CashSheet";
import CashOpen from "./pages/CashOpen";
import CashSales from "./pages/CashSales";
import CashIncome from "./pages/CashIncome";
import CashExpense from "./pages/CashExpense";
import CashClose from "./pages/CashClose";
import AddSupplier from "./pages/AddSupplier";
import SuppliersList from "./pages/SuppliersList";
import AddProduct from "./pages/AddProduct";
import ProductList from "./pages/ProductList";
import MenuSheet from "./modules/menu/MenuSheet";
import StatisticsScreen from "./pages/StatisticsScreen";
import SalesScreen from "./pages/SalesScreen";
import BuyScreen from "./pages/BuyScreen";

// Nuevas pantallas de flujo de ventas
import SearchScreen from "./pages/SearchScreen";
import CheckoutScreen from "./pages/CheckoutScreen";

function App() {
  const [suppliersOpen, setSuppliersOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Estados para carrito y total
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  const navigate = useNavigate(); // ✅ ahora funciona

  const handleCheckout = (cartItems, totalAmount) => {
    setCart(cartItems);
    setTotal(totalAmount);
    navigate("/checkout"); // ✅ navegar sin recargar
  };

  const handleFinishSale = (paymentData) => {
    console.log("Venta finalizada:", { cart, total, paymentData });
    // Aquí podrías enviar la venta al backend (tabla sales + sale_items)
    setCart([]);
    setTotal(0);
    localStorage.removeItem("cart"); // ✅ limpiar carrito persistente
    navigate("/"); // ✅ volver al inicio sin recargar
  };

  return (
    <div style={{ paddingBottom: "60px" }}>
      <Routes>
        {/* Pantalla principal de búsqueda */}
        <Route path="/" element={<SearchScreen onCheckout={handleCheckout} />} />
        <Route
          path="/checkout"
          element={<CheckoutScreen cart={cart} onFinish={handleFinishSale} />}
        />

        {/* Caja */}
        <Route path="/cash" element={<CashModule />} />
        <Route path="/cash/open" element={<CashOpen />} />
        <Route path="/cash/sales" element={<CashSales />} />
        <Route path="/cash/income" element={<CashIncome />} />
        <Route path="/cash/expense" element={<CashExpense />} />
        <Route path="/cash/close" element={<CashClose />} />

        {/* Proveedores */}
        <Route path="/suppliers/add" element={<AddSupplier />} />
        <Route path="/suppliers" element={<SuppliersList />} />

        {/* Productos */}
        <Route path="/products/add" element={<AddProduct />} />
        <Route path="/products" element={<ProductList />} />

        {/*Menu*/}
        <Route path="/menu/statistics" element={<StatisticsScreen />} />
        <Route path="/menu/sales" element={<SalesScreen />} />
        <Route path="/menu/buy" element={<BuyScreen />} />
      </Routes>

      {/* Sheets */}
      <SuppliersSheet open={suppliersOpen} onClose={() => setSuppliersOpen(false)} />
      <CashSheet open={cashOpen} onClose={() => setCashOpen(false)} />
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Barra inferior */}
      <BottomNav
        onSuppliersClick={() => setSuppliersOpen(true)}
        onCashClick={() => setCashOpen(true)}
        onMenuClick={() => setMenuOpen(true)}
      />
    </div>
  );
}

export default App;
