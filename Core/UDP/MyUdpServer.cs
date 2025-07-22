using NetCoreServer;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace Zap.Core.UDP
{
    public class MyUdpServer : UdpServer
    {
        public MyUdpServer(IPAddress address, int port) : base(address, port) { }

        protected override void OnStarting()
        {
            MainWindow.logger.Info("Started port forwarding");
            _ = NatHelper.ForwardPortAsync(Port, "Zap server port", ProtocolType.Tcp);
            base.OnStarting();
        }

        protected override void OnStarted()
        {
            MainWindow.logger.Info($"UDP server started at {Endpoint}");
            Window w = Application.Current.MainWindow;
            Border b = (Border)w.FindName("ServerState");
            b.Background = Brushes.Green;
            TextBlock t = (TextBlock)w.FindName("ServerStatePopup");
            t.Text = "Сервер работает";
        }

        protected override void OnError(SocketError error)
        {
            MainWindow.logger.Error($"UDP server caught an error with code {error}");
        }
    }
}
