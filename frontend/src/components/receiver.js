import React, { useEffect, useRef, useState } from 'react';

export default function Receiver({ roomId }) {
  const pcRef = useRef(null);
  const ws = useRef(null);
  const chunks = useRef([]);
  const fileMetadata = useRef(null);
  const bytesReceived = useRef(0);
  const [progress, setProgress] = useState(0);

  const [status, setStatus] = useState('Waiting for signaling...');

  useEffect(() => {
    ws.current = new WebSocket('wss://p2p-filesharing-production.up.railway.app');
    // ws.current = new WebSocket('ws://localhost:8080');

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ type: 'join', role: 'receiver', roomId }));
      setStatus(`Joined room ${roomId} as receiver`);
      initializeConnection();
    };

    ws.current.onerror = (err) => {
      console.error('[Receiver] WebSocket error:', err);
      setStatus('WebSocket error');
    };

    ws.current.onclose = () => {
      console.warn('[Receiver] WebSocket closed');
    };

    return () => {
      ws.current?.close();
      pcRef.current?.close();
    };
  }, [roomId]);

  const initializeConnection = () => {
    // pcRef.current = new RTCPeerConnection({
    //   iceServers: [
    //     { urls: 'stun:stun.l.google.com:19302' },
    //     {
    //       urls: 'turn:openrelay.metered.ca:80',
    //       username: 'openrelayproject',
    //       credential: 'openrelayproject',
    //     }
    //   ]
    // });
    // pcRef.current = new RTCPeerConnection({
    //   iceServers: [
    //     { urls: 'stun:stun.l.google.com:19302' },
    //     {
    //       urls: 'turn:59.89.25.128:3478',
    //       username: 'webrtc',
    //       credential: 'pass123'
    //     }
    //   ]
    // });
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' }, // free STUN
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ];

    pcRef.current = new RTCPeerConnection({ iceServers });

    pcRef.current.onicecandidate = (e) => {
      if (e.candidate) {
        ws.current.send(JSON.stringify({ type: 'iceCandidate', candidate: e.candidate, roomId }));
      }
    };

    pcRef.current.ondatachannel = (event) => {
      const channel = event.channel;
      setStatus('Receiving file...');

      channel.onmessage = (e) => {
        if (typeof e.data === 'string') {
          try {
            fileMetadata.current = JSON.parse(e.data);
            chunks.current = [];
            bytesReceived.current = 0; // ✅ reset byte count
            setProgress(0);
          } catch {
            console.error('Invalid file metadata');
          }
        } else {
          chunks.current.push(e.data);
          bytesReceived.current += e.data.byteLength; // ✅ increment total received

          const total = fileMetadata.current?.size || 1;
          const percentage = Math.min((bytesReceived.current / total) * 100, 100);
          setProgress(percentage); // ✅ update visual progress

          if (chunks.current.length === fileMetadata.current.totalChunks) {
            const blob = new Blob(chunks.current);
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileMetadata.current.fileName;
            a.click();
            setStatus('File download complete ✅');
            setProgress(100); // ✅ ensure it's full
            chunks.current = [];
          }
        }
      };
    };

    ws.current.onmessage = async ({ data }) => {
      const msg = JSON.parse(data);
      if (msg.type === 'createOffer') {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        ws.current.send(JSON.stringify({ type: 'createAnswer', sdp: answer, roomId }));
        setStatus('Connected to sender');
      } else if (msg.type === 'iceCandidate') {
        pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
      }
    };
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Receiver</h2>
      <p>{status}</p>
      {progress > 0 && progress < 100 && (
        <div style={{ width: '50%', margin: '1rem auto', background: '#eee', borderRadius: '8px' }}>
          <div
            style={{
              width: `${progress}%`,
              height: '20px',
              background: '#2196f3',
              borderRadius: '8px',
              transition: 'width 0.2s ease-in-out',
            }}
          />
        </div>
      )}

      {progress > 0 && progress < 100 && (
        <p>{Math.round(progress)}%</p>
      )}
    </div>
  );
}
