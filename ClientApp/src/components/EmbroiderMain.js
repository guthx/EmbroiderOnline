import React, { useState, useEffect } from 'react'
import { ImagePreview } from './ImagePreview';
import { EmbroiderOptions } from './EmbroiderOptions';

export const tabType = {
    IMAGE: 0,
    PREVIEW: 1,
    SUMMARY: 2
}

export function EmbroiderMain({ image, imageName, guid }) {
    const [selectedTab, setSelectedTab] = useState(tabType.IMAGE);
    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(false);

    return (
        <div className={'main-wrapper'}>
            <ImagePreview
                image={image}
                previewImage={previewImage}
                loading={loading}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
            />
            <EmbroiderOptions
                guid={guid}
                setPreviewImage={setPreviewImage}
                setLoading={setLoading}
                setSelectedTab={setSelectedTab}
            />
        </div>
        );
}