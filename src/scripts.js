(function() {
    let timerInterval;
    let totalSeconds = 0;
    const timerButton = document.getElementById("timerButton");
    const timerCounter = document.getElementById("timer");
    const titleElement = document.getElementById('title');

    function handleEnter(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById('content').focus();
            saveTaskState();
        }
    }

    function formatTime() {
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;
        return minutes + ":" + pad(seconds);
    }

    function updateTitle() {
        const titleInput = titleElement.value.trim();
        const taskTitle = titleInput === "" ? "New task" : titleInput;
        if (timerInterval) {
            document.title = `${formatTime()} - ${taskTitle}`;
        } else {
            document.title = taskTitle;
        }
    }

    function startTimer() {
        stopOtherTimers();
        timerInterval = setInterval(setTime, 1000);
        timerButton.classList.add("stop");
        timerButton.getElementsByClassName("visually-hidden")[0].textContent = "Stop timer";
        timerButton.title = "Stop timer";
        timerCounter.classList.add("active");
        titleElement.classList.add("active");
        createPlayFavicon();
        saveTaskState();
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        timerButton.classList.remove("stop");
        timerButton.getElementsByClassName("visually-hidden")[0].textContent = "Start timer";
        timerButton.title = "Start timer";
        timerCounter.classList.remove("active");
        titleElement.classList.remove("active");
        updateTitle();
        createCheckboxFavicon();
        saveTaskState();
    }

    function toggleTimer() {
        if (!timerInterval) {
            startTimer();
        } else {
            stopTimer();
        }
    }

    function setTime() {
        ++totalSeconds;
        document.getElementById("timer").innerHTML = formatTime();
        updateTitle();
        saveTaskState();
    }

    function pad(val) {
        let valString = val + "";
        return valString.length < 2 ? "0" + valString : valString;
    }

    function createCheckboxFavicon() {
        const iconLink = document.getElementById('favicon') || document.createElement('link');
        iconLink.rel = 'icon';
        iconLink.id = 'favicon';
        iconLink.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">☑️</text></svg>';
        document.getElementsByTagName('head')[0].appendChild(iconLink);
    }

    function createPlayFavicon() {
        const iconLink = document.getElementById('favicon') || document.createElement('link');
        iconLink.rel = 'icon';
        iconLink.id = 'favicon';
        iconLink.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">▶️</text></svg>';
        document.getElementsByTagName('head')[0].appendChild(iconLink);
    }

    function createNewTask() {
        const taskId = Date.now() + Math.random().toString(36).substr(2, 9);
        const newUrl = new URL(window.location.origin + window.location.pathname);
        newUrl.searchParams.set('taskId', taskId);
        window.open(newUrl.toString(), '_blank');
    }

    function saveTaskState() {
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const state = {
            title,
            content,
            totalSeconds,
            timerRunning: !!timerInterval
        };
        const params = new URLSearchParams(state).toString();
        window.history.replaceState(null, '', '?' + params);
    }

    function loadTaskState() {
        const params = new URLSearchParams(window.location.search);
        const state = Object.fromEntries(params.entries());
        if (state.title) {
            titleElement.value = state.title;
            updateTitle();
        }
        if (state.content) {
            document.getElementById('content').value = state.content;
        }
        if (state.totalSeconds) {
            totalSeconds = parseInt(state.totalSeconds, 10);
            document.getElementById('timer').innerHTML = formatTime();
        }
        if (state.timerRunning === 'true') {
            toggleTimer();
        }
    }

    function stopOtherTimers() {
        localStorage.setItem('stopTimers', Date.now().toString());
    }
    
    window.addEventListener('storage', function(event) {
        if (event.key === 'stopTimers') {
            if (timerInterval) {
                stopTimer();
            }
        }
    });

    function setupInputListeners() {
        document.getElementById('title').addEventListener('input', saveTaskState);
        document.getElementById('content').addEventListener('input', saveTaskState);
    }

    window.onload = function() {
        loadTaskState();
        setupInputListeners();
        if (timerInterval) {
            createPlayFavicon();
        } else {
            createCheckboxFavicon();
        }
        if(!document.getElementById('title').value) document.getElementById('title').focus();
    };

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            toggleTimer();
        }
    });

    document.addEventListener('dblclick', function(event) {
        if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
            toggleTimer();
        }
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'n' && event.ctrlKey) {
            createNewTask();
        }
    });

    window.toggleTimer = toggleTimer;
    window.saveTaskState = saveTaskState;
    window.handleEnter = handleEnter;
    window.updateTitle = updateTitle;
    window.createNewTask = createNewTask;
})();