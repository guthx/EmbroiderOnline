using EmroiderOnline.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EmroiderOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectController : ControllerBase
    {
        private readonly ProjectService _projectService;

        public ProjectController(ProjectService projectService)
        {
            _projectService = projectService;
        }

        [HttpGet]
        [Authorize]
        public ActionResult GetProjects()
        {
            try
            {
                var userId = HttpContext.User.Identity.Name;
                var response = _projectService.GetProjects(userId);
                if (response == null)
                    return StatusCode(400);
                else
                    return new JsonResult(response);
            }
            catch (Exception)
            {
                return StatusCode(500);
            }
        }
        /*
        [HttpGet("{id}")]
        [Authorize]
        public ActionResult GetProject(string id)
        {
            try
            {
                var userId = HttpContext.User.Identity.Name;
                var response = _projectService.GetProject(userId, id);
                if (response == null)
                    return StatusCode(404);
                else
                    return new JsonResult(response);
            }
            catch (Exception)
            {
                return StatusCode(500);
            }
        }
        */
    }
}
