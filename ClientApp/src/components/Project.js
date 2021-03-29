import React, { useState, useRef } from 'react'
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { authService } from '../AuthService';
import './Project.css';
import Toolbar from './Toolbar';
import * as signalR from '@microsoft/signalr';
import Spinner from './Spinner';
import { Icon } from '@iconify/react';
import warningStandardSolid from '@iconify-icons/clarity/warning-standard-solid';
import { cursorModes, colorModes } from '../Enums';
import ProjectRenderer from '../ProjectRenderer';

const STITCH_SIZE = 122;
const LINE_WIDTH = 6;

export default function Project() {
    const settings = useRef({
        cursorMode: cursorModes.PAN,
        selectedColor: null,
        colorLock: false,
        colorMode: colorModes.TRANSPARENT_TO_OPAQUE,
        customColor: '#ffffff',
        miniaturePos: 'top-left',
    });
    const { id } = useParams();
    const [stitches, setStitches] = useState([]);
    const [hubConnection, setHubConnection] = useState(null);
    const [colors, setColors] = useState([]);
    const [reconnecting, setReconnecting] = useState(false);
    const [disconnected, setDisconnected] = useState(false);
    const [renderer, setRenderer] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [projectAlreadyOpen, setProjectAlreadyOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(authService.currentUserValue());
    useEffect(() => {
        let sub = authService.currentUser.subscribe(u => {
            setCurrentUser(u);
        });

        return () => sub.unsubscribe();
    }, [])

    const setSelectedColor = useRef();
    const setHoverColor = useRef();
    const setPrevCursorMode = useRef();
    const setStitchCounts = useRef();
    const updateStitchCounts = useRef();

    const guideHorizontal = useRef();
    const guideVertical = useRef();

    let stitchArray = stitches;
    let mousePressed = -1;
    let selectedStitches = [];

    useEffect(() => {
        if (currentUser) {
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
            hub.on('projectAlreadyOpen', () => {
                setProjectAlreadyOpen(true);
            });
            hub.onreconnecting(() => {
                setReconnecting(true);
            });
            hub.onreconnected(() => {
                hub.invoke('GetProject', id);
            });
            /*
            hub.onclose(() => {
                    setReconnecting(false);
                    setDisconnected(true);
            });
            */
            hub.start()
                .then(() => {
                    setHubConnection(hub);
                });

            return () => {
                mousePressed = null;
                selectedStitches = null;
                hub.stop();
            }
        }
        else
            setLoaded(true);
        

    }, []);

    useEffect(() => {
        if (projectAlreadyOpen || !currentUser && hubConnection)
            hubConnection.stop();
        else if (currentUser && loaded)
            window.location.reload();
    }, [projectAlreadyOpen, currentUser])

    useEffect(() => {
        if (hubConnection) {
            hubConnection.invoke('GetProject', id);
        }
    }, [hubConnection]);

    useEffect(() => {
        if (stitches.length > 0 && colors.length > 0) {
            let wrapper = document.getElementById('canvas-wrapper');
            let canvas = document.getElementById('canvas');
            let renderer = new ProjectRenderer(stitches, colors, wrapper.clientWidth, wrapper.clientHeight, canvas, STITCH_SIZE, LINE_WIDTH, settings.current);
            setRenderer(renderer);
            
            setGuideStyles();
            setLoaded(true);
            setReconnecting(false);

            return () => {
                if (renderer) {
                    renderer.dispose();
                }
            }
        }
    }, [colors]);

    useEffect(() => {
        if (loaded && currentUser) {
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
            renderer.on('pointerdown', mouseDown);
            renderer.on('pointerup', mouseUp);
            renderer.on('moved', e => {
                if (e.type == 'drag') {
                    guideHorizontal.current.style.transform = `translate(${e.viewport.lastViewport.x}px, 0)`;
                    guideVertical.current.style.transform = `translate(0, ${e.viewport.lastViewport.y}px)`;
                }
            });
            renderer.on('zoomed-end', e => {
                document.documentElement.style.setProperty('--number-size', `${STITCH_SIZE * 10 * e.lastViewport.scaleX}px`);
                guideHorizontal.current.style.transform = `translate(${e.lastViewport.x}px, 0)`;
                guideVertical.current.style.transform = `translate(0, ${e.lastViewport.y}px)`;
                guideHorizontal.current.style.left = `-${STITCH_SIZE * 5 * e.lastViewport.scaleX}px`;
                guideVertical.current.style.top = `-${STITCH_SIZE * 5 * e.lastViewport.scaleX}px`;
            });
            renderer.on('mousemove', mouseMove);
            setGuideStyles();
        }
            
    }, [loaded]);

    

    function mouseDown(e) {
        mousePressed = e.data.button;
        if (mousePressed == 0) {
            var x = ~~(e.pos.x / STITCH_SIZE);
            var y = ~~(e.pos.y / STITCH_SIZE);
            if (x < stitches[0].length && y < stitches.length && x >= 0 && y >= 0)
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
                        renderer.zoomIn(e.pos);
                        setPrevCursorMode.current();
                        break;
                }

        }
        
    }

    const mouseMove = (e) => {
        var x = ~~(e.pos.x / STITCH_SIZE);
        var y = ~~(e.pos.y / STITCH_SIZE);
        if (x < stitches[0].length && y < stitches.length && x >= 0 && y >= 0) {
            if (mousePressed == 0) {

                switch (settings.current.cursorMode) {
                    case cursorModes.STITCH:
                        completeStitch(x, y);
                        break;
                    case cursorModes.ERASE:
                        eraseStitch(x, y);
                        break;
                }
            }
            if (mousePressed == -1) {
                if (settings.current.cursorMode == cursorModes.ZOOM) {
                    renderer.setZoomRectanglePos(e.pos);
                }
                else {
                    setHoverColor.current(stitchArray[y][x].colorIndex);
                }
            }
        }
        
        
        
    }

    const setGuideStyles = () => {
        document.documentElement.style.setProperty('--number-size', `${STITCH_SIZE * 10}px`);
        guideHorizontal.current.style.left = `-${STITCH_SIZE * 5}px`;
        guideVertical.current.style.top = `-${STITCH_SIZE * 5}px`;
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
        if (!stitches[y][x].stitched &&
            (settings.current.colorLock == false || settings.current.selectedColor == stitches[y][x].colorIndex)
        ) {
            selectedStitches.push({ x: x, y: y });
            stitches[y][x].stitched = true;
            renderer.drawStitch(x, y);
        }
    }

    const eraseStitch = (x, y) => {
        if (stitches[y][x].stitched &&
            (settings.current.colorLock == false || settings.current.selectedColor == stitches[y][x].colorIndex)
        ) {
            selectedStitches.push({ x: x, y: y });
            stitches[y][x].stitched = false;
            renderer.drawStitch(x, y);
        }
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
    if (projectAlreadyOpen) {
        return (
            <div className={'warning-screen'}>
                <Icon icon={warningStandardSolid} />
                You already have a project open in another tab or browser<br />
                Close that tab and reload the page to open your project
            </div>
        )
    } else if (!currentUser) {
        return (
            <div className={'warning-screen'}>
                <Icon icon={warningStandardSolid} />
                You need to be logged in to access your projects
            </div>
        );
    }

    return (
        <>
            <div
                className={'loading-screen'}
                style={{display: `${loaded ? 'none' : 'flex'}`}}
            >
                <div className={'title'}>
                    Loading project
                </div>
                <Spinner />
            </div>
            <div
                className={`disconnect-bg ${reconnecting || disconnected ? 'active' : ''}`}
            >
                {
                    reconnecting ?
                        <div className={'title'}>
                            Disconnected from server<br/>
                            Attempting to reconnect<br/>
                            <Spinner />
                        </div>
                        :
                        <div className={'title'}>
                            Disconnected from server<br />
                            Reload the page to reconnect
                        </div>
                }
            </div>
            <div className={'project-editor'} style={{ visibility: `${loaded ? 'visible' : 'hidden'}` }}>
                {
                    renderer != null ? 
                        <Toolbar
                            settingsRef={settings}
                            setSelectedColorRef={setSelectedColor}
                            setHoverColorRef={setHoverColor}
                            setPrevCursorModeRef={setPrevCursorMode}
                            colors={colors}
                            setStitchCountsRef={setStitchCounts}
                            updateStitchCountsRef={updateStitchCounts}
                            renderer={renderer}
                        />
                        :
                        null
                }
                <div className={'project-wrapper'}
                    style={{ pointerEvents: `${loaded ? 'all' : 'none'}` }}
                >
                    <GuideHorizontal />
                    <GuideVertical />
                    <div style={{
                        backgroundColor: 'white',
                        zIndex: '9'
                    }}>
                    </div>
                    <div id={'canvas-wrapper'}>
                        <canvas width='1000' height='800' id={'canvas'} />
                    </div>
                </div>
            </div>
        </>
    );
}