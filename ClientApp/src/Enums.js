export const cursorModes = {
    SELECT: 0,
    PAN: 1,
    ZOOM: 2,
    STITCH: 3,
    ERASE: 4,
};

export const colorModes = {
    TRANSPARENT_TO_OPAQUE: 0,
    OPAQUE_TO_COLOR: 1,
}

export const quantizerTypes = {
    Octree: "Octree",
    KMeans: "KMeans",
    MedianCut: "MedianCut",
    Popularity: "Popularity",
    SimplePopularity: "SimplePopularity",
    ModifiedMedianCut: "ModifiedMedianCut"
}

export const dithererTypes = {
    Atkinson: "Atkinson",
    FloydSteinberg: "FloydSteinberg",
    Pigeon: "Pigeon",
    Sierra: "Sierra",
    Stucki: "Stucki",
    None: "None"
}

export const colorComparerTypes = {
    WeightedEuclideanDistance: "WeightedEuclideanDistance",
    EuclideanDistance: "EuclideanDistance",
    CMC: "CMC",
    DE2000: "DE2000",
    DE76: "DE76"
}

export const colorSpaceTypes = {
    Rgb: "Rgb",
    Hsv: "Hsv",
    Lab: "Lab",
    Luv: "Luv",
    Ycc: "Ycc"
}


export const octreeModes = {
    LeastImportant: "LeastImportant",
    MostImportant: "MostImportant"
}

export const sizeInputs = {
    stitchSize: 0,
    stitchWidth: 1
}

export const tabType = {
    IMAGE: 0,
    PREVIEW: 1,
    SUMMARY: 2
}