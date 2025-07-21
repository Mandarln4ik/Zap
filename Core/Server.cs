using NetCoreServer;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Threading;

namespace Zap.Core
{
    public class MyTcpServer : TcpServer
    {
        public MyTcpServer(IPAddress address, int port) : base(address, port) { }

        protected override TcpSession CreateSession() => new MyTcpSession(this);
    }

    public class MyTcpSession : TcpSession
    {
        public MyTcpSession(TcpServer server) : base(server) { }

        protected override void OnConnected()
        {
            var remoteIp = ((IPEndPoint)Socket.RemoteEndPoint).Address.ToString();
            var chat = MainWindow._repository.Chats.FirstOrDefault(c => c.IP == remoteIp);
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
        }

        protected override void OnReceived(byte[] buffer, long offset, long size)
        {
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
            MessageBox.Show($"Client disconnected: {Socket.RemoteEndPoint}");
        }
    }

    public class MyTcpClient : TcpClient
    {
        public MyTcpClient(string ip, int port) : base(ip, port) { }

        protected override void OnReceived(byte[] buffer, long offset, long size)
        {
        }

        protected override void OnDisconnected()
        { 
        }
    }
}
