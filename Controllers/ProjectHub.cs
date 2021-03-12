using EmroiderOnline.Models;
using EmroiderOnline.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EmroiderOnline.Controllers
{
    [Authorize]
    public class ProjectHub : Hub
    {
        private ProjectService _projectService;
        private static Dictionary<string, List<string>> UsersConnections = new Dictionary<string, List<string>>();

        public ProjectHub(ProjectService projectService) : base()
        {
            _projectService = projectService;
        }

        public override Task OnConnectedAsync()
        {
            if (!UsersConnections.ContainsKey(Context.UserIdentifier))
                UsersConnections.Add(Context.UserIdentifier, new List<string>());
            UsersConnections[Context.UserIdentifier].Add(Context.ConnectionId);
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            var userId = Context.UserIdentifier;
            UsersConnections[userId].Remove(Context.ConnectionId);
            _projectService.UpdateProject(Context.ConnectionId);
            return base.OnDisconnectedAsync(exception);
        }

        public async Task GetProject(string name)
        {
            var userId = Context.UserIdentifier;
            if (UsersConnections[userId].Count > 1)
            {
                await Clients.Caller.SendAsync("projectAlreadyOpen");
            } else
            {
                var project = _projectService.GetProject(userId, name, Context.ConnectionId);
                await Clients.Caller.SendAsync("projectReceived", project);
            }
        }

        public async void UpdateStitches(Position[] stitchPositions)
        {
            if (_projectService.UpdateStitches(Context.ConnectionId, stitchPositions))
                await Clients.Caller.SendAsync("projectUpdated");
            else
                await Clients.Caller.SendAsync("errorUpdating");
        }

        private void UpdateProject(string connectionId)
        {
            _projectService.UpdateProject(connectionId);
        }
    }
}
