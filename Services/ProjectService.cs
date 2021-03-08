using EmroiderOnline.Models;
using EmroiderOnline.Models.Responses;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EmroiderOnline.Services
{
    public class ProjectService
    {
        private readonly IMongoCollection<User> _users;

        public ProjectService(IMongoClient client)
        {
            var db = client.GetDatabase("Embroider");
            _users = db.GetCollection<User>("Users");
        }

        public List<Project> GetProjects(string userId)
        {
            var user = _users.Find(u => u.Id == userId).FirstOrDefault();
            if (user == null)
                return null;

            return user.Projects;
        }

        public GetProjectResponse GetProject(string userId, string name)
        {
            var user = _users.Find(u => u.Id == userId).FirstOrDefault();
            if (user == null)
                return null;
            var project = user.Projects.Where(p => p.Name == name).FirstOrDefault();
            if (project == null)
                return null;

            return new GetProjectResponse(project);
        }
    }
}
