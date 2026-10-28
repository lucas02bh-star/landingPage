# ADONAY — Landing page

Landing page com giro 360° da camiseta e vista explodida das camadas da estampa,
animada com GSAP + ScrollTrigger + Lenis. O único botão de ação leva ao WhatsApp.

## Estrutura

- `site/` — a página publicada (HTML, CSS, JS e imagens WebP)
- `tools/` — scripts Python que geram as imagens a partir do protótipo
- `prototipo/` — protótipo original e imagens de origem

## Ver localmente

```bash
python -m http.server 5173 --directory site
```

Depois abra http://localhost:5173

## Publicação

Cada push na branch `main` publica a pasta `site/` no GitHub Pages
(`.github/workflows/pages.yml`).

## Configurar o WhatsApp

Em `site/js/main.js`, preencha `WHATSAPP_NUMBER` (DDI + DDD + número, só dígitos).
