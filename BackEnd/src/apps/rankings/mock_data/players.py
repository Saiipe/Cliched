"""Sementes dos jogadores fictícios do ranking.

Valores calibrados pela economia real do jogo: cada vitória vale de 500 a
1000 pontos e há 2 jogos por dia (diário + elenco), então uma semana
perfeita rende no máximo ~14k. Semana ≤ mês ≤ geral, sequência semanal ≤ 7,
mensal ≤ 30. As datas são deslocamentos em dias aplicados no momento do
seed (migração 0002), para os mocks nunca parecerem abandonados.

`display_name` usa nicknames no estilo dos usuários reais da aplicação
(mesmo allowlist de caracteres de `validate_username_format`: letras,
números e pontuação segura, sem espaço/acento), pedido explícito em
2026-07-18 pra não parecerem "nomes de lista telefônica" (migração
`0003_rename_mock_players_to_nicknames`).

Só um roster fixo de 10 fica com `is_active: True` (aparece no ranking) por
vez; o resto é reserva pra `MockPlayerRotationService` sacar quando um
usuário real se cadastra com o mesmo nome de um mock ativo (ver
`apps.rankings.services.mock_rotation_service`), mantendo sempre 10
visíveis sem nunca duplicar nome entre mock e conta real.

Fonte única dos mocks: a migração de seed importa daqui. Remover os mocks
no futuro = apagar as linhas de MockPlayer, nada além disso.
"""

MOCK_PLAYERS: list[dict] = [
    # Veteranos de longa data (topo do ranking geral).
    {"display_name": "CineLendaBR", "weekly_points": 12840, "monthly_points": 52300, "total_points": 3780400, "weekly_streak": 7, "monthly_streak": 29, "best_streak": 214, "streak_days_ago": 3, "last_activity_days_ago": 0, "is_active": True},
    {"display_name": "MestreDoRoteiro", "weekly_points": 11960, "monthly_points": 49780, "total_points": 2914600, "weekly_streak": 7, "monthly_streak": 30, "best_streak": 187, "streak_days_ago": 1, "last_activity_days_ago": 0, "is_active": True},
    {"display_name": "CineDetetive", "weekly_points": 9870, "monthly_points": 44510, "total_points": 2237900, "weekly_streak": 6, "monthly_streak": 26, "best_streak": 162, "streak_days_ago": 5, "last_activity_days_ago": 1, "is_active": True},
    {"display_name": "RainhaDoCinema", "weekly_points": 10420, "monthly_points": 46200, "total_points": 1893200, "weekly_streak": 7, "monthly_streak": 28, "best_streak": 145, "streak_days_ago": 2, "last_activity_days_ago": 0, "is_active": True},
    {"display_name": "SpoilerZero", "weekly_points": 8360, "monthly_points": 38940, "total_points": 1462800, "weekly_streak": 5, "monthly_streak": 23, "best_streak": 128, "streak_days_ago": 8, "last_activity_days_ago": 1, "is_active": True},
    {"display_name": "TelaDeOuroBR", "weekly_points": 9140, "monthly_points": 41870, "total_points": 1218500, "weekly_streak": 6, "monthly_streak": 27, "best_streak": 119, "streak_days_ago": 4, "last_activity_days_ago": 0, "is_active": True},
    {"display_name": "CineExpertRJ", "weekly_points": 7690, "monthly_points": 35420, "total_points": 987300, "weekly_streak": 5, "monthly_streak": 21, "best_streak": 96, "streak_days_ago": 11, "last_activity_days_ago": 2, "is_active": True},
    {"display_name": "PipocaCritica", "weekly_points": 8930, "monthly_points": 37650, "total_points": 842700, "weekly_streak": 6, "monthly_streak": 24, "best_streak": 88, "streak_days_ago": 6, "last_activity_days_ago": 0, "is_active": True},
    # Jogadores frequentes (meio de tabela).
    {"display_name": "CineViciadoSP", "weekly_points": 6540, "monthly_points": 28760, "total_points": 512400, "weekly_streak": 4, "monthly_streak": 18, "best_streak": 64, "streak_days_ago": 15, "last_activity_days_ago": 1, "is_active": True},
    {"display_name": "FilmeManiaco", "weekly_points": 7210, "monthly_points": 30150, "total_points": 468900, "weekly_streak": 5, "monthly_streak": 19, "best_streak": 57, "streak_days_ago": 9, "last_activity_days_ago": 0, "is_active": True},
    {"display_name": "RoteiroFiel", "weekly_points": 5880, "monthly_points": 25340, "total_points": 391200, "weekly_streak": 4, "monthly_streak": 16, "best_streak": 51, "streak_days_ago": 22, "last_activity_days_ago": 2, "is_active": False},
    {"display_name": "CineNerdBR", "weekly_points": 6970, "monthly_points": 27890, "total_points": 344600, "weekly_streak": 5, "monthly_streak": 20, "best_streak": 46, "streak_days_ago": 7, "last_activity_days_ago": 1, "is_active": False},
    {"display_name": "QuebraFilme", "weekly_points": 5320, "monthly_points": 23410, "total_points": 298700, "weekly_streak": 3, "monthly_streak": 14, "best_streak": 42, "streak_days_ago": 19, "last_activity_days_ago": 3, "is_active": False},
    {"display_name": "TelaEQuadro", "weekly_points": 6110, "monthly_points": 24980, "total_points": 256300, "weekly_streak": 4, "monthly_streak": 17, "best_streak": 38, "streak_days_ago": 12, "last_activity_days_ago": 0, "is_active": False},
    {"display_name": "SessaoVIP", "weekly_points": 4750, "monthly_points": 20630, "total_points": 214800, "weekly_streak": 3, "monthly_streak": 12, "best_streak": 33, "streak_days_ago": 27, "last_activity_days_ago": 2, "is_active": False},
    {"display_name": "CineViajante", "weekly_points": 5490, "monthly_points": 22140, "total_points": 187500, "weekly_streak": 4, "monthly_streak": 15, "best_streak": 29, "streak_days_ago": 10, "last_activity_days_ago": 1, "is_active": False},
    {"display_name": "RoloDeFilme", "weekly_points": 4280, "monthly_points": 18320, "total_points": 158900, "weekly_streak": 3, "monthly_streak": 11, "best_streak": 26, "streak_days_ago": 31, "last_activity_days_ago": 4, "is_active": False},
    {"display_name": "FilmesEmDia", "weekly_points": 4920, "monthly_points": 19740, "total_points": 132400, "weekly_streak": 3, "monthly_streak": 13, "best_streak": 24, "streak_days_ago": 14, "last_activity_days_ago": 0, "is_active": False},
    {"display_name": "CineTop10", "weekly_points": 3860, "monthly_points": 16250, "total_points": 109800, "weekly_streak": 2, "monthly_streak": 9, "best_streak": 21, "streak_days_ago": 38, "last_activity_days_ago": 3, "is_active": False},
    {"display_name": "AmanteDeFilmes", "weekly_points": 4430, "monthly_points": 17680, "total_points": 98200, "weekly_streak": 3, "monthly_streak": 10, "best_streak": 19, "streak_days_ago": 16, "last_activity_days_ago": 1, "is_active": False},
    # Regulares casuais.
    {"display_name": "TelaBrilhante", "weekly_points": 3240, "monthly_points": 13870, "total_points": 76500, "weekly_streak": 2, "monthly_streak": 8, "best_streak": 16, "streak_days_ago": 44, "last_activity_days_ago": 2, "is_active": False},
    {"display_name": "PipocaDoceBR", "weekly_points": 3710, "monthly_points": 14920, "total_points": 64300, "weekly_streak": 2, "monthly_streak": 9, "best_streak": 15, "streak_days_ago": 21, "last_activity_days_ago": 0, "is_active": False},
    {"display_name": "CineObcecado", "weekly_points": 2890, "monthly_points": 12140, "total_points": 52700, "weekly_streak": 2, "monthly_streak": 7, "best_streak": 13, "streak_days_ago": 52, "last_activity_days_ago": 5, "is_active": False},
    {"display_name": "RolezinhoCine", "weekly_points": 3350, "monthly_points": 13260, "total_points": 45900, "weekly_streak": 2, "monthly_streak": 8, "best_streak": 12, "streak_days_ago": 18, "last_activity_days_ago": 1, "is_active": False},
    {"display_name": "CineSonhador", "weekly_points": 2540, "monthly_points": 10730, "total_points": 38600, "weekly_streak": 1, "monthly_streak": 6, "best_streak": 11, "streak_days_ago": 61, "last_activity_days_ago": 3, "is_active": False},
    {"display_name": "FilmesDaNoite", "weekly_points": 2970, "monthly_points": 11480, "total_points": 33200, "weekly_streak": 2, "monthly_streak": 7, "best_streak": 10, "streak_days_ago": 25, "last_activity_days_ago": 0, "is_active": False},
    {"display_name": "QueroPipocaBR", "weekly_points": 2180, "monthly_points": 9340, "total_points": 27800, "weekly_streak": 1, "monthly_streak": 5, "best_streak": 9, "streak_days_ago": 70, "last_activity_days_ago": 4, "is_active": False},
    {"display_name": "CineAprendiz", "weekly_points": 2630, "monthly_points": 10150, "total_points": 23400, "weekly_streak": 1, "monthly_streak": 6, "best_streak": 8, "streak_days_ago": 29, "last_activity_days_ago": 1, "is_active": False},
    {"display_name": "FilmeFreakBR", "weekly_points": 1840, "monthly_points": 7920, "total_points": 18700, "weekly_streak": 1, "monthly_streak": 4, "best_streak": 7, "streak_days_ago": 83, "last_activity_days_ago": 6, "is_active": False},
    {"display_name": "CacadorDeCena", "weekly_points": 2260, "monthly_points": 8630, "total_points": 15300, "weekly_streak": 1, "monthly_streak": 5, "best_streak": 7, "streak_days_ago": 33, "last_activity_days_ago": 2, "is_active": False},
    # Novatos (base da tabela, próximos de usuários reais recém-chegados).
    {"display_name": "NovatoDoCinema", "weekly_points": 1520, "monthly_points": 6480, "total_points": 11900, "weekly_streak": 1, "monthly_streak": 4, "best_streak": 6, "streak_days_ago": 40, "last_activity_days_ago": 1, "is_active": False},
    {"display_name": "CineIniciante", "weekly_points": 1780, "monthly_points": 5940, "total_points": 8920, "weekly_streak": 1, "monthly_streak": 3, "best_streak": 5, "streak_days_ago": 23, "last_activity_days_ago": 0, "is_active": False},
    {"display_name": "PrimeiraSessao", "weekly_points": 1130, "monthly_points": 4370, "total_points": 6250, "weekly_streak": 1, "monthly_streak": 3, "best_streak": 4, "streak_days_ago": 48, "last_activity_days_ago": 3, "is_active": False},
    {"display_name": "CineCalouro", "weekly_points": 1390, "monthly_points": 3810, "total_points": 4680, "weekly_streak": 1, "monthly_streak": 2, "best_streak": 4, "streak_days_ago": 17, "last_activity_days_ago": 1, "is_active": False},
    {"display_name": "EstreiaDeCinema", "weekly_points": 860, "monthly_points": 2940, "total_points": 3420, "weekly_streak": 1, "monthly_streak": 2, "best_streak": 3, "streak_days_ago": 55, "last_activity_days_ago": 2, "is_active": False},
    {"display_name": "UltimaSessaoBR", "weekly_points": 950, "monthly_points": 2340, "total_points": 2340, "weekly_streak": 1, "monthly_streak": 2, "best_streak": 2, "streak_days_ago": 13, "last_activity_days_ago": 0, "is_active": False},
    # Reserva (2026-07-18): fora do roster visível (só 10 ativos por vez,
    # ver MockPlayer.is_active). Entram no lugar de um mock ativo quando
    # um usuário real se cadastra com o mesmo nome dele (ver
    # MockPlayerRotationService).
    {"display_name": "BielNunes97", "weekly_points": 3120, "monthly_points": 12480, "total_points": 58000, "weekly_streak": 2, "monthly_streak": 7, "best_streak": 12, "streak_days_ago": 20, "last_activity_days_ago": 1, "is_active": False},
    {"display_name": "JPFerraz_", "weekly_points": 2780, "monthly_points": 10920, "total_points": 47500, "weekly_streak": 2, "monthly_streak": 6, "best_streak": 11, "streak_days_ago": 35, "last_activity_days_ago": 2, "is_active": False},
    {"display_name": "GuizinVolt", "weekly_points": 3450, "monthly_points": 13870, "total_points": 71200, "weekly_streak": 2, "monthly_streak": 8, "best_streak": 14, "streak_days_ago": 15, "last_activity_days_ago": 0, "is_active": False},
    {"display_name": "MatheusLobo", "weekly_points": 2340, "monthly_points": 9210, "total_points": 39800, "weekly_streak": 1, "monthly_streak": 5, "best_streak": 10, "streak_days_ago": 42, "last_activity_days_ago": 3, "is_active": False},
    {"display_name": "PedroAlvesX", "weekly_points": 4120, "monthly_points": 16480, "total_points": 94500, "weekly_streak": 3, "monthly_streak": 9, "best_streak": 17, "streak_days_ago": 9, "last_activity_days_ago": 0, "is_active": False},
    {"display_name": "AnaRamosFPS", "weekly_points": 2950, "monthly_points": 11760, "total_points": 52300, "weekly_streak": 2, "monthly_streak": 7, "best_streak": 13, "streak_days_ago": 26, "last_activity_days_ago": 1, "is_active": False},
    {"display_name": "DudaMoraes", "weekly_points": 1980, "monthly_points": 7840, "total_points": 31200, "weekly_streak": 1, "monthly_streak": 4, "best_streak": 9, "streak_days_ago": 51, "last_activity_days_ago": 4, "is_active": False},
    {"display_name": "CarolVentura", "weekly_points": 3670, "monthly_points": 14680, "total_points": 82400, "weekly_streak": 2, "monthly_streak": 8, "best_streak": 15, "streak_days_ago": 13, "last_activity_days_ago": 0, "is_active": False},
    {"display_name": "LuanCostaBR", "weekly_points": 2510, "monthly_points": 9980, "total_points": 43600, "weekly_streak": 1, "monthly_streak": 6, "best_streak": 11, "streak_days_ago": 30, "last_activity_days_ago": 2, "is_active": False},
    {"display_name": "VitinSilva77", "weekly_points": 4380, "monthly_points": 17520, "total_points": 101200, "weekly_streak": 3, "monthly_streak": 9, "best_streak": 18, "streak_days_ago": 7, "last_activity_days_ago": 0, "is_active": False},
    {"display_name": "GabiFerreiraX", "weekly_points": 1730, "monthly_points": 6890, "total_points": 26400, "weekly_streak": 1, "monthly_streak": 4, "best_streak": 8, "streak_days_ago": 58, "last_activity_days_ago": 3, "is_active": False},
    {"display_name": "RafaSouza_", "weekly_points": 3210, "monthly_points": 12840, "total_points": 68700, "weekly_streak": 2, "monthly_streak": 7, "best_streak": 13, "streak_days_ago": 18, "last_activity_days_ago": 1, "is_active": False},
    {"display_name": "KauaOliveira", "weekly_points": 2670, "monthly_points": 10650, "total_points": 49300, "weekly_streak": 2, "monthly_streak": 6, "best_streak": 12, "streak_days_ago": 27, "last_activity_days_ago": 1, "is_active": False},
    {"display_name": "BrunoMacedo", "weekly_points": 3890, "monthly_points": 15680, "total_points": 88900, "weekly_streak": 3, "monthly_streak": 8, "best_streak": 16, "streak_days_ago": 11, "last_activity_days_ago": 0, "is_active": False},
    {"display_name": "JuliaFreitas", "weekly_points": 2140, "monthly_points": 8460, "total_points": 35700, "weekly_streak": 1, "monthly_streak": 5, "best_streak": 10, "streak_days_ago": 46, "last_activity_days_ago": 3, "is_active": False},
    {"display_name": "EnzoRezende", "weekly_points": 4050, "monthly_points": 16240, "total_points": 96800, "weekly_streak": 3, "monthly_streak": 9, "best_streak": 17, "streak_days_ago": 8, "last_activity_days_ago": 0, "is_active": False},
    {"display_name": "VitorMoura", "weekly_points": 1590, "monthly_points": 6280, "total_points": 23100, "weekly_streak": 1, "monthly_streak": 3, "best_streak": 7, "streak_days_ago": 64, "last_activity_days_ago": 5, "is_active": False},
    {"display_name": "ClaraNogueira", "weekly_points": 3340, "monthly_points": 13360, "total_points": 74800, "weekly_streak": 2, "monthly_streak": 8, "best_streak": 14, "streak_days_ago": 16, "last_activity_days_ago": 1, "is_active": False},
    {"display_name": "ThiagoLimaX", "weekly_points": 2860, "monthly_points": 11440, "total_points": 56900, "weekly_streak": 2, "monthly_streak": 7, "best_streak": 13, "streak_days_ago": 24, "last_activity_days_ago": 1, "is_active": False},
    {"display_name": "LucasVieira99", "weekly_points": 4420, "monthly_points": 17680, "total_points": 108300, "weekly_streak": 3, "monthly_streak": 9, "best_streak": 18, "streak_days_ago": 6, "last_activity_days_ago": 0, "is_active": False},
]
