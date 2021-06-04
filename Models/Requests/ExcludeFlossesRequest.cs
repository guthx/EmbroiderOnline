using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EmroiderOnline.Models.Requests
{
    public class ExcludeFlossesRequest
    {
        public List<string> ExcludedFlosses { get; set; }
        public string Guid { get; set; }
    }
}
