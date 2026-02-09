#!/usr/bin/env python3
"""Alerta visual cuando Claude Code finaliza una tarea."""

import subprocess
import sys
import os


def show_windows_notification() -> bool:
    """Muestra notificación en Windows vía PowerShell (para WSL)."""
    try:
        ps_script = """
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
        $Template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)

        $RawXml = [xml] $Template.GetXml()
        ($RawXml.toast.visual.binding.text|where {$_.id -eq "1"}).AppendChild($RawXml.CreateTextNode("Claude Code")) > $null
        ($RawXml.toast.visual.binding.text|where {$_.id -eq "2"}).AppendChild($RawXml.CreateTextNode("Tarea completada exitosamente")) > $null

        $SerializedXml = New-Object Windows.Data.Xml.Dom.XmlDocument
        $SerializedXml.LoadXml($RawXml.OuterXml)

        $Toast = [Windows.UI.Notifications.ToastNotification]::new($SerializedXml)
        $Toast.Tag = "ClaudeCode"
        $Toast.Group = "ClaudeCode"

        $Notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Claude Code")
        $Notifier.Show($Toast)
        """

        subprocess.run(
            ["powershell.exe", "-Command", ps_script],
            check=True,
            capture_output=True,
            timeout=5
        )
        return True
    except Exception:
        return False


def show_linux_notification() -> bool:
    """Muestra notificación con notify-send (Linux nativo)."""
    try:
        subprocess.run(
            [
                "notify-send",
                "--app-name=Claude Code",
                "--icon=dialog-information",
                "--urgency=normal",
                "Claude Code",
                "Tarea completada exitosamente"
            ],
            check=True,
            timeout=5
        )
        return True
    except (FileNotFoundError, subprocess.SubprocessError):
        return False


def show_terminal_alert() -> None:
    """Fallback: mostrar en terminal con colores."""
    print("\n" + "="*50)
    print("\033[92m✓ Claude Code - Tarea Completada\033[0m")
    print("="*50 + "\n")


def main() -> None:
    """Intenta mostrar notificación en el mejor formato disponible."""
    # Detectar si estamos en WSL
    is_wsl = os.path.exists('/proc/version') and 'microsoft' in open('/proc/version').read().lower()

    if is_wsl:
        # En WSL, intentar notificación de Windows primero
        if show_windows_notification():
            return

    # Intentar notify-send (Linux)
    if show_linux_notification():
        return

    # Fallback: terminal
    show_terminal_alert()


if __name__ == "__main__":
    main()
