import React, { useState } from 'react';
import { useEffect } from 'react';
import { tabType } from './EmbroiderMain'

function ImagePreview({ image, previewImage, loading, selectedTab, setSelectedTab, setImageSize, summary }) {

    const SummaryContent = () => {
        console.log(summary);
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

    const imageWindowContent = () => {
        switch (selectedTab) {
            case tabType.IMAGE:
                var url = URL.createObjectURL(image);
                return (
                    <img
                        onLoad={e => {
                            setImageSize({ height: e.target.naturalHeight, width: e.target.naturalWidth });
                        }}
                        id="original-image"
                        src={url}
                        alt="image" />
                );
            case tabType.PREVIEW:
                if (loading)
                    return (
                        <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
                        )
                if (previewImage == null)
                    return null;
                var url = URL.createObjectURL(previewImage);
                var name = image.name.split('.')[0];
                return (
                    <a href={url} download={name + '_preview'}>
                        <img id="preview-image" src={url} />
                    </a>
                );
            case tabType.SUMMARY:
                return <SummaryContent />
            default:
                return null;
        }
    }
    

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
                {imageWindowContent()}
            </div>
        </div>
        );
}

export default React.memo(ImagePreview);