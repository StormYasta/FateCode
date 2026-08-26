# Tema e gestão docente

Esta evolução adiciona tema claro/escuro persistente, CRUD de desafios para professor/administrador e uma seção de materiais nas turmas.

Os materiais da turma são persistidos no volume Docker `class_uploads`. Posts e textos ficam em um índice JSON no volume; documentos ficam em `/app/uploads/files` e são servidos em `/uploads/*`.

Para produção, a recomendação é migrar metadados para PostgreSQL e arquivos para storage compatível com S3.
