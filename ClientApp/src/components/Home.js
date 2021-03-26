import React, { useEffect, useState } from 'react';
import { ImageUpload } from './ImageUpload';
import { EmbroiderMain } from './EmbroiderMain';

export function Home(props) {
    const [guid, setGuid] = useState(null);
    const [image, setImage] = useState(null);
    const [imageDragged, setImageDragged] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [timeout, setTimeout] = useState(false);
    const [warning, setWarning] = useState(false);

    useEffect(() => {
        fetch('api/embroider')
            .then(res => res.text())
            .then(id => setGuid(id));
    }, [])

    const saveFile = (e) => {
        e.preventDefault();
        if (!e.target.files[0].type.startsWith('image') || e.target.files[0].size > 5242880) {
            setWarning(true);
            return null;
        }
            
        setUploading(true);
        setImage(e.target.files[0]);
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
                if (res.status == 200) {
                    setUploaded(true);
                    setTimeout(false);
                }
                    
            })
            .catch(ex => {
            });
        return true;
    }

    const onDropImage = (e) => {
        e.preventDefault();
        var data = e.dataTransfer.items[0];
        if (data.kind != 'file' || !data.type.startsWith("image"))
            return null;
        var file = data.getAsFile();
        if (file.size > 5242880) {
            setWarning(true);
            return null;
        }
            
        setUploading(true);
        setImage(file);
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
                guid={guid}
                setUploaded={setUploaded}
                saveFile={saveFile}
                uploading={uploading}
                timeout={timeout}
                setTimeout={setTimeout}
                warning={warning}
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
                warning={warning}
            />
        </div>
    );
}