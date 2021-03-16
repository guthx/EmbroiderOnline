import React, { useEffect, useState, useContext } from 'react'
import { useRef } from 'react';
import { MenuContext } from './Project';



function StitchCanvas({ mouseMove, setCanvas, height, width, mouseDown, mouseUp }) {
    const ctxRef = useRef();

    useEffect(() => {
        setCanvas(ctxRef.current);
    }, [])

    

    return (
        <canvas
            id={'stitch-canvas'}
            ref={ctxRef}
            height={height}
            width={width}
            onMouseMove={mouseMove}
            onMouseDown={mouseDown}
            onMouseUp={e => mouseUp()}
            onContextMenu={e => e.preventDefault()}
        >
        </canvas>
        );
}

export default React.memo(StitchCanvas);

/*
 * 
})*/