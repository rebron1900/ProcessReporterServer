## 说明
适配 [Shiro](https://github.com/innei/Shiro) 上报程序 [ProcessReporterWin](https://github.com/ChingCdesu/ShiroProcessReporter) 的服务端代码
ChatGPT生成的代码，自己小改了一下，应该蛮多问题的，不足支出忘各位大佬指正。

## 配置
需要配置一个 whitelist ，是一个 json 地址 格式为：

```json
{
    "wechat": {
        "title": "微信",
        "url": "wechat.png",
        "action": "摸鱼"
    },
    "chrome": {
        "title": "Chrome",
        "url": "chrome.png",
        "action": "冲浪"
    },
}
```