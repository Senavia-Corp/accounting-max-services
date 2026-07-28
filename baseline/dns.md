# Baseline DNS — accountingmaxservices.com
Capturado: 2026-07-28T01:35:25Z

## NS
ns-cloud-e4.googledomains.com.
ns-cloud-e2.googledomains.com.
ns-cloud-e1.googledomains.com.
ns-cloud-e3.googledomains.com.
## A (apex)
accountingmaxservices.com. 14400 IN	A	75.2.70.75
accountingmaxservices.com. 14400 IN	A	99.83.190.102
## CNAME www
www.accountingmaxservices.com. 13379 IN	CNAME	proxy-ssl.webflow.com.
## MX
accountingmaxservices.com. 13378 IN	MX	5 alt1.aspmx.l.google.com.
accountingmaxservices.com. 13378 IN	MX	5 alt2.aspmx.l.google.com.
accountingmaxservices.com. 13378 IN	MX	10 alt4.aspmx.l.google.com.
accountingmaxservices.com. 13378 IN	MX	1 aspmx.l.google.com.
accountingmaxservices.com. 13378 IN	MX	10 alt3.aspmx.l.google.com.
## TXT apex (SPF)
accountingmaxservices.com. 13381 IN	TXT	"v=spf1 include:_spf.google.com ~all"
## DMARC
(vacio = NXDOMAIN, no existe DMARC)
## DKIM google selector
"v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAhasq8borOpfK7ZbutfyuoH/Lv+sm3GnZF312jA7RaUAHkHXhayGM7btp4b2UBulz4cbftdd/TtZ4qV76ADMqKGufeVfPe4QK1Uv3rsr72CIZSgtkMeIuf/d5qOMO5fFGpEC+GITfm
## CAA
(vacio = sin CAA, no bloquea emision de certificado)
