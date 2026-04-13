# Galeria de Prompts

App para organizar e gerenciar seus prompts de arte por categorias.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:5173

## Deploy na Vercel

1. Suba para o GitHub:
```bash
git init
git add .
git commit -m "primeiro commit"
git remote add origin https://github.com/SEU_USUARIO/prompt-gallery.git
git push -u origin main
```

2. Entre em vercel.com → New Project → importe o repositório → Deploy

Pronto! A Vercel detecta o Vite automaticamente.

## Deploy no Netlify

1. Mesmo processo do GitHub acima
2. Entre em netlify.com → Add new site → Import from Git
3. Build command: `npm run build`
4. Publish directory: `dist`

## Funcionalidades

- Categorias e subcategorias ilimitadas
- Copiar prompt com um clique
- Subir imagem de exemplo por prompt
- Busca em tempo real
- Dados salvos no navegador (localStorage)
