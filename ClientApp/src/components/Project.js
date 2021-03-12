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
        colorMode: colorModes.OPAQUE_TO_COLOR
    });
    
    const { id } = useParams();
    const [stitches, setStitches] = useState([]);
    const [hubConnection, setHubConnection] = useState(null);
    const [colors, setColors] = useState([]);
    const [canvas, setCanvas] = useState();

    const setSelectedColor = useRef();
    const setHoverColor = useRef();
    const setPrevCursorMode = useRef();

    const gridCanvas = useRef();
    const zoomCanvas = useRef();
    const stitchWrapper = useRef();
    const transformWrapper = useRef();
    const guideHorizontal = useRef();
    const guideVertical = useRef();
    
    var canvasContext;
    var gridCanvasContext;
    var zoomCanvasContext;
    var stitchArray = stitches;
    var mousePressed = -1;
    var selectedStitches = [];
    var scale = 1.0;
    var posX = 0;
    var posY = 0;
    var stitchedColor = '#ffffff';

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
            canvasContext.font = "bold 20px Roboto";
            canvasContext.textAlign = 'center';
            canvasContext.textBaseline = 'middle';
            canvasContext.imageSmoothingEnabled = false;
            gridCanvasContext = gridCanvas.current.getContext('2d');
            gridCanvasContext.imageSmoothingEnabled = false;
            gridCanvasContext.strokeStyle = 'black';
            zoomCanvasContext = zoomCanvas.current.getContext('2d');
            zoomCanvasContext.imageSmoothingEnabled = false;
            zoomCanvasContext.strokeStyle = 'black';
            zoomCanvasContext.lineWidth = 10;
            transformWrapper.current.style.width = `${canvas.width * scale}px`;
            transformWrapper.current.style.height = `${canvas.height * scale}px`;
            setGuideStyles();
            
            redrawCanvas();
        }
            
    }, [canvas])

    const setGuideStyles = () => {
        document.documentElement.style.setProperty('--number-size', `${STITCH_SIZE * 10 * scale}px`);
        guideHorizontal.current.style.left = `-${STITCH_SIZE * 5 * scale}px`;
        guideHorizontal.current.style.transform = `translate(${posX * scale}px, 0)`;
        guideVertical.current.style.top = `-${STITCH_SIZE * 5 * scale}px`;
        guideVertical.current.style.transform = `translate(0, ${posY * scale}px)`;
    }

    const getMousePos = (e) => {
        var rect = canvas.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
            y: ((e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
        }
    }

    const redrawCanvas = () => {
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        gridCanvasContext.clearRect(0, 0, canvas.width, canvas.height);
        var x, y;
        for (y = 0; y < stitchArray.length; y++)
            for (x = 0; x < stitchArray[0].length; x++) {
                drawStitch(x, y, false);
                drawGrid(x, y);
            }
        if (scale < 0.25)
            gridCanvas.current.style.display = 'none';
        drawGuideGrid();

    }

    const getMinScale = () => {
        var scaleX = stitchWrapper.current.clientWidth / canvas.width;
        var scaleY = stitchWrapper.current.clientHeight / canvas.height;
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
            gridCanvasContext.lineTo(canvas.width, y);
            gridCanvasContext.stroke();
        }
        for (let x = 10 * STITCH_SIZE; x < stitchArray[0].length * STITCH_SIZE; x += 10 * STITCH_SIZE) {
            gridCanvasContext.beginPath();
            gridCanvasContext.moveTo(x, 0);
            gridCanvasContext.lineTo(x, canvas.height);
            gridCanvasContext.stroke();
        }
    }

    const drawGrid = (x, y) => {
        gridCanvasContext.strokeStyle = 'black';
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
    }

    const drawStitch = (x, y, clear = true) => {
        if (clear)
            canvasContext.clearRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);

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
                    canvasContext.fillText(stitchArray[y][x].colorIndex, x * STITCH_SIZE + 20, y * STITCH_SIZE + 20);
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
                canvasContext.fillText(stitchArray[y][x].colorIndex, x * STITCH_SIZE + 20, y * STITCH_SIZE + 20);
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
                colorStyle = stitchedColor;
                alpha = 1;
                canvasContext.font = 'bold 20px Roboto';
            }
            if (settings.current.colorLock) {
                if (settings.current.selectedColor == stitchArray[y][x].colorIndex) {
                    canvasContext.fillStyle = colorStyle;
                    canvasContext.fillRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
                    canvasContext.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                    canvasContext.fillText(stitchArray[y][x].colorIndex, x * STITCH_SIZE + 20, y * STITCH_SIZE + 20);
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
                canvasContext.fillText(stitchArray[y][x].colorIndex, x * STITCH_SIZE + 20, y * STITCH_SIZE + 20);
            }
            
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
        else if (mousePressed == -1 && settings.current.cursorMode == cursorModes.ZOOM)
            drawZoomRectangle(pos.x, pos.y);
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
                    zoomIn(pos.x - (canvas.width * scale) / 2, pos.y - (canvas.height * scale) / 2);
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
        var minX = stitchWrapper.current.clientWidth / scale - canvas.width;
        var minY = stitchWrapper.current.clientHeight / scale - canvas.height;
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
            gridCanvas.current.style.display = 'none';
        }
        else {
            gridCanvas.current.style.display = 'block';
        }
        
        console.log(posX);
        posX = -pos.x + ((canvas.width / 2) * ((stitchWrapper.current.clientWidth / canvas.width) / newScale));
        posY = -pos.y + ((canvas.height / 2) * ((stitchWrapper.current.clientHeight / canvas.height) / newScale));
        scale = newScale;

        keepPixelMult();
        keepInBounds();
        transformWrapper.current.style.transform = `scale(${scale}) translate(${posX}px, ${posY}px)`;
        transformWrapper.current.style.width = `${canvas.width * scale}px`;
        transformWrapper.current.style.height = `${canvas.height * scale}px`;
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
        transformWrapper.current.style.width = `${canvas.width * scale}px`;
        transformWrapper.current.style.height = `${canvas.height * scale}px`;
        gridCanvas.current.style.display = 'none';
        setGuideStyles();
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
        transformWrapper.current.style.width = `${canvas.width * scale}px`;
        transformWrapper.current.style.height = `${canvas.height * scale}px`;
        gridCanvas.current.style.display = 'block';
        setGuideStyles();
    }

    const drawZoomRectangle = (x, y) => {
        zoomCanvasContext.clearRect(0, 0, canvas.width, canvas.height);
        var width = canvas.width * scale;
        var height = canvas.height * scale;
        var rectX = x - width / 2;
        if (rectX < 0)
            rectX = 0;
        else if (rectX > canvas.width - width)
            rectX = canvas.width - width;
        var rectY = y - height / 2;
        if (rectY < 0)
            rectY = 0;
        else if (rectY > canvas.height - height)
            rectY = canvas.height - height;
        zoomCanvasContext.strokeRect(rectX, rectY, width, height);
    }

    const GuideHorizontal = () => {
        var numbers = [];
        for (let i = 0; i < stitchArray[0].length; i += 10) {
            numbers.push(i);
        }

        return (
            <div ref={guideHorizontal} className={'guide-horizontal'}>
                {
                    numbers.map((num) => (
                        <div className={'guide-number'}>
                            {num == 0 ? '' : num}
                        </div>
                        ))
                }
            </div>
            );
    }

    const GuideVertical = () => {
        var numbers = [];
        for (let i = 0; i < stitchArray.length; i += 10) {
            numbers.push(i);
        }

        return (
            <div ref={guideVertical} className={'guide-vertical'}>
                {
                    numbers.map((num) => (
                        <div className={'guide-number'}>
                            {num == 0 ? '' : num}
                        </div>
                    ))
                }
            </div>
        );
    }

    if (stitches.length == 0 || colors.length == 0)
        return null;

    

    return (
        <>
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
                        display: `${canvas ? 'flex' : 'none'}`
                    }}
                    ref={stitchWrapper}
                >
                    <div id={'transform-wrapper'} ref={transformWrapper}>
                        <StitchCanvas
                            setCanvas={setCanvas}
                            mouseMove={mouseMove}
                            mouseUp={mouseUp}
                            mouseDown={mouseDown}
                            height={stitches.length * STITCH_SIZE}
                            width={stitches[0].length * STITCH_SIZE}
                        />
                        <canvas
                            id={'grid-canvas'}
                            height={stitches.length * STITCH_SIZE}
                            width={stitches[0].length * STITCH_SIZE}
                            ref={gridCanvas}
                        />
                        <canvas
                            id={'zoom-canvas'}
                            height={stitches.length * STITCH_SIZE}
                            width={stitches[0].length * STITCH_SIZE}
                            ref={zoomCanvas}
                            />
                    </div>
                </div>
            </div>
            <Toolbar
                settingsRef={settings}
                setSelectedColorRef={setSelectedColor}
                setHoverColorRef={setHoverColor}
                redrawCanvas={redrawCanvas}
                setPrevCursorModeRef={setPrevCursorMode}
                zoomOut={zoomOut}
            />
        </>
    );
}