import React, { useState } from 'react';

export function Counter(props) {
    const [file, setFile] = useState();
    const [fileName, setFileName] = useState();
    const [imageUrl, setImageUrl] = useState();
    const [imageBlob, setImageBlob] = useState(null);
    const saveFile = (e) => {
        setFile(e.target.files[0]);
        setFileName(e.target.files[0].name);
    }

    const uploadFile = (e) => {
        const formData = new FormData();
        formData.append("formFile", file);
        formData.append("imageName", fileName);
        fetch('api/weatherforecast', {
            method: 'POST',
            body: formData
        })
            .then(res => res.json())
            .then(response => {
                console.log(response);
            })
            .catch(ex => {
                console.log(ex);
            });

    }

    const getImage = (e) => {
        fetch('api/weatherforecast/image')
            .then(res => res.blob())
            .then(blob => {
                setImageBlob(blob);
            });
    }

    const getSheet = (e) => {
    }

    if (imageBlob != null)
        return (
            <div>
                <input type="file" onChange={saveFile} />
                <input type="button" value="upload" onClick={uploadFile} />
                <button type='button' onClick={getImage} >get ahri</button>
                <a href={URL.createObjectURL(imageBlob)} download>test</a>
                <img src={URL.createObjectURL(imageBlob)} />
            </div>
        );
    else
        return (
            <div>
                <input type="file" onChange={saveFile} />
                <input type="button" value="upload" onClick={uploadFile} />
                <button type='button' onClick={getImage} >get ahri</button>
                <a href="api/weatherforecast/sheet" download="spreadsheet.xlsx">get sheet</a>
            </div>
            );
}
