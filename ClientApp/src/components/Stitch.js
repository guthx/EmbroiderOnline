import React, { useState } from 'react';
import { Rect } from 'react-konva';

export default function Stitch({ color, x, y }) {
    const [stitched, setStitched] = useState(false);
    return (
        <Rect
            x={x}
            y={y}
            fill={color}
            width={9}
            height={9}
            onMouseOver={e => e.target.setAttrs({
                fill: 'white',
            })}
             />
    );
}
