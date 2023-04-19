// LineGraphCanvas.js
import React, { useRef, useEffect, useState } from 'react';

// Constants
const CANVAS_MARGIN = 50;
const Y_MIN = 40;
const Y_MAX = 120;
const X_AXIS_LABEL = 'Time';
const Y_AXIS_LABEL = 'Heart Rate (BPM)';
const NUM_DATA_POINTS = 96;
const SAMPLE_INTERVAL_MINUTES = 5;
const REM_CYCLE_MINUTES = 90;
const REM_CYCLE_PHASES = [
    { label: 'Light Sleep', duration: 45, baseBpm: 60 },
    { label: 'Deep Sleep', duration: 30, baseBpm: 55 },
    { label: 'REM Sleep', duration: 15, baseBpm: 70 },
];
const LINE_COLOR = 'white';
const CURSOR_LINE_COLOR = 'rgba(128, 128, 128, 0.5)';

// Function to generate deterministic sleep cycle data
const generateSleepData = () => {
    const data = [];
    let currentTime = 0;
    while (data.length < NUM_DATA_POINTS) {
        REM_CYCLE_PHASES.forEach(phase => {
            for (let i = 0; i < phase.duration / SAMPLE_INTERVAL_MINUTES; i++) {
                if (data.length < NUM_DATA_POINTS) {
                    data.push({ time: currentTime, bpm: phase.baseBpm });
                    currentTime += SAMPLE_INTERVAL_MINUTES;
                }
            }
        });
    }
    return data;
};

const LineGraphCanvas = () => {
    const canvasRef = useRef(null);
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set dimensions
        const width = window.innerWidth;
        const height = window.innerHeight - 50; // Subtract height of menu bar

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Get sleep data
        const sleepData = generateSleepData();

        // Draw function
        const draw = () => {
            // Clear canvas and set background color
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, width, height);

            // Set styles for axes and lines
            ctx.strokeStyle = LINE_COLOR;
            ctx.lineWidth = 2;

            // Draw x-axis
            ctx.beginPath();
            ctx.moveTo(CANVAS_MARGIN, height - CANVAS_MARGIN);
            ctx.lineTo(width - CANVAS_MARGIN, height - CANVAS_MARGIN);
            ctx.stroke();

            // Draw y-axis
            ctx.beginPath();
            ctx.moveTo(CANVAS_MARGIN, CANVAS_MARGIN);
            ctx.lineTo(CANVAS_MARGIN, height - CANVAS_MARGIN);
            ctx.stroke();

            // Set labels for x and y axes
            ctx.font = '16px sans-serif';
            ctx.fillStyle = LINE_COLOR;
            ctx.fillText(X_AXIS_LABEL, width / 2, height - 15);
            ctx.fillText(Y_AXIS_LABEL, 5, 20);

            // Set y-axis margins
            const yScale = (height - 2 * CANVAS_MARGIN) / (Y_MAX - Y_MIN);

            // Draw y-axis tick marks and labels
            for (let i = Y_MIN; i <= Y_MAX; i += 20) {
                const y = height - CANVAS_MARGIN - (i - Y_MIN) * yScale;
                ctx.beginPath();
                ctx.moveTo(CANVAS_MARGIN - 5, y);
                ctx.lineTo(CANVAS_MARGIN - 5, y);
                ctx.stroke();
                ctx.fillText(i.toString(), 15, y + 5);
            }

// Calculate data points for line graph
            const xStep = (width - 2 * CANVAS_MARGIN) / (NUM_DATA_POINTS - 1);

// Draw x-axis tick marks and labels (every hour)
            for (let i = 0; i < 9; i++) {
                const x = CANVAS_MARGIN + i * (width - 2 * CANVAS_MARGIN) / 8;
                const hour = i.toString().padStart(2, '0');
                ctx.beginPath();
                ctx.moveTo(x, height - CANVAS_MARGIN + 5);
                ctx.lineTo(x, height - CANVAS_MARGIN - 5);
                ctx.stroke();
                ctx.fillText("${hour}:00", x - 12, height - CANVAS_MARGIN + 25);
            }

// Draw line graph
            ctx.beginPath();
            ctx.moveTo(CANVAS_MARGIN, height - CANVAS_MARGIN - (sleepData[0].bpm - Y_MIN) * yScale);
            sleepData.forEach(({ bpm }, index) => {
                const x = CANVAS_MARGIN + index * xStep;
                const y = height - CANVAS_MARGIN - (bpm - Y_MIN) * yScale;
                ctx.lineTo(x, y);
            });
            ctx.stroke();

// Draw cursor lines and intersected value
            ctx.strokeStyle = CURSOR_LINE_COLOR;
            ctx.beginPath();
            ctx.moveTo(cursorPosition.x, CANVAS_MARGIN);
            ctx.lineTo(cursorPosition.x, height - CANVAS_MARGIN);
            ctx.moveTo(CANVAS_MARGIN, cursorPosition.y);
            ctx.lineTo(width - CANVAS_MARGIN, cursorPosition.y);
            ctx.stroke();

// Calculate and display intersected value
            const dataIndex = Math.floor((cursorPosition.x - CANVAS_MARGIN) / xStep);
            const intersectedBpm = dataIndex >= 0 && dataIndex < sleepData.length ? sleepData[dataIndex].bpm : null;
            if (intersectedBpm) {
                ctx.font = '14px sans-serif';
                ctx.fillStyle = LINE_COLOR;
                ctx.fillText(intersectedBpm.toFixed(1), cursorPosition.x + 10, cursorPosition.y - 10);
            }
        };

// Mouse move event handler
        const handleMouseMove = (event) => {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            setCursorPosition({ x, y });
        };

// Update canvas on cursor position change
        draw();

// Add event listener for mouse move
        canvas.addEventListener('mousemove', handleMouseMove);

// Remove event listener on unmount
        return () => {
            canvas.removeEventListener('mousemove', handleMouseMove);
        };
    }, [cursorPosition]);

    return (
        <canvas
            ref={canvasRef}
            style={{ cursor: 'none' }} // Hide the actual cursor
        ></canvas>
    );
};

export default LineGraphCanvas;
