import React, { useEffect, useRef } from 'react'
import { useState } from 'react';
import { colorModes, cursorModes } from './Project';

export default function Toolbar({ settingsRef, setSelectedColorRef, setHoverColorRef, redrawCanvas, setPrevCursorModeRef, zoomOut }) {
    const [cursorMode, setCursorMode] = useState(cursorModes.PAN);
    const [selectedColor, setSelectedColor] = useState(null);
    setSelectedColorRef.current = setSelectedColor;
    const [hoverColor, setHoverColor] = useState(null);
    setHoverColorRef.current = setHoverColor;
    const [colorLock, setColorLock] = useState(false);
    const [colorMode, setColorMode] = useState(colorModes.OPAQUE_TO_COLOR);
    const [prevCursorMode, setPrevCursorMode] = useState(cursorModes.PAN);
    
    const isInitialMount = useRef(true);
    useEffect(() => {
        settingsRef.current = {
            cursorMode: cursorMode,
            selectedColor: selectedColor,
            hoverColor: hoverColor,
            colorLock: colorLock
        };
    });
    useEffect(() => {
        setCursorMode(prevCursorMode);
    }, [selectedColor]);
    useEffect(() => {
        if (isInitialMount.current)
            isInitialMount.current = false;
        else
            redrawCanvas();
    }, [colorLock, colorMode])

    const revertCursorMode = () => {
        setCursorMode(prevCursorMode);
    }

    setPrevCursorModeRef.current = revertCursorMode;

    return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr'
            }}>
            <div>{cursorMode}</div>
            <button onClick={() => setCursorMode(cursorModes.STITCH)}>stitch</button>
            <button onClick={() => setCursorMode(cursorModes.ERASE)}> unstitch</button>
            <button onClick={() => setCursorMode(cursorModes.PAN)}>pan</button>
            <button onClick={() => {
                setPrevCursorMode(cursorMode);
                setCursorMode(cursorModes.SELECT);
            }
            }>select</button>
            <button onClick={() => setColorLock(!colorLock)}>colorlock</button>
            <button onClick={() => {
                setPrevCursorMode(cursorMode);
                setCursorMode(cursorModes.ZOOM);
                zoomOut();
            }}>zoom</button>
            <div>{selectedColor}</div>
            <div>{colorLock}</div>
            <div>{hoverColor}</div>
        </div>
        );
}