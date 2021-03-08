using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace EmroiderOnline.Models.Requests
{
    public class RegisterRequest
    { 
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        [Required]
        [MinLength(3)]
        [MaxLength(18)]
        public string Username { get; set; }
        [Required]
        [MinLength(3)]
        [MaxLength(18)]
        public string Password { get; set; }
    }
}
