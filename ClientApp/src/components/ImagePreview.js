import React, { useState } from 'react';
import { useEffect } from 'react';
import { tabType } from '../Enums';
import ImagePreviewZoom from './ImagePreviewZoom';
import Spinner from './Spinner';

function ImagePreview({ image, previewImage, loading, selectedTab, setSelectedTab, setImageSize, summary }) {
    const [zoom, setZoom] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [previewImageUrl, setPreviewImageUrl] = useState("");
    const [previewImageSize, setPreviewImageSize] = useState({ height: 0, width: 0 });
    
    const SummaryContent = () => {
        if (summary == null)
            return null;
        return (
            <div className={'summary'}>
            <div>
                {summary.height}x{summary.width} stiches ({summary.height * summary.width} in total)
            </div>
            <div>
                {summary.flosses.length} colors:
            </div>
                <div className={'floss-list'}>
                    {
                        summary.flosses.map((floss, i) => (
                            <div className={'floss'} key={i}>
                                <div className={'description'}>
                                    DMC {floss.number}
                                </div>
                                <div
                                    className={'color-preview'}
                                    style={{ backgroundColor: floss.hexRGB }}
                                >
                                </div>
                                <div className={'count'}>
                                    {floss.count} stitches
                                </div>
                            </div>
                            ))
                    }
                </div>
            </div>
            );
    }

    const ImageWindowContent = () => {
        switch (selectedTab) {
            case tabType.IMAGE:
                return (
                    <img
                        onLoad={e => {
                            setImageSize({ height: e.target.naturalHeight, width: e.target.naturalWidth })
                        }}
                        id="original-image"
                        src={imageUrl}
                        alt="image" />
                );
            case tabType.PREVIEW:
                if (loading)
                    return (
                        <Spinner />
                        )
                if (previewImage == null)
                    return null;
                var name = image.name.split('.')[0];
                return (
                    <img
                        onLoad={e => setPreviewImageSize({ height: e.target.naturalHeight, width: e.target.naturalWidth })}
                        id="preview-image"
                        src={previewImageUrl}
                        onClick={e => setZoom(true)}
                    />
                );
            case tabType.SUMMARY:
                return <SummaryContent />
            default:
                return null;
        }
    }

    useEffect(() => {
        setImageUrl(URL.createObjectURL(image));
    }, [image]);
    useEffect(() => {
        if (previewImage != null)
            setPreviewImageUrl(URL.createObjectURL(previewImage));
    }, [previewImage])

    return (
        <div className={'image-preview'}>
            <div className={'tabs'}>
                <div
                    className={`tab ${selectedTab == tabType.IMAGE ? "selected" : ""}`}
                    onClick={e => setSelectedTab(tabType.IMAGE)}
                >
                    <label>
                        Original image
                    </label>
                </div>
                <div
                    className={`tab ${selectedTab == tabType.PREVIEW ? "selected" : ""} ${previewImage == null ? "disabled" : ""}`}
                    onClick={e => setSelectedTab(tabType.PREVIEW)}
                >
                    <label>
                        Stitches preview
                    </label>
                </div>
                <div
                    className={`tab ${selectedTab == tabType.SUMMARY ? "selected" : ""} ${previewImage == null ? "disabled" : ""}`}
                    onClick={e => setSelectedTab(tabType.SUMMARY)}
                >
                    <label>
                        Summary
                    </label>
                </div>
            </div>
            <div className={'image-window'}>
                {ImageWindowContent()}
            </div>
            <ImagePreviewZoom
                url={previewImageUrl}
                previewImageSize={previewImageSize}
                zoom={zoom}
                setZoom={setZoom}
                />
        </div>
        );
}

export default React.memo(ImagePreview);