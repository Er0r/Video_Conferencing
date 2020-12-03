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
        <Route exact path="/" component={Homepage}></Route>
        <Route path="/load" component={Loader}></Route>
      </Switch>
    </div>
    </BrowserRouter>
  );
}

export default App;
