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
using OfficeOpenXml;
using static Embroider.Enums;
using System.Timers;
using MongoDB.Driver;

namespace EmroiderOnline.Services
{
    public class EmbroiderService
    {
        private static ConcurrentDictionary<Guid, Embroider.Embroider> _embroiders = new ConcurrentDictionary<Guid, Embroider.Embroider>();
        private static ConcurrentDictionary<Guid, Timer> _deletionTimers = new ConcurrentDictionary<Guid, Timer>();
        private readonly IMongoCollection<User> _users;
        public EmbroiderService(IMongoClient client) 
        {
            var db = client.GetDatabase("Embroider");
            _users = db.GetCollection<User>("Users");
        }

        public bool CreateEmbroider(IFormFile file, string fileName, string guid)
        {

            if (!fileName.EndsWith(".jpg") &&
                !fileName.EndsWith(".png") &&
                !fileName.EndsWith(".gif"))
                return false;

            var id = Guid.Parse(guid);
            var bitmap = new Bitmap(file.OpenReadStream());
            var image = bitmap.ToImage<Rgb, double>();
            var embroider = new Embroider.Embroider(image);
            _embroiders.AddOrUpdate(id, embroider, (key, val) => embroider);
            var timer = new Timer(30000);
            timer.Elapsed += (obj, args) =>
            {
                _embroiders.Remove(id, out _);
                _deletionTimers.Remove(id, out _);
                timer.Dispose();
            };
            timer.AutoReset = false;
            timer.Start();
            _deletionTimers.AddOrUpdate(id, timer, (key, val) => timer);
            return true;
        }

        public Image<Rgb, double> GetPreviewImage(OptionsRequest request)
        {
            Embroider.Embroider embroider;
            if(_embroiders.TryGetValue(Guid.Parse(request.Guid), out embroider))
            {
                setEmbroiderOptions(embroider, request);
                resetDeletionTimer(Guid.Parse(request.Guid));
                return embroider.GenerateImage();
            }
            return null;
        }

        public ExcelPackage GetSpreadsheet(OptionsRequest request)
        {
            Embroider.Embroider embroider;
            if (_embroiders.TryGetValue(Guid.Parse(request.Guid), out embroider))
            {
                setEmbroiderOptions(embroider, request);
                resetDeletionTimer(Guid.Parse(request.Guid));
                return embroider.GenerateExcelSpreadsheet();
            }
            return null;
        }

        public Summary GetSummary(string guid)
        {
            Embroider.Embroider embroider;
            if (_embroiders.TryGetValue(Guid.Parse(guid), out embroider))
            {
                resetDeletionTimer(Guid.Parse(guid));
                return embroider.GetSummary();
            }
            return null;
        }
        public enum CreateProjectResult
        {
            Created, NameTaken, NotLoggedIn, NoImage
        }

        public CreateProjectResult CreateProject(string guid, string userId, string name)
        {
            Embroider.Embroider embroider;
            if (_embroiders.TryGetValue(Guid.Parse(guid), out embroider))
            {
                var user = _users.Find(u => u.Id == userId).FirstOrDefault();
                if (user == null)
                    return CreateProjectResult.NotLoggedIn;
                if (user.Projects != null && user.Projects.Exists(p => p.Name == name))
                    return CreateProjectResult.NameTaken;
                var image = embroider.GenerateImage();
                var stitchMap = embroider.GetStitchMap();

                var project = new Project(name, stitchMap, image);

                _users.UpdateOne(u => u.Id == userId, Builders<User>.Update.AddToSet(u => u.Projects, project));
                resetDeletionTimer(Guid.Parse(guid));
                return CreateProjectResult.Created;

            }
            return CreateProjectResult.NoImage;
        }

        private void setEmbroiderOptions(Embroider.Embroider embroider, OptionsRequest request)
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
                case "ModifiedMedianCut":
                    quantizerType = QuantizerType.ModifiedMedianCut;
                    break;
                default:
                    quantizerType = QuantizerType.Octree;
                    break;
            }
            DithererType dithererType;
            switch (request.DithererType)
            {
                case "Atkinson":
                    dithererType = DithererType.Atkinson;
                    break;
                case "FloydSteinberg":
                    dithererType = DithererType.FloydSteinberg;
                    break;
                case "Pigeon":
                    dithererType = DithererType.Pigeon;
                    break;
                case "Stucki":
                    dithererType = DithererType.Stucki;
                    break;
                case "Sierra":
                    dithererType = DithererType.Sierra;
                    break;
                case "None":
                    dithererType = DithererType.None;
                    break;
                default:
                    dithererType = DithererType.Atkinson;
                    break;
            }
            ColorSpace colorSpace;
            switch (request.ColorSpace)
            {
                case "Rgb":
                    colorSpace = ColorSpace.Rgb;
                    break;
                case "Ycc":
                    colorSpace = ColorSpace.Ycc;
                    break;
                case "Luv":
                    colorSpace = ColorSpace.Luv;
                    break;
                case "Lab":
                    colorSpace = ColorSpace.Lab;
                    break;
                case "Hsv":
                    colorSpace = ColorSpace.Hsv;
                    break;
                default:
                    colorSpace = ColorSpace.Rgb;
                    break;
            }
            ColorComparerType colorComparer;
            switch (request.ColorComparerType)
            {
                case "WeightedEuclideanDistance":
                    colorComparer = ColorComparerType.WeightedEuclideanDistance;
                    break;
                case "EuclideanDistance":
                    colorComparer = ColorComparerType.EuclideanDistance;
                    break;
                case "CMC":
                    colorComparer = ColorComparerType.CMC;
                    break;
                case "DE2000":
                    colorComparer = ColorComparerType.DE2000;
                    break;
                case "DE76":
                    colorComparer = ColorComparerType.DE76;
                    break;
                default:
                    colorComparer = ColorComparerType.WeightedEuclideanDistance;
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
                StitchSize = request.StitchSize,
                OutputStitchSize = request.OutputStitchSize,
                MaxColors = request.MaxColors,
                Net = request.Net,
                QuantizerType = quantizerType,
                OctreeMode = octreeMode,
                ColorSpace = colorSpace,
                ColorComparerType = colorComparer,
                DithererType = dithererType,
                DithererStrength = request.DithererStrength,
                WidthStitchCount = request.WidthStitchCount
            };
            resetDeletionTimer(Guid.Parse(request.Guid));
            embroider.Options = options;
        }

        private void resetDeletionTimer(Guid guid)
        {
            Timer timer;
            if (_deletionTimers.TryGetValue(guid, out timer))
            {
                timer.Stop();
                timer.Start();
            }
        }

    }
}
