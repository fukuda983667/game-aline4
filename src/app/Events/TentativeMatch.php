<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TentativeMatch implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $gameId;
    public $opponentPlayerId;
    public $opponentPlayerName;

    /**
     * Create a new event instance.
     */
    public function __construct(string $gameId, string $opponentPlayerId, string $opponentPlayerName)
    {
        $this->gameId = $gameId;
        $this->opponentPlayerId = $opponentPlayerId;
        $this->opponentPlayerName = $opponentPlayerName;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('game.' . $this->gameId),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'game_id' => $this->gameId,
            'opponent_player_id' => $this->opponentPlayerId,
            'opponent_player_name' => $this->opponentPlayerName,
        ];
    }

    /**
     * The event's broadcast name.
     *
     * @return string
     */
    public function broadcastAs(): string
    {
        return 'tentative.match';
    }
}



