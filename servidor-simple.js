// servidor-simple.js - Servidor de impresión TAS final
const http = require('http');
const fs = require('fs');
const axios = require('axios');
const { execSync } = require('child_process');

console.log('🖨️ Iniciando servidor de impresión TAS...');

async function obtenerNombreCliente(nis) {
    const backendURL = 'https://staging.be.cooperativapopular.com.ar';
    const token = '78b7328a5d36a62756805889a69477be024f14f9cb0bf4ef70353231db75fc0c';

    try {
        const response = await axios.get(`${backendURL}/api/facturas?nis=${nis}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = response.data;

        if (Array.isArray(data) && data.length > 0 && data[0].NOMBRE) {
            return data[0].NOMBRE;
        }

        return 'Cliente desconocido';
    } catch (error) {
        console.error('❌ Error al buscar nombre del cliente:', error.message);
        return 'Cliente desconocido';
    }
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/imprimir') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const datos = JSON.parse(body);
                console.log('📄 Recibido ticket para imprimir:', datos.factura || 'TEST');
                console.log('📊 Datos completos recibidos:', JSON.stringify(datos, null, 2));

                const vencimientoLimpio = datos.vencimiento.replace('VTO_', '');
                const idOriginal = datos.transaccion;
                const idSinGuiones = idOriginal.replace(/-/g, '');
                const nombreCliente = await obtenerNombreCliente(datos.nis);
                console.log('🧾 Nombre del cliente:', nombreCliente);

                const contenido = 
`========================================================
Coop. Elect y A. Popular de Rvia Ltda.
       COMPROBANTE DE PAGO
========================================================

Cliente: ${nombreCliente}
NIS: ${datos.nis || 'N/A'}
Factura: ${datos.factura || 'N/A'}
Fecha Venc: ${datos.fecha || new Date().toLocaleDateString('es-AR')}
Importe pagado: $${datos.importe || '0'}
Metodo de pago: ${datos.metodoPago || 'EFECTIVO'}

${idSinGuiones || 'N/A'}

Hora de pago    : ${new Date().toLocaleTimeString('es-AR')}

========================================================
       GRACIAS POR SU PAGO
    Pago sujeto a acreditacion.
  Ticket no valido como factura.
========================================================
`;

                const archivo = `comprobante_${Date.now()}.txt`;
                fs.writeFileSync(archivo, contenido, 'utf8');

                try {
                   execSync(`powershell -Command "Add-Type -AssemblyName System.Drawing; Add-Type -AssemblyName System.Windows.Forms; $printer = [System.Drawing.Printing.PrinterSettings]::new(); $printer.PrinterName = 'NPI Integration Driver'; $doc = [System.Drawing.Printing.PrintDocument]::new(); $doc.PrinterSettings = $printer; $content = Get-Content '${archivo}' -Raw; $doc.add_PrintPage({param($sender, $e) $font = [System.Drawing.Font]::new('Courier New', 9, [System.Drawing.FontStyle]::Bold); $logo = [System.Drawing.Image]::FromFile('logocoope-color.png'); $logoWidth = 120; $logoHeight = 120; $pageWidth = $e.PageBounds.Width; $logoX = ($pageWidth - $logoWidth) / 2; $e.Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality; $e.Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic; $e.Graphics.DrawImage($logo, $logoX, 10, $logoWidth, $logoHeight); $e.Graphics.DrawString($content, $font, [System.Drawing.Brushes]::Black, 10, 140)}); $doc.Print()"`);
                    console.log('✅ Impresión enviada a NPI Integration Driver');
                } catch (printError) {
                    console.log('⚠️ NPI Driver no disponible, intentando impresora por defecto...');
                    execSync(`print "${archivo}"`);
                }

                setTimeout(() => {
                    try {
                        //fs.unlinkSync(archivo);
                    } catch (e) {
                        console.log('Archivo ya eliminado');
                    }
                }, 3000);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    mensaje: 'Comprobante impreso correctamente',
                    factura: datos.factura 
                }));

            } catch (error) {
                console.error('❌ Error procesando impresión:', error.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    error: error.message 
                }));
            }
        });
        return;
    }

    if (req.method === 'GET' && req.url === '/estado') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'online', 
            timestamp: new Date().toISOString(),
            puerto: 9100 
        }));
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
});

server.listen(9100, () => {
    console.log('✅ Servidor TAS listo en puerto 9100');
    console.log('🖨️ Esperando solicitudes de impresión...');
    console.log('📍 Endpoints disponibles:');
    console.log('   POST /imprimir - Imprimir comprobante');
    console.log('   GET /estado - Estado del servicio');
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error('❌ Puerto 9100 ya está en uso');
        console.log('💡 Cierra otras instancias del servidor TAS');
    } else {
        console.error('❌ Error del servidor:', error.message);
    }
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor TAS...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});
