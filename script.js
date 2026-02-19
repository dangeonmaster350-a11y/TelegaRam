// Данные (хранятся в памяти браузера)
let users = JSON.parse(localStorage.getItem('users')) || [];
let messages = JSON.parse(localStorage.getItem('messages')) || [];
let currentUser = null;

// Сохранение в localStorage
function saveData() {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('messages', JSON.stringify(messages));
}

// Регистрация
function register() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    
    if (users.find(u => u.username === username)) {
        alert('Имя занято!');
        return;
    }
    
    users.push({
        username,
        password: btoa(password), // простейшее шифрование
        isAdmin: username === 'admin',
        banned: false,
        frozen: false
    });
    
    saveData();
    alert('Регистрация успешна!');
    showLogin();
}

// Вход
function login() {
    const username = document.getElementById('username').value;
    const password = btoa(document.getElementById('password').value);
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user && !user.banned) {
        currentUser = user;
        document.getElementById('loginModal').style.display = 'none';
        loadMessages();
        
        if (user.isAdmin) {
            showAdminPanel();
        }
    } else {
        alert('Неверный логин или пароль');
    }
}

// Отправка сообщения
function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (!content || !currentUser || currentUser.frozen) return;
    
    const message = {
        username: currentUser.username,
        content: content,
        time: new Date().toLocaleTimeString(),
        id: Date.now()
    };
    
    messages.push(message);
    saveData();
    
    displayMessage(message, true);
    input.value = '';
    
    // Обновляем у всех (в реальном времени через WebSocket)
    updateOtherUsers(message);
}

// Отображение сообщения
function displayMessage(msg, isMy) {
    const container = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = `message ${isMy ? 'my-message' : 'other-message'}`;
    
    if (!isMy) {
        div.innerHTML = `<b>${msg.username}</b><br>${msg.content}`;
    } else {
        div.textContent = msg.content;
    }
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// Загрузка сообщений
function loadMessages() {
    const container = document.getElementById('messages');
    container.innerHTML = '';
    messages.forEach(msg => {
        displayMessage(msg, msg.username === currentUser?.username);
    });
}

// Админ панель
function showAdminPanel() {
    const adminBtn = document.createElement('button');
    adminBtn.innerHTML = '👑 Админка';
    adminBtn.onclick = () => window.open('admin.html', '_blank');
    document.body.appendChild(adminBtn);
}

// Обновление для других (через localStorage события)
function updateOtherUsers(message) {
    localStorage.setItem('lastMessage', JSON.stringify({
        message,
        timestamp: Date.now()
    }));
}

// Слушаем изменения от других
window.addEventListener('storage', (e) => {
    if (e.key === 'lastMessage') {
        const data = JSON.parse(e.newValue);
        if (data.message.username !== currentUser?.username) {
            displayMessage(data.message, false);
        }
    }
});

// Периодическая очистка
setInterval(() => {
    const oldMessages = messages.filter(m => 
        Date.now() - m.id < 24 * 60 * 60 * 1000
    );
    messages = oldMessages;
    saveData();
}, 3600000);