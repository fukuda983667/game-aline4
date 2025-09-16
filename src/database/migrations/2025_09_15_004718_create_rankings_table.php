<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('rankings', function (Blueprint $table) {
            $table->id();
            $table->string('year_month', 7); // 年月（例：'2024-01'）
            $table->string('player_name'); // プレイヤー名
            $table->integer('wins')->default(0); // 勝数
            $table->timestamps();

            $table->unique(['year_month', 'player_name']);

            $table->index(['year_month', 'wins']);
            $table->index('player_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rankings');
    }
};
