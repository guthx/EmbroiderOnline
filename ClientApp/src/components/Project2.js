import React, { useState, useRef } from 'react'
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { authService } from '../AuthService';
import './Project.css';
import Test from './Test';
import Sketch from 'react-p5';

const STITCH_SIZE = 10;

class StitchModule {
    constructor(x, y, color, stitched) {
        this.color = color;
        this.stitched = stitched;
        this.x = x;
        this.y = y;
    }

    draw = (p5) => {
        var alpha;
        if (this.stitched)
            alpha = 1;
        else
            alpha = 0.4;
        p5.noStroke();
        console.log('drawn');
        p5.fill(this.color.red, this.color.green, this.color.blue, alpha);
        p5.rect(this.x * STITCH_SIZE, this.y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
    }
}

export default function Project2() {
    const settings = useRef({
        drawMode: 'stitch'
    });
    const { id } = useParams();
    const [stitches, setStitches] = useState([]);
    const [colors, setColors] = useState([]);
    const [canvas, setCanvas] = useState();
    
    var drawMode = 'stitch'
    var canvasContext;
    var stage, renderer, graphics;
    var stitchArray = stitches;
    var selecting = false;
    var selectedStitches = [];
    let stitchModules = [];

    useEffect(() => {
        var headers = new Headers();
        authService.addAuthHeader(headers);
        fetch('api/project/' + id, {
            headers: headers
        })
            .then(res => res.json())
            .then(project => {
                console.log(project);
                setStitches(project.stitchMap.stitches);
                setColors(project.stitchMap.dmcFlosses);
            })
            .catch(ex => console.log(ex));
    }, []);

    const setup = (p5, parentRef) => {
        p5.createCanvas(stitches.length * STITCH_SIZE, stitches[0].length * STITCH_SIZE).parent(parentRef);
        
        let i = 0;
        for (let y = 0; y < stitchArray.length; y++)
            for (let x = 0; x < stitchArray[0].length; x++) {
                stitchModules.push(new StitchModule(x, y, colors[stitchArray[y][x].colorIndex], stitchArray[y][x].stitched));
                //stitchModules[i].draw();
                i++;
            }
            
    }

    const draw = (p5) => {
        for (let i = 0; i < stitchModules.length; i++)
            stitchModules[i].draw(p5);
        p5.noLoop();
    }

    /*
    const getMousePos = (e) => {
        var rect = canvas.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / (rect.right - rect.left) * canvas.width)/2,
            y: ((e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)/2
        }
    }

    const drawStitch = (x, y) => {
        var alpha;
        if (stitchArray[y][x].stitched == false)
            alpha = 0.4;
        else
            alpha = 1;
        var color = colors[stitchArray[y][x].colorIndex];
        var hexColor = (color.red << 16) + (color.green << 8) + color.blue;
        var stitch = new PIXI.Graphics();
        stitch.beginFill(hexColor, alpha);
        stitch.drawRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
        stitch.endFill();
        stage.addChild(stitch);
    }

    const redrawStitch = (x, y) => {
        var color = colors[stitchArray[y][x].colorIndex];
        var hexColor;
        if (stitchArray[y][x].stitched == true)
            hexColor = 0xFFFFFF;
        else
            hexColor = (color.red << 16) + (color.green << 8) + color.blue;
        var index = y * stitchArray.length + x;
        stage.children[index].beginFill(hexColor);
        stage.children[index].drawRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
        stage.children[index].endFill();
        renderer.render(stage);
        console.log(stage);
    }

    const mouseMove = (e) => {
        
        var pos = getMousePos(e);
        var x = parseInt(pos.x / STITCH_SIZE);
        var y = parseInt(pos.y / STITCH_SIZE);

        if (selecting) {
            selectStitch(x, y);
        }
        
    }

    const mouseDown = (e) => {
        
        if (e.button == 0) {
            selecting = true;
            var pos = getMousePos(e);
            var x = parseInt(pos.x / STITCH_SIZE);
            var y = parseInt(pos.y / STITCH_SIZE);
            selectStitch(x, y);
        }
        
    }

    const mouseUp = () => {
        
        selecting = false;
        console.log(selectedStitches);
        selectedStitches = [];
        
    }

    const selectStitch = (x, y) => {
        if (settings.current.drawMode == 'stitch') {
            if (!stitchArray[y][x].stitched && !selectedStitches.find(s => s.x == x && s.y == y)) {
                selectedStitches.push({ x: x, y: y });
                stitchArray[y][x].stitched = true;
                redrawStitch(x, y);
            }
        }
        else {
            if (stitchArray[y][x].stitched && !selectedStitches.find(s => s.x == x && s.y == y)) {
                selectedStitches.push({ x: x, y: y });
                stitchArray[y][x].stitched = false;
                redrawStitch(x, y);
            }
        }
    }
    */

    if (stitches.length == 0 || colors.length == 0)
        return null;

    return (
        <>
            <div>
                <Sketch setup={setup} draw={draw} />
            </div>
            <Test settingsRef={settings} />
        </>
    );
}