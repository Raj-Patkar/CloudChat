const auth = firebase.auth();
const db = firebase.database();

function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert('Signup successful! Please log in.');
    })
    .catch((error) => {
      alert(error.message);
    });
}

function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('chat-section').style.display = 'block';
      listenForMessages();
    })
    .catch((error) => {
      alert(error.message);
    });
}

function logout() {
  auth.signOut().then(() => {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('chat-section').style.display = 'none';
    document.getElementById('messages').innerHTML = '';
  });
}

function sendMessage() {
  const messageInput = document.getElementById('message-input');
  const message = messageInput.value.trim();
  const user = auth.currentUser;

  if (user && message) {
    db.ref('messages').push({
      sender: user.email,
      text: message,
      timestamp: Date.now()
    });
    messageInput.value = '';
  }
}

function listenForMessages() {
  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = ''; // Clear old messages

  db.ref('messages').on('child_added', (snapshot) => {
    const msg = snapshot.val();
    const msgEl = document.createElement('div');
    msgEl.textContent = `${msg.sender}: ${msg.text}`;
    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

auth.onAuthStateChanged((user) => {
  if (user) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('chat-section').style.display = 'block';
    listenForMessages();
  } else {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('chat-section').style.display = 'none';
  }
});
