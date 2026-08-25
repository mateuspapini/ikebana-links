# Ikebana Links — pacote de produção

Site estático otimizado e endurecido para publicação no GitHub Pages em `https://links.ikebanaflores.com.br/`.

## Publicação

Envie **todo o conteúdo desta pasta**, incluindo os diretórios ocultos `.github` e o arquivo `.nojekyll`, para a raiz da branch `main` do repositório `mateuspapini/ikebana-links`.

Antes de ativar o domínio, leia `SECURITY-DEPLOYMENT.md`.

## Validação local

Com Python 3 disponível, execute:

```text
python scripts/check_site.py
```

O teste confirma os destinos oficiais, o número de WhatsApp, a política CSP, os arquivos obrigatórios e a proteção das novas abas.

## Estrutura

- `index.html`: conteúdo e metadados.
- `styles.css`: layout responsivo, temas e acessibilidade.
- `app.js`: alternância segura de tema, sem `innerHTML`.
- `assets/`: imagens WebP/JPEG otimizadas e fontes locais.
- `.github/workflows/link-integrity.yml`: verificação automática diária e por alteração.
- `.github/CODEOWNERS`: revisão explícita das mudanças no site e nos testes.
- `SECURITY-DEPLOYMENT.md`: GitHub, GoCache, DNSSEC e cabeçalhos HTTP.
