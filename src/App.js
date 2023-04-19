// App.js
import React, { useState } from 'react';
import './App.css';
import LineGraphCanvas from './LineGraphCanvas';

const App = () => {
    // Add a new state variable to control the display of REM markers
    const [showREMMarkers, setShowREMMarkers] = useState(false);

    const handleUpdateClick = () => {
        // Regenerate data and update the graph
        window.location.reload();
    };

    // Define the handleToggleREMMarkers function
    const handleToggleREMMarkers = () => {
        setShowREMMarkers(!showREMMarkers);
    };

    return (
        <div className="App">
            <header className="App-header">
                <div className="menu-bar">
                    <button onClick={handleUpdateClick}>Update</button>
                    {/* Update the onClick handler for the TOGGLE REM MARKERS button */}
                    <button onClick={handleToggleREMMarkers}>TOGGLE REM MARKERS</button>
                </div>
                {/* Pass the showREMMarkers state variable as a prop */}
                <LineGraphCanvas showREMMarkers={showREMMarkers} />
            </header>
        </div>
    );
};

export default App;
