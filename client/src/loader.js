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

// useRef returns a mutable ref object whose .current property is initialized to the passed argument (initialValue).

function Loader() {
  
  const [yourID, setYourID] = useState(); // react hooks to store your id
  const [users, setUsers] = useState({}); // initialize an array to store users id
  const [stream, setStream] = useState();  // store stream info
  const [receivingCall, setReceivingCall] = useState(false);  // store bool(true/false) of receiving call option
  const [caller, setCaller] = useState("");  
  const [callerSignal, setCallerSignal] = useState(); 
  const [callAccepted, setCallAccepted] = useState(false); 
  const [count, setCount] = useState(0); // for exception handling
  const [obj_count, setobj_count] = useState(0); //for exception handling 
  const userVideo = useRef();  // initialize to store user's video information
  const partnerVideo = useRef(); // initialize to store 2nd user's video information
  const [messages, setMessages] = useState([]); // object array of storing multiple messages
  const [message, setMessage] = useState(""); // store 1 single chat message
  const socket = useRef();  // initialize socket which will store socket informations 
  const peerRef = useRef(); 

  
  useEffect(() => {
    socket.current = io.connect("/"); // connect with the backend server side socket
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {  // Get permission to use your camera and mic
      setStream(stream); // if you granted permission, enable the streaming
      if (userVideo.current) { // if your video is on, then show it, else initialize it will null
        userVideo.current.srcObject = stream;
      }
    })


    socket.current.on("yourID", (id) => { // request an id from server side socket 
      setYourID(id); // store it inside YourID using react hooks
    })
    
    socket.current.on("allUsers", (users) => { // request to see who are online or who are wanting to connect with you via video call
      setUsers(users); // store it inside the users array
    })

    socket.current.on("hey", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    })
    
    socket.current.on("message", (message) => {// handle message section calling server side socket
      // console.log("here");
      receivedMessage(message); // there is a function down below(155th line). If you found messages, call the backend function to marge it with the messages array
    })

    socket.current.on("user left", () => {  // if any user left from the call, set receiving call false and destroy the session //
      setReceivingCall(false);
      setCaller("");
      setCallAccepted(false);
      setUsers({});
      peerRef.current.destroy();
    });
  }, []);
  

  function receivedMessage(message) { // push a message with the past messages and store it inside messages
    setMessages(oldMsgs => [...oldMsgs, message]);
  }

  function sendMessage(e) { // initialize a message object with two objects(body and id) in it. Initialize those with live message and your current session id which is provided by socket //
    e.preventDefault(); // prevent to refresh after one letter is inserted inside the chat box
    const messageObject = { 
      body: message,
      id: yourID,
    };
    setMessage(""); 
    socket.current.emit("send message", messageObject); // request server to send the message
  }

  function handleChange(e) { // if any letter is inserted into the chat area,make a call to change and push the typed characters inside the messages
    setMessage(e.target.value);
  }

  function Exit() { // if declined button is called, back to the home page destroing the session
    window.open("/", "_self");
    window.close();
  }


  function callPeer(id) { // Here P2P connection is established. 
      setobj_count(obj_count + 1); // If one connection is establised, please increment the count
      // console.log(obj_count);
      if(obj_count === 0 ){ // if 0 connection established, open a connection 
        const peer = new Peer({ // initialized a P2P connection
          initiator: true, // Make it true from my end
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
    
        peer.on("signal", data => { // call the severside code using your information
          socket.current.emit("callUser", { userToCall: id, signalData: data, from: yourID })
        })
    
        peer.on("stream", stream => { // if partner's video is online, open the stream
          if (partnerVideo.current) {
            partnerVideo.current.srcObject = stream;
          }
        });
    
        socket.current.on("callAccepted", signal => { // accept the call 
          setCallAccepted(true);
          peer.signal(signal);
        })
        peerRef.current = peer;
      }
      
      else {  // if 2 people are already in a connection, if anyone else want to connect, make an exception calling network error //
        alert("network busy");
      }
    }
    

  function acceptCall() { // this is same as connection establishing
    
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
      <Video playsInline muted ref={userVideo} autoPlay /> // integrate the video and mic with the stream(from user side)
    );
  }

  let PartnerVideo;
  if (callAccepted) {
    PartnerVideo = (
      <Video playsInline ref={partnerVideo} autoPlay /> // integrate the video and mic with the stream(from partner side)
    );
  }

  let incomingCall;
  if (receivingCall && count === 0) {
    incomingCall = (
        <div class="container">
        <div class="vertical-center">
            <h1>{caller} is calling you</h1>
            <Button className="mb-2" size="lg" variant="success"  onClick={acceptCall}>Accept Call from {caller}</Button> {/* Click the button to accept the call, calling acceptCall function */}
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
        {Object.keys(users).map(key => { // mapped with users unique id that socket has provided //
          if (key === yourID) { // if you are the same user then no extra key will be created because you are already online ///
            return null;
          }
          return (
            <Button className="mb-2" size="lg" variant="success" onClick={() => callPeer(key)}>Call {key}</Button> // Make a call, calling callPeer function which will establish a P2P connection between you and your client ///
          );
        })}
      </Row>
      <Row>
        {incomingCall} 
      </Row>
      
      <Row>
        <div>
          <Button variant="danger" onClick={Exit}>Disconnect Browser</Button> {/* Destroy Session  */}
        </div>
      </Row>

      <Row>
        <div>
          <h1>𝓛𝓲𝓽𝓽𝓵𝓮 𝓒𝓱𝓪𝓽 𝓦𝓲𝓽𝓱 𝓤𝓼?</h1> {/* Chat Section */}
          <div>
          <Page>
        <Container className="Message_Area">
          {messages.map((message, index) => {
            if (message.id === yourID) { // if your id is equal with the mapped message.id, then color, align will be on your side
              // console.log('Ok');
              return (
                <MyRow key={index}>
                  <MyMessage>
                    {message.body}
                  </MyMessage>
                </MyRow>
              )
            }
            return ( // if not, then it will be your parter's.. then color, align will be on the other side
              <PartnerRow key={index}>
                <PartnerMessage>
                  {message.body}
                </PartnerMessage>
              </PartnerRow>
            )
          })}
        </Container>
        <Form onSubmit={sendMessage}> {/* Submit chat to send message */}
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


// That's All Sir. 