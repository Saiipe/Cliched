import type { LegalContent, LegalPageType } from '../models/legal-content.model';

export const LEGAL_CONTENT: Readonly<Record<LegalPageType, LegalContent>> = {
  privacidade: {
    title: 'Política de Privacidade',
    updatedAt: 'julho de 2026',
    intro:
      'Esta política explica o que o Cliched coleta e como esses dados são usados enquanto você joga.',
    sections: [
      {
        heading: 'Sessão anônima',
        body: 'Para jogar o desafio diário sem precisar criar conta, geramos um token de sessão anônimo, guardado no armazenamento local (localStorage) do seu navegador. Ele identifica só a sua sequência de tentativas naquele aparelho e não contém nome, e-mail ou qualquer dado pessoal.',
      },
      {
        heading: 'Conta e login',
        body: 'O cadastro com conta (e-mail/senha) ainda está em construção. Quando estiver disponível, esta política será atualizada para detalhar exatamente quais dados de conta são coletados.',
      },
      {
        heading: 'Dados de filmes (TMDB)',
        body: 'As informações de filmes (título, elenco, pôsteres, sinopses) vêm da API do The Movie Database (TMDB). O Cliched não é endossado ou certificado pelo TMDB.',
      },
      {
        heading: 'Não vendemos seus dados',
        body: 'Não compartilhamos nem vendemos dados de jogadores para terceiros com fins publicitários.',
      },
      {
        heading: 'Contato',
        body: 'Dúvidas sobre privacidade podem ser enviadas pelos canais de comunidade linkados no rodapé do site.',
      },
    ],
  },
  termos: {
    title: 'Termos de Uso',
    updatedAt: 'julho de 2026',
    intro: 'Ao jogar o Cliched, você concorda com os termos descritos abaixo.',
    sections: [
      {
        heading: 'O que é o Cliched',
        body: 'Cliched é uma plataforma de jogos de adivinhação sobre cinema (sinopse, pôster, elenco, entre outros modos), incluindo um desafio diário compartilhado por todos os jogadores.',
      },
      {
        heading: 'Uso adequado',
        body: 'Não é permitido automatizar palpites (bots), explorar falhas para obter vantagem indevida no ranking, ou tentar acessar a resposta do desafio antes da revelação por meios não previstos pelo jogo.',
      },
      {
        heading: 'Disponibilidade',
        body: 'O Cliched depende de serviços de terceiros (como o TMDB) para funcionar. Instabilidades nesses serviços podem afetar temporariamente a disponibilidade do jogo.',
      },
      {
        heading: 'Mudanças no jogo',
        body: 'Modos de jogo, regras de pontuação e a lista de destaques da página inicial podem mudar a qualquer momento, sem aviso prévio, enquanto a plataforma está em desenvolvimento ativo.',
      },
      {
        heading: 'Alterações nestes termos',
        body: 'Estes termos podem ser atualizados conforme novas funcionalidades (contas de usuário, ranking, monetização) forem lançadas.',
      },
    ],
  },
  cookies: {
    title: 'Política de Cookies',
    updatedAt: 'julho de 2026',
    intro:
      'O Cliched usa armazenamento local essencial ao funcionamento do site, e, só com sua permissão, cookies e scripts de métricas e anúncios de terceiros.',
    sections: [
      {
        heading: 'Armazenamento local essencial (localStorage)',
        body: 'Usamos o localStorage do seu navegador para guardar o token da sua sessão anônima do desafio diário, a preferência de tema (claro/escuro) e a sua escolha no banner de cookies. Esses dados ficam só no seu aparelho, não exigem consentimento (são estritamente necessários) e não são enviados a terceiros.',
      },
      {
        heading: 'Métricas de uso (Microsoft Clarity)',
        body: 'Com sua permissão (banner de cookies), usamos o Microsoft Clarity pra entender como as pessoas navegam pelo site (cliques, rolagem, tempo de sessão) e melhorar a experiência. O script só é carregado depois que você aceita; recusar não limita nenhuma funcionalidade do jogo.',
      },
      {
        heading: 'Anúncios (Google AdSense)',
        body: 'Exibimos anúncios via Google AdSense, que pode usar cookies para personalização. Você pode gerenciar suas preferências de anúncios personalizados diretamente nas configurações de anúncios do Google.',
      },
      {
        heading: 'Como mudar sua escolha',
        body: 'Sua decisão no banner de cookies fica salva neste aparelho. Pra mudar de ideia, limpe os dados de navegação/localStorage do site nas configurações do seu navegador — o banner volta a aparecer na próxima visita. Limpar esses dados também apaga sua sessão anônima local (sua sequência no desafio diário desse aparelho será reiniciada).',
      },
    ],
  },
};
