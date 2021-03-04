import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import ImageMapper from 'react-img-mapper';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

function ImagePreviewZoom({ url, previewImageSize, zoom, setZoom }) {
    console.log(previewImageSize);
    if (previewImageSize.width == 0)
        return null;
    return (
        <>

            <div
                className={`background-dim ${zoom ? "active" : ""}`}
                onClick={e => setZoom(false) }
            >


                <div className={'img-wrapper'}>
                    <img src={url} />
                </div>


            </div>
        </>
    );
}

export default React.memo(ImagePreviewZoom);