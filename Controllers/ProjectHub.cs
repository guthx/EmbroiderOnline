using EmroiderOnline.Models;
using EmroiderOnline.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;

namespace EmroiderOnline.Controllers
{
    [Authorize]
    public class ProjectHub : Hub
    {
        private ProjectService _projectService;
        private static Dictionary<string, List<string>> _usersConnections = new Dictionary<string, List<string>>();
        private static Dictionary<string, Timer> _updateTimers = new Dictionary<string, Timer>();
        private static Dictionary<string, Timer> _removeTimers = new Dictionary<string, Timer>();

        public ProjectHub(ProjectService projectService) : base()
        {
            _projectService = projectService;
        }

        public override Task OnConnectedAsync()
        {
            if (!_usersConnections.ContainsKey(Context.UserIdentifier))
                _usersConnections.Add(Context.UserIdentifier, new List<string>());
            _usersConnections[Context.UserIdentifier].Add(Context.ConnectionId);
            if (_removeTimers.ContainsKey(Context.UserIdentifier))
            {
                _removeTimers[Context.UserIdentifier].Dispose();
                _removeTimers.Remove(Context.UserIdentifier);
            }
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            var userId = Context.UserIdentifier;
            _usersConnections[userId].Remove(Context.ConnectionId);
            if (_usersConnections[userId].Count == 0)
            {
                var timer = new Timer(60000);
                _updateTimers[userId].Stop();
                timer.AutoReset = false;
                timer.Elapsed += (obj, args) =>
                {
                    _projectService.UpdateProject(userId, true);
                    _updateTimers[userId].Dispose();
                    _updateTimers.Remove(userId);
                    timer.Dispose();
                    _removeTimers.Remove(userId);
                };
                timer.Start();
                _removeTimers.Add(userId, timer);
            }
            return base.OnDisconnectedAsync(exception);
        }

        public async Task GetProject(string name)
        {
            var userId = Context.UserIdentifier;
            if (_usersConnections[userId].Count > 1)
            {
                await Clients.Caller.SendAsync("projectAlreadyOpen");
            } else
            {
                var project = _projectService.GetProject(userId, name);
                if (!_updateTimers.ContainsKey(userId))
                {
                    var timer = new Timer(300000);
                    timer.AutoReset = true;
                    timer.Elapsed += (obj, args) =>
                    {
                        _projectService.UpdateProject(userId);
                    };
                    timer.Start();
                    _updateTimers.Add(userId, timer);
                }
                else
                {
                    _updateTimers[userId].Start();
                }
                
                await Clients.Caller.SendAsync("projectReceived", project);
            }
        }

        public async void UpdateStitches(Position[] stitchPositions)
        {
            if (_projectService.UpdateStitches(Context.UserIdentifier, stitchPositions))
                await Clients.Caller.SendAsync("projectUpdated");
            else
                await Clients.Caller.SendAsync("errorUpdating");
        }
    }
}
