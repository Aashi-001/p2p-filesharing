import React, { useEffect, useState } from 'react';

export default function Sender({ roomId }) {
  const [senderSocket, setSenderSocket] = useState(null);
  const [dataChannel, setDataChannel] = useState(null);
  const [status, setStatus] = useState("Idle");

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "join", role: "sender", roomId }));
      setStatus(`Connected as sender to room ${roomId}`);
    };

    setSenderSocket(socket);
  }, [roomId]);

  async function startFileTransfer(file) {
    if (!senderSocket || !file) return;

    const pc = new RTCPeerConnection();
    const dc = pc.createDataChannel("fileChannel");
    setDataChannel(dc);

    pc.onnegotiationneeded = async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      senderSocket.send(JSON.stringify({
        type: 'createOffer',
        sdp: pc.localDescription,
        roomId
      }));
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        senderSocket.send(JSON.stringify({
          type: 'iceCandidate',
          candidate: e.candidate,
          roomId
        }));
      }
    };

    senderSocket.onmessage = (e) => {
      const message = JSON.parse(e.data);
      if (message.type === "createAnswer") {
        pc.setRemoteDescription(message.sdp);
      } else if (message.type === "iceCandidate") {
        pc.addIceCandidate(message.candidate);
      }
    };

    dc.onopen = () => {
      setStatus("Data channel open. Sending file...");
      const chunkSize = 64 * 1024;
      const totalChunks = Math.ceil(file.size / chunkSize);

      dc.send(JSON.stringify({ fileName: file.name, size: file.size, totalChunks }));

      let offset = 0;
      const reader = new FileReader();

      reader.onload = (event) => {
        if (dc.readyState !== "open") return;
        dc.send(event.target.result);
        offset += event.target.result.byteLength;
        if (offset < file.size) readSlice(offset);
        else setStatus("File transfer complete ✅");
      };

      const readSlice = (o) => {
        const slice = file.slice(o, o + chunkSize);
        reader.readAsArrayBuffer(slice);
      };

      readSlice(0);
    };
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>WebRTC File Sender</h2>
      <p>{status}</p>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) startFileTransfer(file);
        }}
      />
    </div>
  );
}