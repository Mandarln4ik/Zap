using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;

namespace Zap
{
    public partial class MainWindow : Window
    {
        bool isTextBoxFocused = false;

        public MainWindow()
        {
            InitializeComponent();
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
    }
}