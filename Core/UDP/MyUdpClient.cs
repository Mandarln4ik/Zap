using System.Net;
using System.Net.Sockets;
using System.Text;
using UdpClient = NetCoreServer.UdpClient;

namespace Zap.Core.UDP
{
    public class MyUdpClient : UdpClient
    {
        public MyUdpClient(string address, int port) : base(address, port) { }

        protected override void OnConnected()
        {
            MainWindow.logger.Info($"Connected to {Endpoint}");
            string[] ipPort = Endpoint.ToString().Split(':');
            string remoteIp = ipPort[0];
            Chat chat = MainWindow._repository.Chats.FirstOrDefault(c => c.IP == remoteIp);
            chat.isConnected = true;
        }

        protected override void OnReceived(EndPoint endpoint, byte[] buffer, long offset, long size)
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

        protected override void OnError(SocketError error)
        {
            MainWindow.logger.Error($"TCP client caught an error with code {error}");
        }
    }


}
