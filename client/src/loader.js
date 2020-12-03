import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import Button from 'react-bootstrap/Button';
import './loader.css';
import { Link } from 'react-router-dom';

const Container = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
  width: 100%;
`;

const Video = styled.video`
  border: 1px solid blue;
  width: 50%;
  height: 50%;
`;


function Loader() {
  const flag=0;  
  const [yourID, setYourID] = useState("");
  const [users, setUsers] = useState({});
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [count, setCount] = useState(0);
  const [obj_count, setobj_count] = useState(0);
  const userVideo = useRef();
  const partnerVideo = useRef();
  const socket = useRef();

  useEffect(() => {
    socket.current = io.connect("/");
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      setStream(stream);
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    })

    socket.current.on("yourID", (id) => {
      setYourID(id);
    })
    socket.current.on("allUsers", (users) => {
      setUsers(users);
    })

    socket.current.on("hey", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    })
  }, []);

  function callPeer(id) {
      setobj_count(obj_count + 1);
      console.log(obj_count);
      if(obj_count === 0 ){
        const peer = new Peer({
          initiator: true,
          trickle: false,
          config: {
            iceServers: [
                {
                    urls: "stun:numb.viagenie.ca",
                    username: "socket.io",
                    credential: "98376683"
                },
                {
                    urls: "turn:numb.viagenie.ca",
                    username: "socket.io",
                    credential: "98376683"
                }
            ]
        },
          stream: stream,
        });
    
        peer.on("signal", data => {
          socket.current.emit("callUser", { userToCall: id, signalData: data, from: yourID })
        })
    
        peer.on("stream", stream => {
          if (partnerVideo.current) {
            partnerVideo.current.srcObject = stream;
          }
        });
    
        socket.current.on("callAccepted", signal => {
          setCallAccepted(true);
          peer.signal(signal);
        })
      }
      
      else {
        alert("network busy");
      }
    }
    

  function acceptCall() {
    
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", data => {
      setCount(count+1);
      if(count === 0){
        // console.log('Call is Accepted'+' '+ count);
        socket.current.emit("acceptCall", { signal: data, to: caller })
      } else {
        console.log('You Have Already Accepted the Call');
      }      
    })

    peer.on("stream", stream => {
      partnerVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
  }

  let UserVideo;
  if (stream) {
    UserVideo = (
      <Video playsInline muted ref={userVideo} autoPlay />
    );
  }

  let PartnerVideo;
  if (callAccepted) {
    PartnerVideo = (
      <Video playsInline ref={partnerVideo} autoPlay />
    );
  }

  let incomingCall;
  if (receivingCall && count === 0) {
    incomingCall = (
        <div class="container">
        <div class="vertical-center">
            <h1>{caller} is calling you</h1>
            <Button className="mb-2" size="lg" variant="success"  onClick={acceptCall}>Accept Call from {caller}</Button>
        </div>
      </div>
    )
  }
  return (
    <Container>
      <Row>
        {UserVideo}
        {PartnerVideo}
      </Row>
      <Row>
        {Object.keys(users).map(key => {
          if (key === yourID) {
            return null;
          }
          return (
            <Button className="mb-2" size="lg" variant="success" onClick={() => callPeer(key)}>Call {key}</Button>
          );
        })}
      </Row>
      <Row>
        {incomingCall}
      </Row>
      <Row>
        <Button variant="secondary" size="lg" active onClick={() => 
        stream.getTracks().forEach((track) => {
            track.stop();
        })}>
             Decline Calling 
        </Button>
        </Row>

        <Row>
        <Button variant="secondary" size="lg" active>
                <Link to="/" color="white">Back To The Main Page.</Link>
        </Button>
      </Row>
      
    </Container>
  );
}

export default Loader;
