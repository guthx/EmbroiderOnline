using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Embroider;
using System.IO;
using EmroiderOnline.Models;
using System.Drawing;
using Emgu.CV;
using Emgu.CV.Structure;
using System.Collections.Concurrent;
using Microsoft.AspNetCore.Http;
using Embroider.Quantizers;
using System.Drawing.Imaging;

namespace EmroiderOnline.Services
{
    public class EmbroiderService
    {
        private static ConcurrentDictionary<Guid, Embroider.Embroider> _embroiders = new ConcurrentDictionary<Guid, Embroider.Embroider>();

        public EmbroiderService() 
        { 
        }

        public bool CreateEmbroider(IFormFile file, string fileName, string guid)
        {

            if (!fileName.EndsWith(".jpg") &&
                !fileName.EndsWith(".png") &&
                !fileName.EndsWith(".gif"))
                return false;

            var id = Guid.Parse(guid);
            var bitmap = new Bitmap(file.OpenReadStream());
            var image = bitmap.ToImage<Lab, double>();
            var embroider = new Embroider.Embroider(image);
            _embroiders.AddOrUpdate(id, embroider, (key, val) => embroider);
            return true;
        }

        public Image<Lab, double> GetPreviewImage(OptionsRequest request)
        {
            Embroider.Embroider embroider;
            if(_embroiders.TryGetValue(Guid.Parse(request.Guid), out embroider))
            {
                QuantizerType quantizerType;
                switch (request.QuantizerType)
                {
                    case "KMeans":
                        quantizerType = QuantizerType.KMeans;
                        break;
                    case "Octree":
                        quantizerType = QuantizerType.Octree;
                        break;
                    case "MedianCut":
                        quantizerType = QuantizerType.MedianCut;
                        break;
                    case "Popularity":
                        quantizerType = QuantizerType.Popularity;
                        break;
                    case "SimplePopularity":
                        quantizerType = QuantizerType.SimplePopularity;
                        break;
                    default:
                        quantizerType = QuantizerType.Octree;
                        break;
                }
                OperationOrder operationOrder;
                switch (request.OperationOrder)
                {
                    case "QuantizeFirst":
                        operationOrder = OperationOrder.QuantizeFirst;
                        break;
                    case "ReplacePixelsFirst":
                        operationOrder = OperationOrder.ReplacePixelsFirst;
                        break;
                    default:
                        operationOrder = OperationOrder.QuantizeFirst;
                        break;
                }
                MergeMode octreeMode;
                switch (request.OctreeMode)
                {
                    case "LeastImportant":
                        octreeMode = MergeMode.LEAST_IMPORTANT;
                        break;
                    case "MostImportant":
                        octreeMode = MergeMode.MOST_IMPORTANT;
                        break;
                    default:
                        octreeMode = MergeMode.LEAST_IMPORTANT;
                        break;
                }
                var options = new EmbroiderOptions
                {
                    StichSize = request.StitchSize,
                    OutputStitchSize = request.OutputStitchSize,
                    MaxColors = request.MaxColors,
                    Net = request.Net,
                    QuantizerType = quantizerType,
                    OctreeMode = octreeMode,
                    OperationOrder = operationOrder
                };
                embroider.Options = options;
                return embroider.GenerateImage();
            }
            return null;
        }

    }
}
