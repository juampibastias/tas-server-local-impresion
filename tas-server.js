// tas-server.js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 9100;

app.use(bodyParser.json());

// Endpoint para test de vida
app.get('/estado', (req, res) => {
    res.json({ estado: 'online', puerto: PORT });
});

// Endpoint para prueba de impresión
app.post('/test', (req, res) => {
    console.log('📄 Test de impresión recibido');
    res.json({ ok: true, mensaje: 'Prueba de impresión recibida' });
});

// Endpoint principal de impresión
app.post('/imprimir', (req, res) => {
    const datos = req.body;
    console.log('🖨️ Recibiendo datos para impresión:', datos);

    // Lógica de impresión real (ejemplo)
    const texto = `
==============================
        COMPROBANTE DE PAGO
==============================
Cliente: ${datos.cliente}
NIS: ${datos.nis}
Factura: ${datos.factura}
Importe: $${datos.importe}
Vencimiento: ${datos.vencimiento}
Método: ${datos.metodoPago}
Transacción: ${datos.transactionId}
Fecha de pago: ${datos.fechaPago}
==============================
`;

    console.log(texto);

    // En tu caso podrías enviarlo a una impresora real aquí
    res.json({ ok: true, mensaje: 'Comprobante recibido para impresión' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('✅ Servidor de impresión TAS listo en puerto', PORT);
});
