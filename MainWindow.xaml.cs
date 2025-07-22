using NLog;
using System.Drawing;
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Zap.Core;
using Brushes = System.Windows.Media.Brushes;


namespace Zap
{
    public partial class MainWindow : Window
    {
        public static readonly Logger logger = LogManager.GetCurrentClassLogger();

        private MyTcpServer _server;
        private MyTcpClient _client;
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

            //Привязка массива чатов к UI
            ChatsListView.ItemsSource = _repository.Chats;
            DataContext = this;
            logger.Info("--- Zap Started! ---");

            //Debug
            _repository.AddChat(new Chat { Name = "LocalHost", IP = "127.0.0.1", PORT = Properties.Settings.Default.PORT, isConnected = false });
            ServerState.Background = Brushes.Red;
            ServerStatePopup.Text = "Сервер выключен";
            logger.Info("Added localhost chat");
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
            logger.Info("Zap showed");
        }

        private void Exit_Click(object sender, RoutedEventArgs e)
        {
            Application.Current.Shutdown();
            _repository.SaveData();
            _server?.Dispose();
            _client?.Dispose();
            logger.Info("Zap Closed!");
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
            MyIPlabel.Text = await IPMaster.GetMyIP();

            //start server
            ServerState.Background = Brushes.DarkOrange;
            ServerStatePopup.Text = "Сервер запускается..";
            logger.Info("Server starting..");
            _server = new MyTcpServer(IPAddress.Any, Properties.Settings.Default.PORT);
            _server.Start();
            if (_server.IsStarted) { ServerState.Background = Brushes.Green; ServerStatePopup.Text = "Server active"; logger.Info("Сервер работает!"); }

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
            if (_sessionsGUID.ContainsKey(_currentChat) && ((IPEndPoint)_server.FindSession(_sessionsGUID[_currentChat]).Socket.RemoteEndPoint).Address.ToString() == _currentChat.IP)
            { 
                _server.FindSession(_sessionsGUID[_currentChat]).SendAsync(newMessage.Text); 
                logger.Info("Message sent as server");
            }
            else
            {
                if (_client != null && _client?.IsConnected == true)
                {
                    _client.Send(newMessage.Text);
                    logger.Info("Message sent as client");
                }
            }
        }

        private void Window_Closed(object sender, EventArgs e)
        {
            logger.Info("--- Zap shutdown ---");
            _server?.Dispose();
            _client?.Dispose();
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
                if (_client != null && (_client.IsConnected || _client.IsConnecting)) { _client.DisconnectAsync(); }
                _client = new MyTcpClient(selectedChat.IP, selectedChat.PORT);
                if (_client.ConnectAsync() == true) 
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