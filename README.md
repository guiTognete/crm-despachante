# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Deploy

Este projeto usa rotas client-side (`react-router-dom`) com `/login` e `/dashboard`. Ao publicar, o servidor precisa devolver `index.html` pra qualquer path (fallback de SPA), senão dar F5 direto em `/dashboard` retorna 404.

- **Netlify**: já incluso em `public/_redirects`.
- **Vercel**: já incluso em `vercel.json`.
- **Outro host estático** (ex: nginx, Apache, S3+CloudFront): configure o fallback manualmente pra `index.html` com status 200 pra rotas desconhecidas.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
