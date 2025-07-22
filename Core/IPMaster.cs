using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace Zap.Core
{
    static class IPMaster
    {
        public static async Task<string> GetMyIPv4()
        {
            using (var client = new HttpClient())
            {
                try
                {
                    // Запрос к сервису, который возвращает внешний IP-адрес.
                    string response = await client.GetStringAsync("https://api.ipify.org");
                    return response;
                }
                catch (Exception ex)
                {
                    MainWindow.logger.Error($"Ошибка при получении внешнего IP: {ex.Message}");
                    return "E";
                }
            }
        }

        public static async Task<string> GetMyIPv6()
        {
            using (var client = new HttpClient())
            {
                try
                {
                    // Запрос к сервису, который возвращает внешний IP-адрес.
                    string response = await client.GetStringAsync("https://api6.ipify.org");
                    return response;
                }
                catch (Exception ex)
                {
                    MainWindow.logger.Error($"Ошибка при получении внешнего IP: {ex.Message}");
                    return "E";
                }
            }
        }
    }
}
