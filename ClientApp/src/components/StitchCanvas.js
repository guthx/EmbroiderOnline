import React, { useEffect, useState, useContext } from 'react'
import { useRef } from 'react';
import { MenuContext } from './Project';

const STITCH_SIZE = 10;

function StitchCanvas({ stitches, colors }) {
    const ctxRef = useRef(undefined);
    const settings = useContext(MenuContext)
    var canvasContext;
    var canvas;
    var stitchArray = stitches;

    useEffect(() => {
        console.log(ctxRef.current.getContext('2d'));
        canvasContext = ctxRef.current.getContext('2d');
        canvas = ctxRef.current;
        canvasContext.imageSmoothingEnabled = false;
        if (canvasContext) {
            console.log(colors);
            var x, y;
            for (y = 0; y < stitches.length; y++)
                for (x = 0; x < stitches[0].length; x++)
                    drawStitch(x, y);
        }
    }, [])

    const getMousePos = (e) => {
        var rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
            y: (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
        }
    }

    const drawStitch = (x, y) => {
        var alpha;
        if (stitchArray[y][x].stitched == false)
            alpha = 0.4;
        else
            alpha = 1;
        var color = colors[stitchArray[y][x].colorIndex];
        canvasContext.clearRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
        canvasContext.fillStyle = `rgba(${color.red}, ${color.green}, ${color.blue}, ${alpha})`;
        canvasContext.fillRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
    }

    const onHover = (e) => {
        var pos = getMousePos(e);
        var x = parseInt(pos.x / STITCH_SIZE);
        var y = parseInt(pos.y / STITCH_SIZE);
        if (settings.drawMode == 'stitch') {
            if (!stitchArray[y][x].stitched) {
                stitchArray[y][x].stitched = true;
                drawStitch(x, y);
            }
        }
        else if (settings.drawMode == 'unstitch') {
            if (stitchArray[y][x].stitched) {
                stitchArray[y][x].stitched = false;
                drawStitch(x, y);
            }
        }
          
    }

    return (
        <canvas
            id={'stitch-canvas'}
            ref={ctxRef}
            height={stitches.length * STITCH_SIZE}
            width={stitches[0].length * STITCH_SIZE}
            onMouseMove={e => onHover(e)}
        >
        </canvas>
        );
}

export default React.memo(StitchCanvas, (prevProps, nextProps) => {
    return prevProps.stitches.length == nextProps.stitches.length;
});

/*
 * 
})*/