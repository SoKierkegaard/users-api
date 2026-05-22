const API_URL = '/users';
let heroes = [];
let fighter1 = null;
let fighter2 = null;

// DOM Elements
const rosterDiv = document.getElementById('roster');
const statusText = document.getElementById('status-text');
const formContainer = document.getElementById('hero-form-container');
const form = document.getElementById('hero-form');
const btnShowForm = document.getElementById('btn-show-form');
const btnCancelForm = document.getElementById('btn-cancel-form');

const slot1 = document.getElementById('fighter-1-slot');
const slot2 = document.getElementById('fighter-2-slot');
const btnFight = document.getElementById('btn-fight');
const logContent = document.getElementById('battle-log-content');

// --- API Calls ---

async function fetchHeroes() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('API Error');
        heroes = await res.json();
        statusText.textContent = 'CONNECTED';
        statusText.style.color = '#00ff66';
        document.querySelector('.status-dot').style.backgroundColor = '#00ff66';
        renderRoster();
    } catch (err) {
        statusText.textContent = 'OFFLINE';
        statusText.style.color = '#ff003c';
        document.querySelector('.status-dot').style.backgroundColor = '#ff003c';
        console.error(err);
    }
}

async function createHero(heroData) {
    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(heroData)
    });
    fetchHeroes();
}

async function deleteHero(id) {
    if(!confirm('Delete this entity permanently?')) return;
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if(fighter1 && fighter1.id === id) clearSlot(1);
    if(fighter2 && fighter2.id === id) clearSlot(2);
    fetchHeroes();
}

async function addWin(hero) {
    await fetch(`${API_URL}/${hero.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wins: hero.wins + 1 })
    });
    fetchHeroes();
}

// --- UI Logic ---

function renderRoster() {
    rosterDiv.innerHTML = '';
    heroes.forEach(h => {
        const isF1 = fighter1 && fighter1.id === h.id;
        const isF2 = fighter2 && fighter2.id === h.id;
        const selectedClass = (isF1 || isF2) ? 'selected' : '';

        const card = document.createElement('div');
        card.className = `hero-card ${selectedClass}`;
        card.innerHTML = `
            <div class="hero-header">
                <span class="hero-name">${h.name}</span>
                <span class="hero-id">ID:${h.id}</span>
            </div>
            <span class="hero-class">${h.heroClass}</span>
            <div class="stats">
                <div class="stat-row"><span>HP:</span><span class="stat-val stat-hp">${h.hp}</span></div>
                <div class="stat-row"><span>ATK:</span><span class="stat-val">${h.atk}</span></div>
                <div class="stat-row"><span>DEF:</span><span class="stat-val">${h.def}</span></div>
                <div class="stat-row"><span>WINS:</span><span class="stat-val" style="color:#00f0ff">${h.wins}</span></div>
            </div>
            <div class="card-actions">
                <button class="cyber-btn sm" onclick="selectFighter(${h.id}, event)">SELECT</button>
                <button class="cyber-btn sm danger" onclick="deleteHero(${h.id}, event)">DEL</button>
            </div>
        `;
        rosterDiv.appendChild(card);
    });
}

function selectFighter(id, event) {
    event.stopPropagation();
    const hero = heroes.find(h => h.id === id);
    if (!hero) return;

    if (!fighter1 || (fighter1.id === id && fighter2)) {
        fighter1 = hero;
        renderSlot(1, fighter1);
    } else if (fighter1.id !== id && (!fighter2 || fighter2.id === id)) {
        fighter2 = hero;
        renderSlot(2, fighter2);
    }
    
    renderRoster();
    checkArena();
}

function renderSlot(slotNum, hero) {
    const slot = slotNum === 1 ? slot1 : slot2;
    slot.classList.add('filled');
    slot.innerHTML = `
        <div style="width:100%; padding: 10px;">
            <h3 style="color:#00f0ff; margin-bottom:5px;">${hero.name}</h3>
            <span style="font-size:0.8rem; color:#8b9bb4;">${hero.heroClass}</span>
            <div class="hp-bar-container">
                <div class="hp-bar-fill" id="hp-bar-${slotNum}" style="width: 100%"></div>
            </div>
            <div style="text-align:right; font-size:0.8rem; margin-top:4px;" id="hp-text-${slotNum}">${hero.hp} / ${hero.hp}</div>
        </div>
    `;
}

function clearSlot(slotNum) {
    if(slotNum === 1) fighter1 = null;
    if(slotNum === 2) fighter2 = null;
    const slot = slotNum === 1 ? slot1 : slot2;
    slot.classList.remove('filled');
    slot.innerHTML = `<div class="empty-slot-text">FIGHTER ${slotNum}</div>`;
    checkArena();
}

function checkArena() {
    if (fighter1 && fighter2) {
        btnFight.classList.remove('hidden');
    } else {
        btnFight.classList.add('hidden');
    }
}

function addLog(msg, type = 'system') {
    const p = document.createElement('div');
    p.className = `log-line ${type}`;
    p.textContent = `> ${msg}`;
    logContent.appendChild(p);
    logContent.scrollTop = logContent.scrollHeight;
}

// --- Combat Engine ---

btnFight.addEventListener('click', async () => {
    if (!fighter1 || !fighter2) return;
    btnFight.disabled = true;
    logContent.innerHTML = '';
    addLog('INITIATING COMBAT SEQUENCE...', 'system');
    
    let hp1 = fighter1.hp;
    let hp2 = fighter2.hp;
    
    document.getElementById('hp-bar-1').style.width = '100%';
    document.getElementById('hp-bar-2').style.width = '100%';

    let turn = 1;

    const interval = setInterval(async () => {
        const attacker = turn === 1 ? fighter1 : fighter2;
        const defender = turn === 1 ? fighter2 : fighter1;
        const slotDef = turn === 1 ? slot2 : slot1;
        const hpBarId = turn === 1 ? 'hp-bar-2' : 'hp-bar-1';
        const hpTextId = turn === 1 ? 'hp-text-2' : 'hp-text-1';
        
        // Calculate Damage
        const baseDmg = Math.max(1, attacker.atk - Math.floor(defender.def / 2));
        const crit = Math.random() > 0.8 ? 1.5 : 1;
        const damage = Math.floor(baseDmg * crit);

        addLog(`${attacker.name} attacks!`, 'attack');
        
        if (crit > 1) addLog('CRITICAL HIT!', 'damage');
        addLog(`Deals ${damage} damage to ${defender.name}.`, 'damage');
        
        // Apply damage visual
        slotDef.classList.add('shake');
        setTimeout(() => slotDef.classList.remove('shake'), 500);

        // Apply HP
        if (turn === 1) hp2 = Math.max(0, hp2 - damage);
        else hp1 = Math.max(0, hp1 - damage);

        const currentHp = turn === 1 ? hp2 : hp1;
        document.getElementById(hpBarId).style.width = `${(currentHp / defender.hp) * 100}%`;
        document.getElementById(hpTextId).textContent = `${currentHp} / ${defender.hp}`;

        if (hp1 <= 0 || hp2 <= 0) {
            clearInterval(interval);
            const winner = hp1 > 0 ? fighter1 : fighter2;
            addLog('COMBAT TERMINATED.', 'system');
            addLog(`${winner.name} IS VICTORIOUS!`, 'victory');
            btnFight.disabled = false;
            await addWin(winner);
        } else {
            turn = turn === 1 ? 2 : 1;
        }
    }, 1000);
});

// --- Events ---

btnShowForm.addEventListener('click', () => {
    formContainer.classList.remove('hidden');
    btnShowForm.classList.add('hidden');
});

btnCancelForm.addEventListener('click', () => {
    formContainer.classList.add('hidden');
    btnShowForm.classList.remove('hidden');
    form.reset();
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const heroData = {
        name: document.getElementById('h-name').value,
        heroClass: document.getElementById('h-class').value,
        // Let the server generate random stats
    };
    createHero(heroData);
    formContainer.classList.add('hidden');
    btnShowForm.classList.remove('hidden');
    form.reset();
});

// Init
fetchHeroes();
