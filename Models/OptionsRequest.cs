using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EmroiderOnline.Models
{
    public class OptionsRequest
    {
        public string QuantizerType { get; set; }
        public string OperationOrder { get; set; }
        public int StitchSize { get; set; }
        public int MaxColors { get; set; }
        public int OutputStitchSize { get; set; }
        public bool Net { get; set; }
        public string OctreeMode { get; set; }
        public string Guid { get; set; }
    }
}
