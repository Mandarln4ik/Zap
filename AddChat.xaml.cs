using System.Windows;
using Zap.Core;

namespace Zap
{
    public partial class AddChat : Window
    {
        public AddChat()
        {
            InitializeComponent();
        }

        private void AddChat_Click(object sender, RoutedEventArgs e)
        {
            string ip = IPTextBox.Text;

            //Проверка айпи
            string[] separatedIP = ip.Split('.');
            if (separatedIP.Count() > 4)
            {
                IPInfo.Text = "адресс не может состоять более чем из 4 частей!";
                return;
            }
            foreach (string part in separatedIP)
            {
                int t;
                if (int.TryParse(part, out t))
                {
                    if (t > 255)
                    {
                        IPInfo.Text = "длина адресса не может быть больше 255!";
                        return;
                    }
                }
                else
                {
                    IPInfo.Text = "Неправильный адрес!";
                    return;
                }
            }

            //проверка порта
            int port;
            if (int.TryParse(PortTextBox.Text, out port))
            {
                if (port < 0 || port > 65535)
                {
                    PortInfo.Text = "Укажите порт в диапазоне от 0 до 65535!";
                    return;
                }
            }
            else
            {
                PortInfo.Text = "Порт должен быть числом!";
                return;
            }

            //Все проверки пройдены
            ChatController.AddChat(ip, port);
            Close();
        }

        private void Cancel_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }
    }
}
