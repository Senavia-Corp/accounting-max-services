# Pendiente para conectar el dominio

> ⚠️ **DOCUMENTO SUPERADO — 31-jul-2026.** El corte se ejecutó: el dominio está
> conectado y sirviendo el sitio nuevo. Lo de abajo describe el estado ANTERIOR y se
> conserva como registro de lo planificado. Para el estado real, ver
> [`release-dominio-conectado.md`](release-dominio-conectado.md).

**Escrito, no ejecutado.** Nada de este documento se ha aplicado. A 31 de julio de
2026, `accountingmaxservices.com` sigue sirviendo el sitio de Webflow y en Vercel
**no hay ningún dominio personalizado**.

El sitio nuevo vive en <https://accounting-max-services.vercel.app> y nada más.

---

## 0 · Antes de tocar nada: dos cosas que bloquean el corte

Ninguna es de DNS, y las dos son anteriores a mover un registro.

1. **D6 — la cuenta de Vercel.** El proyecto está en plan **Hobby**, con facturación
   en un Gmail personal (dirección en `ACCOUNTS.md`, fuera del repo). Hobby **prohíbe el uso comercial**, y
   un sitio que capta leads para un despacho fiscal lo es; la sanción es suspensión.
   Además, en el traspaso el cliente no recupera la cuenta sin ese buzón. Ya está
   decidido que el corte espera a que exista un Team en Pro con propietario en el
   dominio del cliente. **El movimiento de cuenta se hace antes, nunca durante.**
2. **D4 — privacidad y aviso GLBA.** Un preparador de impuestos está obligado a
   publicarlo antes de recoger un dato. Hoy las dos páginas legales son borradores
   pendientes de revisión de un abogado, y llevan `noindex`.

Y una tercera, si los formularios deben funcionar el día del corte: **B3 + SMTP**, con
todo el detalle en `entrega/release-verificacion.md` § 5.

---

## 1 · Estado actual del DNS

Zona en **Google Cloud DNS** (`ns-cloud-e{1..4}.googledomains.com`). Acceso pendiente,
bloqueo **B1**.

| Registro | Valor actual | Qué es |
|---|---|---|
| `A` apex | `75.2.70.75`, `99.83.190.102` | Webflow |
| `CNAME www` | `proxy-ssl.webflow.com.` | Webflow |
| `MX` | `aspmx.l.google.com` y alt1-4 | **Google Workspace — NO TOCAR** |
| `TXT` apex | `v=spf1 include:_spf.google.com ~all` | **SPF — NO TOCAR** |
| DKIM (selector google) | `v=DKIM1; k=rsa; p=MIIBIjANBg…` | **NO TOCAR** |
| DMARC | no existe (NXDOMAIN) | — |
| CAA | no existe | No bloquea la emisión del certificado |

> **MX, SPF y DKIM no se tocan en ningún paso.** El correo del despacho corre por ahí.
> Un cambio de A o de CNAME no los afecta; borrarlos «para limpiar» sí, y deja al
> cliente sin correo.

## 2 · Canonicalización — medida, no supuesta

Verificado hoy contra el sitio en vivo:

```
http://accountingmaxservices.com/about-us
  → 301 https://accountingmaxservices.com/about-us
  → 301 https://www.accountingmaxservices.com/about-us   (200)
```

**apex → www, conservando la ruta.** Se comprobó también con una ruta profunda
(`/services/notary-public-services`) y la conserva igual.

Por eso `astro.config.mjs` declara:

```js
site: "https://www.accountingmaxservices.com"
```

y por eso los 54 canonical del sitio nuevo ya apuntan a `www`. **La dirección de la
canonicalización no se invierte**: si alguien decidiera servir en apex, hay que cambiar
`site`, reconstruir y revisar el sitemap — no basta con el DNS.

## 3 · Registros a cambiar

Solo dos. Los valores exactos los da Vercel al añadir el dominio; los de abajo son los
que Vercel usa hoy por defecto y hay que **confirmarlos en el panel**, no copiarlos a
ciegas.

| Registro | De | A |
|---|---|---|
| `A` apex | `75.2.70.75`, `99.83.190.102` | `76.76.21.21` |
| `CNAME www` | `proxy-ssl.webflow.com.` | `cname.vercel-dns.com.` |

**Orden recomendado:**

1. Bajar el TTL de esos dos registros a 300 s **al menos 24 h antes** del corte. Hoy
   están a 14400 (4 h) y 13379 (~3,7 h): sin bajarlo antes, una marcha atrás tarda
   horas en propagarse.
2. Añadir en Vercel **los dos** dominios, `accountingmaxservices.com` y
   `www.accountingmaxservices.com`, con **www como principal** y el apex redirigiendo a
   www. Es la única configuración que mantiene la canonicalización actual.
3. Esperar a que Vercel emita el certificado (Let's Encrypt, automático; no hay CAA que
   lo bloquee).
4. Cambiar los registros.
5. Subir el TTL otra vez cuando esté estable.

## 4 · Redirecciones 301 — ninguna

> **No hace falta ni un 301 de ruta.**

Las **26 rutas EN** de `baseline/urls-vivas.csv` responden 200 **en la misma ruta** en
el sitio nuevo. Medido sobre producción: **0 divergencias**.

Las dos únicas rutas EN que no existen en el sitio actual son `/privacy-policy` y
`/terms`, que son nuevas y nacen con `noindex`. No hay nada de donde redirigir.

Lo único a conservar es lo que ya hace el adapter y **no** hay que configurar a mano:

- `/<ruta>/` → **308** → `/<ruta>` (lo genera `trailingSlash: "never"`)
- apex → www, conservando la ruta (lo hará la config de dominios de Vercel)

## 5 · Después del corte

1. **Comprobar la canonicalización real**, no darla por hecha:
   ```
   curl -sSL -o /dev/null -w '%{url_effective} %{num_redirects}\n' http://accountingmaxservices.com/services/notary-public-services
   ```
   Debe acabar en `https://www.accountingmaxservices.com/services/notary-public-services`.
2. **Repasar las 54 rutas** sobre el dominio, no sobre la URL de Vercel.
3. **Comprobar que el correo sigue vivo**: enviar y recibir en
   `info@accountingmaxservices.com`. Es la comprobación que nadie hace y la que más
   caro sale.
4. **Enviar el sitemap a Search Console**: `https://www.accountingmaxservices.com/sitemap-index.xml`
   (26 URLs). Hoy no se ha enviado nada, y es correcto: sin dominio conectado no hay
   nada que enviar.
5. **Vigilar el `noindex` de `/es`** — 26 rutas. Sigue puesto hasta que D3 se firme.
   Cuando se conecte el dominio, esas rutas pasan a ser rastreables por un buscador que
   antes ni las veía: conviene confirmar que el `noindex` viaja intacto.
6. **Retirar Webflow solo después**, y no antes de rescatar las *submissions* históricas
   de sus formularios (bloqueo **B4**): viven dentro de Webflow y **se pierden para
   siempre al cancelar la cuenta**.

## 6 · Marcha atrás

Restaurar los dos registros a sus valores actuales:

```
A     accountingmaxservices.com       75.2.70.75
A     accountingmaxservices.com       99.83.190.102
CNAME www.accountingmaxservices.com   proxy-ssl.webflow.com.
```

Válido mientras la cuenta de Webflow siga activa. Con el TTL en 300 s la vuelta es de
minutos; con el TTL actual, de horas. De ahí el paso 1 del apartado 3.
