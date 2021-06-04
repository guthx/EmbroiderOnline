import React, { useState } from 'react';
import { useEffect } from 'react';
import { tabType } from '../Enums';
import ImagePreviewZoom from './ImagePreviewZoom';
import Spinner from './Spinner';
import CloseIcon from '@material-ui/icons/Close';
import UndoIcon from '@material-ui/icons/Undo';
import { Tooltip } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

function ImagePreview(
    {
        image,
        previewImage,
        loading,
        selectedTab,
        setSelectedTab,
        setImageSize,
        summary,
        setSummary,
        setLoading,
        setPreviewImage,
        setTimeout,
        guid,
        excludedFlosses,
        setExcludedFlosses,
        updatePreview,
        setUpdatePreview
    }) {
    const [zoom, setZoom] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [previewImageUrl, setPreviewImageUrl] = useState("");
    const [previewImageSize, setPreviewImageSize] = useState({ height: 0, width: 0 });

    const excludeFlosses = () => {
        setUpdatePreview(false);
        setLoading(true);
        fetch('api/embroider/excludeFlosses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guid: guid,
                excludedFlosses: excludedFlosses
            })
        })
            .then(res => {
                if (res.status == 400) {
                    setTimeout(true);
                    throw new Error("Timeout");
                }
                return res.blob();
            })
            .then(image => {
                setPreviewImage(image);
                updateSummary();
                setLoading(false);
            })
            .catch(ex => {
                setLoading(false);
            });
    }

    function handleExclude(i) {
        if (summary.flosses[i].excluded) {
            summary.flosses[i].excluded = false;
            setExcludedFlosses(excludedFlosses.filter(floss => floss != summary.flosses[i].number));
        } else {
            summary.flosses[i].excluded = true;
            setExcludedFlosses([...excludedFlosses, summary.flosses[i].number]);
        }
        setUpdatePreview(true);
    }

    const OptionTooltip = withStyles((theme) => ({
        tooltip: {
            backgroundColor: '#2e2e2e',
            color: 'white',
            borderRadius: '3px',
            fontSize: 14
        }
    }))(Tooltip);

    const updateSummary = () => {
        fetch('api/embroider/summary?guid=' + guid)
            .then(res => {
                if (res.status == 400)
                    throw new Error("Timeout");
                return res.json();
            })
            .then(newSummary => {
                let flosses = summary.flosses.map((floss) => {
                    let newFloss = newSummary.flosses.find(f => f.number == floss.number);
                    if (newFloss)
                        return {
                            ...floss,
                            count: newFloss.count
                        };
                    else
                        return {
                            ...floss,
                            count: 0
                        }
                });
                setSummary({...summary, flosses: flosses});
            })
            .catch(ex => { })
    }
    
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
                            <div
                                className={'floss'}
                                key={i}
                                style={{
                                    color: `${floss.excluded ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 1)'}`
                                }}
                            >
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
                                <OptionTooltip
                                    title={'Exclude/include the floss color. Stitches of that color will be replaced by the closest of the remaining colors.'}
                                    placement="left"
                                    className={'tool-tip'}
                                    enterDelay={600}
                                >
                                <div
                                    className={'exclude-button'}
                                    style={{
                                        backgroundColor: `${floss.excluded ? '#41c300' : 'red'}`,
                                    }}
                                    onClick={() => handleExclude(i)}
                                >
                                    {
                                        floss.excluded ?
                                            <UndoIcon />
                                            :
                                            <CloseIcon />
                                    }
                                    </div>
                                </OptionTooltip>
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
                    onClick={e => {
                        if (updatePreview) {
                            setUpdatePreview(false);
                            excludeFlosses();
                        }
                        setSelectedTab(tabType.PREVIEW);
                    }}
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