import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import styled from "styled-components";


const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 500px;
  max-height: 500px;
  overflow: auto;
  width: 400px;
  border: 1px solid white;
  border-radius: 10px;
  padding-bottom: 10px;
  margin-top: 25px;
  background-color:white;
`;








function Chat(){
    const [yourID, setYourID] = useState();
    

    const socketRef = useRef();

    

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
        socketRef.current.emit("send message", messageObject);
      }
    
      function handleChange(e) {
        setMessage(e.target.value);
      }

   return (
       <div>
           <Page>
      <Container>
        {messages.map((message, index) => {
          if (message.id === yourID) {
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
        <Button><h3>Send</h3></Button>
      </Form>
    </Page>
       </div>
   ) 
}
export default Chat;