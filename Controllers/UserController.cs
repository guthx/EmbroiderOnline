using EmroiderOnline.Models;
using EmroiderOnline.Models.Requests;
using EmroiderOnline.Models.Responses;
using EmroiderOnline.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EmroiderOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private UserService _userService;

        public UserController(UserService userService)
        {
            _userService = userService;
        }

        [HttpPost]
        public ActionResult<User> Register([FromBody]RegisterRequest request)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    var user = _userService.Register(request);
                    if (user == null)
                        return StatusCode(409, "E-mail is already taken");
                    if (user.Id == null)
                        return StatusCode(500, "An error has occured while trying to add user to database");
                    else
                        return StatusCode(200);
                }
                else
                    return StatusCode(400);
            }
            catch (Exception)
            {
                return StatusCode(500);
            }
        }

        [HttpPost("login")]
        public ActionResult<LoginResponse> Login([FromBody] LoginRequest request)
        {
            try
            {
                var response = _userService.Login(request);
                if (response == null)
                    return StatusCode(400);
                return response;
            }
            catch (Exception)
            {
                return StatusCode(500);
            }
        }
    }
}
