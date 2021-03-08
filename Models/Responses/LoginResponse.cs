using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EmroiderOnline.Models.Responses
{
    public class LoginResponse
    {
        public string Jwt { get; set; }
        public string Username { get; set; }
    }
}
