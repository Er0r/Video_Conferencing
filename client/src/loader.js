// Some import fields //
import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import Button from 'react-bootstrap/Button';
import './loader.css';

const Page = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  align-items: center;
  background-color: #46516e;
  flex-direction: column;
`;

const TextArea = styled.textarea`
  width: 98%;
  height: 100px;
  border-radius: 10px;
  margin-top: 10px;
  padding-left: 10px;
  padding-top: 10px;
  font-size: 17px;
  background-color: transparent;
  border: 1px solid lightgray;
  outline: none;
  color: lightgray;
  letter-spacing: 1px;
  line-height: 20px;
  ::placeholder {
    color: lightgray;
  }
`;

// Some basic styling...
const Container = styled.div`
  height: 100vh;
  width: 100%;
  display: block;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
  width: 100%;
`;

const Video = styled.video`
  border: 3px solid black;
  width: 50%;
  height: 70%;
`;

const Form = styled.form`
  width: 400px;
`;

const MyRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-top: 5px;
`;

const MyMessage = styled.div`
  width: 45%;
  background-color: #EB6A11;
  color: black;
  padding: 10px;
  margin-right: 5px;
  text-align: center;
  border-top-right-radius: 10%;
  border-bottom-right-radius: 10%;
`;

const PartnerRow = styled(MyRow)`
  justify-content: flex-start;
`;

const PartnerMessage = styled.div`
  width: 45%;
  background-color: #B1B0AB ;
  color: black;
  border: 1px solid lightgray;
  padding: 10px;
  margin-left: 5px;
  text-align: center;
  border-top-left-radius: 10%;
  border-bottom-left-radius: 10%;
`;



function Loader() {
  const [yourID, setYourID] = useState();
  
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
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const socket = useRef(); 
  const peerRef = useRef();

  
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
    
    socket.current.on("message", (message) => {
      console.log("here");
      receivedMessage(message);
    })

    socket.current.on("user left", () => {
      setReceivingCall(false);
      setCaller("");
      setCallAccepted(false);
      setUsers({});
      peerRef.current.destroy();
    });
  }, []);
  

  function receivedMessage(message) {
    setMessages(oldMsgs => [...oldMsgs, message]);
  }

  function sendMessage(e) {
    e.preventDefault();
    const messageObject = {
      body: message,
      id: yourID,
    };
    setMessage("");
    socket.current.emit("send message", messageObject);
  }

  function handleChange(e) {
    setMessage(e.target.value);
  }

  function Exit() {
    window.open("/", "_self");
    window.close();
  }


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
        peerRef.current = peer;
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
    <div className="body_container">
      <div>
        <h1>𝔽𝕖𝕖𝕝 𝔽𝕣𝕖𝕖 𝕋𝕠 ℂ𝕠𝕟𝕟𝕖𝕔𝕥 𝕎𝕚𝕥𝕙 𝕌𝕤</h1>
      </div>
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
        <div>
          <Button variant="danger" onClick={Exit}>Disconnect Browser</Button>
        </div>
      </Row>

      <Row>
        <div>
          <h1>𝓛𝓲𝓽𝓽𝓵𝓮 𝓒𝓱𝓪𝓽 𝓦𝓲𝓽𝓱 𝓤𝓼?</h1>
          <div>
          <Page>
        <Container className="Message_Area">
          {messages.map((message, index) => {
            if (message.id === yourID) {
              console.log('Ok');
              return (
                <MyRow key={index}>
                  <MyMessage>
                    {message.body}
                  </MyMessage>
                </MyRow>
              )
            }
            return (
              <PartnerRow key={index}>
                <PartnerMessage>
                  {message.body}
                </PartnerMessage>
              </PartnerRow>
            )
          })}
        </Container>
        <Form onSubmit={sendMessage}>
          <TextArea value={message} onChange={handleChange} placeholder="Say something..." />
          <Button onClick={sendMessage}><h3>Send</h3></Button>
        </Form>
    </Page>
          </div>
        </div>
      </Row>
      
    </Container>

    </div> 
  );
}

export default Loader;
