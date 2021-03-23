import React, { useState, useRef } from 'react'
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { authService } from '../AuthService';
import './Project.css';
import StitchCanvas from './StitchCanvas';
import Toolbar from './Test';
import * as signalR from '@microsoft/signalr';
import { Color } from 'p5';
import Spinner from './Spinner';
import { Icon, InlineIcon } from '@iconify/react';
import warningStandardSolid from '@iconify-icons/clarity/warning-standard-solid';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import * as Cull from 'pixi-cull';
import { BitmapFont, Geometry, GraphicsGeometry } from 'pixi.js';

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

const STITCH_SIZE = 122;
const LINE_WIDTH = 6;
const defaultScale = 64 / (STITCH_SIZE + LINE_WIDTH);

export default function Project() {
    const settings = useRef({
        cursorMode: cursorModes.PAN,
        selectedColor: null,
        colorLock: false,
        colorMode: colorModes.OPAQUE_TO_COLOR,
        customColor: 'ffffff',
        miniaturePos: 'top-left',
    });
    const { id } = useParams();
    const [stitches, setStitches] = useState([]);
    const [hubConnection, setHubConnection] = useState(null);
    const [colors, setColors] = useState([]);
    const [reconnecting, setReconnecting] = useState(false);
    const [disconnected, setDisconnected] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [projectAlreadyOpen, setProjectAlreadyOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(authService.currentUserValue());
    useEffect(() => {
        authService.currentUser.subscribe(u => {
            setCurrentUser(u);
        });
    }, [])

    const spritesRef = useRef();
    const spritesheet = useRef();
    const stitchedTextures = useRef();
    const unstitchedTextures = useRef();
    const zoomRectangle = useRef();
    const app = useRef();
    const viewport = useRef();
    const miniature = useRef();
    const miniatureRect = useRef();

    const setSelectedColor = useRef();
    const setHoverColor = useRef();
    const setPrevCursorMode = useRef();
    const setStitchCounts = useRef();
    const updateStitchCounts = useRef();
    const linesX = useRef();
    const linesY = useRef();

    const guideHorizontal = useRef();
    const guideVertical = useRef();

    let stitchArray = stitches;
    let mousePressed = -1;
    let selectedStitches = [];
    let scale = 1.0;
    let posX = 0;
    let posY = 0;
    let prevBounds;

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
                scale = null;
                posX = null;
                posY = null;
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
            app.current = new PIXI.Application({
                width: wrapper.clientWidth,
                height: wrapper.clientHeight,
                view: document.getElementById('canvas')
            });
            viewport.current = new Viewport({
                worldWidth: stitches[0].length * STITCH_SIZE + LINE_WIDTH,
                worldHeight: stitches.length * STITCH_SIZE + LINE_WIDTH,
                screenWidth: wrapper.clientWidth,
                screenHeight: wrapper.clientHeight,
                disableOnContextMenu: true,
                interaction: app.current.renderer.plugins.interaction,
            });
            app.current.stage.addChild(viewport.current);
            app.current.renderer.plugins.interaction.moveWhenInside = true;
            //viewport.current.drag().wheel();
            let background = viewport.current.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
            background.width = stitches[0].length * STITCH_SIZE;
            background.height = stitches.length * STITCH_SIZE;

            generateTextures();
            spritesRef.current = new Array(stitches.length);
            let i = 0;
            for (let y = 0; y < stitches.length; y++) {

                spritesRef.current[y] = new Array(stitches[0].length)
                for (let x = 0; x < stitches[0].length; x++) {
                    if (stitches[y][x].stitched) {
                        spritesRef.current[y][x] = viewport.current.addChild(new PIXI.Sprite(stitchedTextures.current[stitches[y][x].colorIndex]));
                    }
                    else {
                        spritesRef.current[y][x] = viewport.current.addChild(new PIXI.Sprite(unstitchedTextures.current[stitches[y][x].colorIndex]));
                    }
                    spritesRef.current[y][x].width = spritesRef.current[y][x].height = STITCH_SIZE + LINE_WIDTH;
                    spritesRef.current[y][x].position.set(x * STITCH_SIZE, y * STITCH_SIZE);
                    spritesRef.current[y][x].visible = false;
                    i++;
                }
            }
            linesY.current = [];
            linesX.current = [];
            i = 0;
            for (let y = 10; y < stitches.length; y += 10) {
                linesY.current [i] = viewport.current.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
                linesY.current [i].tint = 0x000000;
                linesY.current [i].width = stitches[0].length * STITCH_SIZE;
                linesY.current[i].height = LINE_WIDTH * 2;
                linesY.current[i].position.set(0, y * STITCH_SIZE - LINE_WIDTH);
                linesY.current[i].visible = false;
                i++;
            }
            i = 0;
            for (let x = 10; x < stitches[0].length; x += 10) {
                linesX.current [i] = viewport.current.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
                linesX.current [i].tint = 0x000000;
                linesX.current[i].height = stitches.length * STITCH_SIZE;
                linesX.current[i].width = LINE_WIDTH * 2;
                linesX.current[i].position.set(x * STITCH_SIZE - LINE_WIDTH, 0);
                linesX.current[i].visible = false;
                i++;
            }
            let scale = viewport.current.findFit(viewport.current.worldWidth, viewport.current.worldHeight);
            viewport.current.clampZoom({
                minScale: scale,
                maxScale: 1
            });
            viewport.current.setZoom(defaultScale);
            zoomRectangle.current = viewport.current.addChild(new PIXI.Graphics());
            zoomRectangle.current.lineStyle(10, 0x000000);
            zoomRectangle.current.drawRect(0, 0, scale * viewport.current.worldWidth / defaultScale, scale * viewport.current.worldHeight / defaultScale);
            zoomRectangle.current.renderable = false;

            let miniatureCanvas = document.createElement('canvas');
            let miniatuteCtx = miniatureCanvas.getContext('2d');
            let minData = miniatuteCtx.createImageData(stitches[0].length, stitches.length);
            i = 0;
            for (let y = 0; y < stitches.length; y++)
                for (let x = 0; x < stitches[0].length; x++) {
                    let color = colors[stitches[y][x].colorIndex];
                    minData.data[i + 0] = color.red;
                    minData.data[i + 1] = color.green;
                    minData.data[i + 2] = color.blue;
                    minData.data[i + 3] = 255;
                    i += 4;
                }
            miniatureCanvas.width = stitches[0].length;
            miniatureCanvas.height = stitches.length;
            miniatuteCtx.putImageData(minData, 0, 0);
            let miniatureTexture = new PIXI.Texture.from(miniatureCanvas, { width: stitches[0].length, height: stitches.length });
            miniature.current = viewport.current.addChild(new PIXI.Sprite(miniatureTexture));
            miniature.current.width = stitches[0].length;
            miniature.current.height = stitches.length;
            miniature.current.position.set(0, 0);
            
            minData = null
            miniatureCanvas = null;
            app.current.stage.addChild(miniature.current);

            miniatureRect.current = miniature.current.addChild(new PIXI.Graphics());
            miniatureRect.current.lineStyle(2);
            miniatureRect.current.drawRect(0, 0, (viewport.current.screenWidth / viewport.current.worldWidth) * stitches[0].length,
                (viewport.current.screenHeight / viewport.current.worldHeight) * stitches.length);

            miniature.current.renderable = false;

            prevBounds = initalBounds(viewport.current.getVisibleBounds());
            PIXI.Ticker.shared.add(() => {
                if (viewport.current.dirty) {
                    let start = performance.now();
                    cull(viewport.current.getVisibleBounds());
                    viewport.current.dirty = false;
                    console.log(performance.now() - start);
                }
            });
            
            viewport.current.drag({
                mouseButtons: 'right-left',
            });
            viewport.current.clamp({
                top: true,
                bottom: true,
                left: true,
                right: true
            });
            viewport.current.wheel();

            
            
            //app.current.stage.interactive = true;
            //app.current.stage.on('mousemove', mouseMove);

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
            setGuideStyles();
            setStitchCounts.current(initialStitchCounts);

            window.addEventListener('resize', handleResize);

            setLoaded(true);
            setReconnecting(false);

            return () => {
                if (stitchedTextures.current) {
                    for (let i = 0; i < stitchedTextures.current.length; i++) {
                        stitchedTextures.current[i].destroy();
                        stitchedTextures.current[i] = null;
                    }
                    for (let y = 0; y < spritesRef.current.length; y++)
                        for (let x = 0; x < spritesRef.current[0].length; x++) {
                            spritesRef.current[y][x].destroy();
                            spritesRef.current[y][x] = null;
                        }
                    for (let i = 0; i < linesX.current .length; i++) {
                        linesX.current [i].destroy(true);
                        linesX.current [i] = null;
                    }
                    for (let i = 0; i < linesY.current .length; i++) {
                        linesY.current [i].destroy(true);
                        linesY.current [i] = null;
                    }
                    spritesheet.current.destroy(true);
                    miniatureTexture.destroy();
                    miniatureTexture = null;
                    miniatureRect.current.destroy();
                    miniatureRect.current = null;
                    miniature.current.destroy();
                    miniature.current = null;
                    for (let key in PIXI.utils.TextureCache) {
                        PIXI.utils.TextureCache[key].destroy(true);
                    }
                    background.destroy(true);
                    background = null;
                    viewport.current.destroy();
                    app.current.renderer.gl.getExtension('WEBGL_lose_context').loseContext();
                    app.current.destroy();
                    window.removeEventListener('resize', handleResize);


                }
            }
        }


    }, [colors]);

    useEffect(() => {
        if (loaded && currentUser) {
            viewport.current.setZoom(defaultScale);
            scale = defaultScale;
            viewport.current.on('mousedown', (e) => mouseDown(e));
            viewport.current.on('mouseup', e => mouseUp(e));
            viewport.current.on('moved', e => {
                if (e.type == 'drag') {
                    guideHorizontal.current.style.transform = `translate(${e.viewport.lastViewport.x}px, 0)`;
                    guideVertical.current.style.transform = `translate(0, ${e.viewport.lastViewport.y}px)`;
                    miniatureRect.current.position.set(
                        (-e.viewport.lastViewport.x / scale / viewport.current.worldWidth) * miniature.current.width,
                        (-e.viewport.lastViewport.y / scale / viewport.current.worldHeight) * miniature.current.height
                    );
                }
            });
            viewport.current.on('zoomed-end', e => {
                scale = e.lastViewport.scaleX;
                document.documentElement.style.setProperty('--number-size', `${STITCH_SIZE * 10 * e.lastViewport.scaleX}px`);
                guideHorizontal.current.style.transform = `translate(${e.lastViewport.x}px, 0)`;
                guideVertical.current.style.transform = `translate(0, ${e.lastViewport.y}px)`;
                guideHorizontal.current.style.left = `-${STITCH_SIZE * 5 * e.lastViewport.scaleX}px`;
                guideVertical.current.style.top = `-${STITCH_SIZE * 5 * e.lastViewport.scaleX}px`;
                
                let width = ((viewport.current.screenWidth / viewport.current.worldWidth) * stitches[0].length) / scale;
                let height = ((viewport.current.screenHeight / viewport.current.worldHeight) * stitches.length) / scale;
                miniatureRect.current.clear();
                miniatureRect.current.lineStyle(2);
                miniatureRect.current.drawRect(0, 0, width, height);
                miniatureRect.current.position.set(
                    (-e.lastViewport.x / scale / viewport.current.worldWidth) * miniature.current.width,
                    (-e.lastViewport.y / scale / viewport.current.worldHeight) * miniature.current.height
                );
            });
            viewport.current.on('mousemove', mouseMove);
            viewport.current.interactive = true;
            setGuideStyles();
        }
            
    }, [loaded]);

    function cull(bounds) {
        let x1 = ~~(bounds.x / STITCH_SIZE);
        let x2 = x1 + ~~(bounds.width / STITCH_SIZE) + 2;
        let y1 = ~~(bounds.y / STITCH_SIZE);
        let y2 = y1 + ~~(bounds.height / STITCH_SIZE) + 2;
        if (x1 < 0)
            x1 = 0;
        if (y1 < 0)
            y1 = 0;
        if (x2 > stitches[0].length)
            x2 = stitches[0].length;
        if (y2 > stitches.length)
            y2 = stitches.length;

        for (let x = prevBounds.x1; x < prevBounds.x2; x++)
            for (let y = prevBounds.y1; y < prevBounds.y2; y++)
                spritesRef.current[y][x].visible = false;
        for (let x = prevBounds.x1 - prevBounds.x1 % 10; x < prevBounds.x2 - 10; x += 10) {
            linesX.current[x / 10].visible = false;
        }
        for (let y = prevBounds.y1 - prevBounds.y1 % 10; y < prevBounds.y2 - 10; y += 10) {
            linesY.current[y / 10].visible = false;
        }

        for (let x = x1; x < x2; x++)
            for (let y = y1; y < y2; y++)
                spritesRef.current[y][x].visible = true;
        for (let x = x1 - x1 % 10; x < x2 - 10; x += 10) {
            linesX.current[x / 10].visible = true;
        }
        for (let y = y1 - y1 % 10; y < y2 - 10; y += 10) {
            linesY.current[y / 10].visible = true;
        }
        prevBounds = { x1, x2, y1, y2 };
    }

    function initalBounds(bounds) {
        let x1 = ~~(bounds.x / STITCH_SIZE);
        let x2 = x1 + ~~(bounds.width / STITCH_SIZE) + 2;
        let y1 = ~~(bounds.y / STITCH_SIZE);
        let y2 = y1 + ~~(bounds.height / STITCH_SIZE) + 2;
        if (x1 < 0)
            x1 = 0;
        if (y1 < 0)
            y1 = 0;
        if (x2 > stitches[0].length)
            x2 = stitches[0].length;
        if (y2 > stitches.length)
            y2 = stitches.length;
        return { x1, x2, y1, y2 };
    }

    function handleResize(e) {
        let wrapper = document.getElementById('canvas-wrapper');
        app.current.renderer.resize(wrapper.clientWidth, wrapper.clientHeight);
        app.current.view.width = wrapper.clientWidth;
        app.current.view.height = wrapper.clientHeight;
        viewport.current.resize(wrapper.clientWidth, wrapper.clientHeight);
        let minScale = viewport.current.findFit(viewport.current.worldWidth, viewport.current.worldHeight);
        viewport.current.clampZoom({
            minScale: minScale,
            maxScale: 1
        });
        scale = viewport.current.lastViewport.scaleX;
        let width = ((viewport.current.screenWidth / viewport.current.worldWidth) * stitches[0].length) / scale;
        let height = ((viewport.current.screenHeight / viewport.current.worldHeight) * stitches.length) / scale;
        miniatureRect.current.clear();
        miniatureRect.current.lineStyle(2);
        miniatureRect.current.drawRect(0, 0, width, height);
        miniatureRect.current.position.set(
            (-viewport.current.lastViewport.x / scale / viewport.current.worldWidth) * miniature.current.width,
            (-viewport.current.lastViewport.y / scale / viewport.current.worldHeight) * miniature.current.height
        );
        setMiniaturePos(settings.current.miniaturePos);
    }

    function setMiniaturePos(position) {
        switch (position) {
            case 'top-left':
                miniature.current.position.set(0, 0);
                break;
            case 'top-right':
                miniature.current.position.set(app.current.view.width - miniature.current.width, 0);
                break;
            case 'bottom-left':
                miniature.current.position.set(0, app.current.view.height - miniature.current.height);
                break;
            case 'bottom-right':
                miniature.current.position.set(app.current.view.width - miniature.current.width, app.current.view.height - miniature.current.height);
                break;
            default:
                miniature.current.position.set(0, 0);
                break;
        }
    }

    function enablePan(enable) {
        if (enable)
            viewport.current.drag({
                mouseButtons: 'right-left',
            });
        else 
            viewport.current.drag({
                mouseButtons: 'right',
            });
    }

    function generateTextures() {
        if (!spritesheet.current) {
            let lineCount = Math.ceil((colors.length * 2 * (STITCH_SIZE + LINE_WIDTH)) / 2048);
            spritesheet.current = new PIXI.RenderTexture.create({ width: 2048, height: (STITCH_SIZE + LINE_WIDTH) * lineCount });
            stitchedTextures.current = new Array(colors.length);
            unstitchedTextures.current = new Array(colors.length);
        }
        let clearSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        clearSprite.width = spritesheet.current.width;
        clearSprite.height = spritesheet.current.height;
        clearSprite.alpha = 0;
        app.current.renderer.render(clearSprite, spritesheet.current, true);
        clearSprite.destroy();
        clearSprite = null;
        if (settings.current.colorMode == colorModes.TRANSPARENT_TO_OPAQUE) {
            if (settings.current.colorLock) {
                for (let i = 0; i < colors.length; i++) {
                    if (settings.current.selectedColor == i) {
                        let color = colors[i];
                        let colorHex = (color.red << 16) + (color.green << 8) + color.blue;
                        const rect = new PIXI.Graphics();

                        rect.lineStyle({ width: LINE_WIDTH, color: 0x000000, alignment: 1 });
                        rect.beginFill(colorHex);
                        rect.drawRect(LINE_WIDTH, LINE_WIDTH, STITCH_SIZE - LINE_WIDTH, STITCH_SIZE - LINE_WIDTH);
                        rect.endFill();
                        const text = new PIXI.Text(i.toString(), {
                            fontFamily: 'Arial',
                            fontSize: STITCH_SIZE / 2,
                            fill: 0x000000,
                        });
                        text.anchor.set(0.5);
                        text.x = (STITCH_SIZE + LINE_WIDTH) / 2;
                        text.y = (STITCH_SIZE + LINE_WIDTH) / 2;
                        rect.addChild(text);
                        text.updateText();
                        let line = ~~(i * (STITCH_SIZE + LINE_WIDTH) / 2048);
                        let row = i % (~~(2048 / STITCH_SIZE));
                        rect.position.set(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH));
                        app.current.renderer.render(rect, spritesheet.current, false);
                        stitchedTextures.current[i] = new PIXI.Texture(spritesheet.current,
                            new PIXI.Rectangle(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH)));

                        rect.clear();
                        rect.lineStyle({ width: LINE_WIDTH, color: 0x000000, alignment: 1 });
                        rect.beginFill(colorHex, 0.4);
                        rect.drawRect(LINE_WIDTH, LINE_WIDTH, STITCH_SIZE - LINE_WIDTH, STITCH_SIZE - LINE_WIDTH);
                        rect.endFill();
                        text.alpha = 0.4;
                        text.updateText();
                        line = ~~((i + colors.length) * (STITCH_SIZE + LINE_WIDTH) / 2048);
                        row = (i + colors.length) % (~~(2048 / STITCH_SIZE));
                        rect.position.set(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH));
                        app.current.renderer.render(rect, spritesheet.current, false);
                        unstitchedTextures.current[i] = new PIXI.Texture(spritesheet.current,
                            new PIXI.Rectangle(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH)));
                        rect.destroy(true);
                    }
                    else {
                        let color = colors[i];
                        let colorHex = (color.red << 16) + (color.green << 8) + color.blue;
                        const rect = new PIXI.Graphics();

                        rect.lineStyle({ width: LINE_WIDTH, color: 0x000000, alpha: 0.2, alignment: 1 });
                        rect.beginFill(colorHex, 0.2);
                        rect.drawRect(LINE_WIDTH, LINE_WIDTH, STITCH_SIZE - LINE_WIDTH, STITCH_SIZE - LINE_WIDTH);
                        rect.endFill();
                        let line = ~~(i * (STITCH_SIZE + LINE_WIDTH) / 2048);
                        let row = i % (~~(2048 / STITCH_SIZE));
                        rect.position.set(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH));
                        app.current.renderer.render(rect, spritesheet.current, false);
                        stitchedTextures.current[i] = new PIXI.Texture(spritesheet.current,
                            new PIXI.Rectangle(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH)));

                        line = ~~((i + colors.length) * (STITCH_SIZE + LINE_WIDTH) / 2048);
                        row = (i + colors.length) % (~~(2048 / STITCH_SIZE));
                        rect.position.set(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH));
                        app.current.renderer.render(rect, spritesheet.current, false);
                        unstitchedTextures.current[i] = new PIXI.Texture(spritesheet.current,
                            new PIXI.Rectangle(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH)));
                       
                        rect.destroy(true);
                    }
                    
                }
            }
            else {
                for (let i = 0; i < colors.length; i++) {
                    let color = colors[i];
                    let colorHex = (color.red << 16) + (color.green << 8) + color.blue;
                    const rect = new PIXI.Graphics();

                    rect.lineStyle({ width: LINE_WIDTH, color: 0x000000, alignment: 1 });
                    rect.beginFill(colorHex);
                    rect.drawRect(LINE_WIDTH, LINE_WIDTH, STITCH_SIZE - LINE_WIDTH, STITCH_SIZE - LINE_WIDTH);
                    rect.endFill();
                    const text = new PIXI.Text(i.toString(), {
                        fontFamily: 'Arial',
                        fontSize: STITCH_SIZE / 2,
                        fill: 0x000000,
                    });
                    text.anchor.set(0.5);
                    text.x = (STITCH_SIZE + LINE_WIDTH) / 2;
                    text.y = (STITCH_SIZE + LINE_WIDTH) / 2;
                    rect.addChild(text);
                    text.updateText();
                    let line = ~~(i * (STITCH_SIZE + LINE_WIDTH) / 2048);
                    let row = i % (~~(2048 / STITCH_SIZE));
                    rect.position.set(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH));
                    app.current.renderer.render(rect, spritesheet.current, false);
                    stitchedTextures.current[i] = new PIXI.Texture(spritesheet.current,
                        new PIXI.Rectangle(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH)));

                    rect.clear();
                    rect.lineStyle({ width: LINE_WIDTH, color: 0x000000, alignment: 1 });
                    rect.beginFill(colorHex, 0.4);
                    rect.drawRect(LINE_WIDTH, LINE_WIDTH, STITCH_SIZE - LINE_WIDTH, STITCH_SIZE - LINE_WIDTH);
                    rect.endFill();
                    text.alpha = 0.4;
                    text.updateText();

                    line = ~~((i + colors.length) * (STITCH_SIZE + LINE_WIDTH) / 2048);
                    row = (i + colors.length) % (~~(2048 / STITCH_SIZE));
                    rect.position.set(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH));
                    app.current.renderer.render(rect, spritesheet.current, false);
                    unstitchedTextures.current[i] = new PIXI.Texture(spritesheet.current,
                        new PIXI.Rectangle(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH)));

                    rect.destroy(true);
                }
            }
        }
        else if (settings.current.colorMode == colorModes.OPAQUE_TO_COLOR) {
            
            if (settings.current.colorLock) {
                for (let i = 0; i < colors.length; i++) {
                    if (settings.current.selectedColor == i) {
                        let color = colors[i];
                        let colorHex = (color.red << 16) + (color.green << 8) + color.blue;
                        const rect = new PIXI.Graphics();

                        rect.lineStyle({ width: LINE_WIDTH, color: 0x000000, alignment: 1 });
                        rect.beginFill(parseInt(`0x${settings.current.customColor.slice(1, 7)}`, 16));
                        rect.drawRect(LINE_WIDTH, LINE_WIDTH, STITCH_SIZE - LINE_WIDTH, STITCH_SIZE - LINE_WIDTH);
                        rect.endFill();
                        const text = new PIXI.Text(i.toString(), {
                            fontFamily: 'Arial',
                            fontSize: STITCH_SIZE / 2,
                            fill: 0x000000,
                        });
                        text.anchor.set(0.5);
                        text.x = (STITCH_SIZE + LINE_WIDTH) / 2;
                        text.y = (STITCH_SIZE + LINE_WIDTH) / 2;
                        rect.addChild(text);
                        text.updateText();
                        let line = ~~(i * (STITCH_SIZE + LINE_WIDTH) / 2048);
                        let row = i % (~~(2048 / STITCH_SIZE));
                        rect.position.set(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH));
                        app.current.renderer.render(rect, spritesheet.current, false);
                        stitchedTextures.current[i] = new PIXI.Texture(spritesheet.current,
                            new PIXI.Rectangle(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH)));

                        rect.clear();
                        rect.lineStyle({ width: LINE_WIDTH, color: 0x000000, alignment: 1 });
                        rect.beginFill(colorHex);
                        rect.drawRect(LINE_WIDTH, LINE_WIDTH, STITCH_SIZE - LINE_WIDTH, STITCH_SIZE - LINE_WIDTH);
                        rect.endFill();
                        text.alpha = 0.4;
                        text.updateText();
                        line = ~~((i + colors.length) * (STITCH_SIZE + LINE_WIDTH) / 2048);
                        row = (i + colors.length) % (~~(2048 / STITCH_SIZE));
                        rect.position.set(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH));
                        app.current.renderer.render(rect, spritesheet.current, false);
                        unstitchedTextures.current[i] = new PIXI.Texture(spritesheet.current,
                            new PIXI.Rectangle(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH)));

                        rect.destroy(true);
                    }
                    else {
                        let color = colors[i];
                        let colorHex = (color.red << 16) + (color.green << 8) + color.blue;
                        const rect = new PIXI.Graphics();

                        rect.lineStyle({ width: LINE_WIDTH, color: 0x000000, alpha: 0.2, alignment: 1 });
                        rect.beginFill(colorHex, 0.2);
                        rect.drawRect(LINE_WIDTH, LINE_WIDTH, STITCH_SIZE - LINE_WIDTH, STITCH_SIZE - LINE_WIDTH);
                        rect.endFill();
                        let line = ~~(i * (STITCH_SIZE + LINE_WIDTH) / 2048);
                        let row = i % (~~(2048 / STITCH_SIZE));
                        rect.position.set(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH));
                        app.current.renderer.render(rect, spritesheet.current, false);
                        stitchedTextures.current[i] = new PIXI.Texture(spritesheet.current,
                            new PIXI.Rectangle(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH)));
                        line = ~~((i + colors.length) * (STITCH_SIZE + LINE_WIDTH) / 2048);
                        row = (i + colors.length) % (~~(2048 / STITCH_SIZE));
                        rect.position.set(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH));
                        app.current.renderer.render(rect, spritesheet.current, false);
                        unstitchedTextures.current[i] = new PIXI.Texture(spritesheet.current,
                            new PIXI.Rectangle(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH)))

                        rect.destroy(true);
                    }
                    
                }
            }
            else {
                for (let i = 0; i < colors.length; i++) {
                    let color = colors[i];
                    let colorHex = (color.red << 16) + (color.green << 8) + color.blue;
                    const rect = new PIXI.Graphics();

                    rect.lineStyle({ width: LINE_WIDTH, color: 0x000000, alignment: 1 });
                    rect.beginFill(parseInt(`0x${settings.current.customColor.slice(1, 7)}`, 16));
                    rect.drawRect(LINE_WIDTH, LINE_WIDTH, STITCH_SIZE - LINE_WIDTH, STITCH_SIZE - LINE_WIDTH);
                    rect.endFill();
                    const text = new PIXI.Text(i.toString(), {
                        fontFamily: 'Arial',
                        fontSize: STITCH_SIZE / 2,
                        fill: 0x000000,
                    });
                    text.anchor.set(0.5);
                    text.x = (STITCH_SIZE + LINE_WIDTH) / 2;
                    text.y = (STITCH_SIZE + LINE_WIDTH) / 2;
                    rect.addChild(text);
                    text.updateText();
                    let line = ~~(i * (STITCH_SIZE + LINE_WIDTH) / 2048);
                    let row = i % (~~(2048 / STITCH_SIZE));
                    rect.position.set(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH));
                    app.current.renderer.render(rect, spritesheet.current, false);
                    stitchedTextures.current[i] = new PIXI.Texture(spritesheet.current,
                        new PIXI.Rectangle(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH)));

                    rect.clear();
                    rect.lineStyle({ width: LINE_WIDTH, color: 0x000000, alignment: 1 });
                    rect.beginFill(colorHex);
                    rect.drawRect(LINE_WIDTH, LINE_WIDTH, STITCH_SIZE - LINE_WIDTH, STITCH_SIZE - LINE_WIDTH);
                    rect.endFill();
                    text.alpha = 0.4;
                    text.updateText();
                    line = ~~((i + colors.length) * (STITCH_SIZE + LINE_WIDTH) / 2048);
                    row = (i + colors.length) % (~~(2048 / STITCH_SIZE));
                    rect.position.set(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH));
                    app.current.renderer.render(rect, spritesheet.current, false);
                    unstitchedTextures.current[i] = new PIXI.Texture(spritesheet.current,
                        new PIXI.Rectangle(row * (STITCH_SIZE + LINE_WIDTH), line * (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH), (STITCH_SIZE + LINE_WIDTH)))

                    rect.destroy(true);
                }
            }
            
        }
    }

    function mouseDown(e) {
        posX = -viewport.current.hitArea.x;
        posY = -viewport.current.hitArea.y;
        var pos = {
            x: viewport.current.input.last.x / scale - posX,
            y: viewport.current.input.last.y / scale - posY,
        };
        mousePressed = e.data.button;
        if (mousePressed == 0) {
            var x = ~~(pos.x / STITCH_SIZE);
            var y = ~~(pos.y / STITCH_SIZE);
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
                        zoomIn(pos);
                        break;
                }

        }
        
    }

    function setCanvasCursor(e) {

    };

    const mouseMove = (e) => {
        posX = -viewport.current.hitArea.x;
        posY = -viewport.current.hitArea.y;
        var pos = {
            x: e.data.global.x / scale - posX,
            y: e.data.global.y / scale - posY
        }
        var x = ~~(pos.x / STITCH_SIZE);
        var y = ~~(pos.y / STITCH_SIZE);
        if (x < stitches[0].length && y < stitches.length && x >= 0 && y >= 0) {
            if (mousePressed == 0) {

                switch (settings.current.cursorMode) {
                    case cursorModes.STITCH:
                        completeStitch(x, y);
                        break;
                    case cursorModes.ERASE:
                        eraseStitch(x, y);
                        break;
                    case cursorModes.PAN:
                        break;
                }


            }
            setHoverColor.current(stitchArray[y][x].colorIndex);
        }
        if (mousePressed == -1 && settings.current.cursorMode == cursorModes.ZOOM) {
            let bounds = {
                width: zoomRectangle.current.width,
                height: zoomRectangle.current.height
            };
            let rectX = pos.x - bounds.width / 2;
            if (rectX < 0)
                rectX = 0;
            else if (rectX > viewport.current.worldWidth - bounds.width)
                rectX = viewport.current.worldWidth - bounds.width;
            let rectY = pos.y - bounds.height / 2;
            if (rectY < 0)
                rectY = 0;
            else if (rectY > viewport.current.worldHeight - bounds.height)
                rectY = viewport.current.worldHeight - bounds.height;
            zoomRectangle.current.position.set(rectX, rectY);
            
        }
        
        
    }

    const setGuideStyles = () => {
        document.documentElement.style.setProperty('--number-size', `${STITCH_SIZE * 10}px`);
        guideHorizontal.current.style.left = `-${STITCH_SIZE * 5}px`;
        guideVertical.current.style.top = `-${STITCH_SIZE * 5}px`;
    }
    
    const drawStitch = (x, y) => {
        let color = stitchArray[y][x].colorIndex;
        if (stitchArray[y][x].stitched)
            spritesRef.current[y][x].texture = stitchedTextures.current[color];
        else
            spritesRef.current[y][x].texture = unstitchedTextures.current[color];
    }
    
    const mouseUp = (e) => {
        console.log(selectedStitches);
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
            (settings.current.colorLock == false || settings.current.selectedColor == stitchArray[y][x].colorIndex)
        ) {
            selectedStitches.push({ x: x, y: y });
            stitchArray[y][x].stitched = true;
            drawStitch(x, y);
        }
    }

    const eraseStitch = (x, y) => {
        if (stitchArray[y][x].stitched &&
            (settings.current.colorLock == false || settings.current.selectedColor == stitchArray[y][x].colorIndex)
        ) {
            selectedStitches.push({ x: x, y: y });
            stitchArray[y][x].stitched = false;
            drawStitch(x, y);
        }
    }

    const zoomOut = () => {
        scale = viewport.current.findFit(viewport.current.worldWidth, viewport.current.worldHeight);
        viewport.current.setZoom(scale, true);
        setGuideStyles();

        zoomRectangle.current.clear();
        zoomRectangle.current.lineStyle(20, 0x8a2be2);
        zoomRectangle.current.drawRect(0, 0, scale * viewport.current.worldWidth / defaultScale, scale * viewport.current.worldHeight / defaultScale);
        zoomRectangle.current.renderable = true;
    }


    const zoomIn = (pos) => {
        scale = defaultScale;
        setPrevCursorMode.current();
        viewport.current.setZoom(defaultScale, true);
        viewport.current.moveCenter(pos.x, pos.y);
        setGuideStyles();
    }

    function clearZoomRectangle() {
        zoomRectangle.current.renderable = false;
    }

    function openMiniature(open) {
        if (open)
            miniature.current.renderable = true;
        else
            miniature.current.renderable = false;
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
                <Toolbar
                    settingsRef={settings}
                    setSelectedColorRef={setSelectedColor}
                    setHoverColorRef={setHoverColor}
                    setPrevCursorModeRef={setPrevCursorMode}
                    colors={colors}
                    setStitchCountsRef={setStitchCounts}
                    updateStitchCountsRef={updateStitchCounts}
                    setCanvasCursor={setCanvasCursor}
                    generateTextures={generateTextures}
                    zoomOut={zoomOut}
                    enablePan={enablePan}
                    clearZoomRectangle={clearZoomRectangle}
                    openMiniature={openMiniature}
                    setMiniaturePos={setMiniaturePos}
                />
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