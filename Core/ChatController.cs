using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Zap.Core
{
    internal static class ChatController
    {
        public static void AddChat(string ip, int port, string name = null)
        {
            string Name = name;
            if (name == null) { Name = "new"; }
            Chat ch = new Chat(Name, ip, port);
            MainWindow._CHATS.Add(ch);
        }
    }
}


public class Chat
{
    public string Name { get; set; }
    public string IP { get; set; }
    public int PORT { get; set; }

    public Chat(string name, string ip, int port)
    {
        Name = name;
        IP = ip;
        PORT = port;
    }
}
