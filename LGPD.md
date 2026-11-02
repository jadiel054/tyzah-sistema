# Política de Privacidade e Conformidade LGPD — Ty_Zah Sistema

Esta política de privacidade estabelece as diretrizes de tratamento de dados pessoais no **Ty_Zah Sistema**, em total conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).

---

## 1. Princípio da Minimização de Dados
O sistema coleta e processa apenas os dados estritamente necessários para a execução dos serviços de barbearia:
- **Nome do cliente**: Para identificação no atendimento e na agenda do barbeiro.
- **Número de WhatsApp / Celular**: Para envio de mensagens de confirmação, lembretes de horário e aviso de vagas na lista de espera.
- **Histórico e Notas de Atendimento**: Informações fornecidas no agendamento ou anotadas pelo profissional (ex: preferência de corte) para prestar um atendimento personalizado.

Não são coletados dados sensíveis, como CPF, dados biométricos, religião ou dados financeiros de cartão de crédito.

---

## 2. Base Legal de Tratamento (Art. 7º da LGPD)
O tratamento dos dados pessoais fundamenta-se em:
1. **Execução de Contrato / Procedimentos Preliminares (Art. 7º, V)**: Necessário para formalizar o agendamento de horário e viabilizar a prestação do serviço contratado pelo cliente.
2. **Consentimento (Art. 7º, I)**: Fornecido expressamente pelo usuário ao preencher o formulário de reserva ou entrar voluntariamente na lista de espera.

---

## 3. Compartilhamento de Dados
Os dados coletados **nunca** são vendidos, alugados ou compartilhados com terceiros para fins de marketing ou publicidade. O compartilhamento ocorre exclusivamente:
- Com a infraestrutura em nuvem segura necessária para a operação da aplicação (Neon PostgreSQL / Vercel).
- Com a API do WhatsApp (Meta) quando o usuário ou o estabelecimento clica no link para iniciar uma conversa.

---

## 4. Direitos do Titular (Art. 18 da LGPD)
Todo cliente da barbearia possui os seguintes direitos garantidos:
- **Confirmação e Acesso**: Saber quais dados seus estão armazenados no sistema.
- **Correção**: Solicitar a correção de dados incompletos, inexatos ou desatualizados.
- **Anonimização, Bloqueio ou Eliminação**: Solicitar a exclusão definitiva do seu cadastro e histórico de agendamentos.
- **Revogação do Consentimento**: Retirar-se da lista de espera a qualquer momento.

Para exercer seus direitos, o titular pode entrar em contato diretamente pelo WhatsApp oficial da Barbearia Ty_Zah.

---

## 5. Medidas de Segurança da Informação
- O painel administrativo é restrito por autenticação criptografada (bcrypt e JWT HS256 com chave segura).
- Todas as comunicações utilizam criptografia de ponta a ponta (HTTPS/TLS).
- Limitação de taxa de requisições (rate limiting) para coibir raspagem de dados ou ataques de força bruta.
- Suporte a limpeza atômica de campos opcionais no banco de dados.
