using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EmroiderOnline.Models.Requests
{
    public class ModifyPaletteRequest
    {
        public List<Embroider.Floss> Flosses { get; set; }
        public string Guid { get; set; }
    }
}
