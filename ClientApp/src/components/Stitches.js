import React from 'react';
import Stitch from './Stitch';

function Stitches({ stitches, colors }) {

    console.log('render');
    return (
        <>
            {stitches.map((stitch, i) => {
                const color = colors[stitch.stitch.colorIndex];
                var colorHex = '#' + color.red.toString(16) + color.green.toString(16) + color.blue.toString(16);
                return (
                    <Stitch
                        key={stitch.x * 1024 + stitch.y}
                        id={stitch.x * 1024 + stitch.y}
                        color={color}
                        x={stitch.x * 10}
                        y={stitch.y * 10}
                    />
                );
            })}
        </>
        );
}

export default Stitches