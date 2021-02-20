using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EmroiderOnline.Models
{
    public class ImageFile
    {
        public string ImageName { get; set; }
        public IFormFile FormFile { get; set; }
    }
}
