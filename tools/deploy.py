#!/usr/bin/env python3
"""FASE 1 — despliegue a Vercel.

    python3 tools/deploy.py [production]

ESTADO: BLOQUEADO para binarios. Ver D8 en DECISIONS.md.

Lo que se probo, en orden, y por que ninguna variante sirve
(todo verificado comparando sha256 del fichero servido contra el original,
no leyendo el "READY" del despliegue, que miente sobre el contenido):

1. `proxy("vercel", {account})` -> API cruda.
   403 en /v9/projects, /v6/deployments y /v2/user. El OAuth de la conexion
   solo autoriza /v2/teams. Descartado.

2. `execute VERCEL_CREATE_NEW_DEPLOYMENT` con `data` en base64 + `encoding`.
   El esquema de la herramienta no declara `encoding` y **Composio lo descarta
   en servidor**; --skip-tool-params-check solo salta la validacion del
   cliente. Resultado: Vercel sirve la CADENA base64 como si fuera el fichero.
   Sintoma: la fuente servida pesaba 132 112 B contra 99 084 B del original,
   exactamente la expansion x4/3 de base64.

3. Flujo en dos pasos: `VERCEL_UPLOAD_FILE` (sube bytes crudos, devuelve el
   SHA1 correcto — esto SI funciona) y luego el despliegue referenciando
   {file, sha, size}. Falla: Composio exige `data` en servidor. Y poniendo
   `data: ""` junto al sha, Vercel resuelve la union a "fichero inline" y
   **ignora el sha**: los 7 binarios salieron a 0 bytes.

Conclusion: el texto se despliega bien por esta via, los binarios no. Las dos
salidas reales son (a) integracion Git — que es D8 y ademas la respuesta
correcta a largo plazo — o (b) un token de Vercel para usar la CLI.
"""
import sys

print(__doc__)
sys.exit(1)
