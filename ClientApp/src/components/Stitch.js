import React, { useState } from 'react';
import { Rect } from 'react-konva';

export default function Stitch({ color, x, y }) {
    const [stitched, setStitched] = useState(false);
    var s = false;
    return (
        <Rect
            x={x}
            y={y}
            fill={`rgba(${color.red}, ${color.green}, ${color.blue}, 1)`}
            width={10}
            height={10}
            onMouseEnter={e => {
                if (e.evt.buttons == 1) {
                    document.getElementsByTagName('canvas')[0].getContext('2d').clearRect(x, y, 10, 10);
                    e.target.setAttr('fill', `rgba(${color.red}, ${color.green}, ${color.blue}, 0.5)`);
                    e.target.draw();
                }
            }}
             />
    );
}
