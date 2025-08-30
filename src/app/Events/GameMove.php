<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameMove implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $gameId;
    public $game;
    public $column;
    public $row;
    public $color;
    public $playerId; // プレイヤーIDを追加
    public $rotated; // 回転フラグを追加
    public $direction; // 回転方向を追加

    public function __construct($gameId, $game, $column, $row, $color, $playerId, $rotated = false, $direction = null)
    {
        $this->gameId = $gameId;
        $this->game = $game;
        $this->column = $column;
        $this->row = $row;
        $this->color = $color;
        $this->playerId = $playerId;
        $this->rotated = $rotated;
        $this->direction = $direction;
    }

    public function broadcastOn()
    {
        return new Channel('game.' . $this->gameId);
    }

    public function broadcastAs()
    {
        return 'game.move';
    }

    public function broadcastWith()
    {
        return [
            'game_id' => $this->gameId,
            'game' => $this->game,
            'move' => [
                'column' => $this->column,
                'row' => $this->row,
                'color' => $this->color,
                'playerId' => $this->playerId,
                'rotated' => $this->rotated,
                'direction' => $this->direction
            ]
        ];
    }
}
