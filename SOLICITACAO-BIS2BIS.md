# Solicitação à Bis2Bis — liberação de analytics no agregador de links

Solicitamos uma alteração restrita ao host `links.ikebanaflores.com.br`. Nenhum cabeçalho, cache, DNS ou comportamento de `ikebanaflores.com.br`, `www.ikebanaflores.com.br` ou de outros subdomínios deve ser modificado.

## Contexto

O agregador será medido pelo Google Tag Manager `GTM-M8T8Q6B7`, Google Analytics 4 e Microsoft Clarity. O cabeçalho CSP atual contém `connect-src 'none'`, que impede o navegador de enviar os dados.

## Alteração solicitada

Criar ou atualizar uma Smart Rule exclusiva para:

```text
host = links.ikebanaflores.com.br
```

Aplicar os seguintes cabeçalhos:

```text
Content-Security-Policy: default-src 'none'; script-src 'self' https://www.googletagmanager.com https://*.clarity.ms; style-src 'self'; img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com https://*.clarity.ms https://c.bing.com; font-src 'self'; connect-src https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.clarity.ms https://c.bing.com; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src blob:; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
Strict-Transport-Security: max-age=31536000
```

Não adicionar `includeSubDomains` ao HSTS.

## Validação solicitada

Após a alteração e a limpeza do cache apenas desse host, favor enviar o resultado destes dois testes:

```text
curl -I https://links.ikebanaflores.com.br/
curl -I https://www.ikebanaflores.com.br/
```

O primeiro deve mostrar a nova CSP sem `connect-src 'none'`. O segundo deve permanecer inalterado. A implementação atual do Microsoft Clarity da Ikebana Flores não deve ser apagada, editada nem desconectada.
