using Newtonsoft.Json;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using Zap.Core;

namespace Zap.Core
{
    public class ChatRepository
    {
        private static readonly string AppDataPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Zap");
        private static readonly string ChatsFilePath = Path.Combine(AppDataPath, "chats.json");
        private static readonly string MessagesFilePath = Path.Combine(AppDataPath, "messages.json");

        public ObservableCollection<Chat> Chats { get; } = new ObservableCollection<Chat>();
        public List<Message> AllMessages { get; } = new List<Message>();

        public ChatRepository()
        {
            Directory.CreateDirectory(AppDataPath);
            LoadData();
        }

        public void AddChat(Chat chat)
        {
            if (!Chats.Any(c => c.IP == chat.IP))
            {
                Chats.Add(chat);
            }
        }

        public void AddMessage(Message message)
        {
            AllMessages.Add(message);

            var chat = Chats.FirstOrDefault(c => c.IP == message.ChatIP);
            if (chat != null)
            {
                System.Windows.Application.Current.Dispatcher.Invoke(() =>
                {
                    chat.Messages.Add(message);
                });
            }
        }

        public ObservableCollection<Message> GetMessagesForChat(string chatIP)
        {
            return new ObservableCollection<Message>(
                AllMessages.Where(m => m.ChatIP == chatIP)
                           .OrderBy(m => m.Timestamp));
        }

        public void RemoveChat(string chatIP)
        {
            // Находим чат
            var chatToRemove = Chats.FirstOrDefault(c => c.IP == chatIP);
            if (chatToRemove == null) return;

            // Удаляем из коллекции чатов
            Chats.Remove(chatToRemove);

            // Удаляем связанные сообщения
            var messagesToRemove = AllMessages.Where(m => m.ChatIP == chatIP).ToList();
            foreach (var message in messagesToRemove)
            {
                AllMessages.Remove(message);
            }
        }

        private void LoadData()
        {
            try
            {
                // Загрузка чатов
                if (File.Exists(ChatsFilePath))
                {
                    var json = File.ReadAllText(ChatsFilePath);
                    var loadedChats = JsonConvert.DeserializeObject<List<Chat>>(json);
                    foreach (var chat in loadedChats)
                    {
                        Chats.Add(chat);
                    }
                }

                // Загрузка сообщений
                if (File.Exists(MessagesFilePath))
                {
                    var json = File.ReadAllText(MessagesFilePath);
                    var loadedMessages = JsonConvert.DeserializeObject<List<Message>>(json);
                    AllMessages.AddRange(loadedMessages);

                    // Привязка сообщений к чатам
                    foreach (var chat in Chats)
                    {
                        chat.Messages = new ObservableCollection<Message>(
                            AllMessages.Where(m => m.ChatIP == chat.IP)
                                       .OrderBy(m => m.Timestamp));
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error loading data: {ex.Message}");
            }
        }

        public void SaveData()
        {
            try
            {
                foreach (var item in Chats)
                {
                    item.isConnected = false;
                }
                // Сохранение чатов
                var chatsJson = JsonConvert.SerializeObject(Chats.ToList());
                File.WriteAllText(ChatsFilePath, chatsJson);

                // Сохранение сообщений
                var messagesJson = JsonConvert.SerializeObject(AllMessages);
                File.WriteAllText(MessagesFilePath, messagesJson);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error saving data: {ex.Message}");
            }
        }
    }
}


public class Chat : INotifyPropertyChanged
{
    private string _name;
    public string Name { get { return _name; } set { if (_name != value) { _name = value; OnPropertyChanged(value); } } }

    private string _ip;
    public string IP { get { return _ip; } set { if (_ip != value) { _ip = value; OnPropertyChanged(); } } }

    private int _port;
    public int PORT { get { return _port; } set { if (_port != value) _port = value; OnPropertyChanged(); } }

    private bool _isConnected;
    public bool isConnected { get { return _isConnected; } set { if (_isConnected != value) { _isConnected = value; OnPropertyChanged(); } } }

    private ObservableCollection<Message> _messages = new ObservableCollection<Message>();
    public ObservableCollection<Message> Messages
    {
        get => _messages;
        set
        {
            _messages = value;
            OnPropertyChanged();
        }
    }

    public event PropertyChangedEventHandler PropertyChanged;
    protected virtual void OnPropertyChanged(string propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}
