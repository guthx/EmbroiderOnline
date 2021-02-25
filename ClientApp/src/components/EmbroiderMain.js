import React, { useState, useEffect } from 'react'
import { ImagePreview } from './ImagePreview';
import { EmbroiderOptions } from './EmbroiderOptions';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';

export const tabType = {
    IMAGE: 0,
    PREVIEW: 1,
    SUMMARY: 2
}

export function EmbroiderMain({ image, guid }) {
    const [selectedTab, setSelectedTab] = useState(tabType.IMAGE);
    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingSpreadsheet, setLoadingSpreadsheet] = useState(false);
    const [summary, setSummary] = useState(null);

    return (
        <div className={'main-wrapper'}>
            <Dialog className={'dialog'} open={loadingSpreadsheet}>
                <DialogTitle id="dialog-title">Generating spreadsheet</DialogTitle>
                <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
            </Dialog>
            <ImagePreview
                image={image}
                previewImage={previewImage}
                loading={loading}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
                summary={summary}
            />
            <EmbroiderOptions
                guid={guid}
                setPreviewImage={setPreviewImage}
                setLoading={setLoading}
                setSelectedTab={setSelectedTab}
                setLoadingSpreadsheet={setLoadingSpreadsheet}
                setSummary={setSummary}
                imageName={image.name}
            />
        </div>
        );
}