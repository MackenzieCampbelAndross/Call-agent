@echo off
setlocal
set "JAVA_HOME=C:\Users\Mackenzie Campbel\.jdks\jbr-21.0.11"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "GRADLE_BIN=C:\Users\Mackenzie Campbel\.gradle\wrapper\dists\gradle-8.11.1-all\2qik7nd48slq1ooc2496ixf4i\gradle-8.11.1\bin\gradle.bat"
"%GRADLE_BIN%" %*
exit /b %ERRORLEVEL%
