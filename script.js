(() => {
  // --- 定数・設定 ---

  const symbols = ['🍒', '7️⃣', '🍋', '⭐', '🍉', '🔔'];
  // ペイライン（3行3列のインデックス、横3本、斜め2本、中央縦1本）
  const paylines = [
    // 横3列
    [[0,0],[0,1],[0,2]],
    [[1,0],[1,1],[1,2]],
    [[2,0],[2,1],[2,2]],
    // 斜め2本
    [[0,0],[1,1],[2,2]],
    [[0,2],[1,1],[2,0]],
    // 真ん中縦
    [[0,1],[1,1],[2,1]],
    //左縦
    [[0,0],[1,0],[2,0]],
    //右縦
    [[0,2],[1,2],[2,2]],
  ];

  // 絵柄ごとの配当コイン
  const payouts = {
    '🍒': 50,
    '7️⃣': 100,
    '🍋': 30,
    '⭐': 200,
    '🍉': 80,
    '🔔': 150,
  };

  const initialCoins = 1000;
  const spinCost = 10;

  // --- DOM要素 ---
  const coinCountEl = document.getElementById('coinCount');
  const spinBtn = document.getElementById('spinBtn');
  const resultEl = document.getElementById('result');
  const historyList = document.getElementById('historyList');
  const rankingDisplay = document.getElementById('rankingDisplay');
  const difficultySelect = document.getElementById('difficulty');
  const themeBtn = document.getElementById('themeBtn');

  // リールは3行3列
  const reels = [
    [document.getElementById('r1c1'), document.getElementById('r1c2'), document.getElementById('r1c3')],
    [document.getElementById('r2c1'), document.getElementById('r2c2'), document.getElementById('r2c3')],
    [document.getElementById('r3c1'), document.getElementById('r3c2'), document.getElementById('r3c3')],
  ];

  // --- 状態 ---
  let coins = initialCoins;
  let history = [];
  let winsCount = 0;
  let currentTheme = 'dark';

  // --- 効果音 ---
  const spinSound = document.getElementById('spinSound');
  const winSound = document.getElementById('winSound');

  // --- 初期処理 ---
  updateCoinDisplay();
  loadStorage();
  renderHistory();
  renderRanking();

  // --- ユーティリティ関数 ---
  function getRandomSymbol(difficulty) {
    // 難易度で確率調整（easy: ⭐減, hard: ⭐増）
    if(difficulty === 'easy'){
      // ⭐の確率を減らすため配列から1/2削除
      let pool = symbols.filter(s => s !== '⭐');
      return pool[Math.floor(Math.random() * pool.length)];
    } else if (difficulty === 'hard'){
      // ⭐の確率を上げるため⭐を増やす
      let pool = [...symbols, '⭐', '⭐'];
      return pool[Math.floor(Math.random() * pool.length)];
    } else {
      return symbols[Math.floor(Math.random() * symbols.length)];
    }
  }

  // --- リールに絵柄をセット ---
  function setReels(symbolGrid) {
    for(let r=0; r<3; r++){
      for(let c=0; c<3; c++){
        reels[r][c].textContent = symbolGrid[r][c];
        reels[r][c].classList.remove('win');
      }
    }
  }

  // --- ペイラインの勝利判定 ---
  function checkPaylines(symbolGrid) {
    const winningLines = [];

    paylines.forEach(line => {
      const lineSymbols = line.map(([r,c]) => symbolGrid[r][c]);
      // 全部同じか判定
      if(lineSymbols.every(s => s === lineSymbols[0])){
        winningLines.push({
          line,
          symbol: lineSymbols[0],
          payout: payouts[lineSymbols[0]] || 0,
        });
      }
    });

    return winningLines;
  }

  // --- スピンアニメーション ---
  async function spinAnimation(difficulty) {
    spinBtn.disabled = true;
    resultEl.textContent = '';
    spinSound.currentTime = 0;
    spinSound.play();

    let symbolGrid = [
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ];

    // 3列それぞれ順に止める
    for(let col=0; col<3; col++){
      for(let spin=0; spin<15; spin++){
        for(let row=0; row<3; row++){
          symbolGrid[row][col] = getRandomSymbol(difficulty);
        }
        setReels(symbolGrid);
        await new Promise(r => setTimeout(r, 50));
      }
    }

    spinSound.pause();

    return symbolGrid;
  }

  // --- 勝利演出 ---
  function showWinLine(line) {
    line.forEach(([r,c]) => {
      reels[r][c].classList.add('win');
    });
  }

  // --- コイン更新 ---
  function updateCoinDisplay() {
    coinCountEl.textContent = coins;
  }

  // --- 履歴描画 ---
  function renderHistory() {
    historyList.innerHTML = '';
    if(history.length === 0){
      historyList.innerHTML = '<li>まだスピン履歴はありません。</li>';
      return;
    }
    history.slice(-10).reverse().forEach(entry => {
      const li = document.createElement('li');
      li.textContent = entry;
      historyList.appendChild(li);
    });
  }

  // --- ランキング描画 ---
  function renderRanking() {
    let wins = localStorage.getItem('slot_wins') || 0;
    rankingDisplay.textContent = ${wins} 回の勝利;
  }

  // --- localStorage読み込み ---
  function loadStorage() {
    const storedCoins = localStorage.getItem('slot_coins');
    if(storedCoins !== null){
      coins = Number(storedCoins);
    }
    const storedHistory = localStorage.getItem('slot_history');
    if(storedHistory !== null){
      history = JSON.parse(storedHistory);
    }
    const storedWins = localStorage.getItem('slot_wins');
    if(storedWins !== null){
      winsCount = Number(storedWins);
    }
  }

  // --- localStorage保存 ---
  function saveStorage() {
    localStorage.setItem('slot_coins', coins);
    localStorage.setItem('slot_history', JSON.stringify(history));
    localStorage.setItem('slot_wins', winsCount);
  }

  // --- テーマ切替 ---
  function toggleTheme() {
    if(currentTheme === 'dark'){
      document.body.style.background = '#f0f0f0';
      document.body.style.color = '#222';
      currentTheme = 'light';
    } else {
      document.body.style.background = '#1a1a2e';
      document.body.style.color = '#eee';
      currentTheme = 'dark';
    }
  }

  // --- メインスピン処理 ---
  async function onSpin() {
    if(coins < spinCost){
      resultEl.textContent = 'コインが足りません！';
      resultEl.style.color = '#ff4444';
      return;
    }
    coins -= spinCost;
    updateCoinDisplay();

    const difficulty = difficultySelect.value;
    const grid = await spinAnimation(difficulty);

    const wins = checkPaylines(grid);

    if(wins.length > 0){
      // 合計配当計算
      let totalPayout = 0;
      wins.forEach(win => {
        totalPayout += win.payout;
        showWinLine(win.line);
      });
      coins += totalPayout;
      winsCount++;
      resultEl.textContent = 🎉 当たり！獲得コイン：${totalPayout} 🪙;
      resultEl.style.color = '#00cc00';
      winSound.currentTime = 0;
      winSound.play();
    } else {
      resultEl.textContent = '残念、ハズレです。';
      resultEl.style.color = '#ff4444';
    }

    // 履歴更新
    const timestamp = new Date().toLocaleTimeString();
    const historyMsg = ${timestamp} - ${wins.length > 0 ? '当たり' : 'ハズレ'} (所持コイン: ${coins});
    history.push(historyMsg);
    if(history.length > 50) history.shift(); // 最大50件まで保持

    updateCoinDisplay();
    renderHistory();
    winsCount && renderRanking();
    saveStorage();

    spinBtn.disabled = false;
  }

  spinBtn.addEventListener('click', () => {
    spinBtn.disabled = true;
    onSpin();
  });

  themeBtn.addEventListener('click', toggleTheme);

})();