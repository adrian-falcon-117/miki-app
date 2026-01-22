const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a la base de datos SQLite
const db = new sqlite3.Database("./miki.db");

// Crear tabla suppliers si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT,
    address TEXT,
    info TEXT
  )
`);

// --- Rutas de proveedores ---
app.get("/suppliers", (req, res) => {
    db.all("SELECT * FROM suppliers", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post("/suppliers", (req, res) => {
    const { name, contact, address, info } = req.body;
    db.run(
        "INSERT INTO suppliers (name, contact, address, info) VALUES (?, ?, ?, ?)",
        [name, contact, address, info],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, name, contact, address, info });
        }
    );
});

app.put("/suppliers/:id", (req, res) => {
    const { id } = req.params;
    const { name, contact, address, info } = req.body;

    db.run(
        "UPDATE suppliers SET name = ?, contact = ?, address = ?, info = ? WHERE id = ?",
        [name, contact, address, info, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: this.changes });
        }
    );
});

app.delete("/suppliers/:id", (req, res) => {
    const { id } = req.params;

    db.run("DELETE FROM suppliers WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

//------------------------------------------------------------------------
// Crear tabla sales (ventas)
db.run(`
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    cash REAL DEFAULT 0,
    transfer REAL DEFAULT 0,
    canceled INTEGER DEFAULT 0,
    sale_date DATE DEFAULT (date('now')),
    sale_time TIME DEFAULT (time('now'))
  )
`);

// Registrar nueva venta
app.post("/sales", (req, res) => {
    const { description, amount, cash, transfer, canceled, sale_date, sale_time } = req.body;
    db.run(
        "INSERT INTO sales (description, amount, cash, transfer, canceled, sale_date, sale_time) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [description, amount, cash || 0, transfer || 0, canceled ? 1 : 0, sale_date, sale_time],
        function (err) {
            if (err) return res.status(500).json({ error: "Error al registrar venta" });
            db.get("SELECT * FROM sales WHERE id = ?", [this.lastID], (getErr, row) => {
                if (getErr) return res.status(500).json({ error: "Error al leer venta creada" });
                res.json(row);
            });
        }
    );
});

// Obtener todas las ventas
app.get("/sales", (req, res) => {
    db.all("SELECT * FROM sales ORDER BY sale_date DESC", [], (err, rows) => {
        if (err) {
            console.error("Error al obtener ventas:", err);
            return res.status(500).json({ error: "Error al obtener ventas" });
        }
        res.json(rows);
    });
});

// Cancelar venta
app.put("/sales/:id/cancel", (req, res) => {
    const { id } = req.params;
    db.run("UPDATE sales SET canceled = 1 WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: "Error al cancelar venta" });
        db.get("SELECT * FROM sales WHERE id = ?", [id], (getErr, row) => {
            if (getErr) return res.status(500).json({ error: "Error al leer venta cancelada" });
            res.json(row);
        });
    });
});

// Reactivar venta
app.put("/sales/:id/reactivate", (req, res) => {
    const { id } = req.params;
    db.run("UPDATE sales SET canceled = 0 WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: "Error al reactivar venta" });
        db.get("SELECT * FROM sales WHERE id = ?", [id], (getErr, row) => {
            if (getErr) return res.status(500).json({ error: "Error al leer venta reactivada" });
            res.json(row);
        });
    });
});

// Ventas detalladas por mes y año
app.get("/reports/sales-by-month", (req, res) => {
    const { month, year } = req.query;

    if (!month || !year) {
        return res.status(400).json({ error: "Debes enviar mes y año" });
    }

    const sql = `
        SELECT * 
        FROM sales
        WHERE canceled = 0
          AND strftime('%Y', sale_date) = ?
          AND strftime('%m', sale_date) = ?
        ORDER BY sale_date DESC, sale_time DESC;
    `;

    db.all(sql, [year, month.padStart(2, "0")], (err, rows) => {
        if (err) {
            console.error("Error al obtener ventas:", err);
            return res.status(500).json({ error: err.message });
        }

        const total = rows.reduce((acc, r) => acc + (r.amount || 0), 0);
        res.json({ rows, total });
    });
});
//Ventas por item------------------------------------------------------

//-------------------------------------------------------------------------
// Crear tabla de productos con todos los campos
db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT,
    name TEXT,
    purchasePrice REAL,
    incrementType TEXT,
    incrementValue REAL,
    salePrice REAL,
    stock REAL,          -- ✅ puede ser decimal si manejas stock en kilos
    description TEXT,
    unitType TEXT        -- ✅ nuevo campo: 'unit' o 'kg'
  )
`);

// --- Listar productos ---
app.get("/products", (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- Buscar producto exacto o coincidencias parciales ordenadas ---
app.get("/products/search", (req, res) => {
    const q = req.query.q || "";
    if (!q) return res.json([]);

    const like = `%${q}%`;
    const startsWith = `${q}%`;

    // Primero coincidencia exacta
    db.all(
        `SELECT * FROM products 
     WHERE LOWER(name) = LOWER(?) OR LOWER(barcode) = LOWER(?)`,
        [q, q],
        (err, exactRows) => {
            if (err) return res.status(500).json({ error: err.message });

            if (exactRows.length > 0) {
                return res.json(exactRows);
            }

            // Si no hay exacta, buscamos coincidencias parciales ordenadas
            db.all(
                `SELECT * FROM products 
         WHERE LOWER(name) LIKE LOWER(?) OR LOWER(barcode) LIKE LOWER(?) 
         ORDER BY 
           CASE 
             WHEN LOWER(name) LIKE LOWER(?) OR LOWER(barcode) LIKE LOWER(?) THEN 0
             ELSE 1
           END`,
                [like, like, startsWith, startsWith],
                (err2, rows) => {
                    if (err2) return res.status(500).json({ error: err2.message });
                    res.json(rows);
                }
            );
        }
    );
});



// --- Agregar producto ---
app.post("/products", (req, res) => {
    const {
        barcode,
        name,
        purchasePrice,
        incrementType,
        incrementValue,
        salePrice,
        stock,
        description,
        unitType        // ✅ recibimos el nuevo campo
    } = req.body;

    db.run(
        `INSERT INTO products 
        (barcode, name, purchasePrice, incrementType, incrementValue, salePrice, stock, description, unitType) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [barcode, name, purchasePrice, incrementType, incrementValue, salePrice, stock, description, unitType],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
                id: this.lastID,
                barcode,
                name,
                purchasePrice,
                incrementType,
                incrementValue,
                salePrice,
                stock,
                description,
                unitType   // ✅ devolvemos el campo en la respuesta
            });
        }
    );
});

// --- Actualizar producto ---
app.put("/products/:id", (req, res) => {
    const { id } = req.params;
    const {
        barcode,
        name,
        purchasePrice,
        incrementType,
        incrementValue,
        salePrice,
        stock,
        description
    } = req.body;

    db.run(
        `UPDATE products 
      SET barcode = ?, name = ?, purchasePrice = ?, incrementType = ?, incrementValue = ?, 
          salePrice = ?, stock = ?, description = ? 
      WHERE id = ?`,
        [barcode, name, purchasePrice, incrementType, incrementValue, salePrice, stock, description, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: this.changes });
        }
    );
});

// --- Eliminar producto ---
app.delete("/products/:id", (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM products WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});


// --- Descontar stock de un producto ---
app.put("/products/:id/decrement", (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body; // cantidad a descontar (puede ser unidades o kg)

    if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: "Cantidad inválida" });
    }

    // Restamos directamente del campo stock
    db.run(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        [quantity, id],
        function (err) {
            if (err) return res.status(500).json({ error: "Error al descontar stock" });
            if (this.changes === 0) return res.status(404).json({ error: "Producto no encontrado" });

            // Devolvemos el producto actualizado
            db.get("SELECT * FROM products WHERE id = ?", [id], (err2, row) => {
                if (err2) return res.status(500).json({ error: "Error al leer producto actualizado" });
                res.json(row);
            });
        }
    );
});



// Estadisticas-------------------------------------------------------------------------
// Ventas por mes del año seleccionado
app.get("/reports/sales", (req, res) => {
    const { year } = req.query;
    if (!year) return res.status(400).json({ error: "Falta el año" });

    const sql = `
        SELECT strftime('%m', sale_date) AS month,
               SUM(amount) AS total_sales
        FROM sales
        WHERE canceled = 0
          AND strftime('%Y', sale_date) = ?
        GROUP BY month
        ORDER BY month ASC;
    `;

    db.all(sql, [year], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const result = Array.from({ length: 12 }, (_, i) => {
            const month = String(i + 1).padStart(2, "0");
            const row = rows.find(r => r.month === month);
            return { month, total_sales: row ? row.total_sales : 0 };
        });

        res.json(result);
    });
});

// Compras por mes del año seleccionado
app.get("/reports/purchases", (req, res) => {
    const { year } = req.query;
    if (!year) return res.status(400).json({ error: "Falta el año" });

    const sql = `
        SELECT strftime('%m', buy_date) AS month,
               SUM(total) AS total_purchases
        FROM purchases
        WHERE strftime('%Y', buy_date) = ?
        GROUP BY month
        ORDER BY month ASC;
    `;

    db.all(sql, [year], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const result = Array.from({ length: 12 }, (_, i) => {
            const month = String(i + 1).padStart(2, "0");
            const row = rows.find(r => r.month === month);
            return { month, total_purchases: row ? row.total_purchases : 0 };
        });

        res.json(result);
    });
});

// Resumen de margen del año seleccionado
app.get("/reports/margin-summary", (req, res) => {
    const { year } = req.query;
    if (!year) return res.status(400).json({ error: "Falta el año" });

    const salesSql = `
        SELECT SUM(amount) AS total_sales
        FROM sales
        WHERE canceled = 0
          AND strftime('%Y', sale_date) = ?;
    `;

    const purchasesSql = `
        SELECT SUM(total) AS total_purchases
        FROM purchases
        WHERE strftime('%Y', buy_date) = ?;
    `;

    db.get(salesSql, [year], (err, salesRow) => {
        if (err) return res.status(500).json({ error: err.message });

        db.get(purchasesSql, [year], (err2, purchasesRow) => {
            if (err2) return res.status(500).json({ error: err2.message });

            const total_sales = salesRow?.total_sales || 0;
            const total_purchases = purchasesRow?.total_purchases || 0;
            const gross_margin = total_sales - total_purchases;

            res.json({ total_sales, total_purchases, gross_margin });
        });
    });
});

// Productos más vendidos por año
app.get("/reports/top-products", (req, res) => {
    const { year, limit = 10 } = req.query;
    if (!year) return res.status(400).json({ error: "Falta el año" });

    const sql = `
        SELECT description AS name,
               COUNT(*) AS times_sold,
               SUM(amount) AS revenue
        FROM sales
        WHERE canceled = 0
          AND strftime('%Y', sale_date) = ?
        GROUP BY description
        ORDER BY times_sold DESC
        LIMIT ?;
    `;

    db.all(sql, [year, limit], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Métodos de pago por año
app.get("/reports/payment-methods", (req, res) => {
    const { year } = req.query;
    if (!year) return res.status(400).json({ error: "Falta el año" });

    const sql = `
        SELECT SUM(cash) AS total_cash,
               SUM(transfer) AS total_transfer
        FROM sales
        WHERE canceled = 0
          AND strftime('%Y', sale_date) = ?;
    `;

    db.get(sql, [year], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
            total_cash: row?.total_cash || 0,
            total_transfer: row?.total_transfer || 0
        });
    });
});


// Compras----------------------------------------------------------------------------
// --- Asegurar columna unitType en purchases (si la tabla ya existe sin la columna)
db.get("PRAGMA table_info(purchases)", (err, info) => {
    // Si la tabla no existe, la creación más abajo la manejará; aquí solo comprobamos columnas
    db.all("PRAGMA table_info(purchases)", (err2, cols) => {
        if (!err2) {
            const hasUnitType = cols && cols.some(c => c.name === "unitType");
            if (!hasUnitType) {
                // Agregar columna unitType (si la tabla existe sin esa columna)
                db.run("ALTER TABLE purchases ADD COLUMN unitType TEXT DEFAULT 'unit'", (alterErr) => {
                    if (alterErr) console.warn("No se pudo agregar columna unitType:", alterErr.message);
                });
            }
        }
    });
});
//TODO Aqui
// --- Crear tabla purchases si no existe (asegura esquema inicial)
db.run(`CREATE TABLE IF NOT EXISTS purchases ( 
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    product_id INTEGER NOT NULL, 
    supplier_id INTEGER NOT NULL, 
    quantity REAL NOT NULL, 
    unit_cost REAL NOT NULL, 
    total REAL NOT NULL, 
    unitType TEXT DEFAULT 'unit', 
    cash REAL DEFAULT 0, 
    transfer REAL DEFAULT 0, 
    buy_date DATE DEFAULT (date('now','localtime')), 
    buy_time TIME DEFAULT (time('now','localtime')), 
    FOREIGN KEY(product_id) REFERENCES products(id), 
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id) );
`);

app.post("/purchases", (req, res) => {
    const { product_id, supplier_id, quantity, unit_cost, unitType, cash, transfer, buy_date, buy_time } = req.body;

    if (!product_id || !supplier_id || quantity == null || unit_cost == null) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const total = Number(quantity) * Number(unit_cost);

    db.run(
        `INSERT INTO purchases (product_id, supplier_id, quantity, unit_cost, total, unitType, cash, transfer, buy_date, buy_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            product_id,
            supplier_id,
            quantity,
            unit_cost,
            total,
            unitType || "unit",
            cash || 0,
            transfer || 0,
            buy_date || new Date().toISOString().slice(0, 10),
            buy_time || new Date().toISOString().slice(11, 16)
        ],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // 1️⃣ Obtener el producto para calcular salePrice
            db.get("SELECT * FROM products WHERE id = ?", [product_id], (prodErr, product) => {
                if (prodErr) return res.status(500).json({ error: prodErr.message });
                if (!product) return res.status(404).json({ error: "Producto no encontrado" });

                // Calcular salePrice según incrementType/incrementValue
                let salePrice = Number(unit_cost);
                if (product.incrementType === "percentage") {
                    salePrice = Number(unit_cost) * (1 + (Number(product.incrementValue) || 0) / 100);
                } else if (product.incrementType === "peso" || product.incrementType === "fixed") {
                    salePrice = Number(unit_cost) + (Number(product.incrementValue) || 0);
                }

                // 2️⃣ Actualizar stock y precios del producto
                db.run(
                    `UPDATE products
           SET stock = COALESCE(stock, 0) + ?, 
               purchasePrice = ?, 
               salePrice = ?, 
               unitType = ?
           WHERE id = ?`,
                    [quantity, unit_cost, salePrice, unitType || product.unitType || "unit", product_id],
                    function (updateErr) {
                        if (updateErr) return res.status(500).json({ error: updateErr.message });

                        // 3️⃣ Devolver la compra recién insertada
                        db.get(
                            `SELECT pu.id, pu.product_id, pu.supplier_id, pu.quantity, pu.unit_cost, pu.total,
                      pu.unitType, pu.cash, pu.transfer, pu.buy_date, pu.buy_time,
                      pr.name AS product_name, pr.description AS product_description,
                      s.name AS supplier_name
               FROM purchases pu
               JOIN products pr ON pr.id = pu.product_id
               JOIN suppliers s ON s.id = pu.supplier_id
               WHERE pu.id = ?`,
                            [this.lastID],
                            (getErr, row) => {
                                if (getErr) return res.status(500).json({ error: getErr.message });
                                res.json(row);
                            }
                        );
                    }
                );
            });
        }
    );
});




// GET /purchases - listar compras con filtro opcional por mes y año
// Query params: month (01..12), year (YYYY)
app.get("/purchases", (req, res) => {
    const { month, year } = req.query;

    let sql = `
        SELECT pu.id, pu.product_id, pu.supplier_id,
               pu.quantity, pu.unit_cost, pu.total, pu.unitType,
               pu.cash, pu.transfer, pu.buy_date, pu.buy_time,
               pr.name AS product_name, pr.description AS product_description, s.name AS supplier_name
        FROM purchases pu
        JOIN products pr ON pr.id = pu.product_id
        JOIN suppliers s ON s.id = pu.supplier_id
    `;

    const params = [];

    if (year && month) {
        sql += ` WHERE strftime('%Y', pu.buy_date) = ? AND strftime('%m', pu.buy_date) = ?`;
        params.push(String(year), String(month).padStart(2, "0"));
    } else if (year) {
        sql += ` WHERE strftime('%Y', pu.buy_date) = ?`;
        params.push(String(year));
    } else if (month) {
        sql += ` WHERE strftime('%m', pu.buy_date) = ?`;
        params.push(String(month).padStart(2, "0"));
    }

    sql += ` ORDER BY pu.buy_date DESC, pu.buy_time DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});



// PUT /purchases/:id - editar compra y ajustar stock (calcula diferencia)
app.put("/purchases/:id", (req, res) => {
    const { id } = req.params;
    const { product_id, supplier_id, quantity, unit_cost, unitType, cash, transfer, buy_date, buy_time } = req.body;

    if (!product_id || !supplier_id || quantity == null || unit_cost == null) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const total = Number(quantity) * Number(unit_cost);

    db.get("SELECT * FROM purchases WHERE id = ?", [id], (err, oldPurchase) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!oldPurchase) return res.status(404).json({ error: "Compra no encontrada" });

        // Diferencia de cantidad para ajustar stock
        const diff = Number(quantity) - Number(oldPurchase.quantity);

        db.run(
            `UPDATE purchases
       SET product_id = ?, supplier_id = ?, quantity = ?, unit_cost = ?, total = ?, 
           unitType = ?, cash = ?, transfer = ?, buy_date = ?, buy_time = ?
       WHERE id = ?`,
            [
                product_id,
                supplier_id,
                quantity,
                unit_cost,
                total,
                unitType || "unit",
                cash || 0,
                transfer || 0,
                buy_date || oldPurchase.buy_date,
                buy_time || oldPurchase.buy_time,
                id
            ],
            function (updateErr) {
                if (updateErr) return res.status(500).json({ error: updateErr.message });

                // Si cambió el producto, ajustar stock de ambos
                if (Number(oldPurchase.product_id) !== Number(product_id)) {
                    // Restar del producto anterior
                    db.run(
                        `UPDATE products SET stock = COALESCE(stock,0) - ? WHERE id = ?`,
                        [oldPurchase.quantity, oldPurchase.product_id],
                        function (r1Err) {
                            if (r1Err) return res.status(500).json({ error: r1Err.message });

                            // Calcular nuevo salePrice
                            db.get("SELECT * FROM products WHERE id = ?", [product_id], (prodErr, product) => {
                                if (prodErr) return res.status(500).json({ error: prodErr.message });
                                if (!product) return res.status(404).json({ error: "Producto no encontrado" });

                                let salePrice = Number(unit_cost);
                                if (product.incrementType === "percentage") {
                                    salePrice = Number(unit_cost) * (1 + (Number(product.incrementValue) || 0) / 100);
                                } else if (product.incrementType === "peso" || product.incrementType === "fixed") {
                                    salePrice = Number(unit_cost) + (Number(product.incrementValue) || 0);
                                }

                                // Sumar al nuevo producto
                                db.run(
                                    `UPDATE products 
                   SET stock = COALESCE(stock,0) + ?, purchasePrice = ?, salePrice = ?, unitType = ?
                   WHERE id = ?`,
                                    [quantity, unit_cost, salePrice, unitType || product.unitType || "unit", product_id],
                                    function (r2Err) {
                                        if (r2Err) return res.status(500).json({ error: r2Err.message });
                                        res.json({ updated: this.changes });
                                    }
                                );
                            });
                        }
                    );
                } else {
                    // Mismo producto: ajustar stock por la diferencia
                    db.get("SELECT * FROM products WHERE id = ?", [product_id], (prodErr, product) => {
                        if (prodErr) return res.status(500).json({ error: prodErr.message });
                        if (!product) return res.status(404).json({ error: "Producto no encontrado" });

                        let salePrice = Number(unit_cost);
                        if (product.incrementType === "percentage") {
                            salePrice = Number(unit_cost) * (1 + (Number(product.incrementValue) || 0) / 100);
                        } else if (product.incrementType === "peso" || product.incrementType === "fixed") {
                            salePrice = Number(unit_cost) + (Number(product.incrementValue) || 0);
                        }

                        db.run(
                            `UPDATE products 
               SET stock = COALESCE(stock,0) + ?, purchasePrice = ?, salePrice = ?, unitType = ?
               WHERE id = ?`,
                            [diff, unit_cost, salePrice, unitType || product.unitType || "unit", product_id],
                            function (stockErr) {
                                if (stockErr) return res.status(500).json({ error: stockErr.message });
                                res.json({ updated: this.changes });
                            }
                        );
                    });
                }
            }
        );
    });
});



// DELETE /purchases/:id - eliminar compra y restar stock
app.delete("/purchases/:id", (req, res) => {
    const { id } = req.params;

    db.get("SELECT * FROM purchases WHERE id = ?", [id], (err, purchase) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!purchase) return res.status(404).json({ error: "Compra no encontrada" });

        db.run("DELETE FROM purchases WHERE id = ?", [id], function (delErr) {
            if (delErr) return res.status(500).json({ error: delErr.message });

            db.run(
                `UPDATE products SET stock = COALESCE(stock,0) - ? WHERE id = ?`,
                [purchase.quantity, purchase.product_id],
                function (stockErr) {
                    if (stockErr) return res.status(500).json({ error: stockErr.message });
                    res.json({ deleted: this.changes });
                }
            );
        });
    });
});

// PATCH /products/:id/sale - actualizar solo salePrice y unitType
app.patch("/products/:id/sale", (req, res) => {
    const { id } = req.params;
    const { salePrice, unitType } = req.body;

    db.run(
        `UPDATE products SET salePrice = ?, unitType = ? WHERE id = ?`,
        [salePrice, unitType, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: this.changes });
        }
    );
});

// --- Obtener producto por ID ---
app.get("/products/:id", (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Producto no encontrado" });
        res.json(row);
    });
});



// Iniciar servidor
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
