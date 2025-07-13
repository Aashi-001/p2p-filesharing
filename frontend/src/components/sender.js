import React, { useEffect, useState } from "react";
// import { Dropbox } from 'dropbox';
import DropboxUploader from "./dropbox";

export default function Sender({ roomId }) {
  const [senderSocket, setSenderSocket] = useState(null);
  const [dataChannel, setDataChannel] = useState(null);
  const [status, setStatus] = useState("Idle");
  const [progressBar, setprogressBar] = useState(0);
  const [fileSelected, setFileSelected] = useState(false);

  useEffect(() => {
    // const socket = new WebSocket("ws://localhost:8080");
    const socket = new WebSocket(
      "wss://p2p-filesharing-production.up.railway.app"
    );

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "join", role: "sender", roomId }));
      setStatus(`Connected as sender to room ${roomId}`);
    };

    setSenderSocket(socket);
  }, [roomId]);

  async function startFileTransfer(file) {
    if (!senderSocket || !file) return;

    // const pc = new RTCPeerConnection();
    // const pc = new RTCPeerConnection({
    // iceServers: [
    //   { urls: 'stun:stun.l.google.com:19302' },
    //   {
    //     urls: [
    //       "turn:192.168.1.7:3478?transport=udp",
    //       "turn:192.168.1.7:3478?transport=tcp"
    //     ],
    //     username: 'webrtc',
    //     credential: 'pass123'
    //   }
    // ]
    const iceServers = [
      { urls: "stun:stun.l.google.com:19302" },
      {
        urls: [
          "turn:13.201.117.97:3478?transport=udp",
          "turn:13.201.117.97:3478?transport=tcp",
        ],
        username: "webrtc",
        credential: "pass123",
      },
    ];
    // });
    // const iceServers = [
    //   { urls: 'stun:stun.l.google.com:19302' }, // free STUN
    //   {
    //     urls: 'turn:openrelay.metered.ca:80',
    //     username: 'openrelayproject',
    //     credential: 'openrelayproject'
    //   }
    // ];

    const pc = new RTCPeerConnection({ iceServers });
    // const pc = new RTCPeerConnection({
    //   iceServers: [
    //     { urls: 'stun:stun.l.google.com:19302' },
    //     {
    //       urls: 'turn:openrelay.metered.ca:80?transport=udp',
    //       username: 'openrelayproject',
    //       credential: 'openrelayproject'
    //     },
    //     {
    //       urls: 'turn:openrelay.metered.ca:80?transport=tcp',
    //       username: 'openrelayproject',
    //       credential: 'openrelayproject'
    //     }
    //   ],
    //   iceTransportPolicy: "all",
    //   bundlePolicy: "balanced",
    //   rtcpMuxPolicy: "require"
    // });

    const dc = pc.createDataChannel("fileChannel");
    setDataChannel(dc);

    pc.onnegotiationneeded = async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      senderSocket.send(
        JSON.stringify({
          type: "createOffer",
          sdp: pc.localDescription,
          roomId,
        })
      );
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        senderSocket.send(
          JSON.stringify({
            type: "iceCandidate",
            candidate: e.candidate,
            roomId,
          })
        );
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

      dc.send(
        JSON.stringify({ fileName: file.name, size: file.size, totalChunks })
      );

      let offset = 0;
      const reader = new FileReader();

      reader.onload = async (event) => {
        if (dc.readyState !== "open") return;

        const buffer = event.target.result;

        const waitForBuffer = () => {
          return new Promise((resolve) => {
            const check = () => {
              if (dc.bufferedAmount < 8 * 1024 * 1024) {
                resolve();
              } else {
                setTimeout(check, 50); // check every 50ms
              }
            };
            check();
          });
        };

        await waitForBuffer();

        dc.send(buffer);
        offset += buffer.byteLength;

        const percent = Math.min((offset / file.size) * 100, 100);
        setprogressBar(percent);
        console.log(percent);

        if (offset < file.size) {
          readSlice(offset);
        } else {
          setStatus("File transfer complete ✅");
          setprogressBar(100);
        }
      };

      const readSlice = (o) => {
        const slice = file.slice(o, o + chunkSize);
        reader.readAsArrayBuffer(slice);
      };

      readSlice(0);
    };
  }

  return (
    <div style={{ textAlign: "center" }}>
      {/* <h2>WebRTC File Sender</h2> */}
      <p className="status-text">{status}</p>

      {!fileSelected && (
        <DropboxUploader
          onFileSelected={(file) => {
            setFileSelected(true);
            startFileTransfer(file);
          }}
        />
      )}

      {progressBar > 0 && progressBar < 100 && (
        <div
          style={{
            width: "50%",
            margin: "1rem auto",
            background: "#eee",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              width: `${progressBar}%`,
              height: "20px",
              background: "#4caf50",
              borderRadius: "8px",
              transition: "width 0.2s ease-in-out",
            }}
          />
        </div>
      )}
    </div>
  );
}
