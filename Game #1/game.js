// Game State
const gameState = {
    currentPhase: 'intro',
    currentPlayer: 1,
    isAI: false,
    player1Items: [],
    player2Items: [],
    player1Outfits: [],
    player2Outfits: [],
    player1Score: 0,
    player2Score: 0,
    fashionItems: [
        { id: 'dress', emoji: '👗', name: 'Dress', category: 'clothing' },
        { id: 'shoes', emoji: '👠', name: 'Shoes', category: 'footwear' },
        { id: 'hat', emoji: '👒', name: 'Hat', category: 'accessories' },
        { id: 'bag', emoji: '👜', name: 'Bag', category: 'accessories' },
        { id: 'glasses', emoji: '🕶️', name: 'Glasses', category: 'accessories' },
        { id: 'jewelry', emoji: '💍', name: 'Jewelry', category: 'accessories' },
        { id: 'scarf', emoji: '🧣', name: 'Scarf', category: 'accessories' },
        { id: 'jacket', emoji: '🧥', name: 'Jacket', category: 'clothing' },
        { id: 'boots', emoji: '👢', name: 'Boots', category: 'footwear' },
        { id: 'necklace', emoji: '💎', name: 'Necklace', category: 'accessories' },
        { id: 'watch', emoji: '⌚', name: 'Watch', category: 'accessories' },
        { id: 'sneakers', emoji: '👟', name: 'Sneakers', category: 'footwear' }
    ],
    player1Name: 'Player 1',
    player2Name: 'Player 2',
    memoryCards: [],
    flippedCards: [],
    matches: { player1: 0, player2: 0 },
    currentOutfitIndex: 0,
    allOutfits: [],
    currentRatingPlayer: 1,
    ratings: [],
    pendingTrade: null
};

// Initialize Game
document.addEventListener('DOMContentLoaded', () => {
    showPhase('nameInputPhase');
});

function startGameWithNames() {
    try {
        const p1Input = document.getElementById('player1NameInput');
        const p2Input = document.getElementById('player2NameInput');
        const aiCheckbox = document.getElementById('useAICheckbox');
        
        if (!p1Input || !p2Input || !aiCheckbox) {
            console.error('Required elements not found');
            alert('Error: Game elements not found. Please refresh the page.');
            return;
        }
        
        const p1Name = p1Input.value.trim() || 'Player 1';
        const p2Name = p2Input.value.trim() || 'Player 2';
        const useAI = aiCheckbox.checked;
        
        gameState.player1Name = p1Name;
        gameState.player2Name = useAI ? 'AI Player' : p2Name;
        gameState.isAI = useAI;
        
        updatePlayerNames();
        showPhase('introPhase');
        setTimeout(() => {
            startMemoryGame();
        }, 3000);
    } catch (error) {
        console.error('Error starting game:', error);
        alert('Error starting game: ' + error.message);
    }
}

function updatePlayerNames() {
    const p1Display = document.getElementById('player1NameDisplay');
    const p2Display = document.getElementById('player2NameDisplay');
    const transitionP2 = document.getElementById('transitionPlayer2Title');
    const inventoryP2 = document.getElementById('player2InventoryTitle');
    const fittingP1 = document.getElementById('fittingPlayer1Title');
    const fittingP2 = document.getElementById('fittingPlayer2Title');
    const fittingInv1 = document.getElementById('fittingInventory1Title');
    const fittingInv2 = document.getElementById('fittingInventory2Title');
    const finalP1 = document.getElementById('finalPlayer1Name');
    const finalP2 = document.getElementById('finalPlayer2Name');
    
    if (p1Display) p1Display.textContent = gameState.player1Name;
    if (p2Display) p2Display.textContent = gameState.player2Name;
    if (transitionP2) transitionP2.textContent = `${gameState.player2Name}'s Collection`;
    if (inventoryP2) inventoryP2.textContent = `${gameState.player2Name}'s Items`;
    if (fittingP1) fittingP1.textContent = `${gameState.player1Name}'s Outfits`;
    if (fittingP2) fittingP2.textContent = `${gameState.player2Name}'s Outfits`;
    if (fittingInv1) fittingInv1.textContent = `${gameState.player1Name}'s Items`;
    if (fittingInv2) fittingInv2.textContent = `${gameState.player2Name}'s Items`;
    if (finalP1) finalP1.textContent = gameState.player1Name;
    if (finalP2) finalP2.textContent = gameState.player2Name;
}

// Phase Management
function showPhase(phaseId) {
    document.querySelectorAll('.game-phase').forEach(phase => {
        phase.classList.add('hidden');
    });
    document.getElementById(phaseId).classList.remove('hidden');
    gameState.currentPhase = phaseId;
}

// Memory Game Functions
function startMemoryGame() {
    showPhase('memoryPhase');
    createMemoryCards();
    renderMemoryGrid();
    updatePlayerIndicator();
}

function createMemoryCards() {
    const items = [...gameState.fashionItems];
    const cards = [];
    
    // Create pairs
    items.forEach(item => {
        cards.push({ ...item, id: `${item.id}-1` });
        cards.push({ ...item, id: `${item.id}-2` });
    });
    
    // Shuffle
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    
    gameState.memoryCards = cards.map((card, index) => ({
        ...card,
        index,
        flipped: false,
        matched: false
    }));
}

function renderMemoryGrid() {
    const grid = document.getElementById('memoryGrid');
    grid.innerHTML = '';
    
    gameState.memoryCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'memory-card';
        cardElement.dataset.index = index;
        
        if (card.flipped || card.matched) {
            cardElement.classList.add('flipped');
            cardElement.textContent = card.emoji;
        }
        
        if (card.matched) {
            cardElement.classList.add('matched');
        }
        
        cardElement.addEventListener('click', () => handleCardClick(index));
        grid.appendChild(cardElement);
    });
}

function handleCardClick(index) {
    const card = gameState.memoryCards[index];
    
    if (card.flipped || card.matched || gameState.flippedCards.length >= 2) {
        return;
    }
    
    // Flip card
    card.flipped = true;
    gameState.flippedCards.push(index);
    renderMemoryGrid();
    
    // Check for match
    if (gameState.flippedCards.length === 2) {
        setTimeout(() => checkMatch(), 1000);
    }
}

function checkMatch() {
    const [index1, index2] = gameState.flippedCards;
    const card1 = gameState.memoryCards[index1];
    const card2 = gameState.memoryCards[index2];
    
    // Get base ID (remove the -1 or -2 suffix)
    const baseId1 = card1.id.replace(/-[12]$/, '');
    const baseId2 = card2.id.replace(/-[12]$/, '');
    
    if (baseId1 === baseId2 && card1.id !== card2.id) {
        // Match found! (same base ID but different card instances)
        card1.matched = true;
        card2.matched = true;
        
        // Award item to current player
        const item = gameState.fashionItems.find(i => i.id === baseId1);
        if (item) {
            if (gameState.currentPlayer === 1) {
                gameState.player1Items.push({...item});
                gameState.matches.player1++;
            } else {
                gameState.player2Items.push({...item});
                gameState.matches.player2++;
            }
        }
        
        updateScore();
        
        // Check if game is over
        const allMatched = gameState.memoryCards.every(card => card.matched);
        if (allMatched) {
            setTimeout(() => {
                endMemoryGame();
            }, 1000);
        } else {
            gameState.flippedCards = [];
            renderMemoryGrid();
        }
    } else {
        // No match
        card1.flipped = false;
        card2.flipped = false;
        gameState.flippedCards = [];
        
        // Switch player
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        updatePlayerIndicator();
        
        renderMemoryGrid();
        
        // AI turn
        if (gameState.isAI && gameState.currentPlayer === 2) {
            setTimeout(() => aiTurn(), 1000);
        }
    }
}

function updateScore() {
    document.getElementById('player1Matches').textContent = gameState.matches.player1;
    document.getElementById('player2Matches').textContent = gameState.matches.player2;
}

function updatePlayerIndicator() {
    document.getElementById('player1Indicator').classList.toggle('active', gameState.currentPlayer === 1);
    document.getElementById('player2Indicator').classList.toggle('active', gameState.currentPlayer === 2);
}

function endMemoryGame() {
    // Ensure both players have items (add some if needed for balance)
    if (gameState.player1Items.length === 0) {
        gameState.player1Items.push(...gameState.fashionItems.slice(0, 3).map(i => ({...i})));
    }
    if (gameState.player2Items.length === 0) {
        gameState.player2Items.push(...gameState.fashionItems.slice(3, 6).map(i => ({...i})));
    }
    
    // Add extra items so players can create multiple outfits
    const extraItems = [...gameState.fashionItems];
    gameState.player1Items.push(...extraItems.slice(0, 2).map(i => ({...i})));
    gameState.player2Items.push(...extraItems.slice(2, 4).map(i => ({...i})));
    
    showTransitionScreen();
}

function showTransitionScreen() {
    showPhase('transitionPhase');
    renderCollections();
}

function renderCollections() {
    const p1Items = document.getElementById('transitionPlayer1Items');
    const p2Items = document.getElementById('transitionPlayer2Items');
    const p2Title = document.getElementById('transitionPlayer2Title');
    
    p1Items.innerHTML = '';
    p2Items.innerHTML = '';
    
    if (gameState.isAI) {
        p2Title.textContent = 'AI Player\'s Collection';
    } else {
        p2Title.textContent = 'Player 2\'s Collection';
    }
    
    gameState.player1Items.forEach(item => {
        const itemEl = document.createElement('span');
        itemEl.textContent = item.emoji;
        itemEl.title = item.name;
        p1Items.appendChild(itemEl);
    });
    
    gameState.player2Items.forEach(item => {
        const itemEl = document.createElement('span');
        itemEl.textContent = item.emoji;
        itemEl.title = item.name;
        p2Items.appendChild(itemEl);
    });
}

function continueToPhase2() {
    startTradingPhase();
}

function continueToFitting() {
    startOutfitCreation();
}

// AI Logic
function aiTurn() {
    const unflippedCards = gameState.memoryCards
        .map((card, index) => ({ card, index }))
        .filter(({ card }) => !card.flipped && !card.matched);
    
    if (unflippedCards.length === 0) return;
    
    // Simple AI: pick two random cards
    const shuffled = [...unflippedCards].sort(() => Math.random() - 0.5);
    const card1 = shuffled[0];
    const card2 = shuffled[1];
    
    handleCardClick(card1.index);
    setTimeout(() => {
        handleCardClick(card2.index);
    }, 500);
}


// Trading Phase
function startTradingPhase() {
    showPhase('tradingPhase');
    updatePlayerNames();
    renderInventories();
    setupDragAndDrop();
    gameState.pendingTrade = null; // Reset any pending trades
    renderPendingTrade();
    document.getElementById('continueToFitting').classList.add('hidden');
}

function renderInventories() {
    // Trading phase inventories
    const p1Inv = document.getElementById('player1Inventory');
    const p2Inv = document.getElementById('player2Inventory');
    
    // Fitting phase inventories
    const fittingP1Inv = document.getElementById('fittingPlayer1Inventory');
    const fittingP2Inv = document.getElementById('fittingPlayer2Inventory');
    
    if (p1Inv) {
        p1Inv.innerHTML = '';
        gameState.player1Items.forEach((item, index) => {
            const itemEl = createInventoryItem(item, 1, index);
            p1Inv.appendChild(itemEl);
        });
    }
    
    if (p2Inv) {
        p2Inv.innerHTML = '';
        gameState.player2Items.forEach((item, index) => {
            const itemEl = createInventoryItem(item, 2, index);
            p2Inv.appendChild(itemEl);
        });
    }
    
    if (fittingP1Inv) {
        fittingP1Inv.innerHTML = '';
        gameState.player1Items.forEach((item, index) => {
            const itemEl = createInventoryItem(item, 1, index);
            fittingP1Inv.appendChild(itemEl);
        });
    }
    
    if (fittingP2Inv) {
        fittingP2Inv.innerHTML = '';
        gameState.player2Items.forEach((item, index) => {
            const itemEl = createInventoryItem(item, 2, index);
            fittingP2Inv.appendChild(itemEl);
        });
    }
}

function createInventoryItem(item, player, index) {
    const itemEl = document.createElement('div');
    itemEl.className = 'inventory-item';
    itemEl.textContent = item.emoji;
    itemEl.dataset.player = player;
    itemEl.dataset.index = index;
    itemEl.draggable = true;
    itemEl.dataset.itemId = item.id;
    
    itemEl.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ player, index, item }));
    });
    
    return itemEl;
}

let tradeState = {
    player1Items: [],
    player2Items: []
};

function initiateTrade(player) {
    if (gameState.isAI && player === 2) {
        alert('AI player cannot initiate trades.');
        return;
    }
    
    if (gameState.pendingTrade) {
        alert('There is already a pending trade. Please approve or reject it first.');
        return;
    }
    
    tradeState = {
        player1Items: [],
        player2Items: [],
        proposingPlayer: player
    };
    
    document.getElementById('tradeModal').classList.remove('hidden');
    updateTradeModal();
}

function updateTradeModal() {
    const yourItems = document.getElementById('tradeYourItems');
    const theirItems = document.getElementById('tradeTheirItems');
    
    yourItems.innerHTML = '';
    theirItems.innerHTML = '';
    
    const proposingPlayer = tradeState.proposingPlayer;
    const otherPlayer = proposingPlayer === 1 ? 2 : 1;
    const yourInv = proposingPlayer === 1 ? gameState.player1Items : gameState.player2Items;
    const theirInv = otherPlayer === 1 ? gameState.player1Items : gameState.player2Items;
    
    yourInv.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = `inventory-item ${tradeState[`player${proposingPlayer}Items`].includes(index) ? 'selected' : ''}`;
        itemEl.textContent = item.emoji;
        itemEl.onclick = () => toggleTradeItem(proposingPlayer, index);
        yourItems.appendChild(itemEl);
    });
    
    theirInv.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = `inventory-item ${tradeState[`player${otherPlayer}Items`].includes(index) ? 'selected' : ''}`;
        itemEl.textContent = item.emoji;
        itemEl.onclick = () => toggleTradeItem(otherPlayer, index);
        theirItems.appendChild(itemEl);
    });
}

function toggleTradeItem(player, index) {
    const key = `player${player}Items`;
    const idx = tradeState[key].indexOf(index);
    if (idx > -1) {
        tradeState[key].splice(idx, 1);
    } else {
        tradeState[key].push(index);
    }
    updateTradeModal();
}

function proposeTrade() {
    if (tradeState.player1Items.length === 0 && tradeState.player2Items.length === 0) {
        alert('Please select items to trade.');
        return;
    }
    
    const proposingPlayer = tradeState.proposingPlayer;
    const p1Items = tradeState.player1Items.map(i => gameState.player1Items[i]).filter(Boolean);
    const p2Items = tradeState.player2Items.map(i => gameState.player2Items[i]).filter(Boolean);
    
    // Store pending trade
    gameState.pendingTrade = {
        proposingPlayer: proposingPlayer,
        player1Items: [...p1Items],
        player2Items: [...p2Items],
        player1Indices: [...tradeState.player1Items],
        player2Indices: [...tradeState.player2Items]
    };
    
    cancelTrade();
    renderPendingTrade();
    renderInventories();
}

function renderPendingTrade() {
    const pendingDisplay = document.getElementById('pendingTradeDisplay');
    if (!gameState.pendingTrade) {
        pendingDisplay.classList.add('hidden');
        return;
    }
    
    pendingDisplay.classList.remove('hidden');
    const trade = gameState.pendingTrade;
    
    const proposer = trade.proposingPlayer === 1 ? 'Player 1' : (gameState.isAI ? 'AI Player' : 'Player 2');
    const receiver = trade.proposingPlayer === 1 ? (gameState.isAI ? 'AI Player' : 'Player 2') : 'Player 1';
    
    document.getElementById('pendingTradeProposer').textContent = `${proposer} offers:`;
    document.getElementById('pendingTradeReceiver').textContent = `Wants from ${receiver}:`;
    
    const yourItems = document.getElementById('pendingTradeYourItems');
    const theirItems = document.getElementById('pendingTradeTheirItems');
    
    yourItems.innerHTML = '';
    theirItems.innerHTML = '';
    
    if (trade.proposingPlayer === 1) {
        trade.player1Items.forEach(item => {
            const itemEl = document.createElement('span');
            itemEl.textContent = item.emoji;
            itemEl.title = item.name;
            yourItems.appendChild(itemEl);
        });
        trade.player2Items.forEach(item => {
            const itemEl = document.createElement('span');
            itemEl.textContent = item.emoji;
            itemEl.title = item.name;
            theirItems.appendChild(itemEl);
        });
    } else {
        trade.player2Items.forEach(item => {
            const itemEl = document.createElement('span');
            itemEl.textContent = item.emoji;
            itemEl.title = item.name;
            yourItems.appendChild(itemEl);
        });
        trade.player1Items.forEach(item => {
            const itemEl = document.createElement('span');
            itemEl.textContent = item.emoji;
            itemEl.title = item.name;
            theirItems.appendChild(itemEl);
        });
    }
    
    // Show approve button only to the receiver
    const approveBtn = document.getElementById('approveTradeBtn');
    if (trade.proposingPlayer === 1) {
        approveBtn.style.display = gameState.isAI ? 'none' : 'inline-block';
    } else {
        approveBtn.style.display = 'inline-block';
    }
}

function approveTrade() {
    if (!gameState.pendingTrade) return;
    
    const trade = gameState.pendingTrade;
    const p1Items = trade.player1Items;
    const p2Items = trade.player2Items;
    
    // Remove items
    trade.player1Indices.sort((a, b) => b - a).forEach(i => {
        gameState.player1Items.splice(i, 1);
    });
    trade.player2Indices.sort((a, b) => b - a).forEach(i => {
        gameState.player2Items.splice(i, 1);
    });
    
    // Add items
    gameState.player1Items.push(...p2Items);
    gameState.player2Items.push(...p1Items);
    
    gameState.pendingTrade = null;
    renderPendingTrade();
    renderInventories();
    document.getElementById('continueToFitting').classList.remove('hidden');
}

function rejectTrade() {
    gameState.pendingTrade = null;
    renderPendingTrade();
}

function confirmTrade() {
    proposeTrade();
    // Show continue button after trade is completed
    document.getElementById('continueToFitting').classList.remove('hidden');
}

function cancelTrade() {
    document.getElementById('tradeModal').classList.add('hidden');
    tradeState = { player1Items: [], player2Items: [] };
}

function skipTrading() {
    document.getElementById('continueToFitting').classList.remove('hidden');
}

// Outfit Creation
let currentOutfit = { player1: [], player2: [] };

function startOutfitCreation() {
    showPhase('fittingPhase');
    updatePlayerNames();
    renderInventories();
    setupOutfitSlots();
    setupDragAndDrop();
    document.getElementById('continueToVoting').classList.add('hidden');
    
    // If AI, auto-create outfits
    if (gameState.isAI) {
        setTimeout(() => createAIOutfits(), 500);
    }
}

function setupOutfitSlots() {
    const slot1 = document.getElementById('player1OutfitSlot');
    const slot2 = document.getElementById('player2OutfitSlot');
    
    slot1.addEventListener('dragover', (e) => {
        e.preventDefault();
        slot1.classList.add('drag-over');
    });
    
    slot1.addEventListener('dragleave', () => {
        slot1.classList.remove('drag-over');
    });
    
    slot1.addEventListener('drop', (e) => {
        e.preventDefault();
        slot1.classList.remove('drag-over');
        handleDrop(e, 1);
    });
    
    slot2.addEventListener('dragover', (e) => {
        e.preventDefault();
        slot2.classList.add('drag-over');
    });
    
    slot2.addEventListener('dragleave', () => {
        slot2.classList.remove('drag-over');
    });
    
    slot2.addEventListener('drop', (e) => {
        e.preventDefault();
        slot2.classList.remove('drag-over');
        handleDrop(e, 2);
    });
}

function setupDragAndDrop() {
    document.querySelectorAll('.inventory-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
        });
    });
}

function handleDrop(e, player) {
    try {
        const dataStr = e.dataTransfer.getData('text/plain');
        if (!dataStr) return;
        
        const data = JSON.parse(dataStr);
        
        if (data.player !== player) {
            alert('You can only add your own items to your outfit!');
            return;
        }
        
        const item = data.item;
        if (!currentOutfit[`player${player}`].find(i => i.id === item.id)) {
            currentOutfit[`player${player}`].push(item);
            renderCurrentOutfit(player);
        }
    } catch (err) {
        console.error('Error handling drop:', err);
    }
}

function renderCurrentOutfit(player) {
    const container = document.getElementById(`player${player}OutfitItems`);
    
    // Remove existing outfit items (but keep model base)
    const existingItems = container.querySelectorAll('.outfit-item');
    existingItems.forEach(item => item.remove());
    
    // Display items on model
    currentOutfit[`player${player}`].forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'outfit-item';
        itemEl.textContent = item.emoji;
        itemEl.title = item.name;
        itemEl.style.position = 'absolute';
        itemEl.style.top = `${20 + index * 15}%`;
        itemEl.style.left = `${50 + (index % 2) * 10 - 5}%`;
        itemEl.style.transform = 'translateX(-50%)';
        itemEl.onclick = () => {
            const idx = currentOutfit[`player${player}`].findIndex(i => i.id === item.id);
            currentOutfit[`player${player}`].splice(idx, 1);
            renderCurrentOutfit(player);
        };
        container.appendChild(itemEl);
    });
}

function saveOutfit(player) {
    if (currentOutfit[`player${player}`].length === 0) {
        alert('Add at least one item to create an outfit!');
        return;
    }
    
    const outfit = [...currentOutfit[`player${player}`]];
    gameState[`player${player}Outfits`].push(outfit);
    currentOutfit[`player${player}`] = [];
    
    renderSavedOutfits(player);
    renderCurrentOutfit(player);
    
    // Show continue button if both players have at least one outfit
    if (gameState.player1Outfits.length > 0 && gameState.player2Outfits.length > 0) {
        document.getElementById('continueToVoting').classList.remove('hidden');
    }
}

function renderSavedOutfits(player) {
    const container = document.getElementById(`player${player}Outfits`);
    container.innerHTML = '';
    
    gameState[`player${player}Outfits`].forEach((outfit, index) => {
        const outfitEl = document.createElement('div');
        outfitEl.className = 'saved-outfit';
        outfitEl.innerHTML = `
            <h5>Outfit ${index + 1}</h5>
            <div class="saved-outfit-items">
                ${outfit.map(item => `<span>${item.emoji}</span>`).join('')}
            </div>
        `;
        container.appendChild(outfitEl);
    });
}

function createAIOutfits() {
    // AI creates 2-3 outfits automatically
    const numOutfits = Math.min(3, Math.floor(gameState.player2Items.length / 2));
    
    for (let i = 0; i < numOutfits; i++) {
        const outfitSize = Math.min(3, Math.floor(Math.random() * 3) + 2);
        const shuffled = [...gameState.player2Items].sort(() => Math.random() - 0.5);
        const outfit = shuffled.slice(0, outfitSize);
        
        if (outfit.length > 0) {
            gameState.player2Outfits.push(outfit);
            renderSavedOutfits(2);
        }
    }
    
    // Show continue button if both players have outfits
    if (gameState.player1Outfits.length > 0 && gameState.player2Outfits.length > 0) {
        document.getElementById('continueToVoting').classList.remove('hidden');
    }
}

function continueToVoting() {
    if (gameState.player1Outfits.length === 0 || gameState.player2Outfits.length === 0) {
        alert('Both players need to create at least one outfit before continuing!');
        return;
    }
    startFashionShow();
}

// Fashion Show
function startFashionShow() {
    gameState.allOutfits = [];
    
    gameState.player1Outfits.forEach((outfit, index) => {
        gameState.allOutfits.push({ player: 1, outfit, index });
    });
    
    gameState.player2Outfits.forEach((outfit, index) => {
        gameState.allOutfits.push({ player: 2, outfit, index });
    });
    
    // Shuffle outfits
    gameState.allOutfits.sort(() => Math.random() - 0.5);
    
    gameState.currentOutfitIndex = 0;
    gameState.currentRatingPlayer = 1;
    gameState.ratings = [];
    
    showPhase('fashionShowPhase');
    displayNextOutfit();
}

function displayNextOutfit() {
    if (gameState.currentOutfitIndex >= gameState.allOutfits.length) {
        showResults();
        return;
    }
    
    const outfit = gameState.allOutfits[gameState.currentOutfitIndex];
    if (!outfit || !outfit.outfit || outfit.outfit.length === 0) {
        // Skip empty outfits
        gameState.currentOutfitIndex++;
        displayNextOutfit();
        return;
    }
    
    const owner = outfit.player === 1 ? gameState.player1Name : gameState.player2Name;
    
    const outfitOwnerEl = document.getElementById('outfitOwner');
    if (outfitOwnerEl) {
        outfitOwnerEl.textContent = `${owner}'s Outfit ${outfit.index + 1}`;
    }
    
    const display = document.getElementById('outfitDisplay');
    if (!display) {
        console.error('outfitDisplay element not found');
        return;
    }
    
    display.innerHTML = '';
    
    // Create model display
    const modelBase = document.createElement('div');
    modelBase.className = 'model-base-large';
    modelBase.textContent = '👩';
    display.appendChild(modelBase);
    
    // Add outfit items positioned around the model
    outfit.outfit.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'outfit-item-display';
        itemEl.textContent = item.emoji;
        itemEl.title = item.name || item.id;
        
        // Position items in a circle around the model
        const angle = (index / outfit.outfit.length) * 2 * Math.PI;
        const radius = 30;
        const centerX = 50;
        const centerY = 50;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        itemEl.style.position = 'absolute';
        itemEl.style.left = `${x}%`;
        itemEl.style.top = `${y}%`;
        itemEl.style.transform = 'translate(-50%, -50%)';
        
        display.appendChild(itemEl);
    });
    
    // Check which player should vote
    const ratingsForOutfit = gameState.ratings.filter(r => r.outfitIndex === gameState.currentOutfitIndex);
    const player1Rated = ratingsForOutfit.some(r => r.ratingPlayer === 1);
    const player2Rated = ratingsForOutfit.some(r => r.ratingPlayer === 2);
    
    if (!player1Rated) {
        gameState.currentRatingPlayer = 1;
    } else if (!player2Rated) {
        gameState.currentRatingPlayer = 2;
    } else {
        // Both rated, move to next
        gameState.currentOutfitIndex++;
        gameState.currentRatingPlayer = 1;
        setTimeout(() => displayNextOutfit(), 500);
        return;
    }
    
    const ratingPlayer = gameState.currentRatingPlayer === 1 ? gameState.player1Name : gameState.player2Name;
    const ratingInstruction = document.getElementById('ratingInstruction');
    if (ratingInstruction) {
        ratingInstruction.textContent = `${ratingPlayer}, rate this outfit`;
    }
    
    // Update rater indicator
    const indicator = document.getElementById('currentRaterIndicator');
    if (indicator) {
        indicator.textContent = `${ratingPlayer}'s Turn`;
        indicator.className = `rater-indicator ${gameState.currentRatingPlayer === 1 ? 'player1' : 'player2'}`;
    }
    
    setupRating();
}

function setupRating() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.classList.remove('selected');
        star.onclick = () => rateOutfit(parseInt(star.dataset.rating));
    });
}

function rateOutfit(rating) {
    const current = gameState.allOutfits[gameState.currentOutfitIndex];
    
    // Check if this player already rated this outfit
    const existingRating = gameState.ratings.find(r => 
        r.outfitIndex === gameState.currentOutfitIndex && 
        r.ratingPlayer === gameState.currentRatingPlayer
    );
    
    if (existingRating) {
        existingRating.rating = rating;
    } else {
        gameState.ratings.push({
            outfitIndex: gameState.currentOutfitIndex,
            player: current.player,
            ratingPlayer: gameState.currentRatingPlayer,
            rating
        });
    }
    
    // Highlight stars
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });
    
    // Check if both players have rated this outfit
    const ratingsForOutfit = gameState.ratings.filter(r => r.outfitIndex === gameState.currentOutfitIndex);
    const player1Rated = ratingsForOutfit.some(r => r.ratingPlayer === 1);
    const player2Rated = ratingsForOutfit.some(r => r.ratingPlayer === 2);
    
    if (player1Rated && player2Rated) {
        // Both players rated, move to next outfit after a delay
        setTimeout(() => {
            displayNextOutfit();
        }, 1500);
    } else {
        // Switch to other player
        gameState.currentRatingPlayer = gameState.currentRatingPlayer === 1 ? 2 : 1;
        
        if (gameState.isAI && gameState.currentRatingPlayer === 2 && !player2Rated) {
            // AI rates
            setTimeout(() => {
                const aiRating = Math.floor(Math.random() * 3) + 3; // AI rates 3-5
                rateOutfit(aiRating);
            }, 1000);
        } else {
            // Update instruction for human player
            displayNextOutfit(); // Refresh display with new rater
        }
    }
}

// Results
function showResults() {
    // Calculate scores
    gameState.player1Score = 0;
    gameState.player2Score = 0;
    
    gameState.ratings.forEach(rating => {
        if (rating.player === 1) {
            gameState.player1Score += rating.rating;
        } else {
            gameState.player2Score += rating.rating;
        }
    });
    
    document.getElementById('player1FinalScore').textContent = gameState.player1Score;
    document.getElementById('player2FinalScore').textContent = gameState.player2Score;
    document.getElementById('finalPlayer1Name').textContent = gameState.player1Name;
    document.getElementById('finalPlayer2Name').textContent = gameState.player2Name;
    
    const winner = gameState.player1Score > gameState.player2Score ? 1 : 
                   gameState.player1Score < gameState.player2Score ? 2 : 0;
    
    const winnerText = winner === 0 ? "It's a Tie!" : 
                      winner === 1 ? `${gameState.player1Name} Wins!` : 
                      `${gameState.player2Name} Wins!`;
    
    document.getElementById('winnerAnnouncement').textContent = winnerText;
    
    if (winner !== 0) {
        createFireworks();
    }
    
    showPhase('resultsPhase');
}

function createFireworks() {
    const fireworksContainer = document.getElementById('fireworks');
    fireworksContainer.innerHTML = '';
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const firework = document.createElement('div');
            firework.className = 'firework';
            firework.style.left = Math.random() * 100 + '%';
            firework.style.top = Math.random() * 100 + '%';
            firework.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
            fireworksContainer.appendChild(firework);
            
            setTimeout(() => {
                firework.remove();
            }, 1000);
        }, i * 100);
    }
}

function restartGame() {
    // Reset game state
    gameState.currentPhase = 'intro';
    gameState.currentPlayer = 1;
    gameState.player1Items = [];
    gameState.player2Items = [];
    gameState.player1Outfits = [];
    gameState.player2Outfits = [];
    gameState.player1Score = 0;
    gameState.player2Score = 0;
    gameState.memoryCards = [];
    gameState.flippedCards = [];
    gameState.matches = { player1: 0, player2: 0 };
    gameState.currentOutfitIndex = 0;
    gameState.allOutfits = [];
    gameState.currentRatingPlayer = 1;
    gameState.ratings = [];
    gameState.pendingTrade = null;
    currentOutfit = { player1: [], player2: [] };
    
    // Reset UI
    gameState.isAI = false;
    
    // Start over
    showPhase('nameInputPhase');
    document.getElementById('player1NameInput').value = '';
    document.getElementById('player2NameInput').value = '';
    document.getElementById('useAICheckbox').checked = false;
}

