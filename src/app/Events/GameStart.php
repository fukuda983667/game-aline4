<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameStart implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $gameId;
    public $game;

    public function __construct($gameId, $game)
    {
        $this->gameId = $gameId;
        $this->game = $game;
    }

    public function broadcastOn()
    {
        return [
            new Channel('game.' . $this->gameId),
            new Channel('waiting-players') // 待機中のプレイヤー用のチャンネル
        ];
    }

    public function broadcastAs()
    {
        return 'game.start';
    }

    public function broadcastWith()
    {
        return [
            'game_id' => $this->gameId,
            'game' => $this->game
        ];
    }
}
