using System.Net;
using System.Net.Sockets;
using System.Text;

namespace Zap.Core.TCP
{
    public class MyTcpClient : NetCoreServer.TcpClient
    {
        public MyTcpClient(string ip, int port) : base(ip, port) { }

        protected override void OnConnected()
        {
            base.OnConnected();
            MainWindow.logger.Info($"Client connected to {Endpoint}");
            var remoteIp = ((IPEndPoint)Socket.RemoteEndPoint).Address.ToString();
            Chat chat = MainWindow._repository.Chats.FirstOrDefault(c => c.IP == remoteIp);
            chat.isConnected = true;
        }

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
