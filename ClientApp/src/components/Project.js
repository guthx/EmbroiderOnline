import React, { useState, useRef } from 'react'
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { authService } from '../AuthService';
import './Project.css';
import StitchCanvas from './StitchCanvas';
import Toolbar from './Test';
import * as signalR from '@microsoft/signalr';
import { Color } from 'p5';

export const cursorModes = {
    SELECT: 0,
    PAN: 1,
    ZOOM: 2,
    STITCH: 3,
    ERASE: 4,
};

export const colorModes = {
    TRANSPARENT_TO_OPAQUE: 0,
    OPAQUE_TO_COLOR: 1,
}

const STITCH_SIZE = 40;

export default function Project() {
    const settings = useRef({
        cursorMode: cursorModes.PAN,
        selectedColor: null,
        colorLock: false,
        colorMode: colorModes.OPAQUE_TO_COLOR,
        customColor: 'fff',
    });
    
    const { id } = useParams();
    const [stitches, setStitches] = useState([]);
    const [hubConnection, setHubConnection] = useState(null);
    const [colors, setColors] = useState([]);
    const [reconnecting, setReconnecting] = useState(false);
    const [disconnected, setDisconnected] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const setSelectedColor = useRef();
    const setHoverColor = useRef();
    const setPrevCursorMode = useRef();
    const setStitchCounts = useRef();
    const updateStitchCounts = useRef();

    const canvas = useRef();
    const gridCanvas = useRef();
    const stitchWrapper = useRef();
    const transformWrapper = useRef();
    const guideHorizontal = useRef();
    const guideVertical = useRef();

    let canvasContext;
    let gridCanvasContext;
    if (canvas.current)
        canvasContext = canvas.current.getContext('2d');
    if (gridCanvas.current)
        gridCanvasContext = gridCanvas.current.getContext('2d');
    let stitchArray = stitches;
    let mousePressed = -1;
    let selectedStitches = [];
    let scale = 1.0;
    let posX = 0;
    let posY = 0;

    let prevZoomX = 0;
    let prevZoomY = 0;
    let currentZoomX = 0;
    let currentZoomY = 0;

    useEffect(() => {
        var hub = new signalR.HubConnectionBuilder()
            .withUrl('/hubs/project', {
                accessTokenFactory: () => {
                    return authService.currentUserValue().jwt;
                },
                skipNegotiation: false
            })
            .configureLogging(signalR.LogLevel.Information)
            .withAutomaticReconnect()
            .build();
        hub.on('projectReceived', project => {
            if (project) {
                setStitches(project.stitchMap.stitches);
                setColors(project.stitchMap.dmcFlosses);
            }
        });
        hub.onreconnecting(() => {
            setReconnecting(true);
        });
        hub.onreconnected(() => {
            hub.invoke('GetProject', id);
        });
        hub.onclose(() => {
            setReconnecting(false);
            setDisconnected(true);
        });
        hub.start()
            .then(() => {
                setHubConnection(hub);
            });

        

        return () => {
            hub.stop();
            canvasContext = null;
            gridCanvasContext = null;
            stitchArray = null;
            mousePressed = null;
            selectedStitches = null;
            scale = null;
            posX = null;
            posY = null;

            prevZoomX = null;
            prevZoomY = null;
            currentZoomX = null;
            currentZoomY = null;
        }

    }, []);

    useEffect(() => {
        if (hubConnection) {
            hubConnection.invoke('GetProject', id);
        }
    }, [hubConnection]);

    useEffect(() => {
        if (stitches.length > 0 && colors.length > 0) {
            loadCanvas();
            let initialStitchCounts = [];
            for (let i = 0; i < colors.length; i++) {
                initialStitchCounts.push({ total: 0, stitched: 0 });
            }
            for (let i = 0; i < stitches.length; i++)
                for (let j = 0; j < stitches[0].length; j++) {
                    initialStitchCounts[stitches[i][j].colorIndex].total += 1;
                    if (stitches[i][j].stitched)
                        initialStitchCounts[stitches[i][j].colorIndex].stitched += 1;
                }
            setStitchCounts.current(initialStitchCounts);

            setGuideStyles();

            redrawCanvas();
        }   
    }, [colors])


    function loadCanvas() {
        
        setLoaded(true); 
        canvasContext.canvas.width = stitches[0].length * STITCH_SIZE;
        canvasContext.canvas.height = stitches.length * STITCH_SIZE;
        canvasContext.font = "bold 20px Roboto";
        canvasContext.textAlign = 'center';
        canvasContext.textBaseline = 'middle';
        canvasContext.imageSmoothingEnabled = false;
        gridCanvasContext.canvas.width = stitches[0].length * STITCH_SIZE;
        gridCanvasContext.canvas.height = stitches.length * STITCH_SIZE;
        gridCanvasContext.imageSmoothingEnabled = false;
        gridCanvasContext.strokeStyle = 'black';
        //transformWrapper.current.style.width = `${canvasContext.canvas.width * scale}px`;
        //transformWrapper.current.style.height = `${canvasContext.canvas.height * scale}px`;
        setCanvasCursor('grab');
        setStitches(stitches);
        setColors(colors);
        
        
        setReconnecting(false);
        
    }
    

    const setGuideStyles = () => {
        document.documentElement.style.setProperty('--number-size', `${STITCH_SIZE * 10 * scale}px`);
        guideHorizontal.current.style.left = `-${STITCH_SIZE * 5 * scale}px`;
        guideHorizontal.current.style.transform = `translate(${posX * scale}px, 0)`;
        guideVertical.current.style.top = `-${STITCH_SIZE * 5 * scale}px`;
        guideVertical.current.style.transform = `translate(0, ${posY * scale}px)`;
    }

    const getMousePos = (e) => {
        var rect = canvas.current.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / (rect.right - rect.left) * canvas.current.width),
            y: ((e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.current.height)
        }
    }

    const redrawCanvas = () => {
        canvasContext.clearRect(0, 0, canvas.current.width, canvas.current.height);
        gridCanvasContext.clearRect(0, 0, canvas.current.width, canvas.current.height);
        var x, y;
        for (y = 0; y < stitchArray.length; y++)
            for (x = 0; x < stitchArray[0].length; x++) {
                drawStitch(x, y, false);
                drawGrid(x, y);
            }
        if (scale < 0.25)
            gridCanvas.current.style.visibility = 'hidden';
        drawGuideGrid();

    }

    const getMinScale = () => {
        var scaleX = stitchWrapper.current.clientWidth / canvas.current.width;
        var scaleY = stitchWrapper.current.clientHeight / canvas.current.height;
        if (scaleX < scaleY)
            return scaleX;
        else
            return scaleY;
    }

    const drawGuideGrid = () => {
        gridCanvasContext.lineWidth = 4;
        for (let y = 10 * STITCH_SIZE; y < stitchArray.length * STITCH_SIZE; y += 10 * STITCH_SIZE) {
            gridCanvasContext.beginPath();
            gridCanvasContext.moveTo(0, y);
            gridCanvasContext.lineTo(canvas.current.width, y);
            gridCanvasContext.closePath();
            gridCanvasContext.stroke();
        }
        for (let x = 10 * STITCH_SIZE; x < stitchArray[0].length * STITCH_SIZE; x += 10 * STITCH_SIZE) {
            gridCanvasContext.beginPath();
            gridCanvasContext.moveTo(x, 0);
            gridCanvasContext.lineTo(x, canvas.current.height);
            gridCanvasContext.closePath();
            gridCanvasContext.stroke();
        }
    }

    const drawGrid = (x, y) => {
        gridCanvasContext.strokeStyle = 'black';
        gridCanvasContext.beginPath();
        if (settings.current.colorLock) {
            if (settings.current.selectedColor == stitchArray[y][x].colorIndex) {
                gridCanvasContext.lineWidth = 4;
                gridCanvasContext.strokeRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
            }
            else {
                gridCanvasContext.strokeStyle = 'rgba(0, 0, 0, 0.2';
                gridCanvasContext.lineWidth = 2;
                gridCanvasContext.strokeRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
            }
        }
        else {
            gridCanvasContext.lineWidth = 2;
            gridCanvasContext.strokeRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
        }
        gridCanvasContext.closePath();
    }

    const drawStitch = (x, y, clear = true) => {
        if (clear)
            canvasContext.clearRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
        canvasContext.beginPath();
        if (settings.current.colorMode == colorModes.TRANSPARENT_TO_OPAQUE) {
            var alpha;
            if (stitchArray[y][x].stitched == false) {
                alpha = 0.4;
                canvasContext.font = '20px Roboto';
            }
            else {
                alpha = 1;
                canvasContext.font = 'bold 20px Roboto';
            }

            var color = colors[stitchArray[y][x].colorIndex];
            if (settings.current.colorLock) {
                if (settings.current.selectedColor == stitchArray[y][x].colorIndex) {
                    
                    canvasContext.fillStyle = `rgba(${color.red}, ${color.green}, ${color.blue}, ${alpha})`;
                    canvasContext.fillRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
                    canvasContext.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                    canvasContext.fillText(stitchArray[y][x].colorIndex, x * STITCH_SIZE + STITCH_SIZE / 2, y * STITCH_SIZE + STITCH_SIZE / 2);
                    
                }
                else {
                    canvasContext.fillStyle = `rgba(${color.red}, ${color.green}, ${color.blue}, 0.2)`;
                    canvasContext.fillRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
                }
            }
            else {
                canvasContext.fillStyle = `rgba(${color.red}, ${color.green}, ${color.blue}, ${alpha})`;
                canvasContext.fillRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
                canvasContext.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                canvasContext.fillText(stitchArray[y][x].colorIndex, x * STITCH_SIZE + STITCH_SIZE / 2, y * STITCH_SIZE + STITCH_SIZE / 2);
            }
        }
        else {
            var color = colors[stitchArray[y][x].colorIndex];
            var colorStyle;
            var alpha;
            if (stitchArray[y][x].stitched == false) {
                colorStyle = `rgb(${color.red}, ${color.green}, ${color.blue})`;
                alpha = 0.4;
                canvasContext.font = '20px Roboto';
            }
            else {
                colorStyle = settings.current.customColor;
                alpha = 1;
                canvasContext.font = 'bold 20px Roboto';
            }
            if (settings.current.colorLock) {
                if (settings.current.selectedColor == stitchArray[y][x].colorIndex) {
                    canvasContext.fillStyle = colorStyle;
                    canvasContext.fillRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
                    canvasContext.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                    canvasContext.fillText(stitchArray[y][x].colorIndex, x * STITCH_SIZE + STITCH_SIZE / 2, y * STITCH_SIZE + STITCH_SIZE / 2);
                }
                else {
                    canvasContext.fillStyle = `rgba(${color.red}, ${color.green}, ${color.blue}, 0.2)`;
                    canvasContext.fillRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
                }
            }
            else {
                canvasContext.fillStyle = colorStyle;
                canvasContext.fillRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
                canvasContext.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                canvasContext.fillText(stitchArray[y][x].colorIndex, x * STITCH_SIZE + STITCH_SIZE / 2, y * STITCH_SIZE + STITCH_SIZE / 2);
            }
            
        }
       // canvasContext.closePath();
        
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
        else if (mousePressed == -1 && settings.current.cursorMode == cursorModes.ZOOM) {
            setTimeout(() => {
                currentZoomX = pos.x;
                currentZoomY = pos.y;
            }, 15);
            
        }
        setHoverColor.current(stitchArray[y][x].colorIndex);
    }

    const pan = (e) => {
        posX += e.movementX / scale;
        posY += e.movementY / scale;
        keepInBounds();
        transformWrapper.current.style.transform = `scale(${scale}) translate(${posX}px, ${posY}px)`;
        guideHorizontal.current.style.transform = `translate(${posX * scale}px, 0)`;
        guideVertical.current.style.transform = `translate(0, ${posY * scale}px)`;
    }

    const mouseDown = (e) => {
        console.log('test');
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
                case cursorModes.ZOOM:
                    zoomIn(pos.x - (canvas.current.width * scale) / 2, pos.y - (canvas.current.height * scale) / 2);
                    break;
            }
        }
    }

    const mouseUp = (e) => {
        mousePressed = -1;
        if (selectedStitches.length > 0) {
            hubConnection.invoke('UpdateStitches', selectedStitches);
            let changes = new Array(colors.length);
            for (let i = 0; i < selectedStitches.length; i++) {
                if (settings.current.cursorMode == cursorModes.STITCH) {
                    let index = stitchArray[selectedStitches[i].y][selectedStitches[i].x].colorIndex;
                    if (!changes[index])
                        changes[index] = 1;
                    else
                        changes[index]++;
                } else {
                    let index = stitchArray[selectedStitches[i].y][selectedStitches[i].x].colorIndex;
                    if (!changes[index])
                        changes[index] = -1;
                    else
                        changes[index]--;
                }
            }
            updateStitchCounts.current(changes);
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
            window.requestAnimationFrame(() => {
                drawStitch(x, y);
            })
        }
    }

    const eraseStitch = (x, y) => {
        if (stitchArray[y][x].stitched &&
            (settings.current.colorLock == false || settings.current.selectedColor == stitchArray[y][x].colorIndex) &&
            !selectedStitches.find(s => s.x == x && s.y == y)
        ) {
            selectedStitches.push({ x: x, y: y });
            stitchArray[y][x].stitched = false;
            window.requestAnimationFrame(() => {
                drawStitch(x, y);
            })
        }
    }

    const keepInBounds = () => {
        var minX = stitchWrapper.current.clientWidth / scale - canvas.current.width;
        var minY = stitchWrapper.current.clientHeight / scale - canvas.current.height;
        if (posX < minX)
            posX = minX;
        if (posX > 0)
            posX = 0;
        if (posY < minY)
            posY = minY;
        if (posY > 0)
            posY = 0;
        posX = posX;
        posY = posY;
        
    }

    const wheel = (e) => {
        var pos = getMousePos(e);
        var minScale = getMinScale();
        var newScale;
        var delta = e.deltaY > 0 ? 0.25 : -0.25;
        if (delta < 0 && scale < 0.25)
            newScale = 0.25;
        else
            newScale = scale - delta;
        if (newScale > 1.0)
            newScale = 1.0
        else if (newScale < minScale)
            newScale = minScale;
        if (newScale == scale)
            return;
        // remove grid if scale < 0.25 to get rid of artifacts
        if (newScale < 0.25) {
            gridCanvas.current.style.visibility = 'hidden';
        }
        else {
            gridCanvas.current.style.visibility = 'visible';
        }
        
        console.log(posX);
        posX = -pos.x + ((canvas.current.width / 2) * ((stitchWrapper.current.clientWidth / canvas.current.width) / newScale));
        posY = -pos.y + ((canvas.current.height / 2) * ((stitchWrapper.current.clientHeight / canvas.current.height) / newScale));
        scale = newScale;

        keepPixelMult();
        keepInBounds();
        transformWrapper.current.style.transform = `scale(${scale}) translate(${posX}px, ${posY}px)`;
        //transformWrapper.current.style.width = `${canvas.current.width * scale}px`;
        //transformWrapper.current.style.height = `${canvas.current.height * scale}px`;
        setGuideStyles();
    }

    const keepPixelMult = () => {
        posX = Math.round(posX);
        posY = Math.round(posY);
        posX -= posX % 4;
        posY -= posY % 4;
    }

    const zoomOut = () => {
        scale = getMinScale();
        
        posX = 0;
        posY = 0;
        transformWrapper.current.style.transform = `scale(${scale}) translate(${posX}px, ${posY}px)`;
        //transformWrapper.current.style.width = `${canvasContext.canvas.width * scale}px`;
        //transformWrapper.current.style.height = `${canvasContext.canvas.height * scale}px`;
        
        gridCanvas.current.style.visibility = 'hidden';
        setGuideStyles();
       // window.requestAnimationFrame(drawZoomRectangle);
    }

    const zoomIn = (x, y) => {
        console.log({ x, y });
        scale = 1;
        setPrevCursorMode.current();
        posX = -x;
        posY = -y;
        keepPixelMult();
        keepInBounds();
        transformWrapper.current.style.transform = `scale(${scale}) translate(${posX}px, ${posY}px)`;
        //transformWrapper.current.style.width = `${canvasContext.canvas.width * scale}px`;
        //transformWrapper.current.style.height = `${canvasContext.canvas.height * scale}px`;
        gridCanvas.current.style.visibility = 'visible';
        setGuideStyles();
    }

    const setCanvasCursor = (cursorType) => {
        if (canvas)
            canvas.current.style.cursor = cursorType;
    }

    const GuideHorizontal = () => {
        if (stitches.length == 0)
            return null;
        var numbers = [];
        for (let i = 0; i < stitchArray[0].length; i += 10) {
            numbers.push(i);
        }

        return (
            <div ref={guideHorizontal} className={'guide-horizontal'}>
                {
                    numbers.map((num) => (
                        <div key={num} className={'guide-number'}>
                            {num == 0 ? '' : num}
                        </div>
                        ))
                }
            </div>
            );
    }

    const GuideVertical = () => {
        if (stitches.length == 0)
            return null;
        var numbers = [];
        for (let i = 0; i < stitchArray.length; i += 10) {
            numbers.push(i);
        }

        return (
            <div ref={guideVertical} className={'guide-vertical'}>
                {
                    numbers.map((num) => (
                        <div key={num} className={'guide-number'}>
                            {num == 0 ? '' : num}
                        </div>
                    ))
                }
            </div>
        );
    }

    return (
        <div className={'project-editor'} style={{ visibility: `${loaded ? 'visible' : 'hidden'}` }}>
            <Toolbar
                settingsRef={settings}
                setSelectedColorRef={setSelectedColor}
                setHoverColorRef={setHoverColor}
                redrawCanvas={redrawCanvas}
                setPrevCursorModeRef={setPrevCursorMode}
                setCanvasCursor={setCanvasCursor}
                zoomOut={zoomOut}
                colors={colors}
                setStitchCountsRef={setStitchCounts}
                updateStitchCountsRef={updateStitchCounts}
            />
            <div className={'project-wrapper'}>
                <GuideHorizontal />
                <GuideVertical />
                <div style={{
                    backgroundColor: 'white',
                    zIndex: '9'
                }}></div>
                <div className={'stitch-wrapper'}
                    onWheel={e => wheel(e)}
                    style={{
                        visibility: `${canvas ? 'visible' : 'hidden'}`
                    }}
                    ref={stitchWrapper}
                >
                    <div id={'transform-wrapper'} ref={transformWrapper}>
                        <canvas
                            id={'stitch-canvas'}
                            ref={canvas}
                            onMouseMove={mouseMove}
                            onMouseDown={mouseDown}
                            onMouseUp={mouseUp}
                            onContextMenu={e => e.preventDefault()}
                        >
                        </canvas>
                        <canvas
                            id={'grid-canvas'}
                            ref={gridCanvas}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}