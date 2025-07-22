using NLog;
using System.Drawing;
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Zap.Core;
using Zap.Core.TCP;
using Zap.Core.UDP;
using Brushes = System.Windows.Media.Brushes;


namespace Zap
{
    public partial class MainWindow : Window
    {
        public static readonly Logger logger = LogManager.GetCurrentClassLogger();

        private MyTcpServer _TCPserver;
        private MyUdpServer _UDPserver;
        private MyTcpClient _TCPclient;
        private MyUdpClient _UDPclient;
        public static readonly ChatRepository _repository = new ChatRepository();
        private Chat _currentChat;
        public static Dictionary<Chat, Guid> _sessionsGUID = new();

        bool isTextBoxFocused = false;
        Chat _renamedChat;
        TextBox tb;

        public MainWindow()
        {
            InitializeComponent();
            _repository.OfflineAllChats();
            LeftMenuBtn.IsChecked = true;
            LeftMenuButtonImg.Source = new BitmapImage(new Uri("pack://application:,,,/Images/left-arrow.png"));
            ChatBorder.Visibility = Visibility.Hidden;
            ServerStatePopup.Text = "Сервер выключен";
            ServerState.Background = Brushes.Red;
            
            //Привязка массива чатов к UI
            ChatsListView.ItemsSource = _repository.Chats;
            DataContext = this;
            logger.Info("--- Zap Started! ---");

            //Debug
            _repository.AddChat(new Chat { Name = "LocalHost", IP = "127.0.0.1", PORT = Properties.Settings.Default.PORT, isConnected = false });
            logger.Info("Added localhost chat");
        }

        private void StartServer()
        {
            ServerState.Background = Brushes.DarkOrange;
            ServerStatePopup.Text = "Сервер запускается";

            int protocol = Properties.Settings.Default.PROTOCOL;
            if (protocol == 0)
            {
                _TCPserver = new MyTcpServer(IPAddress.Any, Properties.Settings.Default.PORT);
                _TCPserver.Start();
            }
            else if (protocol == 1)
            {
                _UDPserver = new MyUdpServer(IPAddress.Any, Properties.Settings.Default.PORT);
                _UDPserver.Start();
            }
        }

        public void RestartServer()
        {
            _TCPserver?.Dispose();
            _UDPserver?.Dispose();
            StartServer();
        }

        private void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
            e.Cancel = true;
            WindowState = WindowState.Minimized;
            Hide();
            Taskbar.Visibility = Visibility.Visible;
            logger.Info("Zap hided");
        }

        private void ReturnWindow(object sender, RoutedEventArgs e)
        {
            WindowState = WindowState.Normal;
            Show();
            Topmost = true;
            Topmost = false;
            Taskbar.Visibility = Visibility.Hidden;
            logger.Info("Zap maximized");
        }

        private void Exit_Click(object sender, RoutedEventArgs e)
        {
            Application.Current.Shutdown();
            _repository.SaveData();
            _TCPserver?.Dispose();
            _TCPclient?.Dispose();
            logger.Info("Zap Closing!");
        }

        private void WindowCloseBtn_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private void TopPanel_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            if (e.LeftButton == MouseButtonState.Pressed)
            {
                DragMove();
            }
        }

        private void WindowRemoveBtn_Click(object sender, RoutedEventArgs e)
        {
            WindowState = WindowState.Minimized;
            logger.Info("Zap minimized");
        }

        private void LeftMenuBtn_Click(object sender, RoutedEventArgs e)
        {
            if (LeftMenuBtn.IsChecked == true)
            {
                LeftMenuButtonImg.Source = new BitmapImage(new Uri("pack://application:,,,/Images/left-arrow.png"));
                logger.Info("Chats menu open");
            }
            else
            {
                LeftMenuButtonImg.Source = new BitmapImage(new Uri("pack://application:,,,/Images/right-arrow.png"));
                logger.Info("Chats menu closed");
            }
        }

        private void TextBox_GotFocus(object sender, RoutedEventArgs e)
        {
            if (!isTextBoxFocused) { TextBox.Text = ""; TextBox.Foreground = Brushes.Black; isTextBoxFocused = true; }
        }

        private void TextBox_LostFocus(object sender, RoutedEventArgs e)
        {
            if (String.IsNullOrEmpty(TextBox.Text)) { TextBox.Text = "Какая сегодня погода?"; TextBox.Foreground = Brushes.Gray; isTextBoxFocused = false; }
        }

        private void AddNewChat_Click(object sender, RoutedEventArgs e)
        {
            AddChat newChatWindow = new AddChat();
            newChatWindow.ShowDialog();
            newChatWindow.Topmost = true;
            logger.Info("Open add chat window");
        }

        private async void Window_Loaded(object sender, RoutedEventArgs e)
        {
            logger.Info("Zap loaded!");
            MyIPlabel.Text = await IPMaster.GetMyIPv4();

            //start server
            StartServer();
        }

        private void MyIP_Click(object sender, RoutedEventArgs e)
        {
            Clipboard.SetText(MyIPlabel.Text);
            logger.Info("IP copied");
        }

        private void SettingsButton_Click(object sender, RoutedEventArgs e)
        {
            SettingsWindow window = new SettingsWindow();
            window.Show();
            window.MW = this;
            logger.Info("Open settings window");
        }

        public void SendMessage(object sender, RoutedEventArgs e)
        {
            if (_currentChat == null || string.IsNullOrEmpty(TextBox.Text)) return;
            var newMessage = new Message
            {
                Text = TextBox.Text,
                IsMyMessage = true,
                ChatIP = _currentChat.IP
            };
            _repository.AddMessage(newMessage);
            logger.Info("Message added to messages repository");
            TextBox.Clear();

            if (Properties.Settings.Default.PROTOCOL == 0) //TCP
            {
                if (_sessionsGUID.ContainsKey(_currentChat) && ((IPEndPoint)_TCPserver.FindSession(_sessionsGUID[_currentChat]).Socket.RemoteEndPoint).Address.ToString() == _currentChat.IP)
                {
                    _TCPserver.FindSession(_sessionsGUID[_currentChat]).SendAsync(newMessage.Text);
                    logger.Info("Message sent as server");
                }
                else
                {
                    if (_TCPclient != null && _TCPclient?.IsConnected == true)
                    {
                        _TCPclient.Send(newMessage.Text);
                        logger.Info("Message sent as client");
                    }
                }
            }
            else if (Properties.Settings.Default.PROTOCOL == 1) //UDP
            {
                try
                {
                    IPEndPoint ip = new IPEndPoint(IPAddress.Parse(_currentChat.IP), _currentChat.PORT);
                    _UDPserver.SendAsync(ip, newMessage.Text);
                    logger.Info($"Message sent as server to {ip.Address}:{ip.Port}");
                }
                catch (Exception ex)
                {
                    logger.Error("Exception at sending msg as server (UDP)");
                    if (_UDPclient != null && _UDPclient?.IsConnected == true)
                    {
                        _UDPclient.Send(newMessage.Text);
                        logger.Info("Message sent as client");
                    }
                }
            }
        }

        private void Window_Closed(object sender, EventArgs e)
        {
            logger.Info("--- Zap shutdown ---");
            _TCPserver?.Dispose();
            _UDPserver?.Dispose();
            _TCPclient?.Dispose();
            _UDPclient?.Dispose();
        }

        private void DeleteChat_Click(object sender, RoutedEventArgs e)
        {
            logger.Info("Started chat deleting");
            if (sender is FrameworkElement element && element.DataContext is Chat selectedChat)
            {
                var result = MessageBox.Show($"Удалить чат '{selectedChat.Name}' и всю его историю?", "Подтверждение", MessageBoxButton.YesNo);
                if (result == MessageBoxResult.Yes)
                {
                    if (_currentChat == selectedChat) { _currentChat = null; MessagesList.ItemsSource = null; ChatBorder.Visibility = Visibility.Hidden; }
                    logger.Info("Chat deleted");
                    _repository.RemoveChat(selectedChat.IP);
                    logger.Info("Chat deleted from repository");
                }
                else
                {
                    logger.Info("Chat deleting canceled");
                }
            }
        }

        private void Rename(object sender, MouseButtonEventArgs e)
        {
            if (sender is FrameworkElement element && element.DataContext is Chat selectedChat)
            {
                if (tb != null && _renamedChat != null) { tb.IsEnabled = false; tb.Text = _renamedChat.Name; }
                _renamedChat = selectedChat;
                logger.Info($"Chat '{_renamedChat.Name}' rename started");
                Grid grid = (Grid)((Button)sender).Content;
                tb = (TextBox)grid.FindName("TB");
                tb.IsEnabled = true;
            }
        }

        private void TextBox_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Escape) 
            {
                logger.Info($"Chat '{_renamedChat.Name}' rename canceled");
                tb.Text = _renamedChat.Name;
                tb.IsEnabled = false;
                tb = null;
                _renamedChat = null;
            }
            else if (e.Key == Key.Enter)
            {
                logger.Info($"Chat '{_renamedChat.Name}' rename succesfully");
                _renamedChat.Name = tb.Text;
                _repository.SaveData();
                ChatName.Text = $"Чат с {_currentChat.Name}";
                tb.IsEnabled = false;
                tb = null;
                _renamedChat = null;
            }
        }

        private void SelectChat_Click(object sender, RoutedEventArgs e)
        {
            if (sender is FrameworkElement element && element.DataContext != null)
            {
                ChatsListView.SelectedItem = element.DataContext;
            }
            e.Handled = true;

            if (ChatsListView.SelectedItem is Chat selectedChat)
            {
                if (_currentChat != null) { _repository.Chats.FirstOrDefault(c => c == _currentChat).isConnected = false; }
                _currentChat = selectedChat;
                logger.Info($"Select chat: {selectedChat.Name}");
                ChatBorder.Visibility = Visibility.Visible;
                ChatName.Text = $"Чат с {selectedChat.Name}";
                MessagesList.ItemsSource = _currentChat.Messages;

                if (Properties.Settings.Default.PROTOCOL == 0)
                {
                    if (_TCPclient != null) { _TCPclient.DisconnectAsync(); _TCPclient.Dispose(); }
                    _TCPclient = new MyTcpClient(selectedChat.IP, selectedChat.PORT);
                    if (_TCPclient.ConnectAsync() == true)
                    {
                        _repository.Chats[ChatsListView.SelectedIndex].isConnected = true;
                        logger.Info($"Try connecting to Server");
                    }
                    else
                    {
                        MessageBox.Show("Не удалось подключиться!");
                        e.Handled = false;
                        _repository.Chats[ChatsListView.SelectedIndex].isConnected = false;
                    }
                }
                else if (Properties.Settings.Default.PROTOCOL == 1)
                {
                    if (_UDPclient != null) { _UDPclient.Disconnect(); _UDPclient.Dispose(); }
                    _UDPclient = new MyUdpClient(selectedChat.IP, selectedChat.PORT);
                    if (_UDPclient.Connect() == true)
                    {
                        _repository.Chats[ChatsListView.SelectedIndex].isConnected = true;
                        logger.Info($"Try connecting to Server");
                    }
                    else
                    {
                        MessageBox.Show("Не удалось подключиться!");
                        e.Handled = false;
                        _repository.Chats[ChatsListView.SelectedIndex].isConnected = false;
                    }
                }
            }
        }
    }
}