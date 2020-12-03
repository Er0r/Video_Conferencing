// Some import fields //
import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import Button from 'react-bootstrap/Button';
import './loader.css';
import { Link } from 'react-router-dom';

// Some basic styling...
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
  const [yourID, setYourID] = useState(""); // React hooks is used to define random id's
  const [users, setUsers] = useState({}); // React hooks for tracking the concurrent users
  const [stream, setStream] = useState(); // React hooks is used to define steam data
  const [receivingCall, setReceivingCall] = useState(false); 
  const [caller, setCaller] = useState(""); 
  const [callerSignal, setCallerSignal] = useState(); 
  const [callAccepted, setCallAccepted] = useState(false); 
  const [count, setCount] = useState(0); // dummy to handle some exceptions
  const [obj_count, setobj_count] = useState(0);  // dummy to handle some exceptions
  const userVideo = useRef(); 
  const partnerVideo = useRef(); 
  const socket = useRef(); 

  // useefect is the most vital part of this code. This part will execute first. So, firstly in this section, socket will get connected with media parts(camera,sound)//
  useEffect(() => {
    socket.current = io.connect("/");
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => { // permission of audio and video call is established.
      setStream(stream);
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    })

    socket.current.on("yourID", (id) => { // Here you have to use JWT key mapped with your authentication data. Use their name instead of using random id //
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
    
        peer.on("signal", data => { // Established P2P Connection
          socket.current.emit("callUser", { userToCall: id, signalData: data, from: yourID }) // Initializer (Just call it as constructor value passing)
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
      
      else { // If he isn't in the connection, show network busy or any interruption 
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
        {UserVideo} {/* Your Video */}
        {PartnerVideo} {/* Client's Video */}
      </Row>
      <Row>
        {Object.keys(users).map(key => { // Map it with your authentication information.
          if (key === yourID) {
            return null;
          }
          return (
            <Button className="mb-2" size="lg" variant="success" onClick={() => callPeer(key)}>Call {key}</Button> // Call the function named callPeer
          );
        })}
      </Row>
      <Row>
        {incomingCall} {/* Show the upcoming Call Message */}
      </Row>
      <Row> 
        <Button variant="secondary" size="lg" active onClick={() => 
        stream.getTracks().forEach((track) => { // those are for declining the call. it will stop your mic and video after your conversation is over. //
            track.stop();
        })}>
             Decline Calling 
        </Button>
        </Row>

        <Row>
        <Button variant="secondary" size="lg" active>
                <Link to="/" color="white">Back To The Main Page.</Link> {/* back to the previous page */}
        </Button>
      </Row>
      
    </Container>
  );
}

export default Loader;
