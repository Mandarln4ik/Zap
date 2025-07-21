using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zap.Core
{
    public class Message
    {
        public string Text { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.Now;
        public bool IsMyMessage { get; set; }
        public string ChatIP { get; set; }
    }
}
