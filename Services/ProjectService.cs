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
        private static Dictionary<string, InMemoryProject> _usersProjects = new Dictionary<string, InMemoryProject>();

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

        public InMemoryProject GetProject(string userId, string name)
        {
            InMemoryProject inMemoryProject;
            if (_usersProjects.TryGetValue(userId, out inMemoryProject))
            {
                if (inMemoryProject.Name == name)
                    return inMemoryProject;
                else
                {
                    UpdateProject(userId, true);
                }
            }
            var user = _users.Find(u => u.Id == userId).FirstOrDefault();
            if (user == null)
                return null;
            var project = user.Projects.Where(p => p.Name == name).FirstOrDefault();
            if (project == null)
                return null;
            inMemoryProject = new InMemoryProject(project, userId);
            _usersProjects[userId] = inMemoryProject;
            return inMemoryProject;
        }

        public bool DeleteProject(string userId, string name)
        {
            var user = _users.Find(u => u.Id == userId).FirstOrDefault();
            if (user == null)
                return false;
            var update = Builders<User>.Update.PullFilter(u => u.Projects, Builders<Project>.Filter.Eq(p => p.Name, name));
            return _users.UpdateOne(u => u.Id == userId, update).IsAcknowledged;
        }

        public bool UpdateStitches(string connectionId, Position[] stitches)
        {
            InMemoryProject project;
            if (_usersProjects.TryGetValue(connectionId, out project))
            {
                foreach (var stitch in stitches)
                {
                    project.StitchMap.Stitches[stitch.Y, stitch.X].Stitched = !project.StitchMap.Stitches[stitch.Y, stitch.X].Stitched;
                }
                return true;
            }
            return false;
        }

        public void UpdateProject(string userId, bool removeFromMemory = false)
        {
            InMemoryProject inMemoryProject;
            if (_usersProjects.TryGetValue(userId, out inMemoryProject))
            {
                var project = _users
                    .Find(u => u.Id == inMemoryProject.UserId)
                    .FirstOrDefault()
                    .Projects
                    .Find(p => p.Name == inMemoryProject.Name);
                project.UpdateStitchMap(inMemoryProject.StitchMap);
                _users.UpdateOne(
                    filter: u => u.Id == inMemoryProject.UserId && u.Projects.Any(p => p.Name == inMemoryProject.Name),
                    update: Builders<User>.Update.Set(p => p.Projects[-1], project)
                    );

                if (removeFromMemory)
                    _usersProjects.Remove(userId);
            }
        }
    }
}
