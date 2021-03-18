import React, { useState } from 'react';
import { useEffect } from 'react';
import { tabType } from './EmbroiderMain'
import InfoIcon from '@material-ui/icons/Info';
import { Dialog, DialogTitle, Tooltip } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import Collapse from '@material-ui/core/Collapse';
import { authService } from '../AuthService';
import CreateProject from './CreateProject';

const quantizerTypes = {
    Octree: "Octree",
    KMeans: "KMeans",
    MedianCut: "MedianCut",
    Popularity: "Popularity",
    SimplePopularity: "SimplePopularity",
    ModifiedMedianCut: "ModifiedMedianCut"
}

const dithererTypes = {
    Atkinson: "Atkinson",
    FloydSteinberg: "FloydSteinberg",
    Pigeon: "Pigeon",
    Sierra: "Sierra",
    Stucki: "Stucki",
    None: "None"
}

const colorComparerTypes = {
    WeightedEuclideanDistance: "WeightedEuclideanDistance",
    EuclideanDistance: "EuclideanDistance",
    CMC: "CMC",
    DE2000: "DE2000",
    DE76: "DE76"
}

const colorSpaceTypes = {
    Rgb: "Rgb",
    Hsv: "Hsv",
    Lab: "Lab",
    Luv: "Luv",
    Ycc: "Ycc"
}


const octreeModes = {
    LeastImportant: "LeastImportant",
    MostImportant: "MostImportant"
}

const sizeInputs = {
    stitchSize: 0,
    stitchWidth: 1
}

const tooltips = {
    stitchSize: "Defines how many pixels from original image will make up a single stitch",

    colorSpace: "Defines the color space used to generate the palette of colors.\
        Different quantization algorithms might work better with different color spaces depending on image's character.",
    stitchWidth: "Number of stitches in the width, calculated from stitch size.\
        Can be forced to any value, but color loss or artifacts might occur.",
    maxColors: "Maximum number of unique colors.\
        The calculated number might be lower depending on the image and quantization algorithm.",
    outputStitchSize: "Defines how much space (in pixels) will each stitch take in the calculated image.",
    net: "Selecting this option will cause a net to be drawn in the output image, separating each stitch.",
    quantizerType: "Algorithm used to reduce the number of colors in the image.\
        Use the popularity algorithms only for images with few colors.",
    octreeMode: "Defines the way in which colors are reduced in the octree algorithm.\
        Merging least popular colors first will make shading look more natural at the cost of losing small details.",
    dithererType: "Defines dithering algorithm used to cause more natural transition between hues at the cost of adding noise to the image.",
    dithererStrength: "Defines the strength of dithering. Lower this value if the image is too noisy.",
    colorComparer: "Defines the formula used to calculate the difference between colors. Try changing it if the stitch colors don't match the original image well.",

}

export function EmbroiderOptions({ guid, setPreviewImage, setLoading, setSelectedTab, setLoadingSpreadsheet, setSummary, setTimeout, imageName, imageSize, selectedTab, uploadNewImage }) {
    const [stitchSize, setStitchSize] = useState(4);
    const [maxColors, setMaxColors] = useState(32);
    const [outputStitchSize, setOutputStitchSize] = useState(4);
    const [net, setNet] = useState(false);
    const [quantizerType, setQuantizerType] = useState(quantizerTypes.ModifiedMedianCut);
    const [octreeMode, setOctreeMode] = useState(octreeModes.LeastImportant);
    const [stitchWidth, setStitchWidth] = useState(0);
    const [dithererType, setDithererType] = useState(dithererTypes.Atkinson);
    const [colorSpace, setColorSpace] = useState(colorSpaceTypes.Rgb);
    const [colorComparer, setColorComparer] = useState(colorComparerTypes.WeightedEuclideanDistance);
    const [dithererStrength, setDithererStrength] = useState(10);
    const [dimmedInput, setDimmedInput] = useState(sizeInputs.stitchWidth);
    const [advancedTab, setAdvancedTab] = useState(false);


    useEffect(() => {
        setStitchWidth(parseInt(imageSize.width / stitchSize));
    }, [imageSize])

    const clampValue = (e, setValue) => {
        if (e.target.value == "") {
            setValue(e.target.min);
            return;
        }
        var val = parseInt(e.target.value);
        var min = parseInt(e.target.min);
        var max = parseInt(e.target.max);
        if (val < min)
            setValue(min);
        else if (val > max)
            setValue(max);
    }

    const getPreview = () => {
        var prevTab = selectedTab;
        setSelectedTab(tabType.PREVIEW);
        setLoading(true);
        var request = {
            stitchSize: stitchSize,
            widthStitchCount: stitchWidth,
            maxColors: maxColors,
            outputStitchSize: outputStitchSize,
            net: net,
            quantizerType: quantizerType,
            octreeMode: octreeMode,
            colorComparerType: colorComparer,
            dithererType: dithererType,
            colorSpace: colorSpace,
            dithererStrength: dithererStrength,
            guid: guid
        }
        fetch('api/embroider/preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request),
        })
            .then(res => {
                if (res.status == 400) {
                    setTimeout(true);
                    setSelectedTab(prevTab);
                    throw new Error("Timeout");
                }
                return res.blob();
            })
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
            widthStitchCount: stitchWidth,
            maxColors: maxColors,
            outputStitchSize: outputStitchSize,
            net: net,
            quantizerType: quantizerType,
            octreeMode: octreeMode,
            colorComparerType: colorComparer,
            dithererType: dithererType,
            colorSpace: colorSpace,
            dithererStrength: dithererStrength,
            guid: guid
        }
        fetch('api/embroider/spreadsheet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        })
            .then(res => {
                if (res.status == 400) {
                    setTimeout(true);
                    throw new Error("Timeout");
                }
                return res.blob();
            })
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
            .then(res => {
                if (res.status == 400)
                    throw new Error("Timeout");
                return res.json();
            })
            .then(summary => {
                setSummary(summary);
            })
            .catch(ex => {})
    }

    const OptionTooltip = withStyles((theme) => ({
        tooltip: {
            backgroundColor: '#2e2e2e',
            color: 'white',
            borderRadius: '3px',
            fontSize: 14
        }
    }))(Tooltip);

    return (
        <div className={'options'}>
            <div className={'title'}>
                Settings
            </div>
            <div className={'options-list'}>
                <div className={`option`}>
                    <label for="stitchSize">
                        Stitch size (px)
                        <OptionTooltip title={tooltips.stitchSize} placement="left" className={'tool-tip'}>
                            <InfoIcon fontSize={"small"} />
                        </OptionTooltip>
                    </label>
                    <input
                        id="stitchSize"
                        type="number"
                        className={`${dimmedInput == sizeInputs.stitchSize ? "dimmed" : ""}`}
                        value={stitchSize}
                        onChange={e => {
                            var val = parseInt(e.target.value);
                            setStitchSize(val);
                            setStitchWidth(parseInt(imageSize.width / val));
                            setDimmedInput(sizeInputs.stitchWidth);
                        }}
                        onBlur={e => {
                            if (e.target.value == "") {
                                var val = parseInt(Math.ceil(imageSize.width / 500));
                                setStitchSize(val);
                                setStitchWidth(parseInt(imageSize.width / val));
                            }
                            else {
                                var val = parseInt(e.target.value);
                                var max = parseInt(imageSize.width / 5);
                                var min = parseInt(Math.ceil(imageSize.width / 500));
                                if (val > max)
                                    val = max;
                                else if (val < min)
                                    val = min;
                                setStitchSize(val);
                                setStitchWidth(parseInt(imageSize.width / val));
                            }
                        }}
                    />
                </div>
                <div className={`option`}>
                    <label for="stitchWidth">
                        Number of stitches (width)
                        <OptionTooltip title={tooltips.stitchWidth} placement="left" className={'tool-tip'}>
                            <InfoIcon fontSize={"small"} />
                        </OptionTooltip>
                    </label>
                    <input
                        id="stitchWidth"
                        type="number"
                        value={stitchWidth}
                        className={`${dimmedInput == sizeInputs.stitchWidth ? "dimmed" : ""}`}
                        onChange={e => {
                            setStitchSize(0);
                            setStitchWidth(parseInt(e.target.value));
                            setDimmedInput(sizeInputs.stitchSize);
                        }}
                        onBlur={e => {
                            if (e.target.value == "")
                                setStitchWidth(100);
                            else {
                                var val = parseInt(e.target.value);
                                var min = 5;
                                var max = 500;
                                if (val > max)
                                    val = max;
                                else if (val < min)
                                    val = min;
                                setStitchWidth(val);
                            }
                        }}
                    />
                </div>
                <div className={'option'}>
                    <label for="maxColors">
                        Maximum number of colors
                        <OptionTooltip title={tooltips.maxColors} placement="left" className={'tool-tip'}>
                            <InfoIcon fontSize={"small"} />
                        </OptionTooltip>
                    </label>
                    <input
                        id="maxColors"
                        type="number"
                        value={maxColors}
                        onChange={e => setMaxColors(parseInt(e.target.value))}
                        onBlur={e => clampValue(e, setMaxColors)}
                        min="2"
                        max="200"
                    />
                </div>
                <div className={'option'}>
                    <label for="outputStitchSize">
                        Stitch size in output image (px)
                        <OptionTooltip title={tooltips.outputStitchSize} placement="left" className={'tool-tip'}>
                            <InfoIcon fontSize={"small"} />
                        </OptionTooltip>
                    </label>
                    <input
                        type="number"
                        value={outputStitchSize}
                        onChange={e => setOutputStitchSize(parseInt(e.target.value))}
                        onBlur={e => clampValue(e, setOutputStitchSize)}
                        min="1"
                        max="8"
                    />
                </div>
                <div className={'option'}>
                    <label for="net">
                        Draw a net separating stitches
                        <OptionTooltip title={tooltips.net} placement="left" className={'tool-tip'}>
                            <InfoIcon fontSize={"small"} />
                        </OptionTooltip>
                    </label>
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
                <div
                    onClick={e => setAdvancedTab(!advancedTab)}
                    className={'advanced-tab-title'}>
                    Advanced settings
                    {
                        !advancedTab ? <ArrowRightIcon /> : <ArrowDropDownIcon />
                    }
                </div>
                <Collapse in={advancedTab}>
                    <div className={'option'}>
                        <label for="quantizerType">
                            Color quantization algorithm
                        <OptionTooltip title={tooltips.quantizerType} placement="left" className={'tool-tip'}>
                                <InfoIcon fontSize={"small"} />
                            </OptionTooltip>
                        </label>
                        <select
                            id="quantizerType"
                            value={quantizerType}
                            onChange={e => setQuantizerType(e.target.value)}
                        >
                            <option value={quantizerTypes.Octree}>Octree</option>
                            <option value={quantizerTypes.KMeans}>K-Means</option>
                            <option value={quantizerTypes.MedianCut}>Median cut</option>
                            <option value={quantizerTypes.ModifiedMedianCut}>Modified median cut</option>
                            <option value={quantizerTypes.Popularity}>Popularity</option>
                            <option value={quantizerTypes.SimplePopularity}>Simple popularity</option>
                        </select>
                    </div>
                    {
                        quantizerType == quantizerTypes.Octree &&
                        <div className={'option'}>
                            <label for="octreeMode">
                                Merge order for octee algorithm
                            <OptionTooltip title={tooltips.octreeMode} placement="left" className={'tool-tip'}>
                                    <InfoIcon fontSize={"small"} />
                                </OptionTooltip>
                            </label>
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
                        <label for="dithererType">
                            Dithering algorithm
                        <OptionTooltip title={tooltips.dithererType} placement="left" className={'tool-tip'}>
                                <InfoIcon fontSize={"small"} />
                            </OptionTooltip>
                        </label>
                        <select
                            id="dithererType"
                            value={dithererType}
                            onChange={e => setDithererType(e.target.value)}
                        >
                            <option value={dithererTypes.Atkinson}>Atkinson</option>
                            <option value={dithererTypes.FloydSteinberg}>Floyd-Steinberg</option>
                            <option value={dithererTypes.Sierra}>Sierra</option>
                            <option value={dithererTypes.Stucki}>Stucki</option>
                            <option value={dithererTypes.Pigeon}>Pigeon</option>
                            <option value={dithererTypes.None}>None</option>
                        </select>
                    </div>
                    <div className={'option'}>
                        <label for="dithererStrength">
                            Dithering strength
                        <OptionTooltip title={tooltips.dithererStrength} placement="left" className={'tool-tip'}>
                                <InfoIcon fontSize={"small"} />
                            </OptionTooltip>
                        </label>
                        <input
                            id="dithererStrength"
                            type="number"
                            value={dithererStrength}
                            onChange={e => setDithererStrength(parseInt(e.target.value))}
                            onBlur={e => clampValue(e, setDithererStrength)}
                            min="0"
                            max="255"
                        />
                        <input
                            type="range"
                            value={dithererStrength}
                            onChange={e => setDithererStrength(parseInt(e.target.value))}
                            onBlur={e => clampValue(e, setDithererStrength)}
                            min="0"
                            max="255" />
                    </div>
                    <div className={'option'}>
                        <label for="colorComparer">
                            Color comparison method
                        <OptionTooltip title={tooltips.colorComparer} placement="left" className={'tool-tip'}>
                                <InfoIcon fontSize={"small"} />
                            </OptionTooltip>
                        </label>
                        <select
                            id="colorComparer"
                            value={colorComparer}
                            onChange={e => setColorComparer(e.target.value)}
                        >
                            <option value={colorComparerTypes.EuclideanDistance}>Euclidean distance</option>
                            <option value={colorComparerTypes.WeightedEuclideanDistance}>Weighted Euclidean distance</option>
                            <option value={colorComparerTypes.CMC}>DE CMC</option>
                            <option value={colorComparerTypes.DE76}>DE76</option>
                            <option value={colorComparerTypes.DE2000}>DE2000</option>
                        </select>
                    </div>
                    <div className={'option'}>
                        <label for="colorSpace">
                            Color space
                        <OptionTooltip title={tooltips.colorSpace} placement="left" className={'tool-tip'}>
                                <InfoIcon fontSize={"small"} />
                            </OptionTooltip>
                        </label>
                        <select
                            id="colorSpace"
                            value={colorSpace}
                            onChange={e => setColorSpace(e.target.value)}
                        >
                            <option value={colorSpaceTypes.Rgb}>RGB</option>
                            <option value={colorSpaceTypes.Hsv}>HSV</option>
                            <option value={colorSpaceTypes.Lab}>CIELab</option>
                            <option value={colorSpaceTypes.Luv}>CIELUV</option>
                            <option value={colorSpaceTypes.Ycc}>YCbCr</option>
                        </select>
                    </div>
                </Collapse>
            </div>
            <div className={'buttons'}>
                <CreateProject guid={guid} />
                <button type="button" onClick={() => getPreview()}>Generate preview</button>
                <button type="button" onClick={() => getSpreadsheet()}>Generate spreadsheet</button>
                <label for="file-upload">
                    Upload new image
                </label>
                <input type="file"
                    id="file-upload"
                    onChange={(e) => uploadNewImage(e)}
                    accept=".gif, .jpeg, .jpg, .png, .bmp"
                />
            </div>
            
        </div>
    );
}