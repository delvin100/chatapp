const socket = io();
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('messageInput');
const messages = document.getElementById('messages');
const usersList = document.getElementById('users-list');
const typingIndicator = document.getElementById('typing-indicator');

function joinChat() {
    const username = usernameInput.value.trim();
    if (username) {
        socket.emit('join', username);
    }
}

function sendMessage() {
    const msg = messageInput.value.trim();
    if (msg) {
        socket.emit('chat message', { user: usernameInput.value, msg });
        messageInput.value = '';
    }
}

function handleTyping(event) {
    if (event.key === 'Enter') {
        sendMessage();
    } else {
        socket.emit('typing');
    }
}

socket.on('load messages', (messagesList) => {
    messagesList.forEach((data) => {
        const li = document.createElement('li');
        li.textContent = `${data.user}: ${data.msg}`;
        messages.appendChild(li);
    });
});

socket.on('chat message', (data) => {
    const li = document.createElement('li');
    li.textContent = `${data.user}: ${data.msg}`;
    messages.appendChild(li);
});

socket.on('typing', (user) => {
    typingIndicator.textContent = `${user} is typing...`;
    setTimeout(() => { typingIndicator.textContent = ''; }, 2000);
});

socket.on('update users', (users) => {
    usersList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        usersList.appendChild(li);
    });
});
