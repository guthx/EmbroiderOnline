using Emgu.CV;
using Emgu.CV.Structure;
using EmroiderOnline.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Drawing;
using System.Drawing.Imaging;
using OfficeOpenXml;

namespace EmroiderOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WeatherForecastController : ControllerBase
    {
        private static readonly string[] Summaries = new[]
        {
            "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        };

        private readonly ILogger<WeatherForecastController> _logger;

        public WeatherForecastController(ILogger<WeatherForecastController> logger)
        {
            _logger = logger;
        }

        [HttpGet]
        public IEnumerable<WeatherForecast> Get()
        {
            var rng = new Random();
            return Enumerable.Range(1, 5).Select(index => new WeatherForecast
            {
                Date = DateTime.Now.AddDays(index),
                TemperatureC = rng.Next(-20, 55),
                Summary = Summaries[rng.Next(Summaries.Length)]
            })
            .ToArray();
        }

        [HttpPost]
        public ActionResult Post([FromForm] ImageFile file)
        {
            try
            {
                var image = System.Drawing.Image.FromStream(file.FormFile.OpenReadStream());
                var bitmap = new Bitmap(image);
                // var stream = new FileStream(@"F:\Inne\ahri\wwwtest.png", FileMode.Create);
                // file.FormFile.CopyTo(stream)
                Image<Rgb, double> x = BitmapExtension.ToImage<Rgb, double>(bitmap);
                
                return StatusCode(200);
            }
            catch (Exception)
            {
                return StatusCode(500);
            }
        }

        [HttpGet("image")]
        public ActionResult GetImage()
        {
            try
            {
                /*
                var image = new Image<Rgb, double>(@"F:\Inne\ahri\ahri2.png");
                var bytes = image.Convert<Bgr, byte>().ToJpegData();
                

                return File(bytes, "image/jpeg");
                */
                var image = new Image<Rgb, double>(@"F:\Inne\ahri\ahri2.png");
                var cimage = image.ToBitmap();
                using (var stream = new MemoryStream())
                {
                    cimage.Save(stream, ImageFormat.Png);
                    return File(stream.ToArray(), "image/png");
                }
            }
            catch (Exception)
            {
                return StatusCode(500);
            }
        }

        [HttpGet("sheet")]
        public ActionResult GetSheet()
        {
            try
            {
                var stream = new MemoryStream();
                var p = new ExcelPackage(stream);
                p.Workbook.Worksheets.Add("Test");

                return File(p.GetAsByteArray(), "application/xlsx");
            }
            catch (Exception)
            {
                return StatusCode(500);
            }
        }
    }
}
