# SpotiCristo

App Next.js para ouvir músicas gravadas em ensaios. Desenvolvimento é
orientado a specs via [GitHub Spec Kit](https://github.com/github/spec-kit):
princípios em `.specify/memory/constitution.md`.

## Getting Started

Para habilitar as playlists, adicione em cada tabela de músicas do Airtable um
campo chamado `playlist`. Ele pode ser do tipo **seleção única** ou **seleção
múltipla**. Os cards são criados automaticamente a partir dos valores
preenchidos nesse campo; músicas sem playlist continuam aparecendo na listagem
geral.

## Configuração de gravações

O Airtable é acessado apenas pelas rotas do servidor. Configure no ambiente de
produção `AIRTABLE_BASE`, `AIRTABLE_TOKEN`, `AIRTABLE_ALBUMS_TABLE_ID`,
`RECORDING_PASSWORD` e `RECORDING_AUTH_SECRET`. O token precisa dos escopos
`data.records:read`, `data.records:write`, `schema.bases:read` e
`schema.bases:write` no base. Não use `NEXT_PUBLIC_AIRTABLE_TOKEN` em novos
deploys; rotacione o token que já foi exposto ao navegador.

O envio e a gravação aceitam arquivos de até 4 MB, para permanecer dentro do
limite da Vercel e do endpoint de anexos do Airtable.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
