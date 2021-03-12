using Embroider;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Formatters.Binary;
using System.Threading.Tasks;

namespace EmroiderOnline.Models.Responses
{
    public class InMemoryProject
    {
        [JsonIgnore]
        public string UserId { get; set; }
        public string Name { get; set; }
        public StitchMap StitchMap { get; set; }

        public InMemoryProject(Project project, string userId)
        {
            using (var ms = new MemoryStream())
            {
                var bf = new BinaryFormatter();
                ms.Write(project.StitchMap, 0, project.StitchMap.Length);
                ms.Seek(0, SeekOrigin.Begin);
                StitchMap = (StitchMap)bf.Deserialize(ms);
            }
            Name = project.Name;
            UserId = userId;
        }
    }
}
