using System;
using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Zap.Core;

namespace Zap
{
    public partial class MainWindow : Window
    {
        public static ObservableCollection<Chat> _CHATS { get; set; } = new();
        bool isTextBoxFocused = false;

        public MainWindow()
        {
            InitializeComponent();
            //Привязка массива чатов к UI
            ChatsListView.ItemsSource = _CHATS;
            

            //Debug
            //_CHATS.Add(new Chat("Petr", "192.168.0.10", 48454));
            //_CHATS.Add(new Chat("Artem", "192.168.1.10", 12551));
            //_CHATS.Add(new Chat("Maxim", "192.168.2.10", 4256));
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
        }

        private void DeleteChat_Click(object sender, RoutedEventArgs e)
        {
            Chat item = (sender as FrameworkElement)?.DataContext as Chat;
            if (item != null)
            {
                _CHATS.Remove(item);
            }
        }

        private async void Window_Loaded(object sender, RoutedEventArgs e)
        {
            MyIPlabel.Text = await IPMaster.GetMyIP();
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
    }
}