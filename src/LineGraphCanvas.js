// LineGraphCanvas.js
import React, { useRef, useEffect, useState } from 'react';

// Constants
const CANVAS_MARGIN = 70;
const Y_MIN = 35;
const Y_MAX = 75;
const X_AXIS_LABEL = 'Time (Hours)';
const Y_AXIS_LABEL = 'Heart Rate (BPM)';
const NUM_DATA_POINTS = 96;
const SAMPLE_INTERVAL_MINUTES = 2.5;
const LINE_COLOR = 'white';
const CURSOR_LINE_COLOR = 'rgba(255, 0, 0, 0.8)';
const GRID_COLOR = 'rgba(255, 255, 255, 0.13)';
const GRID_WIDTH = 0.5;
const GRADIENT_OPACITY = 0.2;
const CURVE_SMOOTHNESS = 0.4;
const ROLLING_AVERAGE_WINDOW_SIZE = 30; // 12 data points = 30 minutes (2.5 minutes per data point)
const SLEEP_CYCLE_WINDOW_SIZE = 36; // 36 data points = 90 minutes
const REM_CYCLE_PHASES = [
    { label: 'Light Sleep', duration: 45, baseBpm: 57 },
    { label: 'Deep Sleep', duration: 30, baseBpm: 52 },
    { label: 'REM Sleep', duration: 25, baseBpm: 63 },
];

// Function to generate sleep data with noise and smoother transitions
const generateSleepData = () => {
    const data = [];
    let currentTime = 0;
    let previousBpm = REM_CYCLE_PHASES[0].baseBpm;
    const numIntermediatePoints = 3; // Number of intermediate points between phases

    while (data.length < NUM_DATA_POINTS) {
        REM_CYCLE_PHASES.forEach((phase, index) => {
            // Randomly vary the duration and base BPM of each phase
            const duration = phase.duration + Math.floor(Math.random() * 15 - 7.5);
            const baseBpm = phase.baseBpm + Math.floor(Math.random() * 5 - 2.5);

            // Add intermediate points for BPM transition
            for (let i = 1; i <= numIntermediatePoints; i++) {
                const t = i / (numIntermediatePoints + 1);
                const interpolatedBpm = previousBpm + t * (baseBpm - previousBpm);
                // Add noise to the intermediate data point
                const bpmWithNoise = interpolatedBpm + Math.floor(Math.random() * 3 - 1.5);
                if (data.length < NUM_DATA_POINTS) {
                    data.push({ time: currentTime, bpm: bpmWithNoise });
                    currentTime += SAMPLE_INTERVAL_MINUTES;
                }
            }

            // Add data points for the current phase
            for (let i = 0; i < (duration - numIntermediatePoints) / SAMPLE_INTERVAL_MINUTES; i++) {
                if (data.length < NUM_DATA_POINTS) {
                    // Add noise to the main data point
                    const bpmWithNoise = baseBpm + Math.floor(Math.random() * 3 - 1.5);
                    data.push({ time: currentTime, bpm: bpmWithNoise });
                    currentTime += SAMPLE_INTERVAL_MINUTES;
                }
            }
            previousBpm = baseBpm;
        });
    }
    return data;
};

// (Continued) Rest of the LineGraphCanvas component


// (Continued) Rest of the LineGraphCanvas component

// Add the toggleREMMarkers function

const LineGraphCanvas = ({ showREMMarkers }) => {
    const canvasRef = useRef(null);
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
    const [sleepData, setSleepData] = useState(generateSleepData());

    const regenerateData = () => {
        setSleepData(generateSleepData());
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set dimensions
        const width = window.innerWidth;
        const height = window.innerHeight - 50; // Subtract height of menu bar

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw function
        const draw = () => {
            // Clear canvas and set background color
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'black';
            ctx.fillRect(
                // (Continued) Draw function
                0, 0, width, height);

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
                ctx.lineTo(CANVAS_MARGIN + 5, y);
                ctx.stroke();
                ctx.fillText(i.toString(), 15, y + 5);
            }

            // Calculate data points for line graph
            const xStep = (width - 2 * CANVAS_MARGIN) / (NUM_DATA_POINTS - 1);

            // Draw x-axis tick marks and labels (every hour)
            for (let i = 0; i < 9; i++) {
                const x = CANVAS_MARGIN + i * (width - 2 * CANVAS_MARGIN) / 8;
                const hour = i.toString().padStart(1, '0');
                ctx.beginPath();
                ctx.moveTo(x, height - CANVAS_MARGIN + 5);
                ctx.lineTo(x, height - CANVAS_MARGIN - 5);
                ctx.stroke();
                ctx.fillText(hour + ":00 am", x - 12, height - CANVAS_MARGIN + 25);
            }

            // Draw line graph
            ctx.beginPath();
            ctx.moveTo(CANVAS_MARGIN, height - CANVAS_MARGIN - (sleepData[0].bpm - Y_MIN) * yScale);
            let prevX = CANVAS_MARGIN;
            let prevY = height - CANVAS_MARGIN - (sleepData[0].bpm - Y_MIN) * yScale;
            for (let i = 1; i < sleepData.length; i++) {
                const { bpm } = sleepData[i];
                const x = CANVAS_MARGIN + i * xStep;
                const y = height - CANVAS_MARGIN - (bpm - Y_MIN) * yScale;
                const cp1x = prevX + (x - prevX) * CURVE_SMOOTHNESS;
                const cp1y = prevY;
                const cp2x = x - (x - prevX) * CURVE_SMOOTHNESS;
                const cp2y = y;
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
                prevX = x;
                prevY = y;
            }
            // set stroke to 0.5 to make the line thinner
            ctx.lineWidth = 0.8;
            ctx.stroke();

            // Create clipping path for the gradient below the line graph
            ctx.beginPath();
            ctx.moveTo(CANVAS_MARGIN, height - CANVAS_MARGIN);
            ctx.lineTo(CANVAS_MARGIN, height - CANVAS_MARGIN - (sleepData[0].bpm - Y_MIN) * yScale);
            prevX = CANVAS_MARGIN;
            prevY = height - CANVAS_MARGIN - (sleepData[0].bpm - Y_MIN) * yScale;
            for (let i = 1; i < sleepData.length; i++) {
                const { bpm } = sleepData[i];
                const x = CANVAS_MARGIN + i * xStep;
                const y = height - CANVAS_MARGIN - (bpm - Y_MIN) * yScale;
                const cp1x = prevX + (x - prevX) * CURVE_SMOOTHNESS;
                const cp1y = prevY;
                const cp2x = x - (x - prevX) * CURVE_SMOOTHNESS;
                const cp2y = y;
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
                prevX = x;
                prevY = y;
            }
            ctx.lineTo(width - CANVAS_MARGIN, height - CANVAS_MARGIN);
            ctx.closePath();

            // Create gradient for the area below the line graph
            const gradient = ctx.createLinearGradient(0, height - CANVAS_MARGIN, 0, CANVAS_MARGIN);
            gradient.addColorStop(1, `rgba(255, 255, 255, ${GRADIENT_OPACITY}`);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');

            // Fill the area below the line graph with the gradient
            ctx.fillStyle = gradient;
            ctx.fill();


            // Draw grid lines
            ctx.strokeStyle = GRID_COLOR;
            ctx.lineWidth = GRID_WIDTH;
            for (let i = Y_MIN; i <= Y_MAX; i += 4) {
                const y = height - CANVAS_MARGIN - (i - Y_MIN) * yScale;
                ctx.beginPath();
                ctx.moveTo(CANVAS_MARGIN, y);
                ctx.lineTo(width - CANVAS_MARGIN, y);
                ctx.stroke();
            }
            for (let i = 0; i < 21; i++) {
                const x = CANVAS_MARGIN + i * (width - 2 * CANVAS_MARGIN) / 20;
                ctx.beginPath();
                ctx.moveTo(x, CANVAS_MARGIN);
                ctx.lineTo(x, height - CANVAS_MARGIN);
                ctx.stroke();
            }

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

            // In the draw function, add code to draw REM markers if showREMMarkers is true
// In the draw function, add code to draw REM markers if showREMMarkers is true
            if (showREMMarkers) {
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 5;
                let lastREMMarkerIndex = null; // Keep track of the last REM marker's index
                for (let index = ROLLING_AVERAGE_WINDOW_SIZE; index < sleepData.length; index++) {
                    // Calculate the rolling average of the previous ROLLING_AVERAGE_WINDOW_SIZE data points
                    const rollingAverage = sleepData.slice(index - ROLLING_AVERAGE_WINDOW_SIZE, index)
                        .reduce((sum, { bpm }) => sum + bpm, 0) / ROLLING_AVERAGE_WINDOW_SIZE;

                    // Check if current data point is the start of a REM cycle (based on rolling average)
                    if (sleepData[index].bpm >= rollingAverage && sleepData[index - 1].bpm < rollingAverage) {
                        // Check if the current data point is outside the 90-minute window from the last marker
                        if (lastREMMarkerIndex === null || index - lastREMMarkerIndex > SLEEP_CYCLE_WINDOW_SIZE) {
                            const { bpm, time } = sleepData[index];
                            const x = CANVAS_MARGIN + index * xStep;
                            const y = height - CANVAS_MARGIN - (bpm - Y_MIN) * yScale;
                            ctx.beginPath();
                            ctx.arc(x, y, 10, 0, 2 * Math.PI);
                            ctx.fill();
                            ctx.stroke();
                            ctx.font = '14px sans-serif';
                            ctx.fillText('REM', x - 10, y - 15);
                            lastREMMarkerIndex = index; // Update the index of the last REM marker
                        }
                    }
                }
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
    }, [cursorPosition, sleepData, showREMMarkers]);

    return (
        <canvas
            ref={canvasRef}
            style={{ cursor: 'none' }} // Hide the actual cursor
        ></canvas>
    );
};

export default LineGraphCanvas;
