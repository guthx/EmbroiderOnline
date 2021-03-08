using Embroider;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Formatters.Binary;
using System.Threading.Tasks;

namespace EmroiderOnline.Models.Responses
{
    public class GetProjectResponse
    {
        public string Name { get; set; }
        public StitchMap StitchMap { get; set; }

        public GetProjectResponse(Project project)
        {
            using (var ms = new MemoryStream())
            {
                var bf = new BinaryFormatter();
                ms.Write(project.StitchMap, 0, project.StitchMap.Length);
                ms.Seek(0, SeekOrigin.Begin);
                StitchMap = (StitchMap)bf.Deserialize(ms);
            }
            Name = project.Name;
        }
    }
}
