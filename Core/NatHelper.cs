using NLog;
using Open.Nat;
using System.Diagnostics;
using System.Net.Sockets;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using Zap;

public static class NatHelper
{
    public static async Task ForwardPortAsync(int port, string description, ProtocolType protocol = ProtocolType.Tcp)
    {
        try
        {
            var discoverer = new NatDiscoverer();
            var device = await discoverer.DiscoverDeviceAsync();

            await device.CreatePortMapAsync(new Mapping(
                protocol == ProtocolType.Tcp ? Open.Nat.Protocol.Tcp : Open.Nat.Protocol.Udp,
                port,
                port,
                description));

            MainWindow.logger.Info($"Порт {port}/{protocol} успешно проброшен через NAT!");

        }
        catch (Exception ex)
        {
            MessageBox.Show($"Ошибка проброса порта: {ex.Message}");
            MainWindow.logger.Error($"Ошибка проброса порта: {ex.Message}");


            Window w = Application.Current.MainWindow;
            Border b = (Border)w.FindName("ServerState");
            b.Background = Brushes.Black;
            TextBlock t = (TextBlock)w.FindName("ServerStatePopup");
            t.Text = "NAT недоступен и сервер вместе с ним!";
        }
    }

    public static async Task CheckPortForwardingAsync()
    {
        try
        {
            var discoverer = new NatDiscoverer();
            var device = await discoverer.DiscoverDeviceAsync();
            var mappings = await device.GetAllMappingsAsync();

            foreach (var mapping in mappings)
            {
                Debug.WriteLine($"{mapping.Description}: {mapping.PublicPort} → {mapping.PrivateIP}:{mapping.PrivatePort}");
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Ошибка: {ex.Message}");
        }
    }
}