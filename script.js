let quizType = "";
let flashcards = [];
let shuffledFlashcards = [];
let hiraganaType = [];
let currentQuestion = 0;
let score = 0;
let totalQuestions = 5;  // Default number of questions
let timer;
let timeLeft = 0; // 10 seconds for each question
let pagevalue = 1;
let history_dataset = []
let databindonreference = 0;
let trailcount = 0;


function shuffleArray(array) {

    return array.sort(() => Math.random() - 0.5);
}

function generateOptions(correctAnswer) {

    const options = new Set([correctAnswer]);
    const meanings = {};  // Store the meaning for each romaji
    // Add meanings to the options set
    while (options.size < Math.min(flashcards.length, 6)) {
        const randomOption = flashcards[Math.floor(Math.random() * flashcards.length)].romaji;
        options.add(randomOption);
    }
    shuffleArray([...options]);
    // Prepare the meanings map
    flashcards.forEach(flashcard => {
        meanings[flashcard.romaji] = flashcard.meaning || ''; // Store meaning for each romaji
    });
    if (quizType === "Kanji") {
        return shuffleArray([...options]).map(option => {
            const meaning = meanings[option] || '';
            // return `<button class="option btn btn-light"  data-bs-toggle="tooltip" data-bs-title="${meaning}" >${option}</button>`;
            return `<button class="option btn btn-light">${option}<span class="invisible">|</span><span class="meaningClass">${meaning}</span></button>`;
        }).join('');
    }
    else {

        return shuffleArray([...options]).map(option => {
            return `<button class="option btn btn-light">${option}</button>`;
        }).join('');
    }
    // Convert Set to array and shuffle the options

}

function renderQuiz() {

    const $container = $('#quiz-container');
    if (currentQuestion >= totalQuestions) {
        clearInterval(timer); // Stop the timer when the quiz ends
        $container.html(`
            <div class="card"  id="quiz_card">
                <div class="card-header">Your Score</div>
                <div class="card-body text-center">
                    <svg height="120" width="120" viewBox="0 0 36 36" class="circular-chart green">
                        <path class="circle-bg" d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path class="circle" stroke-dasharray="${score / (totalQuestions / 100)}, 100" d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <text x="18" y="20.35" class="percentage">${Math.round((score) / (totalQuestions / 100))}%</text>
                    </svg>
                    <br>
                    <h3>${score} / ${totalQuestions}</h3>
                    <div class="d-grid gap-2">
                    <button class="btn btn-primary" onclick="retryQuiz(1)">Retry Quiz</button>
                    </div>
                </div>
            </div>
        `);
        if (score == totalQuestions && totalQuestions > 0) {
            var duration = 3 * 1000;
            var animationEnd = Date.now() + duration;
            var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            function randomInRange(min, max) {
                return Math.random() * (max - min) + min;
            }

            var interval = setInterval(function () {
                var timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                var particleCount = 50 * (timeLeft / duration);
                // since particles fall down, start a bit higher than random
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
        }
        return;
    }

    const currentCharacter = shuffledFlashcards[currentQuestion];
    const optionsHtml = generateOptions(currentCharacter.romaji);
    const percentage = (currentQuestion) / (totalQuestions / 100);
    $container.html(`
        <div class="card" id="quiz_card">
            <div class="card-header">
                Question ${currentQuestion + 1} / ${totalQuestions}
                <div id="timer" class="float-end">Time Left: ${timeLeft} seconds</div>
            </div>
            <div class="card-body">
                <h3>${currentCharacter.character}</h3>
                <div id="options-container">${optionsHtml}</div>
            </div>
            <br><br>
            <div class="d-grid gap-2">
                <button class="btn btn-danger" type="button" onclick="stopQuiz()">STOP</button>
            </div>
            <div class="progress" role="progressbar" aria-label="Example with label" aria-valuenow="${currentQuestion + 1}" aria-valuemin="0" aria-valuemax="${totalQuestions}">
                <div class="progress-bar" style="width: ${percentage}%"></div>
            </div>
        </div>
    `);
    startTimer(); // Start the timer for the current question
}
function startTimer() {

    clearInterval(timer); // Clear any existing timer
    timeLeft = parseInt($('#timerInput').val(), 10); // Get value from user input
    if (isNaN(timeLeft) || timeLeft <= 0) {
        timeLeft = 10; // Default to 10 seconds if input is invalid
    }

    $('#timer').text(`Time Left: ${timeLeft} seconds`);

    timer = setInterval(() => {
        timeLeft--;
        $('#timer').text(`Time Left: ${timeLeft} seconds`);

        if (timeLeft <= 0) {
            clearInterval(timer);
            currentQuestion++; // Automatically move to the next question
            renderQuiz();
        }
    }, 1000); // Decrement every second
}



function handleAnswerOptionClick(option) {

    clearInterval(timer); // Stop the timer when an option is selected

    const currentCharacter = shuffledFlashcards[currentQuestion];
    let status = currentCharacter.romaji === option ? "Correct" : "Incorrect";
    let new_arr = { "quiztype": quizType, "trailcount": trailcount, "character": currentCharacter.character, "romaji": currentCharacter.romaji, "answered": option, "status": status };
    history_dataset.push(new_arr);
    adddatatohistorytable(new_arr);
    const $optionsContainer = $('#options-container');

    $optionsContainer.children().each(function () {
        const $button = $(this);
        const isCorrect = $button.text().split('|')[0] === currentCharacter.romaji;

        // Add correct/incorrect class based on the answer
        if (isCorrect) {
            $button.removeClass('btn-light').addClass('btn-success');
        } else {
            $button.removeClass('btn-light').addClass('btn-danger');
        }

        $button.prop('disabled', true); // Disable all options after selection
    });

    // Increase score if the answer is correct
    if (option === currentCharacter.romaji) {
        score++;
    }

    setTimeout(() => {
        currentQuestion++;
        renderQuiz();
    }, 1500); // Pause for 1 second before moving to the next question
}


function retryQuiz(value) {
    clearInterval(timer); // Stop the timer
    shuffledFlashcards = shuffleArray([...flashcards]);
    currentQuestion = 0;
    score = 0;
    hiraganaType = [];
    if (value == 1) {
        $('#input-container').slideDown();
        $('#quiz-container').slideUp();
    }
}

function getSelectedRadioValue() {

    const radios = document.querySelectorAll('input[name="quiz-type"]');
    let selectedValue = null;

    radios.forEach((radio) => {
        if (radio.checked) {

            // Get the associated label text
            const label = document.querySelector(`label[for="${radio.id}"]`);
            selectedValue = label ? label.textContent : null;
        }
    });

    return selectedValue;
}
function getSelectedKanjiValue() {

    const checkboxes = document.querySelectorAll('input[name="hiragana-type"]');
    let selectedValue = null;
    checkboxes.forEach((ck) => {
        if (ck.checked) {
            // Get the associated label text
            const label = document.querySelector(`label[for="${ck.id}"]`);
            selectedValue = label ? label.textContent : null;
            hiraganaType.push(selectedValue);
        }
    });
    return hiraganaType;
}
function startQuiz() {

    const numQuestions = parseInt($('#num-questions').val(), 10);
    const timerDuration = parseInt($('#timerInput').val(), 10);

    // Validate the inputs
    if (isNaN(numQuestions) || numQuestions < 1) {
        alert('Please enter a valid number of questions.');
        return;
    }
    if (isNaN(timerDuration) || timerDuration < 5 || timerDuration > 30) {
        alert('Please enter a valid timer duration between 5 and 30 seconds.');
        return;
    }

    // Set up quiz with these values
    totalQuestions = numQuestions;
    timeLeft = timerDuration;


    totalQuestions = parseInt($('#num-questions').val());
    quizType = getSelectedRadioValue();

    flashcards = []
    // Set the flashcards based on the quiz type
    switch (quizType) {
        case 'Hiragana':
            hiraganaType = getSelectedKanjiValue();
            if (hiraganaType.length == 0) {
                alert(`Please select minimum one Hiragana Type`);
                return;
            } else {
                //flashcards = hiraganaFlashcards;
                if (hiraganaType.includes('All') || hiraganaType.includes('Basic')) {
                    flashcards.push(...hiraganaFlashcards.Basic.filter(a => a.character != '-'))
                }
                if (hiraganaType.includes('All') || hiraganaType.includes('With Tenten')) {
                    flashcards.push(...hiraganaFlashcards.With_Tenten.filter(a => a.character != '-'))
                }
                if (hiraganaType.includes('All') || hiraganaType.includes('With Maru')) {
                    flashcards.push(...hiraganaFlashcards.With_Maru.filter(a => a.character != '-'))
                }
                if (hiraganaType.includes('All') || hiraganaType.includes('Combination without Tenten')) {
                    flashcards.push(...hiraganaFlashcards.Combination_without_Tenten.filter(a => a.character != '-'))
                }
                if (hiraganaType.includes('All') || hiraganaType.includes('Combination with Tenten')) {
                    flashcards.push(...hiraganaFlashcards.Combination_with_Tenten.filter(a => a.character != '-'))
                }
                if (hiraganaType.includes('All') || hiraganaType.includes('Combination with Maru')) {
                    flashcards.push(...hiraganaFlashcards.Combination_with_Maru.filter(a => a.character != '-'))
                }
            }
            break;
        case 'Katakana':

            hiraganaType = getSelectedKanjiValue();
            if (hiraganaType.length == 0) {
                alert(`Please select minimum one Hiragana Type`);
                return;
            } else {

                if (hiraganaType.includes('All') || hiraganaType.includes('Basic')) {
                    flashcards.push(...katakanaFlashcards.Basic.filter(a => a.character != '-'))
                }
                if (hiraganaType.includes('All') || hiraganaType.includes('With Tenten')) {
                    flashcards.push(...katakanaFlashcards.With_Tenten.filter(a => a.character != '-'))
                }
                if (hiraganaType.includes('All') || hiraganaType.includes('With Maru')) {
                    flashcards.push(...katakanaFlashcards.With_Maru.filter(a => a.character != '-'))
                }
                if (hiraganaType.includes('All') || hiraganaType.includes('Combination without Tenten')) {
                    flashcards.push(...katakanaFlashcards.Combination_without_Tenten.filter(a => a.character != '-'))
                }
                if (hiraganaType.includes('All') || hiraganaType.includes('Combination with Tenten')) {
                    flashcards.push(...katakanaFlashcards.Combination_with_Tenten.filter(a => a.character != '-'))
                }
                if (hiraganaType.includes('All') || hiraganaType.includes('Combination with Maru')) {
                    flashcards.push(...katakanaFlashcards.Combination_with_Maru.filter(a => a.character != '-'))
                }
            }
            break;
        case 'Kanji':
            flashcards = kanjiFlashcards;
            break;
    }

    const maxQuestions = flashcards.length;

    // Validate the number of questions
    if (totalQuestions < 1 || totalQuestions > maxQuestions) {
        alert(`Please choose a number between 1 and ${maxQuestions}.`);
        return;
    }

    shuffledFlashcards = shuffleArray([...flashcards]);
    currentQuestion = 0;
    score = 0;
    hiraganaType = [];
    trailcount++;
    $('#input-container').slideUp();
    $('#quiz-container').slideDown();
    renderQuiz();
}

$(document).ready(function () {
    $('#start-quiz').on('click', startQuiz);
    $('#quizTableDiv').hide();
    $(document).on('click', '#options-container .option', function () {

        const option = $(this).text();

        handleAnswerOptionClick(option.split('|')[0]);
    });

    $('#btnradio17').change(function () {
        const isChecked = $(this).is(':checked');
        // Check or uncheck all checkboxes except the "All" checkbox
        $('input[name="hiragana-type"]').not(this).prop('checked', isChecked);
    });

    // Update the "All" checkbox state
    $('input[name="hiragana-type"]').not('#btnradio17').change(function () {
        const allChecked = $('input[name="hiragana-type"]:not(#btnradio17)').length ===
            $('input[name="hiragana-type"]:not(#btnradio17):checked').length;
        $('#btnradio17').prop('checked', allChecked);
    });
    $('input[name="hiragana-type"]').change(function () {

        let lettervalue = 0; let noofselect = 0
        $('input[name="hiragana-type"]').map((a) => {

            if ($('input[name="hiragana-type"]')[a].checked == true) {
                if (a == 0) {
                    lettervalue += 46
                    noofselect++
                }
                if (a == 1) {
                    lettervalue += 20
                    noofselect++
                }
                if (a == 2) {
                    lettervalue += 5
                    noofselect++
                }
                if (a == 3) {
                    lettervalue += 21
                    noofselect++
                }
                if (a == 4) {
                    lettervalue += 9
                    noofselect++
                }
                if (a == 5) {
                    lettervalue += 3
                    noofselect++
                }
                if (a == 6) {
                    lettervalue = 104
                    noofselect++
                }
            }
        });
        $('#num-questions').val(lettervalue)
        if (noofselect == 0) {
            $('#btnradio11').prop('checked', true)
            $('#num-questions').val(46)
        }
    });

    let key = 'history_quiz'
    if (sessionStorage.getItem(key) !== null) {
        let dataset = JSON.parse(sessionStorage.getItem(key))
        if (dataset.length > 0 && history_dataset.length == 0) {
            history_dataset = dataset;
        }
    }

    let grp = Object.groupBy((history_dataset.filter(a => a.status != 'Correct')), ({ romaji }) => romaji)
    let new_dataset = [];
    Object.entries(grp).map(([key, value]) => {
        new_dataset.push({
            quiztype: value[0].quiztype,
            trailcount: value.length,
            character: value[0].character,
            romaji: value[0].romaji,
            answered: value[0].answered,
            status: value[0].status
        });
    });
    $('#quizTable').bootstrapTable({ data: new_dataset })

});
function stopQuiz() {
    onclick_pagetype_radio(1);
}
function onclick_language_radio(value) {

    if (value == 1 || value == 2) {
        $('#hiraganasubmenu').slideDown();
    }
    else {
        $('#hiraganasubmenu').slideUp();
    }
}
function onclick_pagetype_radio(value) {
    if (value == 1) {
        pagevalue = value;
        $('#input-container').slideDown();
        $('#quiz-container').slideUp();
        $('#accordionExample').slideUp();
        $('#quizTableDiv').slideUp();
        retryQuiz(2)
    } else if (value == 2) {
        if (databindonreference == 0) {
            renderFlashcards();
        }
        retryQuiz(2)
        $('#quiz-container').slideUp();
        $('#input-container').slideUp();
        $('#quizTableDiv').slideUp();
        $('#accordionExample').slideDown();
    } else if (value == 3) {
        $('#quiz-container').slideUp();
        $('#input-container').slideUp();
        $('#accordionExample').slideUp();
        $('#quizTableDiv').slideDown();
    }
}
function customSearch(data, text) {
    return data.filter(function (row) {
        return row.romaji.indexOf(text) > -1
    })
}

const kanjiFlashcards = [{ "character": "一", "romaji": "ichi", "meaning": "one" }, { "character": "二", "romaji": "ni", "meaning": "two" }, { "character": "三", "romaji": "san", "meaning": "three" }, { "character": "四", "romaji": "shi/yon", "meaning": "four" }, { "character": "五", "romaji": "go", "meaning": "five" }, { "character": "六", "romaji": "roku", "meaning": "six" }, { "character": "七", "romaji": "shichi/nana", "meaning": "seven" }, { "character": "八", "romaji": "hachi", "meaning": "eight" }, { "character": "九", "romaji": "kyuu/ku", "meaning": "nine" }, { "character": "十", "romaji": "juu", "meaning": "ten" }, { "character": "百", "romaji": "hyaku", "meaning": "hundred" }, { "character": "千", "romaji": "sen", "meaning": "thousand" }, { "character": "万", "romaji": "man", "meaning": "ten thousand" }, { "character": "円", "romaji": "en", "meaning": "yen, circle" }, { "character": "口", "romaji": "kuchi", "meaning": "mouth" }, { "character": "目", "romaji": "me", "meaning": "eye" }, { "character": "耳", "romaji": "mimi", "meaning": "ear" }, { "character": "手", "romaji": "te", "meaning": "hand" }, { "character": "足", "romaji": "ashi", "meaning": "foot, leg" }, { "character": "力", "romaji": "chikara", "meaning": "power, strength" }, { "character": "男", "romaji": "otoko", "meaning": "man" }, { "character": "女", "romaji": "onna", "meaning": "woman" }, { "character": "子", "romaji": "ko", "meaning": "child" }, { "character": "山", "romaji": "yama", "meaning": "mountain" }, { "character": "川", "romaji": "kawa", "meaning": "river" }, { "character": "田", "romaji": "ta", "meaning": "rice field" }, { "character": "休", "romaji": "kyuu", "meaning": "rest" }, { "character": "先", "romaji": "saki", "meaning": "ahead, previous" }, { "character": "生", "romaji": "sei", "meaning": "life, birth" }, { "character": "学", "romaji": "gaku", "meaning": "study, learning" }, { "character": "校", "romaji": "kou", "meaning": "school" }, { "character": "書", "romaji": "kaku", "meaning": "write" }, { "character": "読む", "romaji": "yomu", "meaning": "read" }, { "character": "食", "romaji": "taberu", "meaning": "eat" }, { "character": "飲", "romaji": "nomu", "meaning": "drink" }, { "character": "行", "romaji": "iku", "meaning": "go" }, { "character": "来", "romaji": "kuru", "meaning": "come" }, { "character": "見", "romaji": "miru", "meaning": "see" }, { "character": "言", "romaji": "iu", "meaning": "say" }, { "character": "話", "romaji": "hanasu", "meaning": "talk, speak" }, { "character": "聞", "romaji": "kiku", "meaning": "ask, hear" }, { "character": "買", "romaji": "kau", "meaning": "buy" }, { "character": "売", "romaji": "uru", "meaning": "sell" }, { "character": "出", "romaji": "deru", "meaning": "exit, leave" }, { "character": "入", "romaji": "hairu", "meaning": "enter" }, { "character": "大", "romaji": "dai/oo", "meaning": "big, large" }, { "character": "小", "romaji": "shou", "meaning": "small" }, { "character": "長", "romaji": "naga", "meaning": "long" }, { "character": "早", "romaji": "haya", "meaning": "early, fast" }, { "character": "古", "romaji": "furui", "meaning": "old" }, { "character": "新", "romaji": "shin", "meaning": "new" }, { "character": "白", "romaji": "shiro", "meaning": "white" }, { "character": "黒", "romaji": "kuro", "meaning": "black" }, { "character": "青", "romaji": "ao", "meaning": "blue, green" }, { "character": "赤", "romaji": "aka", "meaning": "red" }, { "character": "色", "romaji": "iro", "meaning": "color" }, { "character": "金", "romaji": "kin", "meaning": "gold, money" }, { "character": "銀", "romaji": "gin", "meaning": "silver" }, { "character": "土", "romaji": "tsuchi", "meaning": "earth, soil" }, { "character": "天", "romaji": "ten", "meaning": "heaven" }, { "character": "雨", "romaji": "ame", "meaning": "rain" }, { "character": "電", "romaji": "den", "meaning": "electricity" }, { "character": "車", "romaji": "kuruma", "meaning": "car, vehicle" }, { "character": "音", "romaji": "on", "meaning": "sound" }, { "character": "楽", "romaji": "raku", "meaning": "music, comfort" }, { "character": "校", "romaji": "kou", "meaning": "school" }]
const kanjiDataset = [{ "character": "人", "examples": [{ "meaning": "person", "romaji": "hito", "word": "人" }, { "meaning": "Canadian", "romaji": "kanadajin", "word": "カナダ人" }, { "meaning": "three people", "romaji": "sannin", "word": "三人" }], "meaning": "person", "romaji": "hito" }, { "character": "日", "examples": [{ "meaning": "Sunday", "romaji": "nichiyoubi", "word": "日よう日" }, { "meaning": "that day", "romaji": "sono hi", "word": "その日" }, { "meaning": "the third day", "romaji": "mikka", "word": "三日" }], "meaning": "day, sun", "romaji": "hi" }, { "character": "一", "examples": [{ "meaning": "one (thing)", "romaji": "hitotsu", "word": "一つ" }, { "meaning": "one person", "romaji": "hitori", "word": "一人" }, { "meaning": "one day", "romaji": "ichinichi", "word": "一日" }], "meaning": "one", "romaji": "ichi" }, { "character": "二", "examples": [{ "meaning": "two (things)", "romaji": "futatsu", "word": "二つ" }, { "meaning": "two people", "romaji": "futari", "word": "二人" }, { "meaning": "two days", "romaji": "futsuka", "word": "二日" }], "meaning": "two", "romaji": "ni" }, { "character": "三", "examples": [{ "meaning": "three (things)", "romaji": "mittsu", "word": "三つ" }, { "meaning": "three people", "romaji": "sannin", "word": "三人" }, { "meaning": "three days", "romaji": "mikka", "word": "三日" }], "meaning": "three", "romaji": "san" }, { "character": "四", "examples": [{ "meaning": "four (things)", "romaji": "yottsu", "word": "四つ" }, { "meaning": "four days / the fourth day", "romaji": "yokka", "word": "四日" }, { "meaning": "four people", "romaji": "yonin", "word": "四人" }, { "meaning": "April", "romaji": "shigatsu", "word": "四月" }], "meaning": "four", "romaji": "shi / yon" }, { "character": "五", "examples": [{ "meaning": "five (things)", "romaji": "itsutsu", "word": "五つ" }, { "meaning": "five days / the fifth day", "romaji": "itsuka", "word": "五日" }, { "meaning": "five people", "romaji": "gonin", "word": "五人" }], "meaning": "five", "romaji": "go" }, { "character": "六", "examples": [{ "meaning": "six (things)", "romaji": "muttsu", "word": "六つ" }, { "meaning": "six days / the sixth day", "romaji": "muika", "word": "六日" }, { "meaning": "six people", "romaji": "rokunin", "word": "六人" }], "meaning": "six", "romaji": "roku" }, { "character": "七", "examples": [{ "meaning": "seven (things)", "romaji": "nanatsu", "word": "七つ" }, { "meaning": "seven days / the seventh day", "romaji": "nanoka", "word": "七日" }, { "meaning": "seven people", "romaji": "shichinin", "word": "七人" }], "meaning": "seven", "romaji": "shichi / nana" }, { "character": "八", "examples": [{ "meaning": "eight (things)", "romaji": "yattsu", "word": "八つ" }, { "meaning": "eight days / the eighth day", "romaji": "youka", "word": "八日" }, { "meaning": "eight people", "romaji": "hachinin", "word": "八人" }], "meaning": "eight", "romaji": "hachi" }, { "character": "九", "examples": [{ "meaning": "nine (things)", "romaji": "kokonotsu", "word": "九つ" }, { "meaning": "nine days / the ninth day", "romaji": "kokonoka", "word": "九日" }, { "meaning": "nine people", "romaji": "kyuunin", "word": "九人" }, { "meaning": "September", "romaji": "kugatsu", "word": "九月" }], "meaning": "nine", "romaji": "kyuu / ku" }, { "character": "十", "examples": [{ "meaning": "ten (things)", "romaji": "too", "word": "十" }, { "meaning": "ten days / the tenth day", "romaji": "tooka", "word": "十日" }, { "meaning": "ten people", "romaji": "juunin", "word": "十人" }], "meaning": "ten", "romaji": "juu" }, { "character": "月", "examples": [{ "meaning": "moon", "romaji": "tsuki", "word": "月" }, { "meaning": "Monday", "romaji": "getsuyoubi", "word": "月よう日" }, { "meaning": "one month", "romaji": "ikkagetsu", "word": "一か月" }, { "meaning": "April", "romaji": "shigatsu", "word": "四月" }], "meaning": "moon, month", "romaji": "getsu / gatsu" }, { "character": "火", "examples": [{ "meaning": "fire", "romaji": "hi", "word": "火" }, { "meaning": "Tuesday", "romaji": "kayoubi", "word": "火よう日" }], "meaning": "fire", "romaji": "ka" }, { "character": "水", "examples": [{ "meaning": "water", "romaji": "mizu", "word": "水" }, { "meaning": "Wednesday", "romaji": "suiyoubi", "word": "水よう日" }], "meaning": "water", "romaji": "sui" }, { "character": "木", "examples": [{ "meaning": "tree", "romaji": "ki", "word": "木" }, { "meaning": "Thursday", "romaji": "mokuyoubi", "word": "木よう日" }], "meaning": "tree, wood", "romaji": "moku" }, { "character": "金", "examples": [{ "meaning": "money", "romaji": "okane", "word": "お金" }, { "meaning": "gold", "romaji": "kin", "word": "金" }, { "meaning": "Friday", "romaji": "kinyoubi", "word": "金よう日" }], "meaning": "gold, money", "romaji": "kin" }, { "character": "土", "examples": [{ "meaning": "Saturday", "romaji": "doyoubi", "word": "土よう日" }], "meaning": "earth", "romaji": "do" }, { "character": "百", "examples": [{ "meaning": "one hundred yen", "romaji": "hyakuen", "word": "百円" }], "meaning": "hundred", "romaji": "hyaku" }, { "character": "千", "examples": [{ "meaning": "one thousand yen", "romaji": "sen'en", "word": "千円" }], "meaning": "thousand", "romaji": "sen" }]

const katakanaFlashcards = { "Basic": [{ "character": "ア", "romaji": "a" }, { "character": "イ", "romaji": "i" }, { "character": "ウ", "romaji": "u" }, { "character": "エ", "romaji": "e" }, { "character": "オ", "romaji": "o" }, { "character": "カ", "romaji": "ka" }, { "character": "キ", "romaji": "ki" }, { "character": "ク", "romaji": "ku" }, { "character": "ケ", "romaji": "ke" }, { "character": "コ", "romaji": "ko" }, { "character": "サ", "romaji": "sa" }, { "character": "シ", "romaji": "shi" }, { "character": "ス", "romaji": "su" }, { "character": "セ", "romaji": "se" }, { "character": "ソ", "romaji": "so" }, { "character": "タ", "romaji": "ta" }, { "character": "チ", "romaji": "chi" }, { "character": "ツ", "romaji": "tsu" }, { "character": "テ", "romaji": "te" }, { "character": "ト", "romaji": "to" }, { "character": "ナ", "romaji": "na" }, { "character": "ニ", "romaji": "ni" }, { "character": "ヌ", "romaji": "nu" }, { "character": "ネ", "romaji": "ne" }, { "character": "ノ", "romaji": "no" }, { "character": "ハ", "romaji": "ha" }, { "character": "ヒ", "romaji": "hi" }, { "character": "フ", "romaji": "fu" }, { "character": "ヘ", "romaji": "he" }, { "character": "ホ", "romaji": "ho" }, { "character": "マ", "romaji": "ma" }, { "character": "ミ", "romaji": "mi" }, { "character": "ム", "romaji": "mu" }, { "character": "メ", "romaji": "me" }, { "character": "モ", "romaji": "mo" }, { "character": "ヤ", "romaji": "ya" }, { "character": "-", "romaji": "-" }, { "character": "ユ", "romaji": "yu" }, { "character": "-", "romaji": "-" }, { "character": "ヨ", "romaji": "yo" }, { "character": "ラ", "romaji": "ra" }, { "character": "リ", "romaji": "ri" }, { "character": "ル", "romaji": "ru" }, { "character": "レ", "romaji": "re" }, { "character": "ロ", "romaji": "ro" }, { "character": "ワ", "romaji": "wa" }, { "character": "-", "romaji": "-" }, { "character": "ヲ", "romaji": "wo" }, { "character": "-", "romaji": "-" }, { "character": "ン", "romaji": "n" }], "With_Tenten": [{ "character": "ガ", "romaji": "ga" }, { "character": "ギ", "romaji": "gi" }, { "character": "グ", "romaji": "gu" }, { "character": "ゲ", "romaji": "ge" }, { "character": "ゴ", "romaji": "go" }, { "character": "ザ", "romaji": "za" }, { "character": "ジ", "romaji": "ji" }, { "character": "ズ", "romaji": "zu" }, { "character": "ゼ", "romaji": "ze" }, { "character": "ゾ", "romaji": "zo" }, { "character": "ダ", "romaji": "da" }, { "character": "ヂ", "romaji": "ji" }, { "character": "ヅ", "romaji": "zu" }, { "character": "デ", "romaji": "de" }, { "character": "ド", "romaji": "do" }, { "character": "バ", "romaji": "ba" }, { "character": "ビ", "romaji": "bi" }, { "character": "ブ", "romaji": "bu" }, { "character": "ベ", "romaji": "be" }, { "character": "ボ", "romaji": "bo" }], "With_Maru": [{ "character": "パ", "romaji": "pa" }, { "character": "ピ", "romaji": "pi" }, { "character": "プ", "romaji": "pu" }, { "character": "ペ", "romaji": "pe" }, { "character": "ポ", "romaji": "po" }], "Combination_without_Tenten": [{ "character": "-", "romaji": "-" }, { "character": "キャ", "romaji": "kya" }, { "character": "キュ", "romaji": "kyu" }, { "character": "キョ", "romaji": "kyo" }, { "character": "-", "romaji": "-" }, { "character": "-", "romaji": "-" }, { "character": "シャ", "romaji": "sha" }, { "character": "シュ", "romaji": "shu" }, { "character": "ショ", "romaji": "sho" }, { "character": "-", "romaji": "-" }, { "character": "-", "romaji": "-" }, { "character": "チャ", "romaji": "cha" }, { "character": "チュ", "romaji": "chu" }, { "character": "チョ", "romaji": "cho" }, { "character": "-", "romaji": "-" }, { "character": "-", "romaji": "-" }, { "character": "ニャ", "romaji": "nya" }, { "character": "ニュ", "romaji": "nyu" }, { "character": "ニョ", "romaji": "nyo" }, { "character": "-", "romaji": "-" }, { "character": "-", "romaji": "-" }, { "character": "ヒャ", "romaji": "hya" }, { "character": "ヒュ", "romaji": "hyu" }, { "character": "ヒョ", "romaji": "hyo" }, { "character": "-", "romaji": "-" }, { "character": "-", "romaji": "-" }, { "character": "ミャ", "romaji": "mya" }, { "character": "ミュ", "romaji": "myu" }, { "character": "ミョ", "romaji": "myo" }, { "character": "-", "romaji": "-" }, { "character": "-", "romaji": "-" }, { "character": "リャ", "romaji": "rya" }, { "character": "リュ", "romaji": "ryu" }, { "character": "リョ", "romaji": "ryo" }, { "character": "-", "romaji": "-" }], "Combination_with_Tenten": [{ "character": "-", "romaji": "-" }, { "character": "ギャ", "romaji": "gya" }, { "character": "ギュ", "romaji": "gyu" }, { "character": "ギョ", "romaji": "gyo" }, { "character": "-", "romaji": "-" }, { "character": "-", "romaji": "-" }, { "character": "ジャ", "romaji": "ja" }, { "character": "ジュ", "romaji": "ju" }, { "character": "ジョ", "romaji": "jo" }, { "character": "-", "romaji": "-" }, { "character": "-", "romaji": "-" }, { "character": "ビャ", "romaji": "bya" }, { "character": "ビュ", "romaji": "byu" }, { "character": "ビョ", "romaji": "byo" }, { "character": "-", "romaji": "-" }], "Combination_with_Maru": [{ "character": "-", "romaji": "-" }, { "character": "ピャ", "romaji": "pya" }, { "character": "ピュ", "romaji": "pyu" }, { "character": "ピョ", "romaji": "pyo" }, { "character": "-", "romaji": "-" }] }


const hiraganaFlashcards = { "Basic": [{ "character": "あ", "romaji": "a" }, { "character": "い", "romaji": "i" }, { "character": "う", "romaji": "u" }, { "character": "え", "romaji": "e" }, { "character": "お", "romaji": "o" }, { "character": "か", "romaji": "ka" }, { "character": "き", "romaji": "ki" }, { "character": "く", "romaji": "ku" }, { "character": "け", "romaji": "ke" }, { "character": "こ", "romaji": "ko" }, { "character": "さ", "romaji": "sa" }, { "character": "し", "romaji": "shi" }, { "character": "す", "romaji": "su" }, { "character": "せ", "romaji": "se" }, { "character": "そ", "romaji": "so" }, { "character": "た", "romaji": "ta" }, { "character": "ち", "romaji": "chi" }, { "character": "つ", "romaji": "tsu" }, { "character": "て", "romaji": "te" }, { "character": "と", "romaji": "to" }, { "character": "な", "romaji": "na" }, { "character": "に", "romaji": "ni" }, { "character": "ぬ", "romaji": "nu" }, { "character": "ね", "romaji": "ne" }, { "character": "の", "romaji": "no" }, { "character": "は", "romaji": "ha" }, { "character": "ひ", "romaji": "hi" }, { "character": "ふ", "romaji": "fu" }, { "character": "へ", "romaji": "he" }, { "character": "ほ", "romaji": "ho" }, { "character": "ま", "romaji": "ma" }, { "character": "み", "romaji": "mi" }, { "character": "む", "romaji": "mu" }, { "character": "め", "romaji": "me" }, { "character": "も", "romaji": "mo" }, { "character": "や", "romaji": "ya" }, { "character": "-", "romaji": "-" }, { "character": "ゆ", "romaji": "yu" }, { "character": "-", "romaji": "-" }, { "character": "よ", "romaji": "yo" }, { "character": "ら", "romaji": "ra" }, { "character": "り", "romaji": "ri" }, { "character": "る", "romaji": "ru" }, { "character": "れ", "romaji": "re" }, { "character": "ろ", "romaji": "ro" }, { "character": "わ", "romaji": "wa" }, { "character": "-", "romaji": "-" }, { "character": "を", "romaji": "wo" }, { "character": "-", "romaji": "-" }, { "character": "ん", "romaji": "n" }], "With_Tenten": [{ "character": "が", "romaji": "ga" }, { "character": "ぎ", "romaji": "gi" }, { "character": "ぐ", "romaji": "gu" }, { "character": "げ", "romaji": "ge" }, { "character": "ご", "romaji": "go" }, { "character": "ざ", "romaji": "za" }, { "character": "じ", "romaji": "ji" }, { "character": "ず", "romaji": "zu" }, { "character": "ぜ", "romaji": "ze" }, { "character": "ぞ", "romaji": "zo" }, { "character": "だ", "romaji": "da" }, { "character": "ぢ", "romaji": "ji" }, { "character": "づ", "romaji": "zu" }, { "character": "で", "romaji": "de" }, { "character": "ど", "romaji": "do" }, { "character": "ば", "romaji": "ba" }, { "character": "び", "romaji": "bi" }, { "character": "ぶ", "romaji": "bu" }, { "character": "べ", "romaji": "be" }, { "character": "ぼ", "romaji": "bo" }], "With_Maru": [{ "character": "ぱ", "romaji": "pa" }, { "character": "ぴ", "romaji": "pi" }, { "character": "ぷ", "romaji": "pu" }, { "character": "ぺ", "romaji": "pe" }, { "character": "ぽ", "romaji": "po" }], "Combination_without_Tenten": [{ "character": "-", "romaji": "-" }, { "character": "きゃ", "romaji": "kya" }, { "character": "きゅ", "romaji": "kyu" }, { "character": "きょ", "romaji": "kyo" }, { "character": "-", "romaji": "-" }, { "character": "-", "romaji": "-" }, { "character": "しゃ", "romaji": "sha" }, { "character": "しゅ", "romaji": "shu" }, { "character": "しょ", "romaji": "sho" }, { "character": "-", "romaji": "-" }, { "character": "-", "romaji": "-" }, { "character": "ちゃ", "romaji": "cha" }, { "character": "ちゅ", "romaji": "chu" }, { "character": "ちょ", "romaji": "cho" }, { "character": "-", "romaji": "-" }, { "character": "-", "romaji": "-" }, { "character": "にゃ", "romaji": "nya" }, { "character": "にゅ", "romaji": "nyu" }, { "character": "にょ", "romaji": "nyo" }, { "character": "-", "romaji": "-" }, { "character": "-", "romaji": "-" }, { "character": "ひゃ", "romaji": "hya" }, { "character": "ひゅ", "romaji": "hyu" }, { "character": "ひょ", "romaji": "hyo" }, { "character": "-", "romaji": "-" }, { "character": "-", "romaji": "-" }, { "character": "みゃ", "romaji": "mya" }, { "character": "みゅ", "romaji": "myu" }, { "character": "みょ", "romaji": "myo" }, { "character": "-", "romaji": "-" }, { "character": "-", "romaji": "-" }, { "character": "りゃ", "romaji": "rya" }, { "character": "りゅ", "romaji": "ryu" }, { "character": "りょ", "romaji": "ryo" }, { "character": "-", "romaji": "-" }], "Combination_with_Tenten": [{ "character": "-", "romaji": "-" }, { "character": "ぎゃ", "romaji": "gya" }, { "character": "ぎゅ", "romaji": "gyu" }, { "character": "ぎょ", "romaji": "gyo" }, { "character": "-", "romaji": "-" }, { "character": "-", "romaji": "-" }, { "character": "じゃ", "romaji": "ja" }, { "character": "じゅ", "romaji": "ju" }, { "character": "じょ", "romaji": "jo" }, { "character": "-", "romaji": "-" }, { "character": "-", "romaji": "-" }, { "character": "びゃ", "romaji": "bya" }, { "character": "びゅ", "romaji": "byu" }, { "character": "びょ", "romaji": "byo" }, { "character": "-", "romaji": "-" }], "Combination_with_Maru": [{ "character": "-", "romaji": "-" }, { "character": "ぴゃ", "romaji": "pya" }, { "character": "ぴゅ", "romaji": "pyu" }, { "character": "ぴょ", "romaji": "pyo" }, { "character": "-", "romaji": "-" }] }

const combinedhiraganakatakana_dataset = [{ "character": "あ | ア", "romaji": "a" }, { "character": "い | イ", "romaji": "i" }, { "character": "う | ウ", "romaji": "u" }, { "character": "え | エ", "romaji": "e" }, { "character": "お | オ", "romaji": "o" }, { "character": "か | カ", "romaji": "ka | ga", "others": [{ "character": "か | カ", "romaji": "ka" }, { "character": "が | ガ", "romaji": "ga" }] }, { "character": "き | キ", "romaji": "ki | gi", "others": [{ "character": "き | キ", "romaji": "ki" }, { "character": "ぎ | ギ", "romaji": "gi" }] }, { "character": "く | ク", "romaji": "ku | gu", "others": [{ "character": "く | ク", "romaji": "ku" }, { "character": "ぐ | グ", "romaji": "gu" }] }, { "character": "け | ケ", "romaji": "ke | ge", "others": [{ "character": "け | ケ", "romaji": "ke" }, { "character": "げ | ゲ", "romaji": "ge" }] }, { "character": "こ | コ", "romaji": "ko | go", "others": [{ "character": "こ | コ", "romaji": "ko" }, { "character": "ご | ゴ", "romaji": "go" }] }, { "character": "さ | サ", "romaji": "sa | za", "others": [{ "character": "さ | サ", "romaji": "sa" }, { "character": "ざ | ザ", "romaji": "za" }] }, { "character": "し | シ", "romaji": "shi | ji", "others": [{ "character": "し | シ", "romaji": "shi" }, { "character": "じ | ジ", "romaji": "ji" }] }, { "character": "す | ス", "romaji": "su | zu", "others": [{ "character": "す | ス", "romaji": "su" }, { "character": "ず | ズ", "romaji": "zu" }] }, { "character": "せ | セ", "romaji": "se | ze", "others": [{ "character": "せ | セ", "romaji": "se" }, { "character": "ぜ | ゼ", "romaji": "ze" }] }, { "character": "そ | ソ", "romaji": "so | zo", "others": [{ "character": "そ | ソ", "romaji": "so" }, { "character": "ぞ | ゾ", "romaji": "zo" }] }, { "character": "た | タ", "romaji": "ta | da", "others": [{ "character": "た | タ", "romaji": "ta" }, { "character": "だ | ダ", "romaji": "da" }] }, { "character": "ち | チ", "romaji": "chi | ji", "others": [{ "character": "ち | チ", "romaji": "chi" }, { "character": "ぢ | ヂ", "romaji": "ji" }] }, { "character": "つ | ツ", "romaji": "tsu | zu", "others": [{ "character": "つ | ツ", "romaji": "tsu" }, { "character": "づ | ヅ", "romaji": "zu" }] }, { "character": "て | テ", "romaji": "te | de", "others": [{ "character": "て | テ", "romaji": "te" }, { "character": "で | デ", "romaji": "de" }] }, { "character": "と | ト", "romaji": "to | do", "others": [{ "character": "と | ト", "romaji": "to" }, { "character": "ど | ド", "romaji": "do" }] }, { "character": "な | ナ", "romaji": "na" }, { "character": "に | ニ", "romaji": "ni" }, { "character": "ぬ | ヌ", "romaji": "nu" }, { "character": "ね | ネ", "romaji": "ne" }, { "character": "の | ノ", "romaji": "no" }, { "character": "は | ハ", "romaji": "ha | ba | pa", "others": [{ "character": "は | ハ", "romaji": "ha" }, { "character": "ば | バ", "romaji": "ba" }, { "character": "ぱ | パ", "romaji": "pa" }] }, { "character": "ひ | ヒ", "romaji": "hi | bi | pi", "others": [{ "character": "ひ | ヒ", "romaji": "hi" }, { "character": "び | ビ", "romaji": "bi" }, { "character": "ぴ | ピ", "romaji": "pi" }] }, { "character": "ふ | フ", "romaji": "fu | bu | pu", "others": [{ "character": "ふ | フ", "romaji": "fu" }, { "character": "ぶ | ブ", "romaji": "bu" }, { "character": "ぷ | プ", "romaji": "pu" }] }, { "character": "へ", "romaji": "he |be | pe", "others": [{ "character": "へ", "romaji": "he" }, { "character": "べ", "romaji": "be" }, { "character": "ぺ", "romaji": "pe" }] }, { "character": "ほ | ホ", "romaji": "ho | bo | po", "others": [{ "character": "ほ | ホ", "romaji": "ho" }, { "character": "ぼ | ボ", "romaji": "bo" }, { "character": "ぽ | ポ", "romaji": "po" }] }, { "character": "ま | マ", "romaji": "ma" }, { "character": "み | ミ", "romaji": "mi" }, { "character": "む | ム", "romaji": "mu" }, { "character": "め | メ", "romaji": "me" }, { "character": "も | モ", "romaji": "mo" }, { "character": "や | ヤ", "romaji": "ya" }, { "character": "-", "romaji": "-" }, { "character": "ゆ | ユ", "romaji": "yu" }, { "character": "-", "romaji": "-" }, { "character": "よ | ヨ", "romaji": "yo" }, { "character": "ら | ラ", "romaji": "ra" }, { "character": "り | リ", "romaji": "ri" }, { "character": "る | ル", "romaji": "ru" }, { "character": "れ | レ", "romaji": "re" }, { "character": "ろ | ロ", "romaji": "ro" }, { "character": "わ | ワ", "romaji": "wa" }, { "character": "-", "romaji": "-" }, { "character": "を | ヲ", "romaji": "wo" }, { "character": "-", "romaji": "-" }, { "character": "ん | ン", "romaji": "n" }]

const japanese_dataset = [{ "Greetings": [{ "Japanese": "おはよう ございます", "Romaji": "ohayou gozaimasu", "English": "Good morning" }, { "Japanese": "こんにちは", "Romaji": "konnichiwa", "English": "Good afternoon / Hello / Hi" }, { "Japanese": "おやすみなさい", "Romaji": "oyasuminasai", "English": "Good Night" }, { "Japanese": "すみません", "Romaji": "sumimasen", "English": "Sorry / Excuse me / Thank you" }, { "Japanese": "ごめんなさい", "Romaji": "gomennasai", "English": "Sorry" }, { "Japanese": "みなさん", "Romaji": "minasan", "English": "Everyone" }, { "Japanese": "ありがとう ございます", "Romaji": "arigatou gozaimasu", "English": "Thank you" }, { "Japanese": "どういたしまして", "Romaji": "douitashimashite", "English": "You are welcome" }, { "Japanese": "じゃまた", "Romaji": "ja mata", "English": "See you again" }, { "Japanese": "さようなら", "Romaji": "sayounara", "English": "Goodbye" }, { "Japanese": "こんばんは", "Romaji": "konbanwa", "English": "Good evening" }, { "Japanese": "おねがいします", "Romaji": "onegaishimasu", "English": "Please (while asking a favor)" }, { "Japanese": "どうぞ", "Romaji": "douzo", "English": "Please (while offering something)" }, { "Japanese": "ください", "Romaji": "kudasai", "English": "Please" }, { "Japanese": "おめでとうございます", "Romaji": "omedetou gozaimasu", "English": "Congratulations" }, { "Japanese": "だいじょうぶです", "Romaji": "daijoubu desu", "English": "It’s ok / Alright" }, { "Japanese": "たんじょうび", "Romaji": "tanjoubi", "English": "Birthday" }], "Instructions": [{ "Japanese": "はじめます", "Romaji": "hajimemasu", "English": "To start" }, { "Japanese": "はじめましょうか", "Romaji": "hajimemashou ka", "English": "Shall we start?" }, { "Japanese": "はじめましょう", "Romaji": "hajimemashou", "English": "Let’s start" }, { "Japanese": "やすみます", "Romaji": "yasumimasu", "English": "To take a break/rest" }, { "Japanese": "やすみましょうか", "Romaji": "yasumimashou ka", "English": "Shall we take a break?" }, { "Japanese": "やすみましょう", "Romaji": "yasumimashou", "English": "Let’s take a break" }, { "Japanese": "おわります", "Romaji": "owarimasu", "English": "To finish" }, { "Japanese": "おわりましょうか", "Romaji": "owarimashou ka", "English": "Shall we finish?" }, { "Japanese": "おわりましょう", "Romaji": "owarimashou", "English": "Let’s finish" }, { "Japanese": "わかります", "Romaji": "wakarimasu", "English": "To understand" }, { "Japanese": "わかりますか", "Romaji": "wakarimasu ka", "English": "Do you understand?" }], "DaysOfTheWeek": [{ "Japanese": "にちようび", "Romaji": "nichiyoubi", "English": "Sunday (Sun)" }, { "Japanese": "げつようび", "Romaji": "getsuyoubi", "English": "Monday (Moon)" }, { "Japanese": "かようび", "Romaji": "kayoubi", "English": "Tuesday (Fire)" }, { "Japanese": "すいようび", "Romaji": "suiyoubi", "English": "Wednesday (Water)" }, { "Japanese": "もくようび", "Romaji": "mokuyoubi", "English": "Thursday (Tree/Wood)" }, { "Japanese": "きんようび", "Romaji": "kinyoubi", "English": "Friday (Gold)" }, { "Japanese": "どようび", "Romaji": "doyoubi", "English": "Saturday (Soil/Earth)" }, { "Japanese": "なんようび ですか", "Romaji": "nanyoubi desu ka", "English": "What day?" }, { "Japanese": "きょうは なんようび ですか？", "Romaji": "kyou wa nanyoubi desu ka?", "English": "What is the day today?" }], "Days": [{ "Japanese": "おととい", "Romaji": "ototoi", "English": "Day before yesterday" }, { "Japanese": "おととし", "Romaji": "ototoshi", "English": "Year before last" }, { "Japanese": "せんせんげつ", "Romaji": "sensengestu", "English": "Month before last" }, { "Japanese": "せんせんしゅう", "Romaji": "sensenshuu", "English": "Week before last" }, { "Japanese": "きのう/さくじつ", "Romaji": "kinou/sakujitsu", "English": "Yesterday" }, { "Japanese": "きょねん", "Romaji": "kyonen", "English": "Last year" }, { "Japanese": "せんげつ", "Romaji": "sengetsu", "English": "Last month" }, { "Japanese": "せんしゅう", "Romaji": "senshuu", "English": "Last week" }, { "Japanese": "きょう/ほんじつ", "Romaji": "kyou/honjitsu", "English": "Today" }, { "Japanese": "ことし", "Romaji": "kotoshi", "English": "This year" }, { "Japanese": "こんげつ", "Romaji": "kongetsu", "English": "This month" }, { "Japanese": "こんしゅう", "Romaji": "konshuu", "English": "This week" }, { "Japanese": "あした/あす/よくじつ", "Romaji": "ashita/asu/yokujitsu", "English": "Tomorrow" }, { "Japanese": "らいねん", "Romaji": "rainen", "English": "Next year" }, { "Japanese": "らいげつ", "Romaji": "raigetsu", "English": "Next month" }, { "Japanese": "らいしゅう", "Romaji": "raishuu", "English": "Next week" }, { "Japanese": "あさって", "Romaji": "asatte", "English": "Day after tomorrow" }, { "Japanese": "さらいねん", "Romaji": "sarainen", "English": "Year after next" }, { "Japanese": "さらいげつ", "Romaji": "saraigetsu", "English": "Month after next" }, { "Japanese": "さらいしゅう", "Romaji": "saraishuu", "English": "Week after next" }], "Numbers_Basic": [{ "Japanese": "いち", "Romaji": "ichi", "English": "1" }, { "Japanese": "に", "Romaji": "ni", "English": "2" }, { "Japanese": "さん", "Romaji": "san", "English": "3" }, { "Japanese": "よん/よ/し", "Romaji": "yon/yo/shi", "English": "4" }, { "Japanese": "ご", "Romaji": "go", "English": "5" }, { "Japanese": "ろく", "Romaji": "roku", "English": "6" }, { "Japanese": "なな/しち", "Romaji": "nana/shichi", "English": "7" }, { "Japanese": "はち", "Romaji": "hachi", "English": "8" }, { "Japanese": "きゅう/く", "Romaji": "kyuu/ku", "English": "9" }, { "Japanese": "じゅう", "Romaji": "juu", "English": "10" }], "Tens": [{ "Japanese": "じゅういち", "Romaji": "juuichi", "English": "11" }, { "Japanese": "じゅうに", "Romaji": "juuni", "English": "12" }, { "Japanese": "じゅうさん", "Romaji": "juusan", "English": "13" }, { "Japanese": "じゅうよん", "Romaji": "juuyon", "English": "14" }, { "Japanese": "じゅうご", "Romaji": "juugo", "English": "15" }, { "Japanese": "じゅうろく", "Romaji": "juuroku", "English": "16" }, { "Japanese": "じゅうなな", "Romaji": "juunana", "English": "17" }, { "Japanese": "じゅうはち", "Romaji": "juuhachi", "English": "18" }, { "Japanese": "じゅうきゅう", "Romaji": "juukyuu", "English": "19" }], "MultiplesOf10": [{ "Japanese": "にじゅう", "Romaji": "nijuu", "English": "20" }, { "Japanese": "にじゅういち", "Romaji": "nijuuichi", "English": "21" }], "Hundreds": [{ "Japanese": "ひゃく", "Romaji": "hyaku", "English": "100" }, { "Japanese": "にひゃく", "Romaji": "nihyaku", "English": "200" }, { "Japanese": "さんびゃく", "Romaji": "sanbyaku", "English": "300" }, { "Japanese": "よんひゃく", "Romaji": "yonhyaku", "English": "400" }, { "Japanese": "ごひゃく", "Romaji": "gohyaku", "English": "500" }, { "Japanese": "ろっぴゃく", "Romaji": "roppyaku", "English": "600" }, { "Japanese": "ななひゃく", "Romaji": "nanahyaku", "English": "700" }, { "Japanese": "はっぴゃく", "Romaji": "happyaku", "English": "800" }, { "Japanese": "きゅうひゃく", "Romaji": "kyuuhyaku", "English": "900" }], "Thousands": [{ "Japanese": "せん/いっせん", "Romaji": "sen/issen", "English": "1000" }, { "Japanese": "にせん", "Romaji": "nisen", "English": "2000" }, { "Japanese": "さんぜん", "Romaji": "sanzen", "English": "3000" }, { "Japanese": "よんせん", "Romaji": "yonsen", "English": "4000" }, { "Japanese": "ごせん", "Romaji": "gosen", "English": "5000" }, { "Japanese": "ろくせん", "Romaji": "rokusen", "English": "6000" }, { "Japanese": "ななせん", "Romaji": "nanasen", "English": "7000" }, { "Japanese": "はっせん", "Romaji": "hassen", "English": "8000" }, { "Japanese": "きゅうせん", "Romaji": "kyuusen", "English": "9000" }], "Ten_Thousands": [{ "Japanese": "いちまん", "Romaji": "ichiman", "English": "10,000" }, { "Japanese": "にまん", "Romaji": "niman", "English": "20,000" }, { "Japanese": "さんまん", "Romaji": "sanman", "English": "30,000" }, { "Japanese": "よんまん", "Romaji": "yonman", "English": "40,000" }, { "Japanese": "ごまん", "Romaji": "goman", "English": "50,000" }, { "Japanese": "ろくまん", "Romaji": "rokuman", "English": "60,000" }, { "Japanese": "ななまん", "Romaji": "nanaman", "English": "70,000" }, { "Japanese": "はちまん", "Romaji": "hachiman", "English": "80,000" }, { "Japanese": "きゅうまん", "Romaji": "kyuuman", "English": "90,000" }, { "Japanese": "じゅうまん", "Romaji": "juuman", "English": "One-Lac" }], "Time": [{ "Japanese": "ごぜん", "Romaji": "gozen", "English": "a.m." }, { "Japanese": "ごご", "Romaji": "gogo", "English": "p.m." }, { "Japanese": "いちじ", "Romaji": "ichiji", "English": "1 o’clock" }, { "Japanese": "にじ", "Romaji": "niji", "English": "2 o’clock" }, { "Japanese": "さんじ", "Romaji": "sanji", "English": "3 o’clock" }, { "Japanese": "よじ", "Romaji": "yoji", "English": "4 o’clock" }, { "Japanese": "ごじ", "Romaji": "goji", "English": "5 o’clock" }, { "Japanese": "ろくじ", "Romaji": "rokuji", "English": "6 o’clock" }, { "Japanese": "しちじ", "Romaji": "shichiji", "English": "7 o’clock" }, { "Japanese": "はちじ", "Romaji": "hachiji", "English": "8 o’clock" }, { "Japanese": "くじ", "Romaji": "kuji", "English": "9 o’clock" }, { "Japanese": "じゅうじ", "Romaji": "juuji", "English": "10 o’clock" }, { "Japanese": "じゅういちじ", "Romaji": "juuichiji", "English": "11 o’clock" }, { "Japanese": "じゅうにじ", "Romaji": "juuniji", "English": "12 o’clock" }, { "Japanese": "いまなんじですか？", "Romaji": "ima nanji desu ka?", "English": "What is the time now?" }], "Minutes": [{ "Japanese": "いっぷん", "Romaji": "ippun", "English": "1 minute" }, { "Japanese": "にふん", "Romaji": "nifun", "English": "2 minutes" }, { "Japanese": "さんぷん", "Romaji": "sanpun", "English": "3 minutes" }, { "Japanese": "よんぷん", "Romaji": "yonpun", "English": "4 minutes" }, { "Japanese": "ごふん", "Romaji": "gofun", "English": "5 minutes" }, { "Japanese": "ろっぷん", "Romaji": "roppun", "English": "6 minutes" }, { "Japanese": "ななふん", "Romaji": "nanafun", "English": "7 minutes" }, { "Japanese": "はっぷん", "Romaji": "happun", "English": "8 minutes" }, { "Japanese": "きゅうふん", "Romaji": "kyuufun", "English": "9 minutes" }, { "Japanese": "じゅっぷん/じっぷん", "Romaji": "juppun/jippun", "English": "10 minutes" }, { "Japanese": "じゅういっぷん", "Romaji": "juuippun", "English": "11 minutes" }, { "Japanese": "じゅうにふん", "Romaji": "juunifun", "English": "12 minutes" }, { "Japanese": "じゅうさんぷん", "Romaji": "juusanpun", "English": "13 minutes" }, { "Japanese": "じゅうきゅうふん", "Romaji": "juukyuufun", "English": "19 minutes" }, { "Japanese": "にじゅっぷん", "Romaji": "nijuppun", "English": "20 minutes" }, { "Japanese": "さんじゅっぷん/はん", "Romaji": "sanjuppun/han", "English": "30 minutes/half past" }, { "Japanese": "よんじゅっぷん", "Romaji": "yonjuppun", "English": "40 minutes" }, { "Japanese": "ごじゅっぷん", "Romaji": "gojuppun", "English": "50 minutes" }, { "Japanese": "ごじゅうきゅうふん", "Romaji": "gojuukyuu fun", "English": "59 minutes" }, { "Japanese": "なんぷん", "Romaji": "nanpun", "English": "What minute?" }], "Months": [{ "Japanese": "しょうがつ", "Romaji": "shougatsu", "English": "New Year" }, { "Japanese": "いちがつ", "Romaji": "ichigatsu", "English": "1st Month (January)" }, { "Japanese": "にがつ", "Romaji": "nigatsu", "English": "2nd Month (February)" }, { "Japanese": "さんがつ", "Romaji": "sangatsu", "English": "3rd Month (March)" }, { "Japanese": "しがつ", "Romaji": "shigatsu", "English": "4th Month (April)" }, { "Japanese": "ごがつ", "Romaji": "gogatsu", "English": "5th Month (May)" }, { "Japanese": "ろくがつ", "Romaji": "rokugatsu", "English": "6th Month (June)" }, { "Japanese": "しちがつ", "Romaji": "shichigatsu", "English": "7th Month (July)" }, { "Japanese": "はちがつ", "Romaji": "hachigatsu", "English": "8th Month (August)" }, { "Japanese": "くがつ", "Romaji": "kugatsu", "English": "9th Month (September)" }, { "Japanese": "じゅうがつ", "Romaji": "juugatsu", "English": "10th Month (October)" }, { "Japanese": "じゅういちがつ", "Romaji": "juuichigatsu", "English": "11th Month (November)" }, { "Japanese": "じゅうにがつ", "Romaji": "juunigatsu", "English": "12th Month (December)" }, { "Japanese": "なんがつ", "Romaji": "nangatsu", "English": "What month?" }], "Days_of_the_Month": [{ "Japanese": "ついたち", "Romaji": "tsuitachi", "English": "1st" }, { "Japanese": "ふつか", "Romaji": "futsuka", "English": "2nd" }, { "Japanese": "みっか", "Romaji": "mikka", "English": "3rd" }, { "Japanese": "よっか", "Romaji": "yokka", "English": "4th" }, { "Japanese": "いつか", "Romaji": "itsuka", "English": "5th" }, { "Japanese": "むいか", "Romaji": "muika", "English": "6th" }, { "Japanese": "なのか", "Romaji": "nanoka", "English": "7th" }, { "Japanese": "ようか", "Romaji": "youka", "English": "8th" }, { "Japanese": "ここのか", "Romaji": "kokonoka", "English": "9th" }, { "Japanese": "とおか", "Romaji": "tooka", "English": "10th" }, { "Japanese": "じゅういちにち", "Romaji": "juuichinichi", "English": "11th" }, { "Japanese": "じゅうににち", "Romaji": "juuninichi", "English": "12th" }, { "Japanese": "じゅうさんにち", "Romaji": "juusannichi", "English": "13th" }, { "Japanese": "じゅうよっか", "Romaji": "juuyokka", "English": "14th" }, { "Japanese": "じゅうごにち", "Romaji": "juugonichi", "English": "15th" }, { "Japanese": "じゅうろくにち", "Romaji": "juurokunichi", "English": "16th" }, { "Japanese": "じゅうしちにち", "Romaji": "juushichinichi", "English": "17th" }, { "Japanese": "じゅうはちにち", "Romaji": "juuhachinichi", "English": "18th" }, { "Japanese": "じゅうくにち", "Romaji": "juukunichi", "English": "19th" }, { "Japanese": "はつか", "Romaji": "hatsuka", "English": "20th" }, { "Japanese": "にじゅういちにち", "Romaji": "nijuuichinichi", "English": "21st" }, { "Japanese": "にじゅうににち", "Romaji": "nijuuninichi", "English": "22nd" }, { "Japanese": "にじゅうさんにち", "Romaji": "nijuusannichi", "English": "23rd" }, { "Japanese": "にじゅうよっか", "Romaji": "nijuuyokka", "English": "24th" }, { "Japanese": "にじゅごにち", "Romaji": "nijuugonichi", "English": "25th" }, { "Japanese": "にじゅうろくにち", "Romaji": "nijuurokunichi", "English": "26th" }, { "Japanese": "にじゅうしちにち", "Romaji": "nijuushichinichi", "English": "27th" }, { "Japanese": "にじゅうはちにち", "Romaji": "nijuuhachinichi", "English": "28th" }, { "Japanese": "にじゅうきゅうにち", "Romaji": "nijuukyuunichi", "English": "29th" }, { "Japanese": "さんじゅうにち", "Romaji": "sanjuunichi", "English": "30th" }, { "Japanese": "さんじゅういちにち", "Romaji": "sanjuuichinichi", "English": "31st" }, { "Japanese": "なんにち", "Romaji": "nannichi", "English": "What day?" }], "Colors": [{ "Japanese": "あかい/あか", "Romaji": "akai/aka", "English": "Red" }, { "Japanese": "あおい/あお", "Romaji": "aoi/ao", "English": "Blue" }, { "Japanese": "しろい/しろ", "Romaji": "shiroi/shiro", "English": "White" }, { "Japanese": "くろい/くろ", "Romaji": "kuroi/kuro", "English": "Black" }, { "Japanese": "ちゃいろ", "Romaji": "chairo", "English": "Brown" }, { "Japanese": "みどり", "Romaji": "midori", "English": "Green" }, { "Japanese": "むらさき", "Romaji": "murasaki", "English": "Purple" }, { "Japanese": "きいろ", "Romaji": "kiiro", "English": "Yellow" }, { "Japanese": "きん", "Romaji": "kin", "English": "Gold" }, { "Japanese": "ぎん", "Romaji": "gin", "English": "Silver" }, { "Japanese": "はいいろ", "Romaji": "haiiro", "English": "Grey" }, { "Japanese": "こんいろ", "Romaji": "koniro", "English": "Navy Blue" }, { "Japanese": "ピンク", "Romaji": "pinku", "English": "Pink" }, { "Japanese": "オレンジ", "Romaji": "orenji", "English": "Orange" }], "Position": [{ "Japanese": "うえ", "Romaji": "ue", "English": "Up/Above" }, { "Japanese": "した", "Romaji": "shita", "English": "Down/Under" }, { "Japanese": "まえ", "Romaji": "mae", "English": "Front/Before" }, { "Japanese": "うしろ", "Romaji": "ushiro", "English": "Behind/Back" }, { "Japanese": "あいだ", "Romaji": "aida", "English": "Between" }, { "Japanese": "ちかい", "Romaji": "chikai", "English": "Near" }, { "Japanese": "とおい", "Romaji": "tooi", "English": "Far" }, { "Japanese": "なか", "Romaji": "naka", "English": "Inside" }, { "Japanese": "そと", "Romaji": "soto", "English": "Outside" }, { "Japanese": "みぎ", "Romaji": "migi", "English": "Right" }, { "Japanese": "ひだり", "Romaji": "hidari", "English": "Left" }], "Directions": [{ "Japanese": "きた", "Romaji": "kita", "English": "North" }, { "Japanese": "みなみ", "Romaji": "minami", "English": "South" }, { "Japanese": "ひがし", "Romaji": "higashi", "English": "East" }, { "Japanese": "にし", "Romaji": "nishi", "English": "West" }], "Seasons": [{ "Japanese": "なつ", "Romaji": "natsu", "English": "Summer" }, { "Japanese": "あき", "Romaji": "aki", "English": "Autumn" }, { "Japanese": "ふゆ", "Romaji": "fuyu", "English": "Winter" }, { "Japanese": "はる", "Romaji": "haru", "English": "Spring" }], "Weather": [{ "Japanese": "あめ", "Romaji": "ame", "English": "Rain" }, { "Japanese": "ゆき", "Romaji": "yuki", "English": "Snow" }, { "Japanese": "くもり", "Romaji": "kumori", "English": "Cloudy" }, { "Japanese": "はれ", "Romaji": "hare", "English": "Clear" }], "Family": [{ "Japanese": "そふ", "Romaji": "sofu", "English": "Grandfather" }, { "Japanese": "そぼ", "Romaji": "sobo", "English": "Grandmother" }, { "Japanese": "ちち", "Romaji": "chichi", "English": "Father" }, { "Japanese": "はは", "Romaji": "haha", "English": "Mother" }, { "Japanese": "あに", "Romaji": "ani", "English": "Elder brother" }, { "Japanese": "あね", "Romaji": "ane", "English": "Elder sister" }, { "Japanese": "おとうと", "Romaji": "otouto", "English": "Younger brother" }, { "Japanese": "いもうと", "Romaji": "imouto", "English": "Younger sister" }, { "Japanese": "おじ", "Romaji": "oji", "English": "Uncle" }, { "Japanese": "おば", "Romaji": "oba", "English": "Aunt" }, { "Japanese": "むすこ", "Romaji": "musuko", "English": "Son" }, { "Japanese": "むすめ", "Romaji": "musume", "English": "Daughter" }, { "Japanese": "おっと/しゅじん", "Romaji": "otto/shujin", "English": "Husband" }, { "Japanese": "つま/かない", "Romaji": "tsuma/kanai", "English": "Wife" }, { "Japanese": "りょうしん", "Romaji": "ryoushin", "English": "Parents" }, { "Japanese": "こども", "Romaji": "kodomo", "English": "Children" }, { "Japanese": "ともだち", "Romaji": "tomodachi", "English": "Friend" }, { "Japanese": "しんせき", "Romaji": "shinseki", "English": "Relative" }, { "Japanese": "まご", "Romaji": "mago", "English": "Grandchild" }, { "Japanese": "あかちゃん", "Romaji": "akachan", "English": "Baby" }, { "Japanese": "きょうだい", "Romaji": "kyoudai", "English": "Siblings" }, { "Japanese": "しまい", "Romaji": "shimai", "English": "Sisters" }, { "Japanese": "いとこ", "Romaji": "itoko", "English": "Cousin" }], "Other_Family": [{ "Japanese": "おじいさん", "Romaji": "ojiisan", "English": "Grandfather" }, { "Japanese": "おばあさん", "Romaji": "obaasan", "English": "Grandmother" }, { "Japanese": "おとうさん", "Romaji": "otousan", "English": "Father" }, { "Japanese": "おかあさん", "Romaji": "okaasan", "English": "Mother" }, { "Japanese": "おにいさん", "Romaji": "oniisan", "English": "Elder brother" }, { "Japanese": "おねえさん", "Romaji": "oneesan", "English": "Elder sister" }, { "Japanese": "おとうとさん", "Romaji": "otoutosan", "English": "Younger brother" }, { "Japanese": "いもうとさん", "Romaji": "imoutosan", "English": "Younger sister" }, { "Japanese": "おじさん", "Romaji": "ojisan", "English": "Uncle" }, { "Japanese": "おばさん", "Romaji": "obasan", "English": "Aunt" }, { "Japanese": "むすこさん", "Romaji": "musukosan", "English": "Son" }, { "Japanese": "むすめさん", "Romaji": "musumesan", "English": "Daughter" }, { "Japanese": "ごしゅじん", "Romaji": "goshujin", "English": "Husband" }, { "Japanese": "おくさん", "Romaji": "okusan", "English": "Wife" }, { "Japanese": "ごりょうしん", "Romaji": "goryoushin", "English": "Parents" }, { "Japanese": "こども", "Romaji": "kodomo", "English": "Children" }, { "Japanese": "ともだち", "Romaji": "tomodachi", "English": "Friend" }, { "Japanese": "しんせき", "Romaji": "shinseki", "English": "Relative" }, { "Japanese": "ごまご", "Romaji": "gomago", "English": "Grandchild" }, { "Japanese": "あかちゃん", "Romaji": "akachan", "English": "Baby" }, { "Japanese": "ごきょうだい", "Romaji": "gokyoudai", "English": "Siblings" }, { "Japanese": "ごしまい", "Romaji": "goshimai", "English": "Sisters" }, { "Japanese": "いとこ", "Romaji": "itoko", "English": "Cousin" }], "Body_Parts": [{ "Japanese": "あたま", "Romaji": "atama", "English": "Head" }, { "Japanese": "ひたい", "Romaji": "hitai", "English": "Forehead" }, { "Japanese": "め", "Romaji": "me", "English": "Eye" }, { "Japanese": "みみ", "Romaji": "mimi", "English": "Ear" }, { "Japanese": "はな", "Romaji": "hana", "English": "Nose" }, { "Japanese": "くち", "Romaji": "kuchi", "English": "Mouth" }, { "Japanese": "あご", "Romaji": "ago", "English": "Chin" }, { "Japanese": "かた", "Romaji": "kata", "English": "Shoulder" }, { "Japanese": "うで", "Romaji": "ude", "English": "Arm" }, { "Japanese": "ほね", "Romaji": "hone", "English": "Bone" }, { "Japanese": "て", "Romaji": "te", "English": "Hand" }, { "Japanese": "ゆび", "Romaji": "yubi", "English": "Fingers" }, { "Japanese": "てくび", "Romaji": "tekubi", "English": "Wrist" }, { "Japanese": "まゆ", "Romaji": "mayu", "English": "Eyebrow" }, { "Japanese": "まつげ", "Romaji": "matsuge", "English": "Eyelashes" }, { "Japanese": "からだ", "Romaji": "karada", "English": "Body" }, { "Japanese": "あし", "Romaji": "ashi", "English": "Leg" }, { "Japanese": "あしくび", "Romaji": "ashikubi", "English": "Ankle" }, { "Japanese": "こし", "Romaji": "koshi", "English": "Waist" }, { "Japanese": "はだ", "Romaji": "hada", "English": "Skin" }, { "Japanese": "つめ", "Romaji": "tsume", "English": "Nail" }, { "Japanese": "ほほ", "Romaji": "hoho", "English": "Cheek" }, { "Japanese": "くび", "Romaji": "kubi", "English": "Neck" }, { "Japanese": "むね", "Romaji": "mune", "English": "Chest" }, { "Japanese": "おなか", "Romaji": "onaka", "English": "Stomach" }, { "Japanese": "は", "Romaji": "ha", "English": "Teeth" }, { "Japanese": "くちびる", "Romaji": "kuchibiru", "English": "Lips" }, { "Japanese": "かみ", "Romaji": "kami", "English": "Hair" }], "Daily_Phrases": [{ "Japanese": "ごちゅうもんは", "Romaji": "gochuumon wa", "English": "Placing an order" }, { "Japanese": "かしこまりました", "Romaji": "kashikomarimashita", "English": "Confirming an order" }, { "Japanese": "いただきます", "Romaji": "itadakimasu", "English": "Thank you for the food (Before eating)" }, { "Japanese": "ごちそうさまでした", "Romaji": "gochisousama deshita", "English": "Thank you for the food (After eating)" }, { "Japanese": "ただいま", "Romaji": "tadaima", "English": "I am home/I’m back" }, { "Japanese": "おかえりなさい", "Romaji": "okaerinasai", "English": "Welcome back" }, { "Japanese": "いってきます", "Romaji": "ittekimasu", "English": "I will go and come" }, { "Japanese": "いってらっしゃい", "Romaji": "itterasshai", "English": "Yes, you go and come" }, { "Japanese": "いらっしゃい", "Romaji": "irasshai", "English": "Welcome" }, { "Japanese": "いらっしゃいませ", "Romaji": "irasshaimase", "English": "Welcome (To customers in a shop, store, etc.)" }, { "Japanese": "ごめんください", "Romaji": "gomenkudasai", "English": "May I come in?" }, { "Japanese": "どうぞ おあがりください", "Romaji": "douzo oagari kudasai", "English": "Yes, you may come in" }, { "Japanese": "いっしょに いかがですか", "Romaji": "issho ni ikaga desu ka", "English": "Won’t you join us?" }, { "Japanese": "いいえ、ちょっと", "Romaji": "iie, chotto", "English": "It’s a bit difficult" }, { "Japanese": "だめですか", "Romaji": "dame desu ka", "English": "So, you can’t come?" }, { "Japanese": "また こんど おねがいします", "Romaji": "mata kondo onegaishimasu", "English": "Please ask me some other time" }, { "Japanese": "もういっぱい いかがですか", "Romaji": "mou ippai ikaga desu ka", "English": "Would you like to have one more cup?" }, { "Japanese": "いいえ、けっこう です", "Romaji": "iie, kekkou desu", "English": "Polite way of refusing" }, { "Japanese": "もういちど おねがいします", "Romaji": "mou ichido onegaishimasu", "English": "Can you repeat one more time?" }, { "Japanese": "そろそろ しつれいします", "Romaji": "sorosoro shitsurei shimasu", "English": "I’m leaving before you" }, { "Japanese": "おげんきですか", "Romaji": "ogenki desu ka", "English": "How are you?" }, { "Japanese": "いいでんきですね", "Romaji": "ii denki desu ne", "English": "Nice weather" }] }]
const lesson1 = [{ "PersonalPronouns": [{ "Japanese": "わたし", "Romaji": "watashi", "English": "I (formal or neutral, gender-neutral)" }, { "Japanese": "わたしたち", "Romaji": "watashitachi", "English": "We" }, { "Japanese": "あなた", "Romaji": "anata", "English": "You (formal; used carefully as it can sound distant or impolite)" }, { "Japanese": "あのひと", "Romaji": "ano hito", "English": "That person, he, she" }, { "Japanese": "あのかた", "Romaji": "ano kata", "English": "That person (polite equivalent of あのひと)" }, { "Japanese": "みなさん", "Romaji": "minasan", "English": "Everyone, ladies and gentlemen" }], "Titles&Honorifics": [{ "Japanese": "〜さん", "Romaji": "~san", "English": "Mr., Ms. (general title of respect)" }, { "Japanese": "〜ちゃん", "Romaji": "~chan", "English": "Affectionate suffix for children or close friends" }, { "Japanese": "〜くん", "Romaji": "~kun", "English": "Suffix for boys or male juniors" }, { "Japanese": "〜じん", "Romaji": "~jin", "English": "Suffix meaning 'a national of' (e.g., アメリカじん = American)" }], "Professions&Roles": [{ "Japanese": "せんせい", "Romaji": "sensei", "English": "Teacher, instructor (not used for one’s own job)" }, { "Japanese": "きょうし", "Romaji": "kyoushi", "English": "Teacher, instructor (used for one’s own job)" }, { "Japanese": "がくせい", "Romaji": "gakusei", "English": "Student" }, { "Japanese": "かいしゃいん", "Romaji": "kaishain", "English": "Company employee" }, { "Japanese": "しゃいん", "Romaji": "shain", "English": "Employee of a specific company (e.g., IMCのしゃいん = Employee of IMC)" }, { "Japanese": "ぎんこういん", "Romaji": "ginkouin", "English": "Bank employee" }, { "Japanese": "いしゃ", "Romaji": "isha", "English": "Medical doctor" }, { "Japanese": "けんきゅうしゃ", "Romaji": "kenkyuusha", "English": "Researcher, scholar" }, { "Japanese": "エンジニア", "Romaji": "enjinia", "English": "Engineer" }], "Locations": [{ "Japanese": "だいがく", "Romaji": "daigaku", "English": "University" }, { "Japanese": "びょういん", "Romaji": "byouin", "English": "Hospital" }], "Miscellaneous": [{ "Japanese": "でんき", "Romaji": "denki", "English": "Electricity, light" }, { "Japanese": "だれ", "Romaji": "dare", "English": "Who (informal)" }, { "Japanese": "どなた", "Romaji": "donata", "English": "Who (polite equivalent of だれ)" }], "BasicVocabulary&Phrases": [{ "Japanese": "〜さい", "Romaji": "~sai", "English": "~ years old (used for age, e.g., 25さい = 25 years old)" }, { "Japanese": "なんさい", "Romaji": "nansai", "English": "How old? (informal)" }, { "Japanese": "おいくつ", "Romaji": "oikutsu", "English": "How old? (polite equivalent of なんさい)" }, { "Japanese": "はい", "Romaji": "hai", "English": "Yes" }, { "Japanese": "いいえ", "Romaji": "iie", "English": "No" }], "PoliteExpressions1": [{ "Japanese": "しつれいですが", "Romaji": "shitsurei desu ga", "English": "Excuse me, but… (used politely when asking for information)" }, { "Japanese": "おなまえは？", "Romaji": "o-namae wa?", "English": "May I have your name? (polite)" }, { "Japanese": "はじめまして。", "Romaji": "hajimemashite", "English": "How do you do? (lit. I am meeting you for the first time; used at the start of a self-introduction)" }, { "Japanese": "どうぞよろしく［おねがいします］。", "Romaji": "douzo yoroshiku [onegaishimasu]", "English": "Pleased to meet you. (lit. Please be nice to me; usually said at the end of a self-introduction)" }], "Self-IntroductionPhrases": [{ "Japanese": "こちらは～さんです。", "Romaji": "kochira wa ~san desu.", "English": "This is Mr./Ms." }, { "Japanese": "～からきました。", "Romaji": "~kara kimashita", "English": "I came from ~." }, { "Japanese": "インドからきました。", "Romaji": "Indo kara kimashita", "English": "I came from India." }, { "Japanese": "アメリカからきました。", "Romaji": "Amerika kara kimashita", "English": "I came from the USA." }], "Countries": [{ "Japanese": "アメリカ", "Romaji": "Amerika", "English": "U.S.A." }, { "Japanese": "イギリス", "Romaji": "Igirisu", "English": "U.K." }, { "Japanese": "インド", "Romaji": "Indo", "English": "India" }, { "Japanese": "インドネシア", "Romaji": "Indoneshia", "English": "Indonesia" }, { "Japanese": "韓国", "Romaji": "Kankoku", "English": "South Korea" }, { "Japanese": "タイ", "Romaji": "Tai", "English": "Thailand" }, { "Japanese": "中国", "Romaji": "Chuugoku", "English": "China" }, { "Japanese": "ドイツ", "Romaji": "Doitsu", "English": "Germany" }, { "Japanese": "日本", "Romaji": "Nihon", "English": "Japan" }, { "Japanese": "フランス", "Romaji": "Furansu", "English": "France" }, { "Japanese": "ブラジル", "Romaji": "Burajiru", "English": "Brazil" }], "FictitiousInstitutions": [{ "Japanese": "さくら大学", "Romaji": "Sakura Daigaku", "English": "Sakura University" }, { "Japanese": "富士大学", "Romaji": "Fuji Daigaku", "English": "Fuji University" }, { "Japanese": "IMC", "Romaji": "IMC", "English": "IMC" }, { "Japanese": "パワー電気", "Romaji": "Pawaa Denki", "English": "Power Electric" }, { "Japanese": "ブラジルエアー", "Romaji": "Burajiru Ea", "English": "Brazil Air" }, { "Japanese": "神戸病院", "Romaji": "Koube Byouin", "English": "Kobe Hospital" }] }]
const lesson2 = [{ "Demonstrative Pronouns": [{ "Japanese": "これ", "Romaji": "kore", "English": "This (thing here, near the speaker)" }, { "Japanese": "それ", "Romaji": "sore", "English": "That (thing near the listener)" }, { "Japanese": "あれ", "Romaji": "are", "English": "That (thing over there, away from both speaker and listener)" }, { "Japanese": "この〜", "Romaji": "kono~", "English": "This ~ (used with a noun, e.g., このほん = this book)" }, { "Japanese": "その〜", "Romaji": "sono~", "English": "That ~ (used with a noun, e.g., そのかばん = that bag near you)" }, { "Japanese": "あの〜", "Romaji": "ano~", "English": "That ~ (used with a noun, e.g., あのとけい = that watch over there)" }], "Vocabulary": [{ "Japanese": "ほん", "Romaji": "hon", "English": "Book" }, { "Japanese": "じしょ", "Romaji": "jisho", "English": "Dictionary" }, { "Japanese": "ざっし", "Romaji": "zasshi", "English": "Magazine" }, { "Japanese": "しんぶん", "Romaji": "shinbun", "English": "Newspaper" }, { "Japanese": "ノート", "Romaji": "nooto", "English": "Notebook" }, { "Japanese": "てちょう", "Romaji": "techou", "English": "Pocket notebook" }, { "Japanese": "めいし", "Romaji": "meishi", "English": "Business card" }, { "Japanese": "カード", "Romaji": "kaado", "English": "Card" }, { "Japanese": "テレホンカード", "Romaji": "terehonkaado", "English": "Telephone card" }, { "Japanese": "えんぴつ", "Romaji": "enpitsu", "English": "Pencil" }, { "Japanese": "ボールペン", "Romaji": "boorupen", "English": "Ballpoint pen" }, { "Japanese": "シャープペンシル", "Romaji": "shaapupenshiru", "English": "Mechanical pencil, propelling pencil" }, { "Japanese": "かぎ", "Romaji": "kagi", "English": "Key" }, { "Japanese": "とけい", "Romaji": "tokei", "English": "Watch, clock" }, { "Japanese": "かさ", "Romaji": "kasa", "English": "Umbrella" }, { "Japanese": "かばん", "Romaji": "kaban", "English": "Bag, briefcase" }, { "Japanese": "［カセット］テープ", "Romaji": "[kasetto] teepu", "English": "[Cassette] tape" }, { "Japanese": "テープレコーダー", "Romaji": "teepurekoodaa", "English": "Tape recorder" }, { "Japanese": "テレビ", "Romaji": "terebi", "English": "Television" }, { "Japanese": "ラジオ", "Romaji": "rajio", "English": "Radio" }, { "Japanese": "カメラ", "Romaji": "kamera", "English": "Camera" }, { "Japanese": "コンピューター", "Romaji": "konpyuutaa", "English": "Computer" }, { "Japanese": "じどうしゃ", "Romaji": "jidousha", "English": "Automobile, car" }, { "Japanese": "つくえ", "Romaji": "tsukue", "English": "Desk" }, { "Japanese": "いす", "Romaji": "isu", "English": "Chair" }, { "Japanese": "チョコレート", "Romaji": "chokoreeto", "English": "Chocolate" }, { "Japanese": "コーヒー", "Romaji": "koohii", "English": "Coffee" }, { "Japanese": "えいご", "Romaji": "eigo", "English": "The English language" }, { "Japanese": "にほんご", "Romaji": "nihongo", "English": "The Japanese language" }, { "Japanese": "〜ご", "Romaji": "~go", "English": "~ Language (e.g., フランスご = French language)" }, { "Japanese": "なん", "Romaji": "nan", "English": "What" }], "Phrases1": [{ "Japanese": "そう", "Romaji": "sou", "English": "I see. / Yes." }, { "Japanese": "ちがいます", "Romaji": "chigaimasu", "English": "No, it isn’t. / You are wrong." }, { "Japanese": "そうですか", "Romaji": "sou desu ka", "English": "I see. / Is that so?" }, { "Japanese": "あのう", "Romaji": "anou", "English": "Well… (used to show hesitation)" }, { "Japanese": "ほんのきもちです", "Romaji": "hon no kimochi desu", "English": "It’s nothing. / It’s a token of my gratitude." }, { "Japanese": "どうぞ", "Romaji": "douzo", "English": "Please. / Here you are. (used when offering something)" }, { "Japanese": "どうも", "Romaji": "doumo", "English": "Well, thanks." }, { "Japanese": "［どうも］ありがとう［ございます］", "Romaji": "[doumo] arigatou [gozaimasu]", "English": "Thank you [very much]." }], "Polite Expressions2": [{ "Japanese": "これからおせわになります", "Romaji": "kore kara osewa ni narimasu", "English": "I hope for your kind assistance hereafter." }, { "Japanese": "こちらこそよろしく", "Romaji": "kochira koso yoroshiku", "English": "I am pleased to meet you, too. (response to どうぞよろしく)" }] }]
const lesson3 = [{ "Places and Directions": [{ "Japanese": "ここ", "Romaji": "koko", "English": "Here, this place" }, { "Japanese": "そこ", "Romaji": "soko", "English": "There, that place near you" }, { "Japanese": "あそこ", "Romaji": "asoko", "English": "That place over there" }, { "Japanese": "どこ", "Romaji": "doko", "English": "Where, what place" }, { "Japanese": "こちら", "Romaji": "kochira", "English": "This way, this place (polite equivalent of ここ)" }, { "Japanese": "そちら", "Romaji": "sochira", "English": "That way, that place near you (polite equivalent of そこ)" }, { "Japanese": "あちら", "Romaji": "achira", "English": "That way, that place over there (polite equivalent of あそこ)" }, { "Japanese": "どちら", "Romaji": "dochira", "English": "Which way, where (polite equivalent of どこ)" }], "Buildings and Facilities": [{ "Japanese": "きょうしつ", "Romaji": "kyoushitsu", "English": "Classroom" }, { "Japanese": "しょくどう", "Romaji": "shokudou", "English": "Dining hall, canteen" }, { "Japanese": "じむしょ", "Romaji": "jimusho", "English": "Office" }, { "Japanese": "かいぎしつ", "Romaji": "kaigishitsu", "English": "Conference room, assembly room" }, { "Japanese": "うけつけ", "Romaji": "uketsuke", "English": "Reception desk" }, { "Japanese": "ロビー", "Romaji": "robii", "English": "Lobby" }, { "Japanese": "へや", "Romaji": "heya", "English": "Room" }, { "Japanese": "トイレ（おてあらい）", "Romaji": "toire (otearai)", "English": "Toilet, restroom" }, { "Japanese": "かいだん", "Romaji": "kaidan", "English": "Staircase" }, { "Japanese": "エレベーター", "Romaji": "erebeetaa", "English": "Elevator, lift" }, { "Japanese": "エスカレーター", "Romaji": "esukareetaa", "English": "Escalator" }], "Objects and Miscellaneous": [{ "Japanese": "［お］くに", "Romaji": "[o] kuni", "English": "Country" }, { "Japanese": "かいしゃ", "Romaji": "kaisha", "English": "Company" }, { "Japanese": "うち", "Romaji": "uchi", "English": "House, home" }, { "Japanese": "でんわ", "Romaji": "denwa", "English": "Telephone, telephone call" }, { "Japanese": "くつ", "Romaji": "kutsu", "English": "Shoes" }, { "Japanese": "ネクタイ", "Romaji": "nekutai", "English": "Necktie" }, { "Japanese": "ワイン", "Romaji": "wain", "English": "Wine" }, { "Japanese": "たばこ", "Romaji": "tabako", "English": "Tobacco, cigarette" }, { "Japanese": "うりば", "Romaji": "uriba", "English": "Department, counter (in a department store)" }], "Numbers and Measurements": [{ "Japanese": "ちか", "Romaji": "chika", "English": "Basement" }, { "Japanese": "－かい（－がい）", "Romaji": "-kai (-gai)", "English": "-th floor" }, { "Japanese": "なんがい", "Romaji": "nangai", "English": "What floor" }, { "Japanese": "－えん", "Romaji": "-en", "English": "- Yen" }, { "Japanese": "いくら", "Romaji": "ikura", "English": "How much" }, { "Japanese": "ひゃく", "Romaji": "hyaku", "English": "Hundred" }, { "Japanese": "せん", "Romaji": "sen", "English": "Thousand" }, { "Japanese": "まん", "Romaji": "man", "English": "Ten thousand" }], "Phrases2": [{ "Japanese": "すみません", "Romaji": "sumimasen", "English": "Excuse me." }, { "Japanese": "〜でございます", "Romaji": "~de gozaimasu", "English": "(Polite equivalent of です)" }, { "Japanese": "［〜を］みせてください", "Romaji": "[~ o] misete kudasai", "English": "Please show me [~]." }, { "Japanese": "じゃ", "Romaji": "ja", "English": "Well, then; in that case" }, { "Japanese": "［〜を］ください", "Romaji": "[~ o] kudasai", "English": "Give me [~], please." }], "Places and Countries": [{ "Japanese": "おおさか", "Romaji": "Oosaka", "English": "Osaka (name of a station in Osaka)" }, { "Japanese": "イタリア", "Romaji": "Itaria", "English": "Italy" }, { "Japanese": "スイス", "Romaji": "Suisu", "English": "Switzerland" }], "Fictitious Companies": [{ "Japanese": "エムティー", "Romaji": "Emutii", "English": "MT (fictitious company)" }, { "Japanese": "ヨーネン", "Romaji": "Yoonen", "English": "Yonen (fictitious company)" }, { "Japanese": "アキックス", "Romaji": "Akikkusu", "English": "Akix (fictitious company)" }] }]
const lesson4 = [{ "Daily Activities": [{ "Japanese": "おきます", "Romaji": "okimasu", "English": "Get up, wake up" }, { "Japanese": "ねます", "Romaji": "nemasu", "English": "Sleep, go to bed" }, { "Japanese": "はたらきます", "Romaji": "hatarakimasu", "English": "Work" }, { "Japanese": "やすみます", "Romaji": "yasumimasu", "English": "Take a rest, take a holiday" }, { "Japanese": "べんきょうします", "Romaji": "benkyou shimasu", "English": "Study" }, { "Japanese": "おわります", "Romaji": "owarimasu", "English": "Finish" }], "Places": [{ "Japanese": "デパート", "Romaji": "depaato", "English": "Department store" }, { "Japanese": "ぎんこう", "Romaji": "ginkou", "English": "Bank" }, { "Japanese": "ゆうびんきょく", "Romaji": "yuubinkyoku", "English": "Post office" }, { "Japanese": "としょかん", "Romaji": "toshokan", "English": "Library" }, { "Japanese": "びじゅつかん", "Romaji": "bijutsukan", "English": "Art museum" }], "Time Expressions": [{ "Japanese": "いま", "Romaji": "ima", "English": "Now" }, { "Japanese": "ーじ", "Romaji": "-ji", "English": "- O’clock" }, { "Japanese": "ーふん（－ぷん）", "Romaji": "-fun (-pun)", "English": "- Minute" }, { "Japanese": "はん", "Romaji": "han", "English": "Half" }, { "Japanese": "なんじ", "Romaji": "nanji", "English": "What time" }, { "Japanese": "なんぷん", "Romaji": "nanpun", "English": "What minute" }, { "Japanese": "ごぜん", "Romaji": "gozen", "English": "A.M., morning" }, { "Japanese": "ごご", "Romaji": "gogo", "English": "P.M., afternoon" }], "Parts of the Day": [{ "Japanese": "あさ", "Romaji": "asa", "English": "Morning" }, { "Japanese": "ひる", "Romaji": "hiru", "English": "Daytime, noon" }, { "Japanese": "ばん（よる）", "Romaji": "ban (yoru)", "English": "Night, evening" }], "Days and Holidays": [{ "Japanese": "おととい", "Romaji": "ototoi", "English": "The day before yesterday" }, { "Japanese": "きのう", "Romaji": "kinou", "English": "Yesterday" }, { "Japanese": "きょう", "Romaji": "kyou", "English": "Today" }, { "Japanese": "あした", "Romaji": "ashita", "English": "Tomorrow" }, { "Japanese": "あさって", "Romaji": "asatte", "English": "The day after tomorrow" }, { "Japanese": "けさ", "Romaji": "kesa", "English": "This morning" }, { "Japanese": "こんばん", "Romaji": "konban", "English": "This evening, tonight" }, { "Japanese": "やすみ", "Romaji": "yasumi", "English": "Rest, a holiday, a day off" }, { "Japanese": "ひるやすみ", "Romaji": "hiruyasumi", "English": "Lunchtime" }], "Frequency Words": [{ "Japanese": "まいあさ", "Romaji": "maiasa", "English": "Every morning" }, { "Japanese": "まいばん", "Romaji": "maiban", "English": "Every night" }, { "Japanese": "まいにち", "Romaji": "mainichi", "English": "Every day" }], "Days of the Week": [{ "Japanese": "げつようび", "Romaji": "getsuyoubi", "English": "Monday" }, { "Japanese": "かようび", "Romaji": "kayoubi", "English": "Tuesday" }, { "Japanese": "すいようび", "Romaji": "suiyoubi", "English": "Wednesday" }, { "Japanese": "もくようび", "Romaji": "mokuyoubi", "English": "Thursday" }, { "Japanese": "きんようび", "Romaji": "kinyoubi", "English": "Friday" }, { "Japanese": "どようび", "Romaji": "doyoubi", "English": "Saturday" }, { "Japanese": "にちようび", "Romaji": "nichiyoubi", "English": "Sunday" }, { "Japanese": "なんようび", "Romaji": "nanyoubi", "English": "What day of the week?" }] }]

function renderFlashcards() {
    const accordionContainer = $('#accordionExample');
    accordionContainer.empty(); // Clear existing accordion content before rendering

    // Function to generate card HTML for any dataset
    function generateCards(flashcards, title, datasetType, mode) {
        let cardsHtml = `
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="heading${title}">
                            <button
                                class="accordion-button collapsed"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapse${title}"
                                aria-expanded="false"
                                aria-controls="collapse${title}">
                                ${title}
                                ${mode == 2 ? `<span class="badge rounded-pill text-bg-primary" id="score${title}" style="margin-left: 5px;"></span>` : ''}
                            </button>
                        </h2>
                        <div id="collapse${title}"
                            class="accordion-collapse collapse"
                            aria-labelledby="heading${title}"
                            data-bs-parent="#accordionExample">
                            <div class="accordion-body" id="collapse${title}id">
                            <div class="${mode === 4 || mode === 5 ? title.replace('-Quiz', '') : 'kanji-flashcard-container'}">`
        if (mode == 1) {
            flashcards.forEach((card, index) => {
                cardsHtml += `
                        <div class=${datasetType === 'kanji' ? `kanji-card` : 'kanji-card2'}>
                            <div class="kanji-card-header">
                                ${card.character}
                            </div>
                            <div class="kanji-card-body">
                                <div class="kanji-romaji">${card.romaji}</div>
                                ${datasetType === 'kanji'
                        ? `<div class="kanji-meaning">${card.meaning}</div>`
                        : ''
                    }
                            </div>
                        </div>
                        `;
            });
        } else if (mode == 2) {
            flashcards.forEach((card, index) => {
                cardsHtml += `
                        <div class="qzm2-card">
                            <div class="qzm2-card-inner">
                                <div class="qzm2-card-front">
                                    <div class="kanji-card-header">${card.romaji}</div>
                                </div>
                                <div class="qzm2-card-back">
                                    <div class="kanji-card-header">${card.character}</div>
                                </div>
                            </div>
                        </div>
                        `;
            });
        } else if (mode == 3) {
            flashcards.forEach((card, index) => {
                cardsHtml += card?.others ? `
                        <div id="carouselExample${index}" class="carousel slide" data-bs-touch="true">
                            <div class="carousel-inner">
                                <div class="carousel-item active">
                                    <div class="card2">
                                        <div class="character">
                                            <span>${card.character}</span>
                                        </div>
                                        <div class="pronunciation">
                                            ${card.romaji}
                                        </div>
                                    </div>
                                </div>
                                ${card?.others ? card.others.map((item, index) => `
                                <div class="carousel-item">
                                    <div class="card2">
                                        <div class="character">
                                            <span>${item.character}</span>
                                        </div>
                                        <div class="pronunciation">
                                            ${item.romaji}
                                        </div>
                                    </div>
                                </div>
                                `).join('') : ''}
                            </div>
                            <button class="carousel-control-prev" type="button" data-bs-target="#carouselExample${index}" data-bs-slide="prev">
                                <span class="visually-hidden">Previous</span>
                            </button>
                            <button class="carousel-control-next" type="button" data-bs-target="#carouselExample${index}" data-bs-slide="next">
                                <span class="visually-hidden">Next</span>
                            </button>
                        </div>` :
                    `<div class="card2">
                            <div class="character">
                                <span>${card.character}</span>
                            </div>
                            <div class="pronunciation">
                                ${card.romaji}
                            </div>
                        </div>`
                    ;
            });
        } else if (mode == 4) {
            for (let [category, items] of Object.entries(flashcards)) {
                let trimmed_category = category.replace('&', '_n_').replaceAll(' ', '').replaceAll('-', '');
                cardsHtml += `
                            <div class="d-flex justify-content-between align-items-center">
                                <p class="dupsubtitle mb-0">${category}</p>
                                <button
                                    onClick="hidenshowromaji('${trimmed_category}')"
                                    class="btn btn-primary btn-sm toggle-pronunciation"
                                    data-target="#collapse${title}">
                                    <i class="${trimmed_category}Icon bi bi-eye-slash-fill"></i>
                                </button>
                            </div>
                            <table id="${trimmed_category}Table" class="table table-bordered table-striped mt-2">
                                <thead class="table-light">
                                    <tr>
                                        <th data-field="Japanese">Japanese</th>
                                        <th data-field="English">English</th>
                                        <th data-field="Romaji">Romaji</th>
                                    </tr>
                                </thead>
                                <tbody>
                                </tbody>
                            </table>`;
            }
        } else if (mode == 5) {
            flashcards.forEach((card, index) => {
                cardsHtml += `
                        <div class="qzm2-card">
                            <div class="qzm2-card-inner">
                                <div class="qzm2-card-front">
                                    <div class="kanji-card-header">${card.English}</div>
                                </div>
                                <div class="qzm2-card-back">
                                    <div class="kanji-card-header">${card.Japanese}</div>
                                </div>
                            </div>
                        </div>
                        `;
            });
        }

        cardsHtml += `
                                </div>
                            </div>
                        </div>
                    </div>
                    `;
        databindonreference = 1;
        return cardsHtml;
    }

    let orderedhiraganaCards = [
        ...hiraganaFlashcards.Basic.slice(0, 10),
        ...hiraganaFlashcards.Combination_without_Tenten.slice(0, 5),
        ...hiraganaFlashcards.With_Tenten.slice(0, 5),
        ...hiraganaFlashcards.Combination_with_Tenten.slice(0, 5),

        ...hiraganaFlashcards.Basic.slice(10, 15),
        ...hiraganaFlashcards.Combination_without_Tenten.slice(5, 10),
        ...hiraganaFlashcards.With_Tenten.slice(5, 10),
        ...hiraganaFlashcards.Combination_with_Tenten.slice(5, 10),

        ...hiraganaFlashcards.Basic.slice(15, 20),
        ...hiraganaFlashcards.Combination_without_Tenten.slice(10, 15),
        ...hiraganaFlashcards.With_Tenten.slice(10, 15),

        ...hiraganaFlashcards.Basic.slice(20, 25),
        ...hiraganaFlashcards.Combination_without_Tenten.slice(15, 20),

        ...hiraganaFlashcards.Basic.slice(25, 30),
        ...hiraganaFlashcards.Combination_without_Tenten.slice(20, 25),
        ...hiraganaFlashcards.With_Tenten.slice(15, 20),
        ...hiraganaFlashcards.Combination_with_Tenten.slice(10, 15),
        ...hiraganaFlashcards.With_Maru,
        ...hiraganaFlashcards.Combination_with_Maru,

        ...hiraganaFlashcards.Basic.slice(30, 35),
        ...hiraganaFlashcards.Combination_without_Tenten.slice(25, 30),

        ...hiraganaFlashcards.Basic.slice(35, 40),
        ...hiraganaFlashcards.Basic.slice(40, 45),
        ...hiraganaFlashcards.Combination_without_Tenten.slice(30, 35),

        ...hiraganaFlashcards.Basic.slice(45, 50)
    ];
    let orderedkataganaCards = [
        ...katakanaFlashcards.Basic.slice(0, 10),
        ...katakanaFlashcards.Combination_without_Tenten.slice(0, 5),
        ...katakanaFlashcards.With_Tenten.slice(0, 5),
        ...katakanaFlashcards.Combination_with_Tenten.slice(0, 5),

        ...katakanaFlashcards.Basic.slice(10, 15),
        ...katakanaFlashcards.Combination_without_Tenten.slice(5, 10),
        ...katakanaFlashcards.With_Tenten.slice(5, 10),
        ...katakanaFlashcards.Combination_with_Tenten.slice(5, 10),

        ...katakanaFlashcards.Basic.slice(15, 20),
        ...katakanaFlashcards.Combination_without_Tenten.slice(10, 15),
        ...katakanaFlashcards.With_Tenten.slice(10, 15),

        ...katakanaFlashcards.Basic.slice(20, 25),
        ...katakanaFlashcards.Combination_without_Tenten.slice(15, 20),

        ...katakanaFlashcards.Basic.slice(25, 30),
        ...katakanaFlashcards.Combination_without_Tenten.slice(20, 25),
        ...katakanaFlashcards.With_Tenten.slice(15, 20),
        ...katakanaFlashcards.Combination_with_Tenten.slice(10, 15),
        ...katakanaFlashcards.With_Maru,
        ...katakanaFlashcards.Combination_with_Maru,

        ...katakanaFlashcards.Basic.slice(30, 35),
        ...katakanaFlashcards.Combination_without_Tenten.slice(25, 30),

        ...katakanaFlashcards.Basic.slice(35, 40),
        ...katakanaFlashcards.Basic.slice(40, 45),
        ...katakanaFlashcards.Combination_without_Tenten.slice(30, 35),

        ...katakanaFlashcards.Basic.slice(45, 50)
    ]

    accordionContainer.append(generateCards(combinedhiraganakatakana_dataset, 'Hiragana-Katagana', 'hiraganakatagana', 3));
    accordionContainer.append(generateCards(orderedhiraganaCards, 'Hiragana', 'hiragana', 1));
    accordionContainer.append(generateCards(shuffleArray(shuffleArray(orderedhiraganaCards.filter(a => a.character != '-'))), 'Hiragana-Quiz', 'hiragana', 2));
    accordionContainer.append(generateCards(orderedkataganaCards, 'Katakana', 'katakana', 1));
    accordionContainer.append(generateCards(shuffleArray(shuffleArray(orderedkataganaCards.filter(a => a.character != '-'))), 'Katagana-Quiz', 'katagana', 2));


    let { Greetings, Instructions, DaysOfTheWeek, Days, Numbers_Basic,
        Tens, MultiplesOf10, Hundreds, Thousands, Ten_Thousands, Time,
        Minutes, Months, Days_of_the_Month, Colors, Position, Directions,
        Seasons, Weather, Family, Other_Family, Body_Parts, Daily_Phrases } = japanese_dataset[0];

    accordionContainer.append(generateCards({ Greetings, Instructions, DaysOfTheWeek, Days, Numbers_Basic }, 'Basic1', 'Basic1', 4));
    accordionContainer.append(generateCards({ Tens, MultiplesOf10, Hundreds, Thousands, Ten_Thousands, Time }, 'Basic2', 'Basic2', 4));
    accordionContainer.append(generateCards({ Minutes, Months, Days_of_the_Month, Colors, Position, Directions }, 'Basic3', 'Basic3', 4));
    accordionContainer.append(generateCards({ Seasons, Weather, Family, Other_Family, Body_Parts, Daily_Phrases }, 'Basic4', 'Basic4', 4));
    accordionContainer.append(generateCards(lesson1[0], 'Lesson1', 'Lesson1', 4));
    accordionContainer.append(generateCards(lesson2[0], 'Lesson2', 'Lesson2', 4));
    accordionContainer.append(generateCards(lesson3[0], 'Lesson3', 'Lesson3', 4));
    accordionContainer.append(generateCards(lesson4[0], 'Lesson4', 'Lesson4', 4));

    let master_dataset = [...japanese_dataset, ...lesson1, ...lesson2, ...lesson3, ...lesson4];
    const new_dataset = {};
    const mergeDatasets = (datasets) => {
        datasets.forEach((dataset) => {
            Object.keys(dataset).forEach((key) => {
                if (!new_dataset[key]) {
                    new_dataset[key] = [];
                }
                new_dataset[key.replace('&', '_n_').replaceAll(' ', '').replaceAll('-', '')] = [...new_dataset[key], ...dataset[key]];
                $(`#${key.replace('&', '_n_').replaceAll(' ', '').replaceAll('-', '')}Table`).bootstrapTable({ data: new_dataset[key.replace('&', '_n_').replaceAll(' ', '').replaceAll('-', '')] })
            });
        });
    };
    mergeDatasets(master_dataset);
    //accordionContainer.append(generateCards(kanjiFlashcards, 'Kanji', 'kanji', 1));
    accordionContainer.append(generateCards(kanjiDataset, 'Kanji', 'kanji', 1));

    $('.qzm2-card').on('click', function () {
        $(this).toggleClass('flipped');
    });
}
function adddatatohistorytable(item) {

    $('#quizTable').bootstrapTable('append', [item])
    $('#quizTable').bootstrapTable('scrollTo', 'bottom')

    let key = 'history_quiz'
    if (sessionStorage.getItem(key) !== null) {
        let dataset = JSON.parse(sessionStorage.getItem(key))
        if (dataset.length > 0 && history_dataset.length == 0) {
            history_dataset = dataset;
        }
        sessionStorage.setItem(key, JSON.stringify(history_dataset));
    } else {
        sessionStorage.setItem(key, JSON.stringify(history_dataset));
    }
}

$(document).on('click', '.qzm2-card', function () {
    let HiraganaScore = $('#collapseHiragana-Quiz .accordion-body .kanji-flashcard-container .qzm2-card.flipped').length;
    let KataganaScore = $('#collapseKatagana-Quiz .accordion-body .kanji-flashcard-container .qzm2-card.flipped').length;
    if (HiraganaScore == 0) {
        $('#scoreHiragana-Quiz').hide()
    }
    if (KataganaScore == 0) {
        $('#scoreKatagana-Quiz').hide()
    } if (HiraganaScore > 0) {
        $('#scoreHiragana-Quiz').show()
    }
    if (KataganaScore > 0) {
        $('#scoreKatagana-Quiz').show()
    }
    $('#scoreHiragana-Quiz').text(HiraganaScore)
    $('#scoreKatagana-Quiz').text(KataganaScore)

});

function hidenshowromaji(classname) {
    if ($(`#${classname}Table`).bootstrapTable('getVisibleColumns').length == 3) {
        $(`#${classname}Table`).bootstrapTable('hideColumn', 'Romaji');
        $(`.${classname}Icon`).removeClass('bi-eye-slash-fill').addClass('bi-eye-fill');
    } else {
        $(`#${classname}Table`).bootstrapTable('showColumn', 'Romaji');
        $(`.${classname}Icon`).removeClass('bi-eye-fill').addClass('bi-eye-slash-fill');
    }
}
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());

gtag('config', 'G-JX2ZC65LXN');