const gameState = {
    currentRow: 0,
    gameOver: false,
    answer: '',
    usedLetters: new Set(),
    letterStatuses: {}
};

const getRandomWord = async () => {
    try {
        gameState.isLoading = true;

        const response = await fetch('https://api.datamuse.com/words?sp=?????&max=500');
        const words = await response.json();
        
        const word = words[Math.floor(Math.random() * words.length)].word;
        return word.toUpperCase();
    } catch (error) {
        console.error('API error', error);
        return 'ERROR';
    } finally {
        gameState.isLoading = false;
    }
};

const isValidWord = async (word) => {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        return response.ok;
    } catch (error) {
        console.error('API error:', error);
        return false;
    }
};

const initializeGrid = () => {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'word-row';
        
        for (let j = 0; j < 5; j++) {
            const box = document.createElement('div');
            box.className = 'letter-box';
            box.dataset.row = i;
            box.dataset.col = j;
            row.appendChild(box);
        }
        
        grid.appendChild(row);
    }
};

const initializeKeyboard = () => {
    const keyboard = document.getElementById('keyboard');
    const rows = [
        'QWERTYUIOP'.split(''),
        'ASDFGHJKL'.split(''),
        'ZXCVBNM'.split('')
    ];

    keyboard.innerHTML = '';
    rows.forEach(row => {
        const keyboardRow = document.createElement('div');
        keyboardRow.className = 'keyboard-row';
        
        row.forEach(letter => {
            const key = document.createElement('button');
            key.className = 'key';
            key.textContent = letter;
            key.addEventListener('click', () => {
                const input = document.getElementById('guess-input');
                if (input.value.length < 5) {
                    input.value += letter;
                }
            });
            keyboardRow.appendChild(key);
        });
        
        keyboard.appendChild(keyboardRow);
    });

    // backspace button
    const backspaceRow = document.createElement('div');
    backspaceRow.className = 'keyboard-row';

    const backspaceButton = document.createElement('button');
    backspaceButton.className = 'key backspace';

    backspaceButton.textContent = '←';

    backspaceButton.addEventListener('click', () => {
        const input = document.getElementById('guess-input');
        input.value = input.value.slice(0, -1); // remove prev char
    });

    backspaceRow.appendChild(backspaceButton);
    keyboard.appendChild(backspaceRow);
};

// update visual state of keyboard letters
const updateLetterState = (letter, state) => {
    const keys = document.querySelectorAll('.key');

    keys.forEach(key => {
        if (key.textContent === letter) {
            key.classList.remove('correct', 'wrong-position', 'wrong');
            key.classList.add(state);

            if (state === 'wrong') {
                key.disabled = true; // disable key for letters not in answer
                key.classList.add('disabled-key'); // styling
            }
        }
    });

    gameState.letterStatuses[letter] = state;
};

// compare user guess with answer
const checkGuess = (guess) => {
    const result = Array(5).fill('wrong');
    const answerArray = gameState.answer.split('');
    const guessArray = guess.split('');

    // check correct positions
    guessArray.forEach((letter, i) => {
        if (letter === answerArray[i]) {
            result[i] = 'correct';
            answerArray[i] = null;
        }
    });

    // check wrong positions
    guessArray.forEach((letter, i) => {
        if (result[i] !== 'correct') {
            const index = answerArray.indexOf(letter);
            if (index !== -1) {
                result[i] = 'wrong-position';
                answerArray[index] = null;
            }
        }
    });

    return result;
};

// update grid with user guess
const updateGrid = (guess, results) => {
    const row = document.querySelectorAll(`[data-row="${gameState.currentRow}"]`);
    
    guess.split('').forEach((letter, i) => {
        const box = row[i];
        box.textContent = letter;
        box.classList.add(results[i]);
        updateLetterState(letter, results[i]);
    });
};

const showModal = (message) => {
    const modal = document.getElementById('game-modal');
    const modalMessage = document.getElementById('modal-message');
    modalMessage.textContent = message;
    modal.style.display = 'flex';
};

const resetGame = async () => {
    gameState.currentRow = 0;
    gameState.gameOver = false;
    gameState.usedLetters.clear();
    gameState.letterStatuses = {};
    
    initializeGrid();
    initializeKeyboard();

    // fetch new word asynchronously from API
    gameState.answer = await getRandomWord();

    const modal = document.getElementById('game-modal');
    modal.style.display = 'none';
    
    const input = document.getElementById('guess-input');
    input.value = '';
    input.disabled = false;
    
    const guessButton = document.getElementById('guess-button');
    guessButton.disabled = false;

    console.log('answer:', gameState.answer);
};

const handleGuess = async () => {
    const input = document.getElementById('guess-input');
    const guess = input.value.toUpperCase();

    if (guess.length !== 5) {
        alert('Please enter a 5-letter word or else >:(');
        return;
    }

    // check word validity
    const isValid = await isValidWord(guess);
    if (!isValid) {
        alert('Not a real word, buddy :/');
        input.value = ''; // clear input
        return;
    }

    const results = checkGuess(guess);

    // add guessed letters to used letters set
    guess.split('').forEach(letter => gameState.usedLetters.add(letter));

    updateGrid(guess, results);

    if (guess === gameState.answer) {
        gameState.gameOver = true;
        showModal('Congrats, you won!');
    } else if (gameState.currentRow === 5) {
        gameState.gameOver = true;
        showModal(`Game over! The answer was ${gameState.answer}`);
    }

    gameState.currentRow++;
    input.value = '';

    if (gameState.gameOver) {
        input.disabled = true;
        document.getElementById('guess-button').disabled = true;
    }
};

// event listeners
document.getElementById('guess-button').addEventListener('click', handleGuess);
document.getElementById('guess-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleGuess();
    }
});
document.getElementById('restart-button').addEventListener('click', resetGame);

// initialize game!
resetGame();


/* deprecated
const wordList = [
    'AERIE', 'BRUME', 'CRYPT', 'DEITY', 'EPOXY',
    'FJORD', 'GLYPH', 'HYDRA', 'ICHOR', 'KUDZU',
    'LEMUR', 'MYRRH', 'NEXUS', 'WATER', 'PHLOX',
    'QUARK', 'RHEUM', 'SLOTH', 'THYME', 'UVULA',
    'VELDT', 'WRACK', 'XENON', 'YACHT', 'ZESTY',
    'QUEUE', 'PSYCH', 'NYMPH', 'WHARF', 'ETHOS'
];
*/
