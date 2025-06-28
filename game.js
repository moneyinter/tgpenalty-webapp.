let tries = 5, discount = 0, goals = 0, shots = 0, maxTries = 5, ended = false;

// UI обновление
function updateUI() {
    document.getElementById('tries').textContent = `Попыток: ${tries-goals}/${maxTries}`;
    document.getElementById('discount').textContent = `Скидка: ${discount}%`;
}

async function loadToken() {
    let r = await fetch(`${BACKEND_URL}/game_token?user_id=${USER_ID}&secret=${SECRET}`);
...
    let data = await r.json();
    tries = data.tries_left;
    discount = data.discount;
    goals = 0; shots = 0;
    ended = false;
    updateUI();
    document.getElementById('shootInfo').textContent = "Кликни по воротам!";
    document.getElementById('againBtn').style.display = "none";
}

// Примитивная графика + логика пенальти
function setupGame() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    function drawField() {
        ctx.clearRect(0,0,320,480);
        ctx.fillStyle="#35bcfc"; ctx.fillRect(0,300,320,180);
        ctx.fillStyle="#fff";
        ctx.fillRect(60,60,200,12); // перекладина
        ctx.fillRect(60,60,12,120); // левая штанга
        ctx.fillRect(248,60,12,120); // правая штанга
        ctx.beginPath();
        ctx.arc(160,320,30,0,Math.PI*2);
        ctx.strokeStyle="#fff"; ctx.stroke();
        // Вратарь
        let gX = 120+Math.random()*80;
        ctx.fillStyle="#F53";
        ctx.fillRect(gX,72,40,16);
    }
    drawField();
    canvas.onclick = async function(evt) {
        if (ended || shots>=tries) return;
        let x = evt.offsetX * (canvas.width/canvas.clientWidth);
        let zone = x<110?0 : x>210?2 : 1; // три зоны: лев, центр, право
        let goalie = Math.random(); // шанс сейва: центр 60%, края 30%
        let goal = (zone==1 && goalie>0.6) || (zone!=1 && goalie>0.3);
        shots++;
        if(goal) { goals++; }
        document.getElementById('shootInfo').textContent = goal ? "ГОООЛ! 🎉" : "Вратарь отбил!";
        setTimeout(()=>{drawField();},700);
        updateUI();
        if(shots >= tries) endGame();
    }
}
function endGame() {
    ended = true;
    document.getElementById('shootInfo').textContent = `Серия завершена. Голов: ${goals}`;
    document.getElementById('againBtn').style.display = "block";
    // POST результат
    fetch(`${BACKEND_URL}/send_result`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({user_id: USER_ID, goals: goals})
    }).then(async resp=>{
        let data = await resp.json();
        if(data.status==='ok') {
            discount = data.percent;
            updateUI();
        }
    });
}
document.getElementById('againBtn').onclick = loadToken;

window.onload = ()=>{
    loadToken();
    setupGame();
};
