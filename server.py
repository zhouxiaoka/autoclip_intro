#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单的本地HTTP服务器，用于预览AutoClips介绍网站

使用方法:
    python server.py
    
然后在浏览器中访问: http://localhost:8000
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

PORT = 8002

def main():
    # 确保在正确的目录中运行
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # 检查index.html是否存在
    if not Path('index.html').exists():
        print("❌ 错误: 找不到 index.html 文件")
        print("请确保在包含 index.html 的目录中运行此脚本")
        sys.exit(1)
    
    # 创建HTTP服务器
    Handler = http.server.SimpleHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"🚀 AutoClips 介绍网站已启动!")
            print(f"📱 本地访问地址: http://localhost:{PORT}")
            print(f"🌐 网络访问地址: http://0.0.0.0:{PORT}")
            print("\n按 Ctrl+C 停止服务器")
            print("-" * 50)
            
            # 自动打开浏览器
            try:
                webbrowser.open(f'http://localhost:{PORT}')
                print("🌐 已自动打开浏览器")
            except:
                print("⚠️  无法自动打开浏览器，请手动访问上述地址")
            
            # 启动服务器
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ 端口 {PORT} 已被占用")
            print(f"请尝试使用其他端口: python server.py --port 8001")
        else:
            print(f"❌ 启动服务器时出错: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n👋 服务器已停止")
        print("感谢使用 AutoClips!")

if __name__ == "__main__":
    # 简单的命令行参数处理
    if len(sys.argv) > 1 and sys.argv[1] == '--help':
        print("AutoClips 本地服务器")
        print("\n使用方法:")
        print("  python server.py          # 使用默认端口 8000")
        print("  python server.py --help   # 显示帮助信息")
        print("\n功能:")
        print("  - 启动本地HTTP服务器")
        print("  - 自动打开浏览器")
        print("  - 支持热重载 (手动刷新页面)")
        sys.exit(0)
    
    main()