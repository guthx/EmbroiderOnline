using Embroider;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EmroiderOnline.Models
{
    public class Dmc
    {
        public string Number { get; set; }
        public string Description { get; set; }
        public string HexRGB { get; set; }
        public int Count { get; set; }
    }
    public class SummaryResponse
    {
        public List<Dmc> Flosses { get; set; }
        public int Height { get; set; }
        public int Width { get; set; }
        public SummaryResponse(Summary summary)
        {
            Flosses = new List<Dmc>();
            foreach(var flossCount in summary.FlossCount)
            {
                var hex = "#" + ((int)flossCount.Key.Red).ToString("X2") + ((int)flossCount.Key.Green).ToString("X2") + ((int)flossCount.Key.Blue).ToString("X2");
                Flosses.Add(new Dmc
                {
                    Count = flossCount.Value,
                    Description = flossCount.Key.Description,
                    Number = flossCount.Key.Number,
                    HexRGB = hex
                });
            }
            Height = summary.Height;
            Width = summary.Width;
        }
    }
}
