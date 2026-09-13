#Requires -Version 5.1
<#
    vincular-github.ps1
    ---------------------------------------------------------------------------
    Vincula esta carpeta con el repositorio de GitHub del proyecto, conservando
    el historial de commits que ya existe en el remoto.

    Cómo ejecutarlo:
      Clic derecho sobre este archivo -> "Ejecutar con PowerShell"

    Si Windows no muestra esa opción, abrí PowerShell y ejecutá:
      powershell -ExecutionPolicy Bypass -File "<ruta completa a este archivo>"

    El script se ancla a su propia ubicación, así que no importa desde dónde lo
    llames: siempre trabaja sobre la carpeta donde está guardado.

    Es seguro correrlo dos veces: detecta lo que ya está hecho y lo saltea.
    Antes de crear el commit se detiene y te pide confirmación explícita.
    ---------------------------------------------------------------------------
#>

# Deliberadamente NO se usa $ErrorActionPreference = 'Stop'. git escribe su
# progreso normal por el canal de error (fetch, push), y con 'Stop' PowerShell
# 5.1 lo interpreta como una falla real y aborta un script que iba bien. En su
# lugar, cada llamada a git verifica su código de salida en Git-Run, y los
# cmdlets que sí deben abortar llevan -ErrorAction Stop explícito.
$ErrorActionPreference = 'Continue'

$REPO_URL = 'https://github.com/65bcwy86r4-web/CalculadorasIngenieria.git'
$RAIZ     = $PSScriptRoot

# --- Salida por pantalla ------------------------------------------------------

function Paso   ($t) { Write-Host ""; Write-Host "== $t" -ForegroundColor Cyan }
function Ok     ($t) { Write-Host "   [ok] $t" -ForegroundColor Green }
function Aviso  ($t) { Write-Host "   [--] $t" -ForegroundColor Yellow }
function Detalle($t) { Write-Host "        $t" -ForegroundColor DarkGray }

# Los comandos nativos no lanzan excepciones en PowerShell: hay que revisar
# $LASTEXITCODE a mano después de cada uno.
#
# Es una función simple a propósito, sin bloque param(). Con param() y
# ValueFromRemainingArguments, PowerShell intenta interpretar los tokens que
# empiezan con guion (-m, -A, -M) como nombres de parámetro y falla antes de
# llamar a git. Con $args automático, todo llega literal.
function Git-Run {
    & git $args
    if ($LASTEXITCODE -ne 0) {
        throw "El comando 'git $($args -join ' ')' terminó con código $LASTEXITCODE."
    }
}

# --- Proceso ------------------------------------------------------------------

try {
    if ([string]::IsNullOrWhiteSpace($RAIZ)) {
        throw "No pude determinar mi propia ubicacion. Guarda este archivo en la raiz del proyecto y ejecutalo con clic derecho -> Ejecutar con PowerShell (no copiando y pegando su contenido en una consola)."
    }
    Set-Location -LiteralPath $RAIZ -ErrorAction Stop

    Write-Host ""
    Write-Host "  CalculadorasIngenieria - vinculacion con GitHub" -ForegroundColor White
    Write-Host "  Carpeta: $RAIZ" -ForegroundColor DarkGray

    # 1 ------------------------------------------------------------------------
    Paso "1/9  Verificando git"

    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw "git no esta instalado, o no quedo en el PATH. Si lo instalaste recien, cerra esta ventana, abri una nueva y volve a ejecutar el script."
    }
    Ok (& git --version)

    # 2 ------------------------------------------------------------------------
    Paso "2/9  Verificando que sea la carpeta correcta"

    foreach ($f in @('docs\HANDOFF.md', 'shared\math\index.js', 'docs\governance\AI_RULES.md')) {
        if (-not (Test-Path -LiteralPath $f)) {
            throw "No encuentro '$f'. Este script tiene que estar guardado en la raiz del proyecto, al lado de README.md."
        }
    }
    Ok "Estructura del proyecto correcta"

    # 3 ------------------------------------------------------------------------
    Paso "3/9  Limpiando restos de la extraccion"

    $sobrante = Join-Path $RAIZ 'CalculadorasIngenieria'
    if (Test-Path -LiteralPath $sobrante) {
        $conContenido = @(Get-ChildItem -LiteralPath $sobrante -Recurse -File -ErrorAction SilentlyContinue |
                          Where-Object { $_.Length -gt 0 })
        if ($conContenido.Count -gt 0) {
            Aviso "La carpeta sobrante tiene archivos con contenido. NO la borro."
            Detalle "Revisala a mano antes de seguir:"
            $conContenido | ForEach-Object { Detalle $_.FullName }
        } else {
            Remove-Item -LiteralPath $sobrante -Recurse -Force -ErrorAction Stop
            Ok "Eliminada la carpeta sobrante (solo tenia un archivo vacio)"
        }
    } else {
        Ok "Nada que limpiar"
    }

    # 4 ------------------------------------------------------------------------
    Paso "4/9  Identidad de git"

    $nombre = & git config --get user.name
    $mail   = & git config --get user.email

    if ([string]::IsNullOrWhiteSpace($nombre)) {
        Write-Host ""
        Write-Host "   Git todavia no sabe con que nombre firmar los commits." -ForegroundColor Yellow
        $nombre = Read-Host "   Tu nombre (ej: Bryan)"
        if ([string]::IsNullOrWhiteSpace($nombre)) { throw "Hace falta un nombre para poder commitear." }
        Git-Run config --global user.name $nombre
    }

    if ([string]::IsNullOrWhiteSpace($mail)) {
        Write-Host ""
        Write-Host "   Usa el MISMO email que tenes en tu cuenta de GitHub." -ForegroundColor Yellow
        Write-Host "   Si no coincide, los commits no van a figurar como tuyos en el perfil." -ForegroundColor DarkGray
        $mail = Read-Host "   Tu email de GitHub"
        if ([string]::IsNullOrWhiteSpace($mail)) { throw "Hace falta un email para poder commitear." }
        Git-Run config --global user.email $mail
    }

    Ok "Commits firmados como: $nombre <$mail>"

    # 5 ------------------------------------------------------------------------
    Paso "5/9  Inicializando el repositorio local"

    if (Test-Path -LiteralPath (Join-Path $RAIZ '.git')) {
        Ok "Ya existe un repositorio git aca"
    } else {
        Git-Run init
        Ok "Repositorio creado"
    }

    # 6 ------------------------------------------------------------------------
    Paso "6/9  Conectando con GitHub"

    $remotos = @(& git remote)
    if ($remotos -notcontains 'origin') {
        Git-Run remote add origin $REPO_URL
        Ok "Remoto 'origin' agregado"
    } else {
        $actual = (& git remote get-url origin).Trim()
        if ($actual -ne $REPO_URL) {
            Git-Run remote set-url origin $REPO_URL
            Ok "Remoto 'origin' corregido (apuntaba a $actual)"
        } else {
            Ok "Remoto 'origin' ya estaba bien configurado"
        }
    }

    Detalle "Descargando el historial existente..."
    Git-Run fetch origin
    Ok "Historial descargado"

    # 7 ------------------------------------------------------------------------
    Paso "7/9  Enganchando la carpeta al historial del remoto"

    # 'reset --mixed' mueve el puntero de la rama al ultimo commit del remoto y
    # sincroniza el indice, pero NO toca ningun archivo del disco. Es lo que hace
    # que git entienda la reorganizacion como archivos movidos, en vez de como un
    # proyecto nuevo sin relacion con el anterior.
    Git-Run reset --mixed origin/main
    Ok "Enganchado a origin/main"

    Git-Run add -A

    $rutas       = @(& git status --porcelain)
    $renombrados = @(& git diff --cached --name-status --find-renames=40% |
                     Where-Object { $_ -match '^R' })

    if ($rutas.Count -eq 0) {
        Aviso "No hay cambios para commitear. Parece que ya estaba todo subido."
        Write-Host ""
        Read-Host "Enter para cerrar"
        exit 0
    }

    Write-Host ""
    Detalle "$($rutas.Count) rutas afectadas, $($renombrados.Count) detectadas como archivos movidos"
    Write-Host ""
    # Se listan desde la variable ya capturada. Cortar la salida de un comando
    # nativo con Select-Object -First rompe la tuberia a mitad de camino y
    # ensucia la consola con un error espurio.
    $rutas | Select-Object -First 15 | ForEach-Object { Detalle $_ }
    if ($rutas.Count -gt 15) { Detalle "... y $($rutas.Count - 15) mas" }

    # 8 ------------------------------------------------------------------------
    Paso "8/9  Confirmacion"

    Write-Host "   Se va a crear un commit sobre el historial existente y subirlo a GitHub." -ForegroundColor Yellow
    $r = Read-Host "   Escribi SI para continuar (cualquier otra cosa cancela)"
    if ($r.Trim().ToUpper() -ne 'SI') {
        Aviso "Cancelado. No se commiteo ni se subio nada."
        Detalle "Tu carpeta quedo intacta. Podes volver a ejecutar el script cuando quieras."
        Write-Host ""
        Read-Host "Enter para cerrar"
        exit 0
    }

    $mensaje = @"
refactor: consolidar el proyecto en una estructura unica (Paso 0)

Unifica las tres carpetas sueltas en un repositorio con la estructura de
ENGINEERING_GUIDE.md seccion 4. Adopta el motor v2 como canonico, congela la
calculadora V1 y el motor v1 en legacy/, y agrega HANDOFF, CHAT_ROLES y tres
ADR con las decisiones tomadas.

Ver docs/RELEVAMIENTO-2026-09-12.md
"@

    # El mensaje va por archivo y no por -m. Pasar una cadena de varias lineas
    # como argumento a un ejecutable nativo es poco confiable en PowerShell 5.1:
    # el commit termina con el mensaje truncado o partido.
    $archivoMensaje = Join-Path $env:TEMP "commit-msg-calcing.txt"
    # ASCII y no UTF8: en PowerShell 5.1, -Encoding UTF8 agrega BOM, y ese BOM
    # termina como basura al principio del mensaje del commit.
    Set-Content -LiteralPath $archivoMensaje -Value $mensaje -Encoding ASCII -ErrorAction Stop
    try {
        Git-Run commit -F $archivoMensaje
    } finally {
        Remove-Item -LiteralPath $archivoMensaje -Force -ErrorAction SilentlyContinue
    }
    Ok "Commit creado"

    # 9 ------------------------------------------------------------------------
    Paso "9/9  Subiendo a GitHub"

    Git-Run branch -M main

    Write-Host ""
    Detalle "Si se abre el navegador pidiendo autorizacion, es normal: es la primera vez."
    Write-Host ""

    Git-Run push -u origin main
    Ok "Rama 'main' subida"

    & git show-ref --verify --quiet refs/heads/develop
    if ($LASTEXITCODE -ne 0) { Git-Run branch develop }
    Git-Run push -u origin develop
    Ok "Rama 'develop' subida"

    Git-Run checkout develop

    # --------------------------------------------------------------------------
    Write-Host ""
    Write-Host "  LISTO" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Historial del repositorio:" -ForegroundColor White
    & git log --oneline -8
    Write-Host ""
    Write-Host "  Quedaste parado en la rama 'develop'. 'main' se mantiene estable," -ForegroundColor White
    Write-Host "  segun ENGINEERING_GUIDE.md seccion 17." -ForegroundColor White
    Write-Host ""
    Write-Host "  Repositorio:  https://github.com/65bcwy86r4-web/CalculadorasIngenieria" -ForegroundColor White
    Write-Host ""
    Write-Host "  Falta un solo paso, y es en el navegador:" -ForegroundColor Yellow
    Write-Host "  Settings -> Pages -> Source: Deploy from a branch -> main -> / (root) -> Save" -ForegroundColor Yellow
    Write-Host "  Eso publica la plataforma en:" -ForegroundColor Yellow
    Write-Host "  https://65bcwy86r4-web.github.io/CalculadorasIngenieria/" -ForegroundColor Yellow
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "  ALGO FALLO" -ForegroundColor Red
    Write-Host ""
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "  No se subio nada a GitHub. Copia este mensaje y pegamelo en el chat." -ForegroundColor Yellow
    Write-Host ""
}

Read-Host "Enter para cerrar"
