using Embroider;
using Emgu.CV;
using Emgu.CV.Structure;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Formatters.Binary;
using System.Threading.Tasks;

namespace EmroiderOnline.Models
{
    public class Project
    {
        [BsonElement("name")]
        public string Name { get; set; }
        [BsonElement("stitchMap")]
        [JsonIgnore]
        public byte[] StitchMap { get; set; }
        [BsonElement("previewImage")]
        [BsonRepresentation(BsonType.Binary)]
        public byte[] PreviewImage { get; set; }
        [BsonElement("totalStitches")]
        public int TotalStitches { get; set; }
        [BsonElement("finishedStitches")]
        public int FinishedStitches { get; set; }

        public Project(string name, StitchMap map, Image<Rgb, double> image)
        {
            using (var stream = new MemoryStream())
            {
                image.ToBitmap().Save(stream, ImageFormat.Jpeg);
                PreviewImage = stream.ToArray();
            }
            var bf = new BinaryFormatter();
            using (var ms = new MemoryStream())
            {
                bf.Serialize(ms, map);
                StitchMap = ms.ToArray();
            }
            Name = name;
            TotalStitches = map.Stitches.Length;
            FinishedStitches = 0;
        }

        public Project UpdateStitchMap(StitchMap map)
        {
            var count = 0;
            for (int i=0; i<map.Stitches.GetLength(0); i++)
                for (int j=0; j<map.Stitches.GetLength(1); j++)
                {
                    if (map.Stitches[i, j].Stitched)
                        count++;
                }
            var bf = new BinaryFormatter();
            using (var ms = new MemoryStream())
            {
                bf.Serialize(ms, map);
                StitchMap = ms.ToArray();
            }
            FinishedStitches = count;
            return this;
        }

        public byte[] ToByteArray()
        {
            var bf = new BinaryFormatter();
            using (var ms = new MemoryStream())
            {
                bf.Serialize(ms, this);
                return ms.ToArray();
            }
        }

        public static Project FromByteArray(byte[] array)
        {
            using (var ms = new MemoryStream())
            {
                var bf = new BinaryFormatter();
                ms.Write(array, 0, array.Length);
                ms.Seek(0, SeekOrigin.Begin);
                Project project = (Project)bf.Deserialize(ms);
                return project;
            }
        }
    }
}
