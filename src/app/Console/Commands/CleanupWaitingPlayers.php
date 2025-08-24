<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class CleanupWaitingPlayers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'game:cleanup-waiting-players';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = '古い待機プレイヤーをクリーンアップ';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $waitingPlayers = Cache::get('waiting_players', []);
        $currentTime = now();
        $cleanedPlayers = [];
        $removedCount = 0;

        foreach ($waitingPlayers as $player) {
            $joinedTime = Carbon::parse($player['joined_at']);
            $timeDiff = $currentTime->diffInSeconds($joinedTime);
            
            // 30秒以内のプレイヤーのみ保持
            if ($timeDiff < 30) {
                $cleanedPlayers[] = $player;
            } else {
                $removedCount++;
                $this->info("古い待機プレイヤーを削除: {$player['player_name']} (待機時間: {$timeDiff}秒)");
            }
        }

        // クリーンアップされたリストを保存
        if ($removedCount > 0) {
            Cache::put('waiting_players', $cleanedPlayers, 30);
            $this->info("クリーンアップ完了: {$removedCount}人のプレイヤーを削除");
            $this->info("残り待機プレイヤー: " . count($cleanedPlayers) . "人");
        } else {
            $this->info("クリーンアップ不要: 古い待機プレイヤーは存在しません");
        }

        return 0;
    }
}
