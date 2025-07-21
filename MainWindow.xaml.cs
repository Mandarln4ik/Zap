using NetCoreServer;
using System;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Net;
using System.Windows;
using System.Windows.Controls; 
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Threading;
using Zap.Core;

namespace Zap
{
    public partial class MainWindow : Window
    {
        private MyTcpServer _server;
        private MyTcpClient _client;
        public static readonly ChatRepository _repository = new ChatRepository();
        private Chat _currentChat;

        bool isTextBoxFocused = false;

        public MainWindow()
        {
            InitializeComponent();
            //Привязка массива чатов к UI
            ChatsListView.ItemsSource = _repository.Chats;
            DataContext = this;

            //Debug
            _repository.AddChat(new Chat { Name = "LocalHost", IP = "127.0.0.1", PORT = Properties.Settings.Default.PORT, isConnected = false });
            
        }



        private void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
            e.Cancel = true;
            WindowState = WindowState.Minimized;
            Hide();
            Taskbar.Visibility = Visibility.Visible;
        }

        private void ReturnWindow(object sender, RoutedEventArgs e)
        {
            WindowState = WindowState.Normal;
            Show();
            Topmost = true;
            Topmost = false;
            Taskbar.Visibility = Visibility.Hidden;
        }

        private void Exit_Click(object sender, RoutedEventArgs e)
        {
            Application.Current.Shutdown();
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
        }

        private void LeftMenuBtn_Click(object sender, RoutedEventArgs e)
        {
            if (LeftMenuBtn.IsChecked == true)
            {
                LeftMenuButtonImg.Source = new BitmapImage(new Uri("pack://application:,,,/Images/left-arrow.png"));
            }
            else
            {
                LeftMenuButtonImg.Source = new BitmapImage(new Uri("pack://application:,,,/Images/right-arrow.png"));
            }
        }

        private void TextBox_GotFocus(object sender, RoutedEventArgs e)
        {
            if (!isTextBoxFocused) { TextBox.Text = ""; TextBox.Foreground = Brushes.Black; isTextBoxFocused = true; }
        }

        private void AddNewChat_Click(object sender, RoutedEventArgs e)
        {
            AddChat newChatWindow = new AddChat();
            newChatWindow.ShowDialog();
            newChatWindow.Topmost = true;
        }

        private async void Window_Loaded(object sender, RoutedEventArgs e)
        {
            MyIPlabel.Text = await IPMaster.GetMyIP();

            //start server
            _server = new MyTcpServer(IPAddress.Any, Properties.Settings.Default.PORT);
            _server.Start();
            
        }

        private void MyIP_Click(object sender, RoutedEventArgs e)
        {
            Clipboard.SetText(MyIPlabel.Text);
        }

        private void SettingsButton_Click(object sender, RoutedEventArgs e)
        {
            SettingsWindow window = new SettingsWindow();
            window.Show();
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
            
            TextBox.Clear();

            if (_client != null && _client?.IsConnected == true)
            {
                _client.Send(newMessage.Text);
            }
        }

        private void Window_Closed(object sender, EventArgs e)
        {
            _repository.SaveData();
            _server.Dispose();
            _client.Dispose();
        }

        private void DeleteChat_Click(object sender, RoutedEventArgs e)
        {
            if (ChatsListView.SelectedItem is Chat selectedChat)
            {
                var result = MessageBox.Show($"Удалить чат '{selectedChat.Name}' и всю его историю?", "Подтверждение", MessageBoxButton.YesNo);
                if (result == MessageBoxResult.Yes)
                {
                    if (_currentChat == selectedChat) { _currentChat = null; MessagesList.ItemsSource = null; }
                    _repository.RemoveChat(selectedChat.IP);
                }
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
                ChatsListView.SelectedItem = selectedChat;
                _currentChat = selectedChat;
                MessagesList.ItemsSource = _currentChat.Messages;
                if (_client != null && (_client.IsConnected || _client.IsConnecting)) { _client.DisconnectAsync(); }
                _client = new MyTcpClient(selectedChat.IP, selectedChat.PORT);
                if (_client.ConnectAsync() == true) { _repository.Chats[ChatsListView.SelectedIndex].isConnected = true; }
                else { MessageBox.Show("Не удалось подключиться!"); }
            }
        }
    }
}