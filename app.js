const auth = firebase.auth();
const db = firebase.database();

let currentRoom = 'general';
let messagesRef = null;


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

    .catch((error) => {
      alert(error.message);
    });
}

function logout() {
    db.ref('messages').off(); // stop old listeners
  auth.signOut().then(() => {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('chat-section').style.display = 'none';
    document.getElementById('messages').innerHTML = '';
  });
}

/*function sendMessage() {
  const messageInput = document.getElementById('message-input');
  const message = messageInput.value.trim();
  const user = auth.currentUser;

  if (user && message) {
    db.ref(`rooms/${currentRoom}/messages`).push({
      sender: user.email,
      text: message,
      timestamp: Date.now()
    });
    messageInput.value = '';
    toggleSendButton();
  }
}
*/
function sendMessage() {
  const messageInput = document.getElementById('message-input');
  const fileInput = document.getElementById('image-input');
  const message = messageInput.value.trim();
  const file = fileInput.files[0];
  const user = auth.currentUser;

  if (user && (message || file)) {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      fetch('https://us-central1-deep-wares-462607-b4.cloudfunctions.net/uploadImage', {
        method: 'POST',
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        db.ref(`rooms/${currentRoom}/messages`).push({
          sender: user.email,
          imageUrl: data.url,
          text: message || '',
          timestamp: Date.now()
        });
      })
      .catch(err => console.error(err));
    } else {
      db.ref(`rooms/${currentRoom}/messages`).push({
        sender: user.email,
        text: message,
        timestamp: Date.now()
      });
    }

    messageInput.value = '';
    fileInput.value = '';
    toggleSendButton();
  }
}



function listenForMessages() {
  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = ''; // clear old

  if (messagesRef) {
    messagesRef.off(); // detach old listener if switching room
  }

  messagesRef = db.ref(`rooms/${currentRoom}/messages`);
  const currentUser = auth.currentUser;

  messagesRef.on('child_added', (snapshot) => {
    const msg = snapshot.val();
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const msgEl = document.createElement('div');
    msgEl.classList.add('message');

    msgEl.innerHTML = `
      <div class="bubble">
        <span class="msg-sender">${msg.sender === currentUser.email ? 'You' : msg.sender}</span>
        <div class="msg-text">${msg.text}</div>
        <span class="msg-time">${time}</span>
      </div>
    `;

    if (currentUser && msg.sender === currentUser.email) {
      msgEl.classList.add('my-message');
    } else {
      msgEl.classList.add('other-message');
    }

    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTo({
      top: messagesDiv.scrollHeight,
      behavior: 'smooth'
    });
  });
}




auth.onAuthStateChanged((user) => {
  if (user) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('chat-section').style.display = 'block';
    document.getElementById('welcome-message').textContent = `Welcome, ${user.email}`;
    listenForMessages();
  } else {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('chat-section').style.display = 'none';
  }
});

function toggleSendButton() {
  const input = document.getElementById('message-input').value.trim();
  document.getElementById('send-btn').disabled = input === "";
}



function switchRoom() {
  const roomSelect = document.getElementById('room-select');
  currentRoom = roomSelect.value;
  listenForMessages();
}




function createRoom() {
  const roomInput = document.getElementById('new-room-name');
  const roomName = roomInput.value.trim();

  if (roomName) {
    // Store new room in Firebase under /rooms-list
    db.ref('rooms-list/' + roomName).set(true).then(() => {
      // Add to dropdown
      const roomSelect = document.getElementById('room-select');
      const option = document.createElement('option');
      option.value = roomName;
      option.textContent = roomName;
      roomSelect.appendChild(option);

      // Auto-select it & switch
      roomSelect.value = roomName;
      switchRoom();
    });

    roomInput.value = '';
  } else {
    alert('Please enter a valid room name.');
  }
}


function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => {
      // Firebase handles everything, onAuthStateChanged will run
    })
    .catch((error) => {
      alert(error.message);
    });
}
