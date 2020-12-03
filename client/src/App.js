import React from 'react';
import './App.css';
import Loader from './loader.js';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import Homepage from './homepage.js';
function App() {
  return (
    <BrowserRouter>
    <div className="App">
      <Switch>
        <Route exact path="/" component={Homepage}></Route> {/*React router is for link. Sir, you have worked with node and express, it's like app.get('/',) at nodejs */}
        <Route path="/load" component={Loader}></Route>
      </Switch>
    </div>
    </BrowserRouter>
  );
}

export default App;
