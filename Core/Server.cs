using NetCoreServer;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;
using System.Windows;

namespace Zap.Core
{
    public class MyTcpServer : TcpServer
    {
        public MyTcpServer(IPAddress address, int port) : base(address, port) { }

        protected override TcpSession CreateSession() => new MyTcpSession(this);

        protected override void OnError(SocketError error)
        {
            MessageBox.Show($"Server error: {error}");
        }
    }

    public class MyTcpSession : TcpSession
    {
        public MyTcpSession(TcpServer server) : base(server) { }

        protected override void OnConnected()
        {
            IPEndPoint clientEndpoint = (IPEndPoint)Socket.RemoteEndPoint;
            string clientIp = clientEndpoint.Address.ToString();
            int clientPort = clientEndpoint.Port;
        }

        protected override void OnReceived(byte[] buffer, long offset, long size)
        {
            string message = System.Text.Encoding.UTF8.GetString(buffer, (int)offset, (int)size);
        }

        protected override void OnDisconnected()
        {
            Console.WriteLine($"Client disconnected: {Socket.RemoteEndPoint}");
        }
    }
}
