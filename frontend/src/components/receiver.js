// import React, { useEffect, useRef, useState } from 'react';

// const Receiver = ({ roomId }) => {
//   const pcRef = useRef(null);
//   const ws = useRef(null);
//   const chunks = useRef([]);
//   const fileMetadata = useRef(null);

//   const [status, setStatus] = useState('Connecting...');

//   useEffect(() => {
//     ws.current = new WebSocket('wss://p2p-filesharing-production.up.railway.app'); //new WebSocket('ws://localhost:8080');

//     ws.current.onopen = () => {
//       ws.current.send(JSON.stringify({ type: 'join', role: 'receiver', roomId }));
//       setStatus(`Joined room ${roomId} as receiver, waiting for sender...`);
//       initializeConnection();
//     };

//     ws.current.onerror = (err) => {
//       console.error('WebSocket error:', err);
//       setStatus('WebSocket error');
//     };

//     return () => {
//       ws.current?.close();
//       pcRef.current?.close();
//     };
//   }, [roomId]);

//   const initializeConnection = () => {
//     pcRef.current = new RTCPeerConnection();

//     pcRef.current.onicecandidate = (e) => {
//       if (e.candidate) {
//         ws.current.send(JSON.stringify({ type: 'iceCandidate', candidate: e.candidate, roomId }));
//       }
//     };

//     pcRef.current.ondatachannel = (event) => {
//       const channel = event.channel;

//       setStatus('Data channel established. Receiving file...');

//       channel.onmessage = (e) => {
//         if (typeof e.data === 'string') {
//           try {
//             fileMetadata.current = JSON.parse(e.data);
//             chunks.current = [];
//             console.log('Metadata received:', fileMetadata.current);
//           } catch {
//             console.error('Invalid metadata JSON');
//           }
//         } else {
//           chunks.current.push(e.data);
//           if (chunks.current.length === fileMetadata.current.totalChunks) {
//             const blob = new Blob(chunks.current);
//             const a = document.createElement('a');
//             a.href = URL.createObjectURL(blob);
//             a.download = fileMetadata.current.fileName;
//             a.click();
//             setStatus('Download complete');
//             chunks.current = [];
//           }
//         }
//       };
//     };

//     ws.current.onmessage = async ({ data }) => {
//       const msg = JSON.parse(data);
//       if (msg.type === 'createOffer') {
//         await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
//         const answer = await pcRef.current.createAnswer();
//         await pcRef.current.setLocalDescription(answer);
//         ws.current.send(JSON.stringify({ type: 'createAnswer', sdp: answer, roomId }));
//         setStatus('Connected to sender. Ready to receive.');
//       }
//     };
//   };

//   return (
//     <div style={{ textAlign: 'center' }}>
//       <h2>Receiver</h2>
//       <p>{status}</p>
//     </div>
//   );
// };

// export default Receiver;

import React, { useEffect, useRef, useState } from 'react';

export default function Receiver({ roomId }) {
  const pcRef = useRef(null);
  const ws = useRef(null);
  const chunks = useRef([]);
  const fileMetadata = useRef(null);

  const [status, setStatus] = useState('Waiting for signaling...');

  useEffect(() => {
    ws.current = new WebSocket('wss://p2p-filesharing-production.up.railway.app');

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
    pcRef.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        }
      ]
    });

    pcRef.current.onicecandidate = (e) => {
      if (e.candidate) {
        ws.current.send(JSON.stringify({ type: 'iceCandidate', candidate: e.candidate, roomId }));
      }
    };

    pcRef.current.ontrack = (event) => {
      setStatus('Receiving screen stream...');
      const video = document.createElement('video');
      video.controls = true;
      video.srcObject = new MediaStream([event.track]);
      document.body.appendChild(video);
      video.play();
    };

    pcRef.current.ondatachannel = (event) => {
      const channel = event.channel;
      setStatus('Data channel open for file reception');

      channel.onmessage = (e) => {
        if (typeof e.data === 'string') {
          try {
            fileMetadata.current = JSON.parse(e.data);
            chunks.current = [];
          } catch {
            console.error('Invalid file metadata');
          }
        } else {
          chunks.current.push(e.data);
          if (chunks.current.length === fileMetadata.current.totalChunks) {
            const blob = new Blob(chunks.current);
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileMetadata.current.fileName;
            a.click();
            setStatus('File download complete');
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
    </div>
  );
}
