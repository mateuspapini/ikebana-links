# Contingência Bis2Bis — liberação de analytics no agregador de links

> **Não é necessário enviar esta solicitação no cenário atual.** Na validação de produção de 31/08/2026, `links.ikebanaflores.com.br` respondeu diretamente pelo GitHub Pages, sem um cabeçalho CSP da GoCache sobrescrevendo a política do site. Use este documento somente se a GoCache for colocada na frente do subdomínio ou se surgir um cabeçalho HTTP com `connect-src 'none'`.

Solicitamos uma alteração restrita ao host `links.ikebanaflores.com.br`. Nenhum cabeçalho, cache, DNS ou comportamento de `ikebanaflores.com.br`, `www.ikebanaflores.com.br` ou de outros subdomínios deve ser modificado.

## Contexto

O agregador é medido pelo Google Tag Manager `GTM-M8T8Q6B7`, Google Analytics 4 e pelo projeto separado Microsoft Clarity **Ikebana Links**. Se um proxy passar a enviar `connect-src 'none'`, o navegador deixará de enviar esses dados.

## Alteração a solicitar somente se houver bloqueio

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
