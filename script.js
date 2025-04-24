document.addEventListener('DOMContentLoaded', function() {
    // 要求通知權限
    if ('Notification' in window) {
        Notification.requestPermission();
    }
    
    // 初始化
    loadTimers();
    loadHistory();
    
    // 初始化並更新當前時間
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    // 表單提交事件
    document.getElementById('mic-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 獲取輸入值
        const micName = document.getElementById('mic-name').value;
        const hours = parseInt(document.getElementById('hours').value) || 0;
        const minutes = parseInt(document.getElementById('minutes').value) || 0;
        
        // 驗證輸入
        if (!micName) {
            alert('請輸入麥克風名稱');
            return;
        }
        
        if (hours === 0 && minutes === 0) {
            alert('請設置有效的時間');
            return;
        }
        
        // 檢查是否已有四組計時器
        const activeTimers = getActiveTimers();
        if (activeTimers.length >= 4) {
            alert('最多只能同時設置四組麥克風計時器');
            return;
        }
        
        // 計算總秒數
        const totalSeconds = (hours * 60 * 60) + (minutes * 60);
        
        // 創建新計時器 - 直接使用倒數秒數，不依賴於開始和結束時間
        const timer = {
            id: Date.now().toString(),
            name: micName,
            totalSeconds: totalSeconds,  // 總時間（不變）
            remainingSeconds: totalSeconds,  // 剩餘時間（會變化）
            startTime: Date.now(),       // 開始時間戳
            lastUpdateTime: Date.now(),  // 最後更新時間戳，用於計算實際經過的時間
            status: 'active'
        };
        
        // 保存計時器
        saveTimer(timer);
        
        // 重置表單
        this.reset();
        document.getElementById('hours').value = '6';
        document.getElementById('minutes').value = '0';
        
        // 更新 UI
        renderTimers();
        
        console.log('已創建新計時器:', timer);
    });
    
    // 如果計時器已經在運行，則清除它
    if (window.timerInterval) {
        clearInterval(window.timerInterval);
    }
    
    // 每秒更新計時器 - 提高更新頻率
    const timerInterval = setInterval(updateTimers, 1000);

    // 將計時器實例存儲在全局變量中，以便需要時可以清除
    window.timerInterval = timerInterval;
    
    console.log('頁面已初始化，計時器已啟動');
});

// 更新當前時間
function updateCurrentTime() {
    const now = new Date();
    const timeString = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    document.getElementById('current-time').textContent = timeString;
}

// 獲取活動計時器
function getActiveTimers() {
    const timers = JSON.parse(localStorage.getItem('timers') || '[]');
    return timers.filter(timer => timer.status === 'active');
}

// 保存計時器
function saveTimer(timer) {
    const timers = JSON.parse(localStorage.getItem('timers') || '[]');
    timers.push(timer);
    localStorage.setItem('timers', JSON.stringify(timers));
}

// 更新計時器 - 完全重寫更新機制
function updateTimers() {
    const timers = JSON.parse(localStorage.getItem('timers') || '[]');
    const now = Date.now();
    let updated = false;
    
    // 添加調試信息
    console.log('開始更新計時器 - 當前時間:', new Date(now).toLocaleTimeString());
    
    timers.forEach(timer => {
        if (timer.status === 'active') {
            // 計算自上次更新以來經過的實際時間（秒）
            const elapsedSeconds = Math.floor((now - (timer.lastUpdateTime || timer.startTime)) / 1000);
            
            if (elapsedSeconds > 0) {
                // 更新剩餘時間
                const oldRemainingSeconds = timer.remainingSeconds;
                timer.remainingSeconds = Math.max(0, oldRemainingSeconds - elapsedSeconds);
                timer.lastUpdateTime = now;  // 更新最後更新時間
                updated = true;
                
                // 輸出調試信息
                console.log(`計時器 "${timer.name}" 更新:`, {
                    舊剩餘時間: formatDuration(oldRemainingSeconds),
                    新剩餘時間: formatDuration(timer.remainingSeconds),
                    本次減少時間: elapsedSeconds + '秒',
                    經過總時間: formatDuration(Math.floor((now - timer.startTime) / 1000))
                });
                
                // 檢查是否完成
                if (timer.remainingSeconds <= 0) {
                    timer.status = 'completed';
                    timer.endTime = now;
                    console.log(`計時器 "${timer.name}" 已完成!`);
                    
                    // 當計時器結束時播放警告聲音或顯示通知
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification(`${timer.name} 計時器已完成!`);
                    }
                    
                    // 嘗試播放聲音
                    try {
                        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
                        audio.play();
                    } catch (error) {
                        console.error('無法播放提示音:', error);
                    }
                }
            }
        }
    });
    
    // 只要有更新就保存數據
    if (updated) {
        localStorage.setItem('timers', JSON.stringify(timers));
        console.log('計時器數據已保存到 localStorage');
        
        // 更新 UI
        renderTimers();
        renderHistory();
    }
}

// 加載計時器
function loadTimers() {
    renderTimers();
}

// 渲染計時器 - 改進顯示方式確保實時更新
function renderTimers() {
    const activeTimersContainer = document.getElementById('active-timers');
    const activeTimers = getActiveTimers();
    
    // 如果沒有活動計時器，顯示相應消息
    if (activeTimers.length === 0) {
        activeTimersContainer.innerHTML = '<p>目前沒有活動中的計時器</p>';
        return;
    }
    
    // 如果已經有計時器卡片，只更新它們的內容而不是完全重建
    if (activeTimersContainer.children.length === activeTimers.length && 
        activeTimersContainer.firstChild.tagName !== 'P') {
        
        // 更新現有的計時器卡片
        for (let i = 0; i < activeTimers.length; i++) {
            const timer = activeTimers[i];
            const timerCard = activeTimersContainer.children[i];
            
            const hoursLeft = Math.floor(timer.remainingSeconds / 3600);
            const minutesLeft = Math.floor((timer.remainingSeconds % 3600) / 60);
            const secondsLeft = timer.remainingSeconds % 60;
            
            // 計算進度百分比
            const progress = (timer.remainingSeconds / timer.totalSeconds) * 100;
            
            // 檢查是否低電量 (小於30分鐘)
            const isLowBattery = timer.remainingSeconds < 1800;
            
            // 更新計時器顯示
            const timerDisplay = timerCard.querySelector('.timer-display');
            timerDisplay.textContent = `${hoursLeft.toString().padStart(2, '0')}:${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
            timerDisplay.className = `timer-display ${isLowBattery ? 'warning' : ''}`;
            
            // 更新進度條
            const progressBar = timerCard.querySelector('.progress-bar');
            progressBar.style.width = `${progress}%`;
            
            // 更新卡片樣式
            timerCard.className = `timer-card ${isLowBattery ? 'low-battery' : ''}`;
        }
    } else {
        // 完全重建計時器卡片
        activeTimersContainer.innerHTML = '';
        
        activeTimers.forEach(timer => {
            const hoursLeft = Math.floor(timer.remainingSeconds / 3600);
            const minutesLeft = Math.floor((timer.remainingSeconds % 3600) / 60);
            const secondsLeft = timer.remainingSeconds % 60;
            
            // 計算進度百分比
            const progress = (timer.remainingSeconds / timer.totalSeconds) * 100;
            
            // 檢查是否低電量 (小於30分鐘)
            const isLowBattery = timer.remainingSeconds < 1800;
            
            const timerCard = document.createElement('div');
            timerCard.className = `timer-card ${isLowBattery ? 'low-battery' : ''}`;
            timerCard.innerHTML = `
                <h3>${timer.name}</h3>
                <div class="timer-progress">
                    <div class="progress-bar" style="width: ${progress}%"></div>
                </div>
                <div class="timer-display ${isLowBattery ? 'warning' : ''}">
                    ${hoursLeft.toString().padStart(2, '0')}:${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}
                </div>
                <div class="timer-actions">
                    <button class="btn" onclick="completeTimer('${timer.id}')">完成</button>
                    <button class="btn delete-btn" onclick="deleteTimer('${timer.id}')">刪除</button>
                </div>
            `;
            
            activeTimersContainer.appendChild(timerCard);
        });
    }
}

// 完成計時器
function completeTimer(timerId) {
    const timers = JSON.parse(localStorage.getItem('timers') || '[]');
    const timerIndex = timers.findIndex(t => t.id === timerId);
    
    if (timerIndex !== -1) {
        timers[timerIndex].status = 'completed';
        timers[timerIndex].endTime = Date.now();
        localStorage.setItem('timers', JSON.stringify(timers));
        renderTimers();
        renderHistory();
    }
}

// 刪除計時器
function deleteTimer(timerId) {
    const timers = JSON.parse(localStorage.getItem('timers') || '[]');
    const timerIndex = timers.findIndex(t => t.id === timerId);
    
    if (timerIndex !== -1) {
        timers.splice(timerIndex, 1);
        localStorage.setItem('timers', JSON.stringify(timers));
        renderTimers();
        renderHistory();
    }
}

// 加載歷史記錄
function loadHistory() {
    renderHistory();
}

// 渲染歷史記錄
function renderHistory() {
    const historyContainer = document.getElementById('timer-history');
    const timers = JSON.parse(localStorage.getItem('timers') || '[]');
    const completedTimers = timers.filter(timer => timer.status === 'completed');
    
    historyContainer.innerHTML = '';
    
    if (completedTimers.length === 0) {
        historyContainer.innerHTML = '<p>沒有歷史記錄</p>';
        return;
    }
    
    // 按結束時間排序（最新的在前面）
    completedTimers.sort((a, b) => b.endTime - a.endTime);
    
    completedTimers.forEach(timer => {
        const startDate = new Date(timer.startTime);
        const endDate = new Date(timer.endTime);
        
        const duration = formatDuration(Math.floor((timer.endTime - timer.startTime) / 1000));
        
        const historyItem = document.createElement('div');
        historyItem.className = 'timer-history-item';
        historyItem.innerHTML = `
            <div>
                <h3>${timer.name}</h3>
                <p>開始: ${formatDate(startDate)}</p>
                <p>結束: ${formatDate(endDate)}</p>
                <p>使用時間: ${duration}</p>
            </div>
            <button class="btn delete-btn" onclick="deleteTimer('${timer.id}')">刪除</button>
        `;
        
        historyContainer.appendChild(historyItem);
    });
}

// 格式化日期 - 添加秒數顯示
function formatDate(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
}

// 格式化持續時間
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
} 