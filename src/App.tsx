// src/App.tsx
import React, {useRef} from 'react'; // Removed useState, useEffect if not needed here
import PhaserGame, {PhaserGameRef} from '@/game/PhaserGame';
import EventBus from '@/game/EventBus'; // Import the EventBus here
import {GameUI} from '@/components/GameUI';

function App() {
    const phaserGameRef = useRef<PhaserGameRef>(null);

    return (
        // Container needs defined dimensions and relative positioning
        <div style={{
            position: 'relative',
            width: '800px',
            height: '600px',
            margin: 'auto',
            border: '1px solid #ccc' /* Optional border */
        }}>
            {/* Phaser Game Component */}
            <PhaserGame ref={phaserGameRef}/>

            {/* React UI Overlay Component - Pass the imported EventBus */}
            <GameUI listenTo={EventBus}/>
        </div>
    );
}

export default App;