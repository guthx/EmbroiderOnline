using EmroiderOnline.Models;
using EmroiderOnline.Models.Requests;
using EmroiderOnline.Models.Responses;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace EmroiderOnline.Services
{
    public class UserService
    {
        private readonly IMongoCollection<User> _users;
        private readonly IConfiguration _config;

        public UserService(IMongoClient client, IConfiguration config)
        {
            var db = client.GetDatabase("Embroider");
            _users = db.GetCollection<User>("Users");
            _config = config;
        }

        public User Register(RegisterRequest request)
        {
            if (_users.Find(u => u.Email == request.Email).FirstOrDefault() != null)
                return null;
            var hash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            var user = new User
            {
                Email = request.Email,
                Password = hash,
                Username = request.Username
            };

            _users.InsertOne(user);
            return user;
        }

        public LoginResponse Login(LoginRequest request)
        {
            var user = _users.Find(u => u.Email == request.Email).FirstOrDefault();
            if (user == null)
                return null;
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
                return null;
            var jwtSecret = _config.GetValue<string>("jwtSecret");
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Name, user.Id)
                }),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)), SecurityAlgorithms.HmacSha256Signature)
            };
            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.WriteToken(tokenHandler.CreateToken(tokenDescriptor));

            return new LoginResponse
            {
                Jwt = token,
                Username = user.Username
            };
        }
    }
}
