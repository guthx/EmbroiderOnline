import React, { useState, useEffect } from 'react'
import ImagePreview from './ImagePreview';
import { EmbroiderOptions } from './EmbroiderOptions';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import { Typography } from '@material-ui/core';

export const tabType = {
    IMAGE: 0,
    PREVIEW: 1,
    SUMMARY: 2
}

export function EmbroiderMain({ image, guid, setUploaded, uploading, saveFile, setTimeout, timeout, warning }) {
    const [selectedTab, setSelectedTab] = useState(tabType.IMAGE);
    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingSpreadsheet, setLoadingSpreadsheet] = useState(false);
    const [summary, setSummary] = useState(null);
    const [imageSize, setImageSize] = useState({ height: "100", width: "100" });

    const uploadNewImage = (e) => {
        if (saveFile(e)) {
            setPreviewImage(null);
            setSummary(null);
            setSelectedTab(tabType.IMAGE);
        }
    }

    const SessionTimeout = () => {
        var dialogContent;
        if (uploading) {
            dialogContent = (
                <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
            );
        }
        else {
            dialogContent = (
                <>
                <DialogTitle disableTypography id="dialog-title">
                    <Typography
                        variant="h5">
                        Session timeout
                        </Typography>
                    </DialogTitle>
                <div className="dialog-content">
                        Session has timed out due to inactivity.
                    <label for="file-upload" class="file-upload-label">
                            Re-upload the image
                    </label>
                        <input type="file"
                            id="file-upload"
                            onChange={(e) => saveFile(e)}
                            accept=".gif, .jpeg, .jpg, .png, .bmp"
                        />
                    &nbsp;to continue
                    {warning &&
                            <div className="warning">
                                Image size cannot exceed 5MB
                            </div>
                    }
                </div>
                </>
                );
        }

        return (
            <Dialog className={'session-timeout-dialog'} open={timeout || uploading}>
                {dialogContent}
            </Dialog>
        );
    }

    return (
        <div className={'main-wrapper'}>
            <Dialog className={'dialog'} open={loadingSpreadsheet}>
                <DialogTitle id="dialog-title">Generating spreadsheet</DialogTitle>
                <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
            </Dialog>
            <SessionTimeout />
            <ImagePreview
                image={image}
                previewImage={previewImage}
                loading={loading}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
                setImageSize={setImageSize}
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
                imageSize={imageSize}
                setTimeout={setTimeout}
                selectedTab={selectedTab}
                uploadNewImage={uploadNewImage}
            />
        </div>
        );
}