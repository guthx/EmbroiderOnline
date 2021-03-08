using Emgu.CV;
using EmroiderOnline.Models;
using EmroiderOnline.Models.Requests;
using EmroiderOnline.Services;
using Microsoft.AspNetCore.Authorization;
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

        [HttpPost("spreadsheet")]
        public ActionResult GetSpreadsheet([FromBody] OptionsRequest request)
        {
            try
            {
                var spreadsheet = _embroiderService.GetSpreadsheet(request);
                if (spreadsheet == null)
                    return StatusCode(400);
                var data = spreadsheet.GetAsByteArray();
                spreadsheet = null;
                return File(data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            }
            catch (Exception)
            {
                return StatusCode(500);
            }
        }

        [HttpGet("summary")]
        public ActionResult GetSummary(string guid)
        {
            try
            {
                var summary = _embroiderService.GetSummary(guid);
                if (summary == null)
                    return StatusCode(400);
                return new JsonResult(new SummaryResponse(summary));
            }
            catch (Exception)
            {
                return StatusCode(500);
            }
        }

        
        [HttpPost("createProject")]
        [Authorize]
        public ActionResult<string> CreateProject([FromBody] CreateProjectRequest request)
        {
            try
            {
                var userId = User.Identity.Name;
                var response = _embroiderService.CreateProject(request.Guid, userId, request.Name);
                switch (response)
                {
                    case EmbroiderService.CreateProjectResult.Created:
                        return Ok("Created");
                    case EmbroiderService.CreateProjectResult.NameTaken:
                        return BadRequest("You already have a project with that name");
                    case EmbroiderService.CreateProjectResult.NoImage:
                        return BadRequest("Timeout");
                    case EmbroiderService.CreateProjectResult.NotLoggedIn:
                        return BadRequest("You must be logged in to create a project");
                    default:
                        return StatusCode(500);
                }

            }
            catch (Exception ex)
            {
                return StatusCode(500);
            }
            
            
        }
    }
}
