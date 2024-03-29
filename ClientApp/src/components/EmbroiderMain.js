﻿import React, { useState } from 'react'
import ImagePreview from './ImagePreview';
import { EmbroiderOptions } from './EmbroiderOptions';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import { Typography } from '@material-ui/core';
import Spinner from './Spinner';
import { tabType } from '../Enums';


export function EmbroiderMain({ image, guid, uploading, saveFile, setTimeout, timeout, warning, flosses }) {
    const [selectedTab, setSelectedTab] = useState(tabType.IMAGE);
    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingSpreadsheet, setLoadingSpreadsheet] = useState(false);
    const [summary, setSummary] = useState(null);
    const [imageSize, setImageSize] = useState({ height: "100", width: "100" });
    const [excludedFlosses, setExcludedFlosses] = useState([]);
    const [updatePreview, setUpdatePreview] = useState(false);

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
                <Spinner />
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
                <Spinner />
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
                setSummary={setSummary}
                setLoading={setLoading}
                setPreviewImage={setPreviewImage}
                setTimeout={setTimeout}
                guid={guid}
                excludedFlosses={excludedFlosses}
                setExcludedFlosses={setExcludedFlosses}
                updatePreview={updatePreview}
                setUpdatePreview={setUpdatePreview}
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
                flosses={flosses}
                setExcludedFlosses={setExcludedFlosses}
                setUpdatePreview={setUpdatePreview}
            />
        </div>
        );
}