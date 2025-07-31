# instalar-tas.ps1 - Instalador simple y limpio para TAS

# Verifica si es administrador
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Este script debe ejecutarse como Administrador"
    Pause
    Exit
}

# Crear carpeta C:\Users\TAS\Desktop\TAS-Server
$path = "C:\Users\TAS\Desktop\TAS-Server"
if (!(Test-Path $path)) {
    New-Item -ItemType Directory -Path $path | Out-Null
    Write-Host "✅ Carpeta creada en $path"
} else {
    Write-Host "⚠️ Ya existe la carpeta $path"
}

# Copiar servidor-simple.js a ese directorio
$origen = "$PSScriptRoot\servidor-simple.js"
$destino = "$path\servidor-simple.js"

if (Test-Path $origen) {
    Copy-Item $origen $destino -Force
    Write-Host "✅ Servidor copiado a $destino"
} else {
    Write-Host "❌ No se encontró el archivo servidor-simple.js en el mismo directorio que este script"
}

# Crear acceso directo en Escritorio
$wshell = New-Object -ComObject WScript.Shell
$shortcut = $wshell.CreateShortcut("$env:PUBLIC\Desktop\TAS - Iniciar Servidor.lnk")
$shortcut.TargetPath = "powershell.exe"
$shortcut.Arguments = "-ExecutionPolicy Bypass -NoExit -Command `"cd '$path'; node servidor-simple.js`""
$shortcut.WorkingDirectory = "$path"
$shortcut.WindowStyle = 1
$shortcut.Save()

Write-Host "✅ Acceso directo creado en el escritorio"
Pause
