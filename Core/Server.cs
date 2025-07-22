using NetCoreServer;
using NLog;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Windows;

namespace Zap.Core
{
    public class MyTcpServer : TcpServer
    {
        public MyTcpServer(IPAddress address, int port) : base(address, port) { }

        protected override TcpSession CreateSession() => new MyTcpSession(this);

        protected override void OnError(SocketError error)
        {
            MainWindow.logger.Error($"Chat TCP server caught an error with code {error}");
        }
        protected override void OnStarting()
        {
            MainWindow.logger.Info("Started port forwarding");
            _ = NatHelper.ForwardPortAsync(Port, "Zap server port", ProtocolType.Tcp);
            base.OnStarting();
        }

    }

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

    public class MyTcpClient : NetCoreServer.TcpClient
    {
        public MyTcpClient(string ip, int port) : base(ip, port) { }

        protected override void OnReceived(byte[] buffer, long offset, long size)
        {
            MainWindow.logger.Info("Client recived anything");
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
            MainWindow.logger.Error($"TCP client caught an error with code {error}");
        }
    }
}
