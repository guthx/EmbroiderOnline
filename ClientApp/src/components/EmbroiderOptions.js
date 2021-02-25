import React, { useState } from 'react';
import { tabType } from './EmbroiderMain'

const quantizerTypes = {
    Octree: "Octree",
    KMeans: "KMeans",
    MedianCut: "MedianCut",
    Popularity: "Popularity",
    SimplePopularity: "SimplePopularity",
    ModifiedMedianCut: "ModifiedMedianCut"
}

const operationOrders = {
    QuantizeFirst: "QuantizeFirst",
    ReplacePixelsFirst: "ReplacePixelsFirst"
}

const octreeModes = {
    LeastImportant: "LeastImportant",
    MostImportant: "MostImportant"
}

export function EmbroiderOptions({ guid, setPreviewImage, setLoading, setSelectedTab, setLoadingSpreadsheet, setSummary, imageName }) {
    const [stitchSize, setStitchSize] = useState(4);
    const [maxColors, setMaxColors] = useState(32);
    const [outputStitchSize, setOutputStitchSize] = useState(4);
    const [net, setNet] = useState(false);
    const [quantizerType, setQuantizerType] = useState(quantizerTypes.Octree);
    const [operationOrder, setOperationOrder] = useState(operationOrders.QuantizeFirst);
    const [octreeMode, setOctreeMode] = useState(octreeModes.LeastImportant);

    const getPreview = () => {
        setSelectedTab(tabType.PREVIEW);
        setLoading(true);
        var request = {
            stitchSize: stitchSize,
            maxColors: maxColors,
            outputStitchSize: outputStitchSize,
            net: net,
            quantizerType: quantizerType,
            operationOrder: operationOrder,
            octreeMode: octreeMode,
            guid: guid
        }
        fetch('api/embroider/preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request),
        })
            .then(res => res.blob())
            .then(image => {
                setPreviewImage(image);
                getSummary();
                setLoading(false);
            })
            .catch(ex => {
                setLoading(false);
                console.log(ex)
            });
    }

    const getSpreadsheet = () => {
        setLoadingSpreadsheet(true);
        var request = {
            stitchSize: stitchSize,
            maxColors: maxColors,
            outputStitchSize: outputStitchSize,
            net: net,
            quantizerType: quantizerType,
            operationOrder: operationOrder,
            octreeMode: octreeMode,
            guid: guid
        }
        fetch('api/embroider/spreadsheet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        })
            .then(res => res.blob())
            .then(sheet => {
                setLoadingSpreadsheet(false);
                var a = document.createElement('a');
                a.href = URL.createObjectURL(sheet);
                a.download = imageName;
                a.click();
            })
            .catch(ex => {
                console.log(ex);
                setLoadingSpreadsheet(false);
            });
    }

    const getSummary = () => {
        fetch('api/embroider/summary?guid=' + guid)
            .then(res => res.json())
            .then(summary => {
                console.log(summary);
                setSummary(summary);
            });
    }

    return (
        <div className={'options'}>
            <div className={'title'}>
                Settings
            </div>
            <div className={'options-list'}>
                <div className={'option'}>
                    <label for="stitchSize">Stitch size (px)</label>
                    <input
                        id="stitchSize"
                        type="number"
                        value={stitchSize}
                        onChange={e => setStitchSize(parseInt(e.target.value))}
                        min="1"
                        max="8"
                    />
                </div>
                <div className={'option'}>
                    <label for="maxColors">Maximum number of colors</label>
                    <input
                        id="maxColors"
                        type="number"
                        value={maxColors}
                        onChange={e => setMaxColors(parseInt(e.target.value))}
                        min="2"
                    />
                </div>
                <div className={'option'}>
                    <label for="outputStitchSize">Stitch size in output image (px)</label>
                    <input
                        type="number"
                        value={outputStitchSize}
                        onChange={e => setOutputStitchSize(parseInt(e.target.value))}
                        min="1"
                        max="8"
                    />
                </div>
                <div className={'option'}>
                    <label for="net">Draw a net separating stitches</label>
                    <label class="switch">
                        <input
                            id="net"
                            type="checkbox"
                            value={net}
                            onChange={e => setNet(e.target.checked)}
                        />
                        <span class="slider"></span>
                    </label>
                </div>
                <div className={'option'}>
                    <label for="quantizerType">Color quantization algorithm</label>
                    <select
                        id="quantizerType"
                        value={quantizerType}
                        onChange={e => setQuantizerType(e.target.value)}
                    >
                        <option value={quantizerTypes.Octree}>Octree</option>
                        <option value={quantizerTypes.KMeans}>K-Means</option>
                        <option value={quantizerTypes.MedianCut}>Median cut</option>
                        <option value={quantizerTypes.Popularity}>Popularity</option>
                        <option value={quantizerTypes.SimplePopularity}>Simple popularity</option>
                    </select>
                </div>
                {
                    quantizerType == quantizerTypes.Octree &&
                    <div className={'option'}>
                        <label for="octreeMode">Merge order for octee algorithm</label>
                        <select
                            id="octreeMode"
                            value={octreeMode}
                            onChange={e => setOctreeMode(e.target.value)}
                        >
                            <option value={octreeModes.LeastImportant}>Merge least popular colors first</option>
                            <option value={octreeModes.MostImportant}>Merge most popular colors first</option>
                        </select>
                    </div>
                }
                <div className={'option'}>
                    <label for="operationOrder">Order of operations</label>
                    <select
                        id="operationOrder"
                        value={operationOrder}
                        onChange={e => setOperationOrder(e.target.value)}
                    >
                        <option value={operationOrders.QuantizeFirst}>Quantize first</option>
                        <option value={operationOrders.ReplacePixelsFirst}>Replace pixels with DMC colors first</option>
                    </select>
                </div>
            </div>
            <div className={'buttons'}>
                <button type="button" onClick={() => getPreview()}>Generate preview</button>
                <button type="button" onClick={() => getSpreadsheet()}>Generate spreadsheet</button>
            </div>
        </div>
    );
}