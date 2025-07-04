import React, { useState } from 'react';
import Sender from './components/sender'
import Receiver from './components/receiver';
import './App.css';

function App() {
  const [role, setRole] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Generate random 6-char room code
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = () => {
    if (!roomId) {
      alert('Please enter a room code.');
      return;
    }
    setSubmitted(true);
  };

  return (
    // <div style={{ textAlign: 'center', marginTop: '40px' }}>
    <div className="container">
      <h1>Welcome to FilehopP2P</h1>

      {!role && (
        <div>
          <button className="send-btn" onClick={() => {
            const generated = generateRoomCode();
            setRole('sender');
            setRoomId(generated);
          }}>Send File</button>

          <button className="receive-btn" onClick={() => setRole('receiver')} style={{ marginLeft: '20px' }}>
            Receive File
          </button>
        </div>
      )}

      {role && !submitted && (
        <div style={{ marginTop: '30px' }}>
          <h3>{role === 'sender' ? 'Share this room code' : 'Enter the room code'}</h3>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            placeholder="e.g., A1B2C3"
            style={{ textTransform: 'uppercase' }}
            disabled={role === 'sender'}
          />
          <br /><br />
          <button onClick={handleSubmit}>
            {role === 'sender' ? 'Start Session' : 'Join Session'}
          </button>
          <br /><br />
          <button onClick={() => {
            setRole(null);
            setRoomId('');
            setSubmitted(false);
          }}>
            🔙
          </button>
        </div>
      )}

      {submitted && role === 'sender' && <Sender roomId={roomId} />}
      {submitted && role === 'receiver' && <Receiver roomId={roomId} />}
    </div>
  );
}

export default App;
