# Ikebana Links — produção com mensuração

Site estático preparado para publicação no GitHub Pages em `https://links.ikebanaflores.com.br/`, com camada de dados para Google Tag Manager, Google Analytics 4 e Microsoft Clarity.

## Antes de publicar

1. Leia `ANALYTICS-SETUP.md`; o container `GTM-M8T8Q6B7` já está publicado como **Versão 2 — Ikebana Links analytics v1.0**.
2. Peça à Bis2Bis para atualizar na GoCache o cabeçalho CSP descrito em `SECURITY-DEPLOYMENT.md`. A política antiga usa `connect-src 'none'` e bloqueará toda a mensuração se permanecer ativa.
3. Preserve integralmente o projeto e a implementação atuais do Microsoft Clarity. O agregador usa o projeto separado **Ikebana Links** (`yb3ifl2hxa`) e não compartilha a configuração do site principal.
4. Execute:

```text
python scripts/check_site.py --require-configured-analytics
```

5. Publique **todo o conteúdo desta pasta**, incluindo `.github` e `.nojekyll`, na raiz da branch `main` do repositório `mateuspapini/ikebana-links`.

## Arquitetura

- `measurement.js`: inicializa uma única `dataLayer`, carrega somente o GTM e mede interações.
- GTM: camada única de entrega das tags; GA4 e Clarity não são instalados diretamente no HTML.
- `data-link-*`: metadados estáveis dos oito destinos, independentes do texto visual.
- `.github/workflows/link-integrity.yml`: impede publicação com GTM não configurado e valida diariamente o site publicado.
- `ANALYTICS-SETUP.md`: configuração do GTM/GA4/Clarity, eventos, dimensões, testes e UTMs.
- `SECURITY-DEPLOYMENT.md`: GitHub, GoCache, DNSSEC e cabeçalhos HTTP compatíveis com a mensuração.

O layout, o tema, os arquivos de mídia e os destinos dos links permanecem inalterados.
