#!/usr/bin/env python3
"""Alerta visual cuando Claude Code finaliza una tarea."""

import tkinter as tk
from tkinter import messagebox


def show_alert() -> None:
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    messagebox.showinfo(
        title="Claude Code",
        message="La tarea ha sido completada exitosamente.\n\nPuedes revisar los cambios realizados.",
    )
    root.destroy()


if __name__ == "__main__":
    show_alert()
