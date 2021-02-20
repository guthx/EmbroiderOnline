using Emgu.CV;
using EmroiderOnline.Models;
using EmroiderOnline.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace EmroiderOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmbroiderController : ControllerBase
    {
        private EmbroiderService _embroiderService;
        public EmbroiderController(EmbroiderService embroiderService)
        {
            _embroiderService = embroiderService;
        }
        [HttpGet]
        public ActionResult<string> GetGuid()
        {
            try
            {
                return Guid.NewGuid().ToString();
            }
            catch (Exception)
            {
                return StatusCode(500);
            }
        }
        public class CreateEmbroiderRequest
        {
            public string ImageName { get; set; }
            public IFormFile FormFile { get; set; }
            public string Guid { get; set; }
        }
        [HttpPost]
        public ActionResult<string> CreateEmbroider([FromForm] CreateEmbroiderRequest request)
        {
            try
            {
                if (!_embroiderService.CreateEmbroider(request.FormFile, request.ImageName, request.Guid))
                {
                    return StatusCode(400);
                } else
                {
                    return StatusCode(200);
                }
            }
            catch (Exception)
            {
                return StatusCode(500);
            }
        }

        

        [HttpPost("preview")]
        public ActionResult GetPreviewImage([FromBody] OptionsRequest request)
        {
            try
            {
                var image = _embroiderService.GetPreviewImage(request);
                if (image == null)
                    return StatusCode(400);
                var bitmap = image.ToBitmap();
                using (var stream = new MemoryStream())
                {
                    bitmap.Save(stream, ImageFormat.Png);
                    return File(stream.ToArray(), "image/png");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500);
            }
        }
    }
}
