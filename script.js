(() => {
  const symbols = ['🍒', '7️⃣', '🍋', '⭐', '🍉', '🔔'];
  const paylines = [
    [[0,0],[0,1],[0,2]],
    [[1,0],[1,1],[1,2]],
    [[2,0],[2,1],[2,2]],
    [[0,0],[1,1],[2,2]],
    [[0,2],[1,1],[2,0]],
    [[0,1],[1,1],[2,1]],
    [[0,0],[1,0],[2,0]],
    [[0,2],[1,2],[2,2]],
  ];

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

  const coinCountEl = document.getElementById('coinCount');
  const spinBtn = document.getElementById('spinBtn');
  const resultEl = document.getElementById('result');
  const historyList = document.getElementById('historyList');
  const rankingDisplay = document.getElementById('rankingDisplay');
  const difficultySelect = document.getElementById('difficulty');
  const themeBtn = document.getElementById('themeBtn');
  const leverageInput = document.getElementById('leverageInput');

  const reels = [
    [document.getElementById('r1c1'), document.getElementById('r1c2'), document.getElementById('r1c3')],
    [document.getElementById('r2c1'), document.getElementById('r2c2'), document.getElementById('r2c3')],
    [document.getElementById('r3c1'), document.getElementById('r3c2'), document.getElementById('r3c3')],
  ];

  let coins = initialCoins;
  let history = [];
  let winsCount = 0;
  let currentTheme = 'dark';

  const spinSound = document.getElementById('spinSound');
  const winSound = document.getElementById('winSound');

  updateCoinDisplay();
  loadStorage();
  renderHistory();
  renderRanking();

  function getRandomSymbol(difficulty) {
    if(difficulty === 'easy'){
      return symbols.filter(s => s !== '⭐')[Math.floor(Math.random() * (symbols.length - 1))];
    } else if (difficulty === 'hard'){
      return [...symbols, '⭐', '⭐'][Math.floor(Math.random() * (symbols.length + 2))];
    } else {
      return symbols[Math.floor(Math.random() * symbols.length)];
    }
  }

  function setReels(symbolGrid) {
    for(let r=0; r<3; r++){
      for(let c=0; c<3; c++){
        reels[r][c].textContent = symbolGrid[r][c];
        reels[r][c].classList.remove('win');
      }
    }
  }

  function checkPaylines(symbolGrid) {
    const winningLines = [];
    paylines.forEach(line => {
      const lineSymbols = line.map(([r,c]) => symbolGrid[r][c]);
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

  async function spinAnimation(difficulty) {
    spinBtn.disabled = true;
    resultEl.textContent = '';
    spinSound.currentTime = 0;
    spinSound.play();

    let symbolGrid = [['','',''], ['','',''], ['','','']];
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

  function showWinLine(line) {
    line.forEach(([r,c]) => {
      reels[r][c].classList.add('win');
    });
  }

  function updateCoinDisplay() {
    coinCountEl.textContent = coins;
  }

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

  function renderRanking() {
    let wins = localStorage.getItem('slot_wins') || 0;
    rankingDisplay.textContent = `${wins} 回の勝利`;
  }

  function loadStorage() {
    const storedCoins = localStorage.getItem('slot_coins');
    if(storedCoins !== null) coins = Number(storedCoins);
    const storedHistory = localStorage.getItem('slot_history');
    if(storedHistory !== null) history = JSON.parse(storedHistory);
    const storedWins = localStorage.getItem('slot_wins');
    if(storedWins !== null) winsCount = Number(storedWins);
  }

  function saveStorage() {
    localStorage.setItem('slot_coins', coins);
    localStorage.setItem('slot_history', JSON.stringify(history));
    localStorage.setItem('slot_wins', winsCount);
  }

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

  async function onSpin() {
    if(coins < spinCost){
      resultEl.textContent = 'コインが足りません！';
      resultEl.style.color = '#ff4444';
      return;
    }

    coins -= spinCost;
    updateCoinDisplay();

    const difficulty = difficultySelect.value;
    const leverage = Math.max(1, parseInt(leverageInput.value) || 1);
    const grid = await spinAnimation(difficulty);
    const wins = checkPaylines(grid);

    if(wins.length > 0){
      let totalPayout = 0;
      wins.forEach(win => {
        const payoutWithLeverage = win.payout * leverage;
        totalPayout += payoutWithLeverage;
        showWinLine(win.line);
      });
      coins += totalPayout;
      winsCount++;
      resultEl.textContent = `🎉 当たり！倍率${leverage}倍で ${totalPayout} 🪙獲得！`;
      resultEl.style.color = '#00cc00';
      winSound.currentTime = 0;
      winSound.play();
    } else {
      resultEl.textContent = '残念、ハズレです。';
      resultEl.style.color = '#ff4444';
    }

    const timestamp = new Date().toLocaleTimeString();
    const historyMsg = `${timestamp} - ${wins.length > 0 ? '当たり' : 'ハズレ'} (所持コイン: ${coins})`;
    history.push(historyMsg);
    if(history.length > 50) history.shift();

    updateCoinDisplay();
    renderHistory();
    if(winsCount > 0) renderRanking();
    saveStorage();

    spinBtn.disabled = false;
  }

  spinBtn.addEventListener('click', () => {
    spinBtn.disabled = true;
    onSpin();
  });

  themeBtn.addEventListener('click', toggleTheme);

})();
