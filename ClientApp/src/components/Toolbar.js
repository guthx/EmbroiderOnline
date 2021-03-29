import React, { useEffect, useRef } from 'react'
import { useState } from 'react';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import panIcon from '@iconify-icons/grommet-icons/pan';
import { Icon } from '@iconify/react';
import eraserSolid from '@iconify-icons/clarity/eraser-solid';
import lockSolid from '@iconify-icons/clarity/lock-solid';
import settingsSolid from '@iconify-icons/clarity/settings-solid';
import colorPaletteSolid from '@iconify-icons/clarity/color-palette-solid';
import { CompactPicker } from 'react-color';
import { Tooltip } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import eyeSolid from '@iconify-icons/clarity/eye-solid';
import { cursorModes, colorModes } from '../Enums';

const tooltips = {
    pan: "Pan around the image",
    zoom: "Zoom in to a specified area",
    stitch: "Mark stitches as completed",
    erase: "Mark stitches as uncompleted",
    colorLock: "Select and lock a color, blocking the rest of colors from being editable",
    settings: "Change color mode settings",
    palette: "Check palette of colors used in your project",
    miniature: "Show a miniature of your project displaying which part you are currently editing",
}

export default function Toolbar({
    settingsRef,
    setSelectedColorRef,
    setHoverColorRef,
    setPrevCursorModeRef,
    colors,
    setStitchCountsRef,
    updateStitchCountsRef,
    renderer
}) {
    const [cursorMode, setCursorMode] = useState(cursorModes.PAN);
    const [selectedColor, setSelectedColor] = useState(null);
    setSelectedColorRef.current = setSelectedColor;
    const [hoverColor, setHoverColor] = useState(0);
    setHoverColorRef.current = setHoverColor;
    const [colorLock, setColorLock] = useState(false);
    const [colorMode, setColorMode] = useState(colorModes.TRANSPARENT_TO_OPAQUE);
    const [prevCursorMode, setPrevCursorMode] = useState(cursorModes.PAN);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [customColor, setCustomColor] = useState('#ffffff');
    const [stitchCounts, setStitchCounts] = useState([]);
    const [stitchCountMenu, setStitchCountMenu] = useState(false);
    const [miniatureOpen, setMiniatureOpen] = useState(false);
    const [miniaturePosition, setMiniaturePosition] = useState('top-left');
    setStitchCountsRef.current = setStitchCounts;
    const isInitialMount = useRef(3);
    useEffect(() => {
        settingsRef.current = {
            cursorMode: cursorMode,
            selectedColor: selectedColor,
            colorMode: colorMode,
            colorLock: colorLock,
            customColor: customColor,
            miniaturePos: miniaturePosition
        };
    }, [cursorMode, selectedColor, colorMode, colorLock, customColor, miniaturePosition]);
    
    useEffect(() => {
        if (isInitialMount.current)
            isInitialMount.current--;
        else
            switch (cursorMode) {
                case cursorModes.ZOOM:
                    renderer.enablePan(false);
                    renderer.zoomOut();
                    break;
                case cursorModes.PAN:
                    renderer.enablePan(true);
                    renderer.clearZoomRectangle();
                    break;
                default:
                    renderer.enablePan(false);
                    renderer.clearZoomRectangle();
                    break;
            }
    }, [cursorMode]);
    
    useEffect(() => {
        setCursorMode(prevCursorMode);
        if (selectedColor != null)
            setColorLock(true);
        else
            setColorLock(false);
    }, [selectedColor]);
    useEffect(() => {
        if (isInitialMount.current)
            isInitialMount.current--;
        else
            renderer.generateTextures(colorMode, colorLock, selectedColor, customColor);
    }, [colorLock, colorMode, customColor]);
    useEffect(() => {
        if (isInitialMount.current)
            isInitialMount.current--;
        else {
            if (miniatureOpen)
                renderer.openMiniature(true);
            else
                renderer.openMiniature(false);
        }   
    }, [miniatureOpen])

    function revertCursorMode() {
        setCursorMode(prevCursorMode);
    }
    setPrevCursorModeRef.current = revertCursorMode;

    function updateStitchCounts(changes) {
        let stitchCounts2 = [...stitchCounts];
        for (let i = 0; i < changes.length; i++) {
            if (changes[i]) {
                stitchCounts2[i].stitched += changes[i];
            }
        }
        setStitchCounts(stitchCounts2);
    }
    updateStitchCountsRef.current = updateStitchCounts;

    var toolbarColor;
    if (selectedColor)
        toolbarColor = colors[selectedColor];
    else
        toolbarColor = colors[hoverColor];

    function handlePanMode(e) {
        setCursorMode(cursorModes.PAN);
    }
    function handleZoomMode(e) {
        if (cursorMode != cursorModes.ZOOM) {
            setPrevCursorMode(cursorMode);
            setCursorMode(cursorModes.ZOOM);
        }
    }
    function handleStitchMode(e) {
        setCursorMode(cursorModes.STITCH);
    }
    function handleEraseMode(e) {
        setCursorMode(cursorModes.ERASE);
    }
    function handleColorLock(e) {
        if (cursorMode == cursorModes.SELECT) {
            setCursorMode(prevCursorMode);
        }
        else if (colorLock) {
            setSelectedColor(null);
        }
        else {
            setPrevCursorMode(cursorMode);
            setCursorMode(cursorModes.SELECT);
            setStitchCountMenu(true);
            setSettingsOpen(false);
        }
    }
    function handleSettingsOpen(e) {
        setSettingsOpen(!settingsOpen);
        setStitchCountMenu(false);
    }
    function handleColorModeTTO(e) {
        setColorMode(colorModes.TRANSPARENT_TO_OPAQUE);
    }
    function handleColorModeOTC(e) {
        setColorMode(colorModes.OPAQUE_TO_COLOR);
    }
    function handleColorChange(color) {
        setCustomColor(color.hex);
    }
    function handleStitchCountMenu(e) {
        setStitchCountMenu(!stitchCountMenu);
        setSettingsOpen(false);
    }
    function handleColorClick(color) {
        if (cursorMode == cursorModes.SELECT) {
            setSelectedColor(color);
            setStitchCountMenu(false);
        }
            
    }
    function handleMiniatureOpen(e) {
        setMiniatureOpen(!miniatureOpen);
    }
    function handleSetMiniaturePosition(pos) {
        renderer.setMiniaturePos(pos);
        setMiniaturePosition(pos);
    }

    const OptionTooltip = withStyles((theme) => ({
        tooltip: {
            backgroundColor: '#2e2e2e',
            color: 'white',
            borderRadius: '3px',
            fontSize: 14
        }
    }))(Tooltip);


    if (colors.length == 0)
        return null;

    return (
        <div className={'toolbar'}>
            <div className={'toolbar-group'}>
                <div className={'toolbar-item'}>
                    <OptionTooltip enterDelay={600} title={tooltips.pan} placement="right" className={'tool-tip'}>
                    <div
                        className={`icon ${cursorMode == cursorModes.PAN ? 'selected' : ''}`}
                        onClick={handlePanMode}
                    >
                        <Icon icon={panIcon} />
                        </div>
                    </OptionTooltip>
                </div>
                <div className={'toolbar-item'}>
                    <OptionTooltip enterDelay={600} title={tooltips.zoom} placement="right" className={'tool-tip'}>
                    <div
                        className={`icon ${cursorMode == cursorModes.ZOOM ? 'selected' : ''}`}
                        onClick={handleZoomMode}
                    >
                        <ZoomInIcon fontSize={'inherit'} />
                        </div>
                    </OptionTooltip>
                </div>
                <div className={'toolbar-item'}>
                    <OptionTooltip enterDelay={600} title={tooltips.stitch} placement="right" className={'tool-tip'}>
                    <div
                        className={`icon ${cursorMode == cursorModes.STITCH ? 'selected' : ''}`}
                        onClick={handleStitchMode} >
                        <svg viewBox="0 0 128 128" width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" class="iconify icon:noto:sewing-needle" preserveAspectRatio="xMidYMid meet">
                            <g>
                                <title>Layer 1</title>
                                <path id="svg_1" fill="#3f3f3f" d="m61.04,37.52c9.86,-3.61 20.05,-7.34 28.52,-8.86c1.23,-0.22 2.43,-0.4 3.59,-0.52c2.06,-2.28 4.96,-3.17 6.69,-5.08c-3.22,-0.11 -6.73,0.17 -10.51,0.85c-9,1.62 -19.45,5.44 -29.55,9.14c-16.18,5.92 -31.47,11.82 -40.71,7.94c-2.26,-0.95 -4.91,-2.18 -6.5,-6.7c-3.35,-9.56 9.36,-22.02 15.59,-23.97c17.61,-5.5 20.8,12.99 20.8,12.99s1,-0.47 0.81,-3.94c-0.37,-6.68 -4.42,-17.1 -20.63,-13.98c-9.7,1.86 -24.78,16.11 -21.31,29.67c1.2,4.69 3.71,8.08 7.47,10.06c10.24,5.39 27.48,-0.92 45.74,-7.6z" />
                                <path id="svg_2" fill="#000000" d="m121.04,6.12c-2.76,-2.61 -6.57,-3.26 -11.94,-0.15c-3.36,1.95 -7.25,5.49 -12.15,10.59c-8.18,8.5 -74.37,82.47 -91.08,101.78c-2.32,2.68 -2.37,4.29 -1.84,4.81c0.52,0.52 1.95,0.39 4.76,-1.95c19.24,-16.05 93.01,-81.21 102.33,-90.48c4.16,-4.14 7.68,-7.88 9.18,-9.68c5.13,-6.13 4.01,-11.82 0.74,-14.92zm-24.39,29.88c-1.41,1.41 -3.11,2.22 -4.31,1.02s-1.03,-3.34 0.38,-4.76l17.79,-17.79c1.41,-1.41 3.55,-1.58 4.76,-0.38c1.2,1.2 0.59,2.71 -0.82,4.12l-17.8,17.79z" />
                                <path id="svg_3" fill="#000000" opacity="0.6" d="m99.95,17.69c5.55,-5.91 9.51,-9.57 12.83,-11.06c6.17,-2.78 9.14,0.42 8.85,0.11c-2.64,-2.85 -6.28,-4.14 -12.09,-1c-3.45,1.86 -7.26,5.27 -12.6,10.83c-8.16,8.51 -74.62,82.69 -91.08,101.78c-2.31,2.68 -2.49,4.44 -1.66,4.88c16.75,-19.17 87.68,-96.95 95.75,-105.54z" />
                                <path id="svg_4" fill="#000000" d="m117.76,12.81c-2.57,-1.59 -4.91,-0.9 -7.36,1.53c0,0 0.19,-0.1 0.48,-0.19c1.4,-1.15 3.32,-1.24 4.44,-0.12c1.2,1.2 0.53,2.77 -0.88,4.18l-17.79,17.79c-1.41,1.41 -3.05,2.16 -4.25,0.96c-1.2,-1.2 -1.03,-3.34 0.38,-4.76l0.57,-0.57s-6.17,4.07 -2.18,8.17c2.11,2.16 5.88,0.96 7.39,-0.6l19,-19.52c1.51,-1.55 2.78,-5.27 0.2,-6.87z" />
                                <path id="svg_5" fill="url(#IconifyId-178360d7d6f-ebde49-144)" opacity="0.7" d="m100.61,32.15s2.49,0.02 3.34,1.08s0.39,3.84 0.59,3.64c0.2,-0.2 4.87,-4.58 6.15,-5.86c1.28,-1.28 -1.65,-4.66 -1.65,-4.66l-2.73,0l-5.7,5.8z" />
                                <path id="svg_6" fill="url(#IconifyId-178360d7d6f-ebde49-145)" opacity="0.7" d="m49.69,85.69l9.97,-8.74l-13.82,-3.76l-8.21,9.25c5.35,3.67 12.06,3.25 12.06,3.25z" />
                                <path id="svg_7" fill="#3f3f3f" d="m114.77,28.5c-5.15,-5.3 -13.17,-5.3 -13.17,-5.3l-4.69,4.69c7.01,-0.35 11.15,1.28 14.8,4.8c4.21,4.07 5.45,10.42 4.8,14.9c-3.5,24.26 -36.17,28.31 -36.5,28.35c-28.89,3.34 -44.59,-8.49 -53.06,-20.2c0,0 -0.97,6.48 5.24,12.11c8.06,7.3 19.48,13.63 38.39,13.63c3.4,0 7.02,-0.21 10.86,-0.65c13.04,-1.51 36.62,-8.92 39.95,-32.08c0.82,-5.6 -0.62,-14.08 -6.62,-20.25z" />
                            </g>
                        </svg>
                        </div>
                    </OptionTooltip>
                </div>
                <div className={'toolbar-item'}>
                    <OptionTooltip enterDelay={600} title={tooltips.erase} placement="right" className={'tool-tip'}>
                    <div
                        className={`icon ${cursorMode == cursorModes.ERASE ? 'selected' : ''}`}
                        onClick={handleEraseMode}>
                        <Icon icon={eraserSolid} />
                        </div>
                    </OptionTooltip>
                </div>
            </div>
            <div className={'toolbar-group'}>
                <div className={'toolbar-item'}>
                    <div
                        className={'icon'}
                        style={{
                            backgroundColor: `rgb(${toolbarColor.red}, ${toolbarColor.green}, ${toolbarColor.blue})`,
                            fontSize: '22px',
                            color: (0.299 * toolbarColor.red + 0.587 * toolbarColor.green + 0.114 * toolbarColor.blue) / 255 > 0.5 ? 'black' : 'white',
                            textAlign: 'center',
                            pointerEvents: 'none'
                        }}>
                        DMC<br />
                        {
                            toolbarColor.number
                        }
                    </div>
                </div>
                <div className={'toolbar-item'}>
                    <OptionTooltip enterDelay={600} title={tooltips.colorLock} placement="right" className={'tool-tip'}>
                    <div
                        className={`icon ${cursorMode == cursorModes.SELECT || colorLock ? 'selected' : ''}`}
                        onClick={handleColorLock}
                    >
                        <Icon icon={lockSolid} />
                        </div>
                    </OptionTooltip>
                </div>
            </div>
            <div className={'toolbar-group'}>
                <div className={'toolbar-item'}>
                    <OptionTooltip enterDelay={600} title={tooltips.settings} placement="right" className={'tool-tip'}>
                    <div
                        className={`icon ${settingsOpen ? 'selected' : ''}`}
                        onClick={handleSettingsOpen}
                    >
                        <Icon icon={settingsSolid} />
                        </div>
                    </OptionTooltip>
                    <div className={`settings ${settingsOpen ? '' : 'hidden'}`}>
                        <div className={'title'}>
                            Color mode
                        </div>
                        <div className="option">
                            <input
                                type="checkbox"
                                checked={colorMode == colorModes.TRANSPARENT_TO_OPAQUE}
                                onChange={handleColorModeTTO}
                            />
                            <div>
                                Transparent when not stitched, opaque when stitched
                            </div>
                        </div>
                        <div className="option">
                            <input
                                type="checkbox"
                                checked={colorMode == colorModes.OPAQUE_TO_COLOR}
                                onChange={handleColorModeOTC}
                            />
                            <div>
                                Opaque when not stitched, custom color when stitched
                            </div>
                        </div>
                        <div
                            className={`${colorMode == colorModes.OPAQUE_TO_COLOR ? '' : 'disabled'}`}
                        >
                            <CompactPicker
                                color={customColor}
                                onChangeComplete={handleColorChange}
                            />
                        </div>
                        <div className={'title'}>
                            Miniature position
                        </div>
                        <div className={'option'}>
                            <input
                                type="checkbox"
                                checked={miniaturePosition == 'top-left'}
                                onChange={() => handleSetMiniaturePosition('top-left')}
                            />
                            <div>
                                Top-left
                            </div>
                        </div>
                        <div className={'option'}>
                            <input
                                type="checkbox"
                                checked={miniaturePosition == 'top-right'}
                                onChange={() => handleSetMiniaturePosition('top-right')}
                            />
                            <div>
                                Top-right
                            </div>
                        </div>
                        <div className={'option'}>
                            <input
                                type="checkbox"
                                checked={miniaturePosition == 'bottom-left'}
                                onChange={() => handleSetMiniaturePosition('bottom-left')}
                            />
                            <div>
                                Bottom-left
                            </div>
                        </div>
                        <div className={'option'}>
                            <input
                                type="checkbox"
                                checked={miniaturePosition == 'bottom-right'}
                                onChange={() => handleSetMiniaturePosition('bottom-right')}
                            />
                            <div>
                                Bottom-right
                            </div>
                        </div>
                    </div>
                </div>
                <div className={'toolbar-item'}>
                    <OptionTooltip enterDelay={600} title={tooltips.palette} placement="right" className={'tool-tip'}>
                    <div
                        className={`icon ${stitchCountMenu ? 'selected' : ''}`}
                        onClick={handleStitchCountMenu}
                    >
                        <Icon icon={colorPaletteSolid} />
                        </div>
                    </OptionTooltip>
                    <div className={`stitch-count-menu ${stitchCountMenu ? '' : 'hidden'}`}>
                        {
                            stitchCounts.map((stitchCount, i) => {
                                if (stitchCount.total > 0)
                                    return (
                                        <div key={i} className={'stitch-count'}>
                                            <div>
                                                {i}:
                                    </div>
                                            <div>
                                                DMC {colors[i].number}
                                            </div>
                                            <div
                                                className={'color-preview'}
                                                style={{
                                                    backgroundColor: `rgb(${colors[i].red}, ${colors[i].green}, ${colors[i].blue})`,
                                                    cursor: `${cursorMode == cursorModes.SELECT ? 'pointer' : 'auto'}`
                                                }}
                                                onClick={() => handleColorClick(i)}
                                            >
                                            </div>
                                            <div style={{
                                                textAlign: 'center'
                                            }}>
                                                {stitchCount.stitched}
                                            </div>
                                            <div>
                                                /
                                    </div>
                                            <div style={{ textAlign: 'center' }}>
                                                {stitchCount.total}
                                            </div>
                                        </div>
                                    );
                                else
                                    return null;
                            })
                        }
                    </div>
                </div>
                <div className={'toolbar-item'}>
                    <OptionTooltip enterDelay={600} title={tooltips.miniature} placement="right" className={'tool-tip'}>
                        <div
                            className={`icon ${miniatureOpen ? 'selected' : ''}`}
                            onClick={handleMiniatureOpen}
                        >
                            <Icon icon={eyeSolid} />
                        </div>
                    </OptionTooltip>
                </div>
            </div>

        </div>
    );
}
