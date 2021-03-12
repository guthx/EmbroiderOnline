import React, { useState, useRef } from 'react'
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { authService } from '../AuthService';
import './Project.css';
import StitchCanvas from './StitchCanvas';
import Toolbar from './Test';
import * as signalR from '@microsoft/signalr';

export const cursorModes = {
    SELECT: 0,
    PAN: 1,
    ZOOM: 2,
    STITCH: 3,
    ERASE: 4,
};

const STITCH_SIZE = 40;

export default function Project() {
    const settings = useRef({
        cursorMode: cursorModes.PAN,
        selectedColor: null,
        colorLock: false
    });
    const setSelectedColor = useRef();
    const setHoverColor = useRef();
    const { id } = useParams();
    const [stitches, setStitches] = useState([]);
    const [hubConnection, setHubConnection] = useState(null);
    const [colors, setColors] = useState([]);
    const [canvas, setCanvas] = useState();

    const gridCanvas = useRef();
    
    var canvasContext;
    var stitchArray = stitches;
    var mousePressed = -1;
    var selectedStitches = [];
    var scale = 1.0;
    var posX = 0;
    var posY = 0;

    useEffect(() => {
        var hub = new signalR.HubConnectionBuilder()
            .withUrl('/hubs/project', {
                accessTokenFactory: () => {
                    return authService.currentUserValue().jwt;
                },
                skipNegotiation: false
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();
        hub.on('projectReceived', project => {
            if (project) {
                console.log(project);
                setStitches(project.stitchMap.stitches);
                setColors(project.stitchMap.dmcFlosses);
            }
        });
        hub.start()
            .then(() => {
                setHubConnection(hub);
            });

        return () => {
            hub.stop();
        }

    }, []);

    useEffect(() => {
        if (hubConnection) {
            hubConnection.invoke('GetProject', id);
        }
    }, [hubConnection])

    useEffect(() => {
        if (canvas) {
            canvasContext = canvas.getContext('2d');
            canvasContext.font = "20px Roboto";
            canvasContext.textAlign = 'center';
            canvasContext.textBaseline = 'middle';
            canvasContext.imageSmoothingEnabled = false;
            redrawCanvas();
        }
            
    }, [canvas])

    const getMousePos = (e) => {
        var rect = canvas.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
            y: ((e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
        }
    }

    const redrawCanvas = () => {
        var x, y;
        for (y = 0; y < stitchArray.length; y++)
            for (x = 0; x < stitchArray[0].length; x++)
                drawStitch(x, y);
    }

    const drawStitch = (x, y, clear = true) => {
        var alpha;
        if (stitchArray[y][x].stitched == false)
            alpha = 0.4;
        else
            alpha = 1;
        var color = colors[stitchArray[y][x].colorIndex];
        if (clear)
            canvasContext.clearRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
        if (settings.current.colorLock) {
            if (settings.current.selectedColor == stitchArray[y][x].colorIndex) {
                canvasContext.lineWidth = 4;
                canvasContext.fillStyle = `rgba(${color.red}, ${color.green}, ${color.blue}, ${alpha})`;
                canvasContext.fillRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
                canvasContext.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                canvasContext.fillText(stitchArray[y][x].colorIndex, x * STITCH_SIZE + 20, y * STITCH_SIZE + 20);
                canvasContext.strokeStyle = `rgba(0, 0, 0, 1`;
                canvasContext.strokeRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
            }
            else {
                canvasContext.lineWidth = 2;
                canvasContext.fillStyle = `rgba(${color.red}, ${color.green}, ${color.blue}, 0.3)`;
                canvasContext.fillRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
                canvasContext.fillStyle = `rgba(0, 0, 0, 0.3)`;
                canvasContext.fillText(stitchArray[y][x].colorIndex, x * STITCH_SIZE + 20, y * STITCH_SIZE + 20);
                canvasContext.strokeStyle = `rgba(0, 0, 0, 0.3)`;
                canvasContext.strokeRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
            }
        }
        else {
            canvasContext.lineWidth = 1;
            canvasContext.fillStyle = `rgba(${color.red}, ${color.green}, ${color.blue}, ${alpha})`;
            canvasContext.fillRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
            canvasContext.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            canvasContext.fillText(stitchArray[y][x].colorIndex, x * STITCH_SIZE + 20, y * STITCH_SIZE + 20);
            canvasContext.strokeStyle = `rgba(0, 0, 0, ${alpha}`;
            canvasContext.strokeRect(x * STITCH_SIZE + 0.5, y * STITCH_SIZE + 0.5, STITCH_SIZE - 1, STITCH_SIZE - 1);
        }
    }

    const mouseMove = (e) => {
        var pos = getMousePos(e);
        var x = parseInt(pos.x / STITCH_SIZE);
        var y = parseInt(pos.y / STITCH_SIZE);
        if (mousePressed == 0) {
            switch (settings.current.cursorMode) {
                case cursorModes.STITCH:
                    completeStitch(x, y);
                    break;
                case cursorModes.ERASE:
                    eraseStitch(x, y);
                    break;
                case cursorModes.PAN:
                    pan(e);
                    break;
            }
        }
        else if (mousePressed == 2) {
            pan(e);
        }
        setHoverColor.current(stitchArray[y][x].colorIndex);
    }

    const pan = (e) => {
        posX += e.movementX / scale;
        posY += e.movementY / scale;
        keepInBounds();
        canvas.style.transform = `scale(${scale}) translate(${posX}px, ${posY}px)`;
    }

    const mouseDown = (e) => {
        mousePressed = e.button;
        if (mousePressed == 0) {
            var pos = getMousePos(e);
            var x = parseInt(pos.x / STITCH_SIZE);
            var y = parseInt(pos.y / STITCH_SIZE);
            switch (settings.current.cursorMode) {
                case cursorModes.STITCH:
                    completeStitch(x, y);
                    break;
                case cursorModes.ERASE:
                    eraseStitch(x, y);
                    break;
                case cursorModes.SELECT:
                    setSelectedColor.current(stitchArray[y][x].colorIndex);
                    break;
            }
        }
    }

    const mouseUp = () => {
        mousePressed = -1;
        if (selectedStitches.length > 0) {
            hubConnection.invoke('UpdateStitches', selectedStitches);
            selectedStitches = [];
        }
    }

    const completeStitch = (x, y) => {
        if (!stitchArray[y][x].stitched &&
            (settings.current.colorLock == false || settings.current.selectedColor == stitchArray[y][x].colorIndex) &&
            !selectedStitches.find(s => s.x == x && s.y == y) 
        ) {
            selectedStitches.push({ x: x, y: y });
            stitchArray[y][x].stitched = true;
            drawStitch(x, y);
        }
    }

    const eraseStitch = (x, y) => {
        if (stitchArray[y][x].stitched &&
            (settings.current.colorLock == false || settings.current.selectedColor == stitchArray[y][x].colorIndex) &&
            !selectedStitches.find(s => s.x == x && s.y == y)
        ) {
            selectedStitches.push({ x: x, y: y });
            stitchArray[y][x].stitched = false;
            drawStitch(x, y);
        }
    }

    const keepInBounds = () => {
        var wrapper = document.getElementsByClassName('stitch-wrapper')[0];
        var minX = wrapper.clientWidth / scale - canvas.width;
        var minY = wrapper.clientHeight / scale - canvas.height;
        if (posX < minX)
            posX = minX;
        if (posX > 0)
            posX = 0;
        if (posY < minY)
            posY = minY;
        if (posY > 0)
            posY = 0;
        posX = Math.round(posX);
        posY = Math.round(posY);
        
    }

    const wheel = (e) => {
        var wrapper = document.getElementsByClassName('stitch-wrapper')[0];
        var pos = getMousePos(e);
        console.log(pos);
        var delta = e.deltaY > 0 ? 0.25 : -0.25;
        var newScale = scale - delta;
        if (newScale > 1.0)
            newScale = 1.0
        else if (newScale < 0.25)
            newScale = 0.25;
        if (newScale == scale)
            return;
        
        console.log(posX);
        posX = -pos.x + ((canvas.width / 2) * ((wrapper.clientWidth / canvas.width) / newScale));
        posY = -pos.y + ((canvas.height / 2) * ((wrapper.clientHeight / canvas.height) / newScale));
        scale = newScale;
        
        
        keepInBounds();
        canvas.style.transform = `scale(${scale}) translate(${posX}px, ${posY}px)`;
    }


    if (stitches.length == 0 || colors.length == 0)
        return null;

    return (
        <>
            <div className={'stitch-wrapper'}
                onWheel={e => wheel(e)}
                style={{
                    display: `${canvas ? 'block' : 'none'}`
                }}
            >
                <canvas
                    id={'grid-canvas'}
                    height={stitches.length * STITCH_SIZE}
                    width={stitches[0].length * STITCH_SIZE}
                    ref={gridCanvas}
                    />
            <StitchCanvas
                setCanvas={setCanvas}
                mouseMove={mouseMove}
                mouseUp={mouseUp}
                mouseDown={mouseDown}
                height={stitches.length * STITCH_SIZE}
                width={stitches[0].length * STITCH_SIZE}
                />
            </div>
            <Toolbar
                settingsRef={settings}
                setSelectedColorRef={setSelectedColor}
                setHoverColorRef={setHoverColor}
                redrawCanvas={redrawCanvas}
            />
        </>
    );
}