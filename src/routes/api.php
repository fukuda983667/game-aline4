<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GameController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// オンライン対戦用のルート
Route::prefix('game')->group(function () {
    Route::post('/find-match', [GameController::class, 'findMatch']);
    Route::post('/ready-match', [GameController::class, 'readyMatch']);
    Route::post('/confirm-match', [GameController::class, 'confirmMatch']);
    Route::post('/make-move', [GameController::class, 'makeMove']);
    Route::post('/rotate-board', [GameController::class, 'rotateBoard']);
    Route::get('/state', [GameController::class, 'getGameState']);
    Route::post('/leave', [GameController::class, 'leaveGame']);
});

// ランキング用のルート
Route::prefix('ranking')->group(function () {
    Route::get('/monthly', [GameController::class, 'getMonthlyRanking']);
    Route::get('/available-months', [GameController::class, 'getAvailableMonths']);
});
