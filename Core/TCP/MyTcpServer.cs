using NetCoreServer;
using System.Net;
using System.Net.Sockets;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace Zap.Core.TCP
{
    public class MyTcpServer : TcpServer
    {
        public MyTcpServer(IPAddress address, int port) : base(address, port) { }

        protected override TcpSession CreateSession() => new MyTcpSession(this);

        protected override void OnError(SocketError error)
        {
            MainWindow.logger.Error($"TCP server caught an error with code {error}");
        }

        protected override void OnStarted()
        {
            MainWindow.logger.Info($"TCP server started at {Endpoint}");
            Window w = Application.Current.MainWindow;
            Border b = (Border)w.FindName("ServerState");
            b.Background = Brushes.Green;
            TextBlock t = (TextBlock)w.FindName("ServerStatePopup");
            t.Text = "Сервер работает";
        }

        protected override void OnStarting()
        {
            MainWindow.logger.Info("Started port forwarding");
            _ = NatHelper.ForwardPortAsync(Port, "Zap server port", ProtocolType.Udp);
            base.OnStarting();
        }

    }
}
