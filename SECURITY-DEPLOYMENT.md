# Publicação segura — Ikebana Links

Este arquivo contém as configurações externas que não viajam dentro do HTML.

## 1. GitHub Pages

1. Substitua o conteúdo da branch `main` pelos arquivos deste pacote.
2. Em **Settings → Pages**, publique a raiz da branch `main`.
3. Em **Custom domain**, informe `links.ikebanaflores.com.br`.
4. Aguarde a validação e ative **Enforce HTTPS**.
5. No perfil pessoal do GitHub, em **Settings → Pages**, verifique `ikebanaflores.com.br` com o registro TXT fornecido. Mantenha esse TXT permanentemente.

## 2. Proteção da branch

Em **Settings → Rules → Rulesets**, crie um branch ruleset:

- Nome: `Protect production`.
- Enforcement: `Active`.
- Target: `main`.
- Restrict deletions: ativo.
- Block force pushes: ativo.
- Require a pull request before merging: ativo.
- Require signed commits: ativo.
- Require status checks: selecione `validate-site` depois da primeira execução do workflow.
- Bypass: mantenha o menor número possível de pessoas.
- Ideal: exija uma aprovação de uma segunda pessoa confiável da empresa.

Proteja a conta GitHub, o e-mail administrativo, a GoCache e o registrador com passkey ou chave de segurança. Revogue tokens, chaves SSH, deploy keys e aplicativos que não sejam necessários.

## 3. DNS na GoCache

Crie primeiro o domínio personalizado no GitHub Pages. Depois, na zona DNS da GoCache:

| Tipo | Nome | Destino |
|---|---|---|
| CNAME | links | mateuspapini.github.io |

Não inclua `https://`, barras ou `/ikebana-links`. Não use wildcard DNS.

Quando o certificado estiver aprovado no GitHub, se o subdomínio passar pela CDN da GoCache, utilize SSL **Full Security**.

## 4. DNSSEC

Ative DNSSEC na GoCache e copie o registro DS gerado para o registrador do domínio. Confirme a validação antes de encerrar a sessão. Uma entrada DS incorreta pode deixar todo o domínio indisponível.

## 5. Cabeçalhos na GoCache

Crie uma Smart Rule geral com o critério `host = links.ikebanaflores.com.br` e adicione os cabeçalhos abaixo:

```text
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; require-trusted-types-for 'script'; trusted-types 'none'; upgrade-insecure-requests
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
Strict-Transport-Security: max-age=31536000
```

Não acrescente `includeSubDomains` ao HSTS sem confirmar que absolutamente todos os subdomínios funcionam exclusivamente por HTTPS.

## 6. Cache

Depois que o domínio estiver na CDN, use nomes versionados ao substituir recursos estáticos. Para os arquivos atuais em `assets/`, configure cache de navegador longo. Mantenha `index.html` e `CNAME` com cache curto para permitir alterações rápidas.

## 7. Monitoramento

O workflow `Link integrity` executa em cada alteração e diariamente. Ele bloqueia mudanças no telefone, nos destinos oficiais, na CSP e nas proteções de nova aba. Ative as notificações de falha do GitHub Actions e mantenha uma segunda monitoração externa para `https://links.ikebanaflores.com.br/`.
