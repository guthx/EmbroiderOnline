import React, { useState } from 'react'
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Rect, Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { authService } from '../AuthService';
import './Project.css';
import Stitch from './Stitch';
import Stitches from './Stitches'
import StitchCanvas from './StitchCanvas';

export const MenuContext = React.createContext({
    drawMode: 'stitch'
});

export default function Project() {
    const { id } = useParams();
    const [stitches, setStitches] = useState([]);
    const [colors, setColors] = useState([]);
    const [drawMode, setDrawMode] = useState('stitch');
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
    

    console.log('rerender project');

    if (stitches.length == 0 || colors.length == 0)
        return null;

    return (
        <MenuContext.Provider value={{
            drawMode: drawMode
        }}>
            <button onClick={() => setDrawMode('stitch')}>stitch</button>
            <button onClick={() => setDrawMode('unstitch')}> unstitch</button>
            <StitchCanvas stitches={stitches} colors={colors} drawMode={drawMode} />
        </MenuContext.Provider>
        );
}