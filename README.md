# Duas Cataratas — Primetour (conceito)

Landing page experimental e **não oficial** de turismo premium, apresentando Foz do Iguaçu e Cataratas do Niágara.

> Este projeto é apenas uma demonstração de design e desenvolvimento, sem afiliação comercial com a Primetour e sem serviço de reservas.

## Demonstração

https://primetour-cataratas-conceito.vercel.app/

## Funcionalidades

- Hero cinematográfica com vídeos de cachoeiras, reprodução silenciosa e `playsinline`.
- Cabeçalho responsivo com uma única exibição da marca e fallback.
- Avião SVG independente acompanhando um arco dourado.
- Seções de Foz do Iguaçu e Cataratas do Niágara com transições na rolagem.
- Quatro cards de experiências com imagens WebP para desktop e mobile.
- Layout mobile responsivo e suporte a `prefers-reduced-motion`.
- CTAs para contato com a Primetour, sem pagamentos ou formulários de reserva.

## Estrutura

```text
index.html
assets/
  iguacu.webp
  iguacu_walk.webp
  niagara_detail.webp
  traveler.webp
  experience_1_desktop.webp
  experience_1_mobile.webp
  ...
  experience_4_desktop.webp
  experience_4_mobile.webp
```

Site estático em HTML, CSS e JavaScript, sem framework e sem build obrigatório.

## Executar localmente

```bash
python -m http.server 8000
```

Acesse http://localhost:8000.

## Publicar

**Vercel:** importe o repositório, selecione projeto estático sem framework e mantenha `index.html` na raiz (sem comando de build).

**GitHub Pages:** em Settings → Pages, selecione Deploy from a branch, `main`, `/ (root)`.

## Licenças e uso

- A marca e o logotipo Primetour pertencem a seus titulares. Não há licença comercial implícita.
- A hero utiliza vídeos externos do Pexels; confirme as condições de licença antes de qualquer campanha comercial.
- O logotipo oficial é carregado por URL externa. Para produção, valide sua autorização de uso.
- As fotografias demonstrativas estão em `assets/` e precisam de verificação de direitos antes de uso comercial.

## Estado

**V6** — remoção da marca duplicada, SVG do avião corrigido, cards em alta resolução e layout adaptado para mobile. A homologação em dispositivos reais ainda está pendente.
