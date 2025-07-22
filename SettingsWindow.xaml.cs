using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace Zap
{
    /// <summary>
    /// Логика взаимодействия для SettingsWindow.xaml
    /// </summary>
    public partial class SettingsWindow : Window
    {
        public MainWindow MW;
        bool isWaitRestart = false;

        public SettingsWindow()
        {
            InitializeComponent();
        }


        private void SaveButton_Click(object sender, RoutedEventArgs e)
        {
            int port;
            if (!(int.TryParse(PortBox.Text, out port)))
            {
                PortInfo.Text = "Порт должен быть числом!";
            }
            else
            {
                if (port < 0 || port > 65535)
                {
                    PortInfo.Text = "Порт должен быть в диапазоне от 0 до 65535!";
                }
                else
                {
                    if (port != Properties.Settings.Default.PORT)
                    {
                        Properties.Settings.Default.PORT = port;
                        isWaitRestart = true;
                    }
                }
            }

            
            if (Properties.Settings.Default.PROTOCOL != ProtocolComboBox.SelectedIndex)
            {
                Properties.Settings.Default.PROTOCOL = ProtocolComboBox.SelectedIndex;
                isWaitRestart = true;
            }

            Properties.Settings.Default.Save();
            if (isWaitRestart == true)
            {
                isWaitRestart = false;
                MW.RestartServer();
            }
        }

        private void Window_Loaded(object sender, RoutedEventArgs e)
        {
            PortBox.Text = Properties.Settings.Default.PORT.ToString();
            ProtocolComboBox.SelectedIndex = Properties.Settings.Default.PROTOCOL;
        }
    }
}
