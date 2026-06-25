@echo off
title تشغيل نظام إدارة المقاولات - مصون
chcp 65001 > nul
echo ===================================================
echo   جاري تشغيل نظام إدارة المقاولات والماليات (مصون)
echo ===================================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [تنبيه] تم اكتشاف بايثون (Python) على جهازك.
    echo جاري تشغيل الخادم المحلي على المنفذ 8000...
    echo.
    echo سيفتح النظام الآن في المتصفح على الرابط: http://localhost:8000
    echo (ستتمكن الآن من تثبيت البرنامج كـ App مستقل من شريط العنوان)
    echo.
    start "" http://localhost:8000
    python -m http.server 8000
    exit
)

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [تنبيه] تم اكتشاف نود (Node.js) على جهازك.
    echo جاري إعداد وتشغيل خادم محلي خفيف...
    
    :: Write server.js script
    (
    echo const http = require^('http'^);
    echo const fs = require^('fs'^);
    echo const path = require^('path'^);
    echo http.createServer^((req, res^) =^> {
    echo   let filePath = '.' + req.url;
    echo   if ^(filePath == './'^) filePath = './index.html';
    echo   const extname = path.extname^(filePath^);
    echo   let contentType = 'text/html';
    echo   if ^(extname == '.js'^) contentType = 'text/javascript';
    echo   else if ^(extname == '.css'^) contentType = 'text/css';
    echo   else if ^(extname == '.json'^) contentType = 'application/json';
    echo   else if ^(extname == '.jpg'^) contentType = 'image/jpeg';
    echo   fs.readFile^(filePath, ^(error, content^) =^> {
    echo     if ^(error^) {
    echo       res.writeHead^(404^); res.end^('File not found'^);
    echo     } else {
    echo       res.writeHead^(200, { 'Content-Type': contentType }^);
    echo       res.end^(content, 'utf-8'^);
    echo     }
    echo   }^);
    echo }^).listen^(8000^);
    ) > server.js
    
    echo.
    echo سيفتح النظام الآن في المتصفح على الرابط: http://localhost:8000
    echo (ستتمكن الآن من تثبيت البرنامج كـ App مستقل من شريط العنوان)
    echo.
    start "" http://localhost:8000
    node server.js
    exit
)

:: Fallback: Open index.html directly
echo [تنبيه] لم يتم العثور على Python أو Node.js لتشغيل خادم محلي.
echo جاري فتح ملف النظام مباشرة في المتصفح...
echo.
start "" index.html
exit
