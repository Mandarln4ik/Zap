using DocumentFormat.OpenXml.Office2010.Excel;
using NetCoreServer;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

namespace Zap.Core.TCP
{
    public class MyTcpSession : TcpSession
    {
        public MyTcpSession(TcpServer server) : base(server) { }

        protected override void OnConnected()
        {
            var remoteIp = ((IPEndPoint)Socket.RemoteEndPoint).Address.ToString();
            var chat = MainWindow._repository.Chats.FirstOrDefault(c => c.IP == remoteIp);
            MainWindow.logger.Info($"Session connected from {remoteIp}:{((IPEndPoint)Socket.RemoteEndPoint).Port}");

            if (chat == null)
            {
                chat = new Chat
                {
                    Name = remoteIp,
                    IP = remoteIp,
                    PORT = ((IPEndPoint)Socket.RemoteEndPoint).Port
                };
                MainWindow._repository.AddChat(chat);
            }
            if (!MainWindow._sessionsGUID.ContainsKey(chat)) { MainWindow._sessionsGUID.Add(chat, Id); }
        }

        protected override void OnReceived(byte[] buffer, long offset, long size)
        {
            MainWindow.logger.Info("Session recived anything");
            string msg = Encoding.UTF8.GetString(buffer, (int)offset, (int)size);
            var remoteIp = ((IPEndPoint)Socket.RemoteEndPoint).Address.ToString();
            // Находим или создаем чат
            var chat = MainWindow._repository.Chats.FirstOrDefault(c => c.IP == remoteIp);

            var message = new Message
            {
                Text = msg,
                IsMyMessage = false,
                ChatIP = chat.IP
            };

            MainWindow._repository.AddMessage(message);

        }

        protected override void OnDisconnected()
        {

        }

        protected override void OnError(SocketError error)
        {
            MainWindow.logger.Error($"TCP Session caught an error with code {error}");
        }
    }
}
