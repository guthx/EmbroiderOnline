# Embroider
Embroider is an application for cross-stitching fans that allows for generating embroidery patterns from images and manage cross-stiching projects.

This web application uses another one of my projects as a library to operate on images and create the patterns from them. That project can be found here:
https://github.com/guthx/Embroider

The app offers 2 main functionalities: pattern generation and project management.

## Pattern generation
With Embroider you can generate embroidery patterns from any image. The app uses various color quantization algorithms (MMCQ, Wu's algorithm, Octree, etc.) and dithering algorithms (Atkinson, Floyd-Steinberg, etc.) to create cross-stitching patterns using actual DMC floss colors to allow for an easy transition to an actual, physical project. Different images end up looking differently based on algorithms and color spaces used, and as such, the application offers a multitude of options to allow users to create the best looking patterns.

## Project management
Generated cross-stitch patterns can be saved as projects, which then can be managed and edited in a sub-application made in PixiJS. The app allows to easily track the completion of each individual stitch in the pattern and a plethora of other options majorly helping the stitching proccess, such as isolating selected colors from the pattern, marking stitches for completion in selected areas and tracking used and necessary floss.

## Demo
The application's demo is available on
https://embroider.herokuapp.com/
