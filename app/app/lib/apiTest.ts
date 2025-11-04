// APIテスト用
const API_BASE_URL = '/api/game';

// テスト用のプレイヤー情報
const player1 = {
  player_id: 'player1_test',
  player_name: 'Player 1'
};

const player2 = {
  player_id: 'player2_test',
  player_name: 'Player 2'
};

// API呼び出し用のヘルパー関数
async function apiCall(endpoint: string, method: string = 'POST', body?: any) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(`${method} ${endpoint}:`, data);
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error(`Error calling ${method} ${endpoint}:`, error);
    return { success: false, error };
  }
}

// テスト関数
async function runTests() {
  console.log('=== Next.js API テスト開始 ===\n');

  // 1. プレイヤー1がマッチングを開始
  console.log('1. プレイヤー1がマッチングを開始');
  const match1 = await apiCall('/find-match', 'POST', player1);
  if (!match1.success) {
    console.error('マッチング開始に失敗しました');
    return;
  }

  // 2. プレイヤー2がマッチングを開始（マッチング成功）
  console.log('\n2. プレイヤー2がマッチングを開始');
  const match2 = await apiCall('/find-match', 'POST', player2);
  if (!match2.success) {
    console.error('マッチングに失敗しました');
    return;
  }

  const gameId = match2.data.game_id;

  // 3. プレイヤー2がマッチングを確認
  console.log('\n3. プレイヤー2がマッチングを確認');
  await apiCall('/confirm-match', 'POST', {
    game_id: gameId,
    player_id: player2.player_id
  });

  // 4. プレイヤー1がマッチングを準備
  console.log('\n4. プレイヤー1がマッチングを準備');
  const ready = await apiCall('/ready-match', 'POST', {
    game_id: gameId,
    player_id: player1.player_id,
    player_name: player1.player_name,
    opponent_id: player2.player_id,
    opponent_name: player2.player_name
  });

  if (!ready.success || ready.data.status !== 'playing') {
    console.error('ゲーム開始に失敗しました');
    return;
  }

  // 5. ゲーム状態を取得
  console.log('\n5. ゲーム状態を取得');
  await apiCall(`/state?game_id=${gameId}`, 'GET');

  // 6. プレイヤー1が石を配置
  console.log('\n6. プレイヤー1が石を配置');
  await apiCall('/make-move', 'POST', {
    game_id: gameId,
    player_id: player1.player_id,
    column: 3
  });

  // 7. プレイヤー2が石を配置
  console.log('\n7. プレイヤー2が石を配置');
  await apiCall('/make-move', 'POST', {
    game_id: gameId,
    player_id: player2.player_id,
    column: 3
  });

  // 8. プレイヤー1がボードを回転
  console.log('\n8. プレイヤー1がボードを回転');
  await apiCall('/rotate-board', 'POST', {
    game_id: gameId,
    player_id: player1.player_id,
    direction: 'left'
  });

  // 9. 最終的なゲーム状態を取得
  console.log('\n9. 最終的なゲーム状態を取得');
  await apiCall(`/state?game_id=${gameId}`, 'GET');

  // 10. プレイヤー1がゲームから退出
  console.log('\n10. プレイヤー1がゲームから退出');
  await apiCall('/leave', 'POST', {
    game_id: gameId,
    player_id: player1.player_id
  });

  console.log('\n=== テスト完了 ===');
}

// ブラウザ環境でのテスト実行
if (typeof window !== 'undefined') {
  // ブラウザで実行する場合
  (window as any).runApiTests = runTests;
  console.log('テストを実行するには runApiTests() を呼び出してください');
} else {
  // Node.js環境での実行
  runTests().catch(console.error);
}

export { runTests };
