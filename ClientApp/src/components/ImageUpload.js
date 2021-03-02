import React, { useState } from 'react';

export function ImageUpload({ saveFile, onDrop, imageDragged, uploading, warning }) {
    const [dragInArea, setDragInArea] = useState(false);

    const dragEnter = (e) => {
        e.preventDefault();
        setDragInArea(true);
        console.log(e);
    }

    const dragLeave = (e) => {
        e.preventDefault();
        setDragInArea(false);
        console.log(e);
    }
    if (uploading)
        return (
            <div
                className={`image-upload-window`}>
                <div className={'image-upload'}>
                    <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
                </div>
            </div>
        )

    if (!imageDragged)
        return (
            <div
                className={'image-upload-window'}
                onDrop={(e) => onDrop(e)}
                onDragEnter={e => dragEnter(e)}
                onDragExit={e => dragLeave(e)}
            >
                <div className={'image-upload'}>
                    To start,<br />
            drag & drop or<br />
                    <label for="file-upload" class="file-upload-label">
                        upload an image
            </label>
                    <input type="file"
                        id="file-upload"
                        onChange={(e) => saveFile(e)}
                        accept=".gif, .jpeg, .jpg, .png, .bmp"
                    />
                    {warning &&
                        <div className="warning">
                            Image size cannot exceed 5MB
                        </div>
                    }
                </div>
            </div>
        );
    else
        return (
            <div
                className={`image-upload-window ${dragInArea ? "dragged" : ""}`}
                onDragEnter={e => dragEnter(e)}
                onDragExit={e => dragLeave(e)}
                onDrop={(e) => onDrop(e)}
            >
                <div className={'image-upload dragged'}>
                    Drop image here
                </div>
            </div>
        );
}