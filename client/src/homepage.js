import React from 'react';
import './App.css';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';


function Homepage() {
    return (
        <div>
            <h1> Hello, Welcome</h1>
            <div className="mb-2">
            <Button variant="secondary" size="lg" active>
                <Link to="/load" color="white">Contact With Us.</Link>
            </Button>
            
            </div>
            
        </div>
    )
    
}

export default Homepage;