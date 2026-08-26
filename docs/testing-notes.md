# Validação local

Após atualizar a branch:

```powershell
npm install
docker compose up -d --build api web
```

Validar:

- alternância claro/escuro no topo;
- `/teacher/challenges` com criação, edição e exclusão de desafios;
- `/classes/:id` com posts, textos e documentos;
- upload e abertura de arquivo após recriar o container da API.
