<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Events\GameMove;
use App\Events\GameStart;
use App\Events\PlayerJoined;
use App\Events\PlayerLeft;
use Illuminate\Support\Str;

class GameController extends Controller
{
    private function getWaitingPlayers()
    {
        return cache()->get('waiting_players', []);
    }

    private function setWaitingPlayers($players)
    {
        cache()->put('waiting_players', $players, 30); // 30秒間キャッシュ
    }

    private function getActiveGames()
    {
        return cache()->get('active_games', []);
    }

    private function setActiveGames($games)
    {
        cache()->put('active_games', $games, 300); // 5分間キャッシュ
    }

    public function findMatch(Request $request): JsonResponse
    {
        $playerId = $request->input('player_id');
        $playerName = $request->input('player_name', 'Player');

        // 古い待機プレイヤーをクリーンアップ
        $this->cleanupOldWaitingPlayers();

        // 待機中のプレイヤーを取得
        $waitingPlayers = $this->getWaitingPlayers();

        // デバッグ情報を追加
        \Log::info('マッチング要求', [
            'player_id' => $playerId,
            'player_name' => $playerName,
            'waiting_players_count' => count($waitingPlayers),
            'waiting_players' => $waitingPlayers
        ]);

        // 既に待機中のプレイヤーがいるかチェック
        if (!empty($waitingPlayers)) {
            $opponent = array_shift($waitingPlayers);

            // ゲームIDを生成
            $gameId = Str::uuid()->toString();

            // 先攻後攻をランダムに決定
            $firstPlayer = rand(0, 1) === 0 ? $opponent : ['player_id' => $playerId, 'player_name' => $playerName];
            $secondPlayer = $firstPlayer['player_id'] === $opponent['player_id'] ? 
                ['player_id' => $playerId, 'player_name' => $playerName] : $opponent;

            // ゲームを開始
            $game = [
                'id' => $gameId,
                'players' => [
                    $firstPlayer['player_id'] => [
                        'id' => $firstPlayer['player_id'],
                        'name' => $firstPlayer['player_name'],
                        'color' => 'red'
                    ],
                    $secondPlayer['player_id'] => [
                        'id' => $secondPlayer['player_id'],
                        'name' => $secondPlayer['player_name'],
                        'color' => 'yellow'
                    ]
                ],
                'board' => $this->createEmptyBoard(),
                'current_player' => 'red',
                'status' => 'playing',
                'created_at' => now()
            ];

            $activeGames = $this->getActiveGames();
            $activeGames[$gameId] = $game;
            $this->setActiveGames($activeGames);

            \Log::info('マッチング成功', [
                'game_id' => $gameId,
                'player1' => $opponent,
                'player2' => ['player_id' => $playerId, 'player_name' => $playerName]
            ]);

            // 両プレイヤーにゲーム開始を通知
            broadcast(new GameStart($gameId, $game))->toOthers();

            return response()->json([
                'success' => true,
                'game_id' => $gameId,
                'status' => 'matched',
                'game' => $game
            ]);
        }

        // 待機リストに追加
        $waitingPlayers[] = [
            'player_id' => $playerId,
            'player_name' => $playerName,
            'joined_at' => now()
        ];
        $this->setWaitingPlayers($waitingPlayers);

        \Log::info('プレイヤーを待機リストに追加', [
            'player_id' => $playerId,
            'player_name' => $playerName,
            'total_waiting' => count($waitingPlayers)
        ]);

        return response()->json([
            'success' => true,
            'status' => 'waiting',
            'message' => 'マッチング中です...'
        ]);
    }

    public function makeMove(Request $request): JsonResponse
    {
        $gameId = $request->input('game_id');
        $playerId = $request->input('player_id');
        $column = $request->input('column');

        $activeGames = $this->getActiveGames();

        if (!isset($activeGames[$gameId])) {
            return response()->json(['success' => false, 'message' => 'ゲームが見つかりません'], 404);
        }

        $game = $activeGames[$gameId];

        // プレイヤーの順番をチェック
        $currentPlayerColor = $game['current_player'];
        $playerColor = $this->getPlayerColor($game, $playerId);

        if ($playerColor !== $currentPlayerColor) {
            return response()->json(['success' => false, 'message' => 'あなたのターンではありません'], 400);
        }

        // 石を配置
        $row = $this->placeStone($game['board'], $column, $playerColor);
        if ($row === -1) {
            return response()->json(['success' => false, 'message' => 'その列には石を置けません'], 400);
        }

        // ゲーム状態を更新
        $game['board'][$row][$column] = $playerColor;
        $game['current_player'] = $currentPlayerColor === 'red' ? 'yellow' : 'red';

        // 勝利判定
        if ($this->checkWin($game['board'], $row, $column, $playerColor)) {
            $game['status'] = 'won';
            $game['winner'] = $playerColor;
        } elseif ($this->checkDraw($game['board'])) {
            $game['status'] = 'draw';
        }

        $activeGames[$gameId] = $game;
        $this->setActiveGames($activeGames);

        // 他のプレイヤーに手を通知
        broadcast(new GameMove($gameId, $game, $column, $row, $playerColor, $playerId))->toOthers();

        return response()->json([
            'success' => true,
            'game' => $game,
            'move' => [
                'column' => $column,
                'row' => $row,
                'color' => $playerColor
            ]
        ]);
    }

    public function getGameState(Request $request): JsonResponse
    {
        $gameId = $request->input('game_id');

        $activeGames = $this->getActiveGames();

        if (!isset($activeGames[$gameId])) {
            return response()->json(['success' => false, 'message' => 'ゲームが見つかりません'], 404);
        }

        return response()->json([
            'success' => true,
            'game' => $activeGames[$gameId]
        ]);
    }

    public function leaveGame(Request $request): JsonResponse
    {
        $gameId = $request->input('game_id');
        $playerId = $request->input('player_id');

        $activeGames = $this->getActiveGames();
        $waitingPlayers = $this->getWaitingPlayers();

        if (isset($activeGames[$gameId])) {
            $game = $activeGames[$gameId];

            // 他のプレイヤーに通知
            broadcast(new PlayerLeft($gameId, $playerId))->toOthers();

            // ゲームを削除
            unset($activeGames[$gameId]);
            $this->setActiveGames($activeGames);
        }

        // 待機リストからも削除
        $waitingPlayers = array_filter($waitingPlayers, function($player) use ($playerId) {
            return $player['player_id'] !== $playerId;
        });
        $this->setWaitingPlayers($waitingPlayers);

        return response()->json(['success' => true]);
    }

    private function createEmptyBoard(): array
    {
        $board = [];
        for ($row = 0; $row < 7; $row++) {
            $board[$row] = [];
            for ($col = 0; $col < 7; $col++) {
                $board[$row][$col] = null;
            }
        }
        return $board;
    }

    private function getPlayerColor(array $game, string $playerId): ?string
    {
        foreach ($game['players'] as $player) {
            if ($player['id'] === $playerId) {
                return $player['color'];
            }
        }
        return null;
    }

    private function placeStone(array $board, int $column, string $color): int
    {
        for ($row = 6; $row >= 0; $row--) {
            if ($board[$row][$column] === null) {
                $board[$row][$column] = $color;
                return $row;
            }
        }
        return -1;
    }

    private function checkWin(array $board, int $row, int $col, string $color): bool
    {
        // 水平方向のチェック
        if ($this->checkDirection($board, $row, $col, $color, 0, 1)) return true;

        // 垂直方向のチェック
        if ($this->checkDirection($board, $row, $col, $color, 1, 0)) return true;

        // 対角線方向のチェック
        if ($this->checkDirection($board, $row, $col, $color, 1, 1)) return true;
        if ($this->checkDirection($board, $row, $col, $color, 1, -1)) return true;

        return false;
    }

    private function checkDirection(array $board, int $row, int $col, string $color, int $dRow, int $dCol): bool
    {
        $count = 1;

        // 正方向にチェック
        for ($i = 1; $i < 4; $i++) {
            $newRow = $row + ($dRow * $i);
            $newCol = $col + ($dCol * $i);

            if ($newRow < 0 || $newRow >= 7 || $newCol < 0 || $newCol >= 7) break;
            if ($board[$newRow][$newCol] !== $color) break;

            $count++;
        }

        // 負方向にチェック
        for ($i = 1; $i < 4; $i++) {
            $newRow = $row - ($dRow * $i);
            $newCol = $col - ($dCol * $i);

            if ($newRow < 0 || $newRow >= 7 || $newCol < 0 || $newCol >= 7) break;
            if ($board[$newRow][$newCol] !== $color) break;

            $count++;
        }

        return $count >= 4;
    }

    private function checkDraw(array $board): bool
    {
        for ($col = 0; $col < 7; $col++) {
            if ($board[0][$col] === null) {
                return false;
            }
        }
        return true;
    }

    /**
     * 古い待機プレイヤーをクリーンアップ
     */
    private function cleanupOldWaitingPlayers()
    {
        $waitingPlayers = $this->getWaitingPlayers();
        $currentTime = now();
        $cleanedPlayers = [];

        foreach ($waitingPlayers as $player) {
            $joinedTime = \Carbon\Carbon::parse($player['joined_at']);
            $timeDiff = $currentTime->diffInSeconds($joinedTime);

            // 30秒以内のプレイヤーのみ保持
            if ($timeDiff < 30) {
                $cleanedPlayers[] = $player;
            } else {
                \Log::info('古い待機プレイヤーを削除', [
                    'player_id' => $player['player_id'],
                    'player_name' => $player['player_name'],
                    '待機時間' => $timeDiff . '秒'
                ]);
            }
        }

        // クリーンアップされたリストを保存
        if (count($cleanedPlayers) !== count($waitingPlayers)) {
            $this->setWaitingPlayers($cleanedPlayers);
            \Log::info('待機プレイヤーリストをクリーンアップ', [
                'before' => count($waitingPlayers),
                'after' => count($cleanedPlayers)
            ]);
        }
    }
}
