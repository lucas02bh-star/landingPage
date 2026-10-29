# Boas práticas: landing page com tráfego Google Ads e conversão via WhatsApp (camisa personalizada, Brasil)

Pesquisa feita em outubro/2026. Fontes oficiais (Google Ads Help, web.dev, Think with Google, ANPD via resumos jurídicos) foram priorizadas; dados de fornecedores (RD Station, respond.io, Wati, Unbounce etc.) estão marcados como tal.

## 1. O que o Google diz oficialmente sobre experiência na página de destino e Índice de Qualidade?

### Takeaway
Oficialmente o Google define a experiência na página de destino só como "relevância e utilidade da página para quem clica no anúncio", avaliada como acima da média / na média / abaixo da média. Os critérios práticos (conteúdo relevante e original, transparência, navegabilidade) vêm das diretrizes de qualidade de página de destino do Google, e velocidade/mobile entram como parte da "utilidade". O Índice de Qualidade é diagnóstico, não entra no leilão diretamente.

### Cited Findings
- Índice de Qualidade (1 a 10, por palavra-chave) tem 3 componentes: CTR esperada, relevância do anúncio e experiência na página de destino — [RD Station](https://www.rdstation.com/blog/marketing/indice-de-qualidade-google-ads/); [Google Ads Help](https://support.google.com/google-ads/answer/2404197?hl=pt-BR)
- Definição oficial: experiência na página de destino = "qual é a relevância e utilidade da página de destino para as pessoas que clicam no anúncio"; nota comparada com anunciantes que exibiram anúncios para a mesma pesquisa nos últimos 90 dias; status acima da média / na média / abaixo da média — [Google Ads Help (pt-BR)](https://support.google.com/google-ads/answer/2404197?hl=pt-BR)
- O Índice de Qualidade é uma ferramenta de diagnóstico, não um indicador de performance principal, e não é um insumo direto do leilão — [Google Ads Help](https://support.google.com/google-ads/answer/2404197?hl=pt-BR)
- Diretrizes de qualidade de página de destino do Google têm 3 componentes: conteúdo relevante e original, transparência e navegabilidade — [Google AdSense Help (cita as Landing Page Quality Guidelines)](https://support.google.com/adsense/answer/1348727?hl=en)
- RD Station detalha: (a) conteúdo relevante = a página deve conter as palavras-chave compradas e dar continuidade à mensagem do anúncio; (b) transparência = páginas poluídas por banners e pop-ups prejudicam; (c) navegabilidade = mandar para página específica, não para a home. Artigo de 2020 (antigo, mas critérios seguem válidos) — [RD Station](https://www.rdstation.com/blog/marketing/indice-de-qualidade-google-ads/)
- Transparência, segundo blogs que resumem as diretrizes: identificar claramente o negócio, preços, políticas e contato; explicar o produto antes de pedir dados pessoais — [Apexure](https://www.apexure.com/blog/which-attributes-describe-a-good-landing-page-experience); [LeadSquared](https://www.leadsquared.com/learn/marketing/landing-page-optimization-for-google-adwords/) (fontes secundárias)
- Índices mais altos (7–10) tendem a reduzir CPC e melhorar posição — [Valor Final (curso, atualizado 2026)](https://valorfinal.com.br/cursos/trafego-pago/google-ads-pesquisa-pmax-e-ia/pagina-de-destino-indice-de-qualidade) (fonte secundária)
- Velocidade mobile: 53% das visitas mobile são abandonadas se a página leva mais de 3 s para carregar; probabilidade de rejeição sobe 113% quando o carregamento vai de 1 s para 7 s (dados Google/SOASTA de 2017) — [Think with Google](https://thinkwithgoogle.com/consumer-insights/consumer-trends/mobile-site-load-time-statistics/); [Think with Google benchmarks](https://thinkwithgoogle.com/intl/en-gb/marketing-strategies/app-and-mobile/mobile-page-speed-new-industry-benchmarks)

### Inferences
- Para camisa personalizada: cada grupo de anúncios (igreja, terceirão/formatura, empresa/uniforme) deve cair numa página (ou variação) cujo H1 repete o termo do anúncio ("Camisas personalizadas para igreja"), com o produto visível sem rolar.
- Transparência na prática: CNPJ, endereço/cidade, telefone/WhatsApp, prazo de produção, "preço a partir de", política de troca/pedido mínimo, fotos reais de pedidos entregues. Evitar pop-up de entrada.
- Navegação: página única com âncoras é ok; não mandar para home genérica; não usar menu que leve para fora do funil.

### Gaps
- O artigo oficial "5 maneiras de usar o Índice de Qualidade" e a página oficial com dicas de experiência na página de destino não foram lidos na íntegra (a página principal não lista os critérios). O Google não publica pesos dos fatores nem um limite oficial de velocidade para o Índice de Qualidade.
- O dado de 53%/3 s é de 2017; não achei atualização oficial mais recente.

## 2. Core Web Vitals e como manter uma página visualmente rica (GSAP, sequência de imagens, 3D) rápida

### Takeaway
Metas: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1, medidas no percentil 75 separado por mobile/desktop. Animações devem usar só `transform`/`opacity`; a imagem do LCP (hero) nunca pode ser lazy-load nem depender de JS; sequências de imagem devem ir para `<canvas>`, em WebP, com menos frames e resolução menor no celular, carregadas depois do primeiro paint.

### Cited Findings
- Metas "bom": LCP ≤ 2,5 s; INP ≤ 200 ms; CLS ≤ 0,1. A página passa se atingir as três no percentil 75 das visitas, segmentado mobile/desktop — [web.dev Web Vitals](https://web.dev/articles/vitals)
- LCP: colocar a imagem do hero no HTML inicial (`src`/`srcset`), não em CSS background ou JS; se vier de CSS, usar `<link rel="preload" fetchpriority="high" as="image">` — [web.dev Optimize LCP](https://web.dev/articles/optimize-lcp)
- `fetchpriority="high"` só em 1–2 imagens; `fetchpriority="low"` em imagens fora da tela (ex.: slides de carrossel) — [web.dev Optimize LCP](https://web.dev/articles/optimize-lcp)
- Nunca fazer lazy-load da imagem do LCP; servir AVIF/WebP no tamanho certo e comprimido — [web.dev Optimize LCP](https://web.dev/articles/optimize-lcp)
- Evitar JS síncrono no `<head>` (usar `defer`/`async`); CSS bloqueante menor que o recurso do LCP; hospedar o recurso LCP na mesma origem — [web.dev Optimize LCP](https://web.dev/articles/optimize-lcp)
- Distribuição alvo do LCP: ~40% TTFB, <10% atraso de carregamento do recurso, ~40% duração do download, <10% atraso de renderização — [web.dev Optimize LCP](https://web.dev/articles/optimize-lcp)
- Animações: animar apenas `transform` e `opacity` (ficam na etapa de composição, sem layout/paint); mover com `translate`, não `top/left`; `will-change` com parcimônia e só antes da mudança; verificar no painel Performance / Paint Flashing — [web.dev Animations guide](https://web.dev/articles/animations-guide)
- Sequência de imagens com ScrollTrigger: desenhar os frames num `<canvas>` em vez de trocar o `src` de uma `<img>` — [Fórum GSAP](https://gsap.com/community/forums/topic/25188-airpods-image-sequence-animation-using-scrolltrigger/)
- Regra prática (autor de guia, não benchmark): no mobile ~60–90 frames, WebP q75–80, orçamento ~1–2 MB; desktop 120–180 frames, 2–4 MB — [claudskills scroll-animation](https://claudskills.com/skills/scroll-animation/SKILL.md)
- Case Codrops (OPTIKKA): conjuntos de frames separados para desktop e mobile, com menos frames no mobile — [Codrops](https://tympanus.net/codrops/?p=103024)
- Limitar o backing store do canvas a devicePixelRatio 1,5 e WebP q68 foi o equilíbrio encontrado por um desenvolvedor — [DEV Community](https://dev.to/pratham7711/how-i-made-a-scroll-scrubbed-video-portfolio-fast-nextjs-15-gsap-canvas-1mj6)
- Há discordância entre pré-carregar todos os frames (evita frames em branco) e carregar sob demanda (menos requisições) — [Fórum GSAP: performance de image sequence](https://gsap.com/community/forums/topic/31234-scrolltrigger-image-sequence-performance/)

### Inferences
- O primeiro frame da sequência (ou uma foto estática do produto) deve ser a imagem do LCP, em `<img>` no HTML com `fetchpriority="high"`; os demais frames carregam depois do evento `load` / quando a seção se aproxima (IntersectionObserver).
- Reservar dimensões (width/height ou `aspect-ratio`) para hero, canvas e cards evita CLS; fontes com `font-display: swap` e preload da fonte principal.
- INP: scripts de animação pesados e muitos ScrollTriggers podem atrasar a resposta ao toque no botão do WhatsApp; o handler do botão deve ser leve (só disparar evento e abrir link). Considerar `prefers-reduced-motion` e versão simplificada no celular.
- GSAP + ScrollTrigger carregados com `defer`; tags de marketing (GTM) carregadas sem bloquear renderização.
- Medir com PageSpeed Insights (dados de campo CrUX quando houver tráfego) e Lighthouse em modo mobile.

### Gaps
- Faixas "precisa melhorar"/"ruim" (LCP 2,5–4 s / >4 s; INP 200–500 ms / >500 ms; CLS 0,1–0,25 / >0,25) não foram confirmadas no texto buscado (estão em gráficos do web.dev).
- Não achei benchmark oficial de impacto de GSAP/three.js sobre INP; recomendações são de comunidade.

## 3. Rastreamento de cliques no WhatsApp (GA4, Google Ads, GTM, mensagem pré-preenchida)

### Takeaway
O padrão de mercado é: no GTM, gatilho de clique no link `wa.me`/botão → evento GA4 (ex. `whatsapp_click` / `generate_lead`) e/ou tag de conversão do Google Ads (ID + rótulo). O texto pré-preenchido do WhatsApp não volta para Google Ads/GA4, então serve só para o atendente identificar a origem; atribuição real a vendas exige capturar GCLID/UTM e cruzar depois (conversões offline), e esse fluxo é frágil.

### Cited Findings
- Passo a passo GTM: criar tag de conversão Google Ads (ID de conversão + rótulo) ou evento GA4 (ID de medição + nome do evento), com gatilho de clique filtrado por seletor CSS do botão do WhatsApp — [respond.io (es)](https://respond.io/es/help/capture-leads/how-to-attribute-whatsapp-conversations-to-non-meta-ads); [respond.io (pt)](https://respond.io/pt/help/capture-leads/how-to-attribute-whatsapp-conversations-to-non-meta-ads.md) (fornecedor)
- Recomenda-se adicionar um identificador de clique ao texto do link do WhatsApp para associar a conversa ao anúncio; mas o texto pré-preenchido não é sincronizado automaticamente com Google Ads ou GA4 — [respond.io](https://respond.io/help/capture-leads/how-to-attribute-whatsapp-conversations-to-non-meta-ads.md)
- Na prática o GCLID frequentemente chega vazio ao CRM no fluxo anúncio → site → WhatsApp (relato de anunciante em 2026) — [Workana](https://www.workana.com/pt/job/especialista-em-otimizacao-de-rastreamento-de-conversoes-google-ads-e-pipedrive)
- Formato do link: `https://wa.me/<número internacional sem +, sem zeros, sem pontuação>?text=<texto URL-encoded>`; o texto aparece editável na caixa e o usuário ainda precisa apertar enviar — [Bird](https://bird.com/explained/whatsapp/what-is-a-whatsapp-click-to-chat-link.md); [Unipile](https://www.unipile.com/br/?p=275019)
- Codificar com `encodeURIComponent()`; espaço %20, quebra de linha %0A; não deixar espaço cru (pode virar `%2520`) — [Bird](https://bird.com/explained/whatsapp/what-is-a-whatsapp-click-to-chat-link.md); [Unipile](https://www.unipile.com/br/?p=275019)
- Google tem anúncios "clique para enviar mensagem" (ativo de mensagem) que abrem conversa no WhatsApp direto da Pesquisa/PMax; segundo fornecedor, o acesso exigia autorização da conta (beta) — [Wati](https://support.wati.io/pt-BR/articles/11462076-google-ctm-ads-tudo-o-que-voce-precisa-saber) (fornecedor; confirmar na Central do Google)
- Sem ferramenta intermediária, empresas costumam montar solução própria com UTMs e integração de API para devolver dados ao Google Ads — [Wati](https://support.wati.io/pt-BR/articles/15970225-qualifique-e-direcione-leads-de-anuncios-google-click-to-message)

### Inferences
- Implementação recomendada para um negócio pequeno (grátis): todos os botões de WhatsApp com classe comum (ex. `.js-whatsapp`) e `data-local` (hero, card-igreja, sticky, rodapé); um único listener em JS que (1) dispara `gtag('event','generate_lead'/ 'whatsapp_click', {local, campanha})` e (2) monta o `?text=` com o contexto. Marcar o evento como conversão principal no GA4 e importar no Google Ads, ou criar conversão "Clique no WhatsApp" direto via tag do Ads.
- Texto pré-preenchido sugerido: "Olá! Vim pelo site e quero um orçamento de camisas personalizadas para [igreja/terceirão/empresa]. Quantidade aproximada: __" — com um código curto da campanha (ex. "#IG01") para o atendente anotar a origem. Evitar colocar dados pessoais na URL.
- Como clique ≠ venda, otimizar lances com cuidado; quando possível, registrar vendas fechadas (com GCLID salvo no navegador/planilha) e subir como conversão offline.

### Gaps
- Não encontrei página oficial do Google Ads especificamente sobre medir cliques em WhatsApp como conversão; nem a documentação oficial atual dos anúncios de mensagem para o Brasil.

## 4. Dados de CRO sobre WhatsApp no Brasil, formulário vs WhatsApp, sinais de confiança e headline dinâmica

### Takeaway
Não há benchmark público confiável de taxa de conversão de botão de WhatsApp em landing pages brasileiras; os números circulantes são de fornecedores. A evidência mais sólida é indireta: penetração quase total do WhatsApp e hábito de falar com empresas por ele. Headline dinâmica por parâmetro (message match) tem um A/B test público com +31,4%.

### Cited Findings
- WhatsApp estaria em 99% dos smartphones brasileiros e 76% dos usuários já falam com empresas por ele (blog de fornecedor, sem fonte primária identificada) — [Cosmobots](https://cosmobots.io/?p=9152)
- RD Station afirma que o botão de WhatsApp aumenta leads qualificados e evita que o visitante saia sem deixar contato, sem números de estudo — [RD Station](https://www.rdstation.com/blog/marketing/botao-whatsapp-no-site)
- Caso Meta: A Escola de Confeitaria (SP) usou anúncios que levam a landing page com WhatsApp e obteve mais compras que a abordagem habitual (sem percentual nos trechos) — [WhatsApp Business](https://whatsappbusiness.com/resources/success-stories/a-escola-de-confeitaria/)
- "Click-to-WhatsApp converte 3–5x mais que anúncios tradicionais" — afirmação sem metodologia, tratar com cautela — [MessageCentral](https://www.messagecentral.com/blog/click-to-whatsapp-ads-brazil)
- Teste A/B Unbounce/Campaign Monitor: troca dinâmica do verbo do headline conforme a palavra-chave deu +31,4% de conversões (77 dias, >100 conversões por variante) — [Unbounce](https://unbounce.com/landing-page-examples/built-using-unbounce/dynamic-text-a-b-test/)
- Outras alegações (30–35%, 212%, 10–25% médio) vêm de vendedores de ferramenta/sem fonte primária — [Leadpages](https://leadpages.com/product/dynamic-text-replacement); [Foundry CRO](https://foundrycro.com/blog/landing-page-headline-benchmarks-2026/)
- Toda implementação dinâmica precisa de um texto padrão (fallback) para visitas sem parâmetro — [PPC Land](https://ppc.land/dynamic-header/)

### Inferences
- Headline dinâmica: usar `?seg=igreja|terceirao|empresa` (ou `utm_content`/`utm_campaign`) no URL final de cada grupo de anúncios; JS troca H1, subtítulo, foto do hero, ordem dos cards e o texto do WhatsApp. Sempre com fallback genérico ("Camisas personalizadas para seu grupo") e lista branca de valores (nunca injetar o parâmetro cru no HTML, para evitar XSS). Para evitar flash/CLS, trocar o texto antes do primeiro paint (script inline pequeno) ou criar páginas estáticas por segmento.
- WhatsApp vs formulário: para pedido sob encomenda (quantidade, tamanhos, arte), WhatsApp reduz atrito e permite enviar arte/fotos; formulário curto pode ser alternativa secundária para quem não quer abrir o app (ou fora do horário). Recomendação: WhatsApp como CTA principal; formulário opcional, não concorrente.
- Sinais de confiança: avaliações reais do Google (nota + número + trechos, com link para o perfil), fotos reais de pedidos entregues (grupos de igreja, turmas, equipes), logotipos/nomes de clientes com permissão, CNPJ e endereço/cidade no rodapé, prazo e pedido mínimo explícitos, "como funciona" em 3–4 passos.
- Cards de produto: foto real grande (proporção fixa), título com o caso de uso ("Camisa para igreja"), "a partir de R$ X" (transparência de preço), 2–3 mini benefícios (tecido, estampa, prazo), botão "Pedir orçamento no WhatsApp" com mensagem pré-preenchida específica do card.
- Estrutura mobile-first acima da dobra: H1 que espelha o anúncio + subtítulo com benefício/prazo + foto real ou primeiro frame da animação + CTA WhatsApp + prova curta (★ 4,9 no Google / "X pedidos entregues"). Depois: cards por segmento → como funciona → galeria real → avaliações → FAQ (prazo, mínimo, pagamento, entrega) → CTA final + rodapé com CNPJ/endereço. Botão de WhatsApp fixo (sticky) no rodapé em mobile, sem cobrir conteúdo nem o banner de cookies; CTA repetido a cada 1–2 seções.

### Gaps
- Nenhuma pesquisa primária brasileira com taxa média de conversão de botão de WhatsApp em landing page foi encontrada; também não achei estudos sobre sticky button vs não-sticky especificamente para WhatsApp. Recomenda-se teste A/B próprio.
- Não pesquisei dados específicos sobre impacto de avaliações do Google na conversão (ex.: pesquisas BrightLocal) nesta rodada.

## 5. LGPD e consentimento de cookies no Brasil

### Takeaway
A ANPD (Guia Orientativo de Cookies, out/2022) pede banner com opção real de recusar cookies não necessários e escolher por categoria, com não necessários desligados por padrão. O Consent Mode v2 do Google é exigido para tráfego do EEE/Reino Unido, não por regra específica para o Brasil, mas é a forma técnica natural de respeitar o consentimento no GA4/Ads.

### Cited Findings
- ANPD publicou em outubro de 2022 o Guia Orientativo sobre cookies e proteção de dados pessoais; segue como referência — [Mattos Filho](https://www.mattosfilho.com.br/unico/anpd-guia-cookies-protecao-dados/); [Confidata](https://confidata.com.br/blog/cookies-rastreamento-consentimento-anpd)
- Banner de 1º nível deve permitir recusar cookies não necessários e não só "aceitar"; destacar só o aceite ou usar um único botão "concordo/ciente" é desaconselhado quando a base é consentimento — [Lefosse](https://lefosse.com/noticias/anpd-publica-guia-orientativo-sobre-o-uso-de-cookies); [Mattos Filho](https://www.mattosfilho.com.br/unico/anpd-guia-cookies-protecao-dados/)
- 2º nível: categorias por finalidade, consentimento por finalidade, cookies dependentes de consentimento desativados por padrão — [Mattos Filho](https://www.mattosfilho.com.br/unico/anpd-guia-cookies-protecao-dados/)
- Cookies estritamente necessários: legítimo interesse pode ser a base legal; publicidade/analytics tendem a exigir consentimento — [Mattos Filho](https://www.mattosfilho.com.br/unico/anpd-guia-cookies-protecao-dados/); [Lec](https://lec.com.br/guia-orientativo-da-anpd) (resumos jurídicos)
- Consent Mode v2 (parâmetros `ad_user_data`, `ad_personalization`, além de `ad_storage`/`analytics_storage`) é exigido pelo Google para quem recebe dados de usuários do EEE; a página oficial não menciona o Brasil — [Google Help: Set up and manage consent](https://support.google.com/google-ads/answer/13802165); [CookieScript](https://cookie-script.com/blog/google-consent-mode-v2/amp)

### Inferences
- Para a landing: banner discreto (rodapé, não modal que cubra o hero — também protege LCP/CLS e "transparência"), botões "Aceitar" e "Recusar" com mesmo destaque + "Personalizar"; Consent Mode com default `denied` para ads/analytics e `granted` após aceite; link para política de privacidade com CNPJ e contato. Isso reduz dados medidos, mas o Consent Mode permite modelagem de conversões pelo Google.
- O próprio clique no WhatsApp envia o usuário para outra plataforma (Meta); vale mencionar isso na política de privacidade.

### Gaps
- Não li o PDF oficial da ANPD diretamente (só resumos de escritórios). Não há posição oficial do Google tornando Consent Mode obrigatório para tráfego brasileiro; confirmar com assessoria jurídica se necessário.
