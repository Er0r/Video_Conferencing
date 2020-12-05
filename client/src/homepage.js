import React from "react";
import './App.css';

import { Link } from 'react-router-dom';
import './homepage.css';
import Button from 'react-bootstrap/Button';

function Homepage() {
    
    return (
        <div className="homepage">
            <h1> Hello, Welcome</h1>
            <div className="mb-2">
                <Button variant="secondary" size="lg" active>
                   <h2> <Link to="/load" color="black">Contact Via Video Call. 📷</Link> </h2>
                </Button>
            </div>
        </div>
    )
    
}

export default Homepage;