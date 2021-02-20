import React, { useState } from 'react';
import { tabType } from './EmbroiderMain'

export function ImagePreview({ image, previewImage, loading, selectedTab, setSelectedTab }) {

    const imageWindowContent = () => {
        switch (selectedTab) {
            case tabType.IMAGE:
                return (
                        <img src={URL.createObjectURL(image)} alt="image" />
                );
            case tabType.PREVIEW:
                if (loading)
                    return (
                        <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
                        )
                if (previewImage == null)
                    return null;
                return (
                    <img src={URL.createObjectURL(previewImage)} />
                    );
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
                    className={`tab ${selectedTab == tabType.PREVIEW ? "selected" : ""}`}
                    onClick={e => setSelectedTab(tabType.PREVIEW)}
                >
                    <label>
                        Stitches preview
                    </label>
                </div>
                <div
                    className={`tab ${selectedTab == tabType.SUMMARY ? "selected" : ""}`}
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