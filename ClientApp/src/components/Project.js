import React, { useState } from 'react'
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Rect, Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { authService } from '../AuthService';
import './Project.css';
import Stitch from './Stitch';
import Stitches from './Stitches'

export default function Project() {
    const { id } = useParams();
    const [stitches, setStitches] = useState([]);
    const [colors, setColors] = useState([]);

    const setStitchArray = (stitches) => {
        var stitchArray = new Array();
        var i, j;
        for (i = 0; i < stitches.length; i++)
            for (j = 0; j < stitches[0].length; j++) {
                stitchArray.push({
                    stitch: stitches[i][j],
                    x: j,
                    y: i
                });
            }

        setStitches(stitchArray);
    }

    useEffect(() => {
        var headers = new Headers();
        authService.addAuthHeader(headers);
        fetch('api/project/' + id, {
            headers: headers
        })
            .then(res => res.json())
            .then(project => {
                console.log(project);
                setStitchArray(project.stitchMap.stitches);
                setColors(project.stitchMap.dmcFlosses);
            })
            .catch(ex => console.log(ex));
    }, []);
    /*
    const Stitches = () => {
        return stitches.map((row, i) => {
            return row.map((stitch, j) => {
                const color = colors[stitch.colorIndex];
                var colorHex = '#' + color.red.toString(16) + color.green.toString(16) + color.blue.toString(16); 
                return (
                    <Stitch
                        key={j*1024+i}
                        color={colorHex}
                        x={j*10}
                        y={i*10}
                    />
                );
            });
        });
    }
    */
    console.log('rerender project');

    if (stitches.length == 0 || colors.length == 0)
        return null;

    return (
        <Stage
            width={3000}
            height={3000}
        >
            <Layer>
                <Stitches stitches={stitches} colors={colors} />
            </Layer>
        </Stage>
        );
}