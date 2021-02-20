import React, { Component, useEffect, useState } from 'react';
import { ImageUpload } from './ImageUpload';
import { EmbroiderMain } from './EmbroiderMain';

export function Home(props) {
    const [guid, setGuid] = useState(null);
    const [image, setImage] = useState(null);
    const [imageName, setImageName] = useState(null);
    const [imageDragged, setImageDragged] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);

    useEffect(() => {
        fetch('api/embroider')
            .then(res => res.text())
            .then(id => setGuid(id));
    }, [])

    const saveFile = (e) => {
        e.preventDefault();
        if (!e.target.files[0].type.startsWith('image'))
            return null;
        setUploading(true);
        console.log(e.target.files[0]);
        setImage(e.target.files[0]);
        setImageName(e.target.files[0].name);
        const formData = new FormData();
        formData.append("formFile", e.target.files[0]);
        formData.append("imageName", e.target.files[0].name);
        formData.append("guid", guid);
        fetch('api/embroider', {
            method: 'POST',
            body: formData
        })
            .then(res => {
                setUploading(false);
                if (res.status == 200)
                    setUploaded(true);
            })
            .catch(ex => {
                console.log(ex);
            });
    }

    const onDropImage = (e) => {
        e.preventDefault();
        var data = e.dataTransfer.items[0];
        if (data.kind != 'file' || !data.type.startsWith("image"))
            return null;
        setUploading(true);
        var file = data.getAsFile();
        setImage(file);
        setImageName(file.name);
        const formData = new FormData();
        formData.append("formFile", file);
        formData.append("imageName", file.name);
        formData.append("guid", guid);
        fetch('api/embroider', {
            method: 'POST',
            body: formData
        })
            .then(res => {
                setUploading(false);
                if (res.status == 200)
                    setUploaded(true);
            })
            .catch(ex => {
                console.log(ex);
            });
    }

    const dragOver = (e) => {
        e.preventDefault();
        if (image == null) {
            setImageDragged(true);
        }
    }

    const dragEnd = (e) => {
        e.preventDefault();
        setImageDragged(false);
    }
    if (uploaded)
        return (
            <EmbroiderMain
                image={image}
                imageName={imageName}
                guid={guid}
                />
            );

    return (
        <div
            className={`upload-wrapper ${imageDragged||uploading ? "dim" : ""}`}
            onDragOver={e => dragOver(e)}
            onDragEnd={e => dragEnd(e)}
            onDragExit={e => dragEnd(e)}
            onDrop={e => dragEnd(e)}
        >
            <ImageUpload
                saveFile={saveFile}
                onDrop={onDropImage}
                imageDragged={imageDragged}
                uploading={uploading}
            />
        </div>
    );
}