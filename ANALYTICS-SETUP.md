# Mensuração — GA4, GTM e Microsoft Clarity

## 1. Arquitetura adotada

O site carrega apenas um container Web do Google Tag Manager. O arquivo local `measurement.js` envia interações para uma única `window.dataLayer`; o GTM transforma esses eventos em eventos do GA4 e carrega o Microsoft Clarity.

Não instale `gtag.js`, outra tag do GTM ou o snippet manual do Clarity no HTML. Isso duplicaria visualizações, sessões e cliques.

São usados três identificadores:

- GTM: `GTM-M8T8Q6B7`, inserido na meta tag `gtm-container-id` de `index.html`.
- GA4: `G-0NBE7P632T`, fluxo Web existente da propriedade `Compras.Ikebana`, usado somente na Google tag dentro do GTM.
- Clarity: projeto separado **Ikebana Links**, ID `yb3ifl2hxa`, usado somente no GTM do agregador. A implementação existente da Ikebana Flores permanece protegida e não deve ser editada, removida nem reutilizada.

O container do GTM já está identificado no código. A publicação do container e do site continua sendo uma etapa controlada, posterior à validação.

## 2. Eventos implementados

### `link_view`

Disparado uma vez por visualização de página para cada link que ficar pelo menos 50% visível. É o denominador recomendado para calcular CTR real de cada posição.

### `link_click`

Disparado quando qualquer elemento com `data-link-id` é acionado, inclusive cards, redes sociais e logo do rodapé.

### `scroll_depth`

Disparado uma vez em 25%, 50%, 75%, 90% e 100% da página. Se toda a página já estiver visível sem rolagem, os limiares alcançados são registrados imediatamente.

### `theme_change`

Disparado quando o visitante alterna entre o modo claro e escuro.

GA4 continuará criando automaticamente `page_view`, `session_start`, `first_visit` e `user_engagement`. Usuários, sessões, origem/mídia, campanhas, dispositivo, navegador e localização vêm desses eventos automáticos.

## 3. Parâmetros

| Parâmetro | Uso |
|---|---|
| `link_id` | ID estável: `whatsapp`, `loja`, `rosa-eterna`, `curso`, `tiktok`, `instagram`, `youtube` ou `site` |
| `link_name` | Nome legível e estável do destino |
| `link_url` | URL de destino sem query string nem fragmento |
| `link_domain` | Domínio de destino |
| `link_type` | Tipo: WhatsApp, loja, produto, curso, social ou site |
| `link_section` | `primary`, `social` ou `footer` |
| `link_position` | Posição dentro da seção |
| `link_position_global` | Posição entre todos os links da página |
| `outbound` | Indica saída do domínio atual |
| `visibility_threshold` | Percentual mínimo visível usado por `link_view` (50) |
| `scroll_percent` | Limiar alcançado por `scroll_depth` |
| `theme` | `dark` ou `light` |
| `page_type` | Sempre `link_aggregator`, útil para uma propriedade GA4 compartilhada |
| `page_path` | Caminho da página, sem parâmetros UTM |
| `measurement_version` | Versão do contrato de dados (`1.1.0`) |
| `debug_mode` | `true` quando a página é aberta com `?debug_mode=true` |

As URLs de destino são sanitizadas antes do envio. O telefone e a mensagem pré-preenchida do WhatsApp, assim como UTMs dos destinos, não entram nos parâmetros de evento.

## 4. Configuração do GTM

### Variáveis da camada de dados

Crie variáveis do tipo **Data Layer Variable**, versão 2, com o mesmo nome da variável e do campo:

`measurement_version`, `page_type`, `page_path`, `debug_mode`, `link_id`, `link_name`, `link_url`, `link_domain`, `link_type`, `link_section`, `link_position`, `link_position_global`, `outbound`, `visibility_threshold`, `scroll_percent` e `theme`.

Use nomes claros no GTM, por exemplo `DLV - link_id`.

### Acionadores

1. `CE - Link interaction`: evento personalizado com regex `^(link_click|link_view)$`.
2. `CE - Scroll depth`: evento personalizado igual a `scroll_depth`.
3. `CE - Theme change`: evento personalizado igual a `theme_change`.
4. `CE - Analytics consent granted`: evento personalizado igual a `analytics_consent_granted`.

### Google tag e GA4

1. Crie uma **Google tag** com o ID `G-0NBE7P632T` e acionador **Initialization - All Pages**. Este é o fluxo Web já usado pela propriedade `Compras.Ikebana`; não crie um segundo fluxo para o agregador.
2. Crie `GA4 - Link interaction`, do tipo evento do GA4:
   - nome do evento: variável incorporada `{{Event}}`;
   - parâmetros: todos os campos `link_*`, mais `outbound`, `visibility_threshold`, `page_type`, `page_path`, `measurement_version` e `debug_mode`;
   - acionador: `CE - Link interaction`.
3. Crie `GA4 - Scroll depth`:
   - evento: `scroll_depth`;
   - parâmetros: `scroll_percent`, `page_type`, `page_path`, `measurement_version` e `debug_mode`;
   - acionador: `CE - Scroll depth`.
4. Crie `GA4 - Theme change`:
   - evento: `theme_change`;
   - parâmetros: `theme`, `page_type`, `page_path`, `measurement_version` e `debug_mode`;
   - acionador: `CE - Theme change`.

Mantenha a medição otimizada existente ativa, inclusive cliques de saída e rolagens, porque o mesmo fluxo atende a loja. Os eventos automáticos continuarão como `click` e `scroll`; os eventos mais completos e exclusivos do agregador usam `link_click` e `scroll_depth`. Nos relatórios do agregador, filtre pelos eventos personalizados e por `page_type = link_aggregator` para não misturar as duas taxonomias.

### Microsoft Clarity

1. Não altere nem remova o projeto ou o snippet atual da Ikebana Flores.
2. Use o projeto separado **Ikebana Links**, associado somente a `links.ikebanaflores.com.br`, ID `yb3ifl2hxa`.
3. No GTM do agregador, use o template da galeria **Microsoft Clarity - Official**.
4. Dispare a tag com `CE - Analytics consent granted`, uma vez por página, e exija o consentimento adicional `analytics_storage`.
5. Não use **All Pages** para o Clarity e não instale um snippet manual em paralelo.
6. A Consent API V2 do Clarity é atualizada pelo banner antes de a tag ser carregada.

O Clarity já registra gravações, heatmaps, cliques e rolagem. Não é necessário reenviar cada clique como outra tag. Os eventos estruturados permanecem no GA4; o Clarity cuida da análise visual.

## 5. Dimensões personalizadas no GA4

Em **Administrador → Definições personalizadas**, crie dimensões de escopo de evento para:

`link_id`, `link_name`, `link_type`, `link_section`, `link_position`, `link_position_global`, `page_type`, `measurement_version` e `theme`.

Crie `scroll_percent` como métrica personalizada de evento com unidade **Padrão**. `link_url` e `link_domain` podem ser enviados e inspecionados sem criar dimensões extras quando os relatórios nativos já forem suficientes.

As definições personalizadas não são retroativas: crie-as antes de iniciar a análise de produção.

## 6. Indicadores recomendados

- CTR por exposição: eventos `link_click` / eventos `link_view`, agrupados por `link_id`.
- CTR por sessão: sessões com `link_click` / sessões.
- CTR por posição: `link_click` / `link_view`, agrupados por `link_section` + `link_position`.
- Alcance de página: usuários por `scroll_percent`.
- Performance do destino: cliques e usuários por `link_type`, `link_name` e `link_domain`.

Para uma tabela com CTR calculado, use uma Exploração do GA4 ou o Looker Studio. Prefira usuários quando a pergunta for “quantas pessoas” e contagem de eventos quando a pergunta for “quantas interações”.

## 7. UTMs e atribuição

Use UTMs na URL que leva **ao agregador**, por exemplo:

```text
https://links.ikebanaflores.com.br/?utm_source=instagram&utm_medium=social&utm_campaign=bio_2026
```

O `page_view` do GA4 lê esses parâmetros automaticamente. Não é necessário duplicá-los nos eventos.

Os três links atuais para `www.ikebanaflores.com.br` preservam UTMs fixas de Instagram porque os destinos existentes não foram alterados neste pacote. Isso pode atribuir ao Instagram uma visita que originalmente chegou ao agregador por outro canal. Antes de ampliar as campanhas, escolha uma destas estratégias:

- usar a mesma propriedade/Google tag nos dois subdomínios e verificar a continuidade de sessão e autorreferências; depois remover as UTMs fixas dos destinos; ou
- manter propriedades separadas e definir conscientemente a regra de atribuição entre agregador e loja.

Não propague cegamente parâmetros recebidos para links externos; use uma lista permitida e nunca encaminhe identificadores pessoais.

## 8. Consentimento

O site implementa Google Consent Mode v2 com `analytics_storage`, `ad_storage`, `ad_user_data` e `ad_personalization` negados por padrão. O banner permite aceitar ou recusar analytics e mantém a escolha no navegador. O Clarity usa Consent API V2 e só é carregado pelo evento `analytics_consent_granted`; anúncios e personalização permanecem negados em todos os casos.

## 9. Teste completo

### Antes do GTM

1. Abra a página local ou publicada.
2. No console, execute `window.ikebanaMeasurement` e confirme `version: "1.1.0"`.
3. Execute `window.dataLayer.filter(item => item.event)`.
4. Role a página e clique nos links. Devem aparecer `link_view`, `scroll_depth`, `theme_change` e `link_click` com IDs e posições corretos.

### GTM e GA4

1. Confirme o ID `GTM-M8T8Q6B7`, publique uma versão de teste e depois publique o container do GTM.
2. Abra:

```text
https://links.ikebanaflores.com.br/?debug_mode=true&utm_source=qa&utm_medium=test&utm_campaign=measurement_validation
```

3. No GA4, abra **Administrador → DebugView**. Confirme `page_view` e os quatro eventos personalizados.
4. Clique em cada evento e confira `link_id`, `link_section`, posições e demais parâmetros.
5. Em **Relatórios → Tempo real**, confirme um usuário ativo, a origem `qa / test` e os eventos.
6. No painel de rede do navegador, filtre por `collect`. Um clique de saída pode gerar tanto o evento automático `click` quanto o evento estruturado `link_click`; isso é esperado no fluxo compartilhado. Para calcular CTR e posição dos links, use somente `link_click`, `link_view` e `scroll_depth`.

### Clarity

1. Na mesma visita de teste, clique em cards, redes sociais, alternador de tema e role até o final.
2. No painel do Clarity, confirme que a sessão e a gravação aparecem no projeto correto.
3. Abra a gravação e um heatmap para verificar cliques e profundidade de rolagem.
4. No painel de rede do navegador, filtre por `clarity` e confirme que existe uma única instalação. Se houver duas, remova o snippet manual ou a segunda tag do GTM.

Relatórios agregados e dimensões personalizadas podem levar mais tempo para consolidar; DebugView e Tempo real são os testes imediatos.
