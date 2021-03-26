import React from 'react';

function ImagePreviewZoom({ url, previewImageSize, zoom, setZoom }) {
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