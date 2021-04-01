import React, { useState } from 'react';
import { useEffect } from 'react';
import InfoIcon from '@material-ui/icons/Info';
import { Tooltip } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import Collapse from '@material-ui/core/Collapse';
import { Icon, InlineIcon } from '@iconify/react';
import angleLine from '@iconify-icons/clarity/angle-line';

import CreateProject from './CreateProject';
import { quantizerTypes, dithererTypes, colorComparerTypes, colorSpaceTypes, octreeModes, sizeInputs, tabType } from '../Enums';

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
    const [presetsTab, setPresetsTab] = useState(true);
    const [presets, setPresets] = useState([]);
    const [presetName, setPresetName] = useState("");
    const [selectedPreset, setSelectedPreset] = useState(null);

    useEffect(() => {
        setStitchWidth(parseInt(imageSize.width / stitchSize));
    }, [imageSize]);

    useEffect(() => {
        if (selectedPreset != null) {
            let preset = presets[selectedPreset];
            setStitchSize(preset.stitchSize);
            setMaxColors(preset.maxColors);
            setOutputStitchSize(preset.outputStitchSize);
            setNet(preset.net);
            setQuantizerType(preset.quantizerType);
            setOctreeMode(preset.octreeMode);
            setStitchWidth(preset.stitchWidth);
            setDithererType(preset.dithererType);
            setColorSpace(preset.colorSpace);
            setColorComparer(preset.colorComparer);
            setDithererStrength(preset.dithererStrength);
        }
    }, [selectedPreset]);

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
                a.download = imageName.split('.')[0] + '.xlsx';
                a.click();
            })
            .catch(ex => {
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
            .catch(ex => { })
    }

    const addPreset = () => {
        let newPreset = {
            name: presetName,
            stitchSize,
            maxColors,
            outputStitchSize,
            stitchWidth,
            net,
            quantizerType,
            dithererType,
            dithererStrength,
            colorSpace,
            colorComparer
        };
        setPresets([...presets, newPreset]);
    }

    const deletePreset = () => {
        setPresets(presets.filter((p, i) => i != selectedPreset));
        setSelectedPreset(null);
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
        <>
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
                                setSelectedPreset(null);
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
                                setSelectedPreset(null);
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
                            onChange={e => {
                                setMaxColors(parseInt(e.target.value));
                                setSelectedPreset(null);
                            }}
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
                            onChange={e => {
                                setOutputStitchSize(parseInt(e.target.value));
                                setSelectedPreset(null);
                            }}
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
                                onChange={e => {
                                    setNet(e.target.checked);
                                    setSelectedPreset(null);
                                }}
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
                                onChange={e => {
                                    setQuantizerType(e.target.value);
                                    setSelectedPreset(null);
                                }}
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
                                    onChange={e => {
                                        setOctreeMode(e.target.value);
                                        setSelectedPreset(null);
                                    }}
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
                                onChange={e => {
                                    setDithererType(e.target.value);
                                    setSelectedPreset(null);
                                }}
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
                                onChange={e => {
                                    setDithererStrength(parseInt(e.target.value));
                                    setSelectedPreset(null);
                                }}
                                onBlur={e => clampValue(e, setDithererStrength)}
                                min="0"
                                max="255"
                            />
                            <input
                                type="range"
                                value={dithererStrength}
                                onChange={e => {
                                    setDithererStrength(parseInt(e.target.value));
                                    setSelectedPreset(null);
                                }}
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
                                onChange={e => {
                                    setColorComparer(e.target.value);
                                    setSelectedPreset(null);
                                }}
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
                                onChange={e => {
                                    setColorSpace(e.target.value);
                                    setSelectedPreset(null);
                                }}
                            >
                                <option value={colorSpaceTypes.Rgb}>RGB</option>
                                <option value={colorSpaceTypes.Lab}>CIELab</option>
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
            <div className={'presets'}>
                <div
                    className={'collapse-bar'}
                    onClick={() => setPresetsTab(!presetsTab)}
                >
                    <Icon icon={angleLine} rotate={`${presetsTab ? '90deg' : '270deg'}`} />
                </div>
                <div
                    className={'presets-main'}
                    style={{
                        display: `${presetsTab ? 'grid' : 'none'}`
                    }}
                >
                    <div className={'title'}>
                        Presets
                    </div>
                    <div className={'presets-list'}>
                        {
                            presets.length > 0 ?
                                presets.map((preset, i) => (
                                    <div
                                        className={`preset ${i == selectedPreset ? 'selected' : ''}`}
                                        key={i}
                                        onClick={() => setSelectedPreset(i)}
                                    >
                                        {presets[i].name}
                                    </div>
                                ))
                                :
                                <div className={'preset-info'}>
                                    You can save your current settings as a preset with the button below
                                </div>
                        }
                    </div>
                    <div className={'presets-buttons'}>
                        <input type="text"
                            placeholder="Preset name..."
                            value={presetName}
                            onChange={e => setPresetName(e.target.value)}
                        />
                        <button type="button"
                            onClick={() => {
                                addPreset();
                                setSelectedPreset(presets.length);
                                setPresetName("");
                            }}
                            disabled={presetName.length == 0}
                        >
                            Save preset
                        </button>
                        <button type="button"
                            disabled={selectedPreset == null}
                            onClick={() => {
                                deletePreset();
                            }}>
                            Delete preset
                        </button>
                    </div>
                </div>
            </div>
        </>

    );
}