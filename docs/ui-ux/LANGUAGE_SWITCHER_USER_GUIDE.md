# Language Switcher - User Guide

## Quick Start

### How to Change Language

1. **Log into any prototype** (prototype-admin or prototype-cliente)

2. **Look at the top-right corner** of the navigation bar

3. **You'll see two buttons**: `ES` and `EN`

4. **Click your preferred language**:
   - Click **ES** for Spanish (Español)
   - Click **EN** for English

5. **The interface updates immediately** - all navigation menus, buttons, and labels change to your selected language

6. **Your choice is remembered** - even after closing and reopening the browser

---

## What Gets Translated

### ✅ Fully Translated

- **Navigation Menu** (left sidebar):
  - Dashboard, Users/Tasks, Calendar, Projects, etc.

- **Top Navigation Bar**:
  - User menu (Profile, Settings, Logout)
  - Plan badge

- **Common Buttons**:
  - Save → Save / Guardar
  - Cancel → Cancel / Cancelar
  - Delete → Delete / Eliminar
  - Edit → Edit / Editar
  - Create → Create / Crear

- **Status Labels**:
  - Active → Active / Activo
  - Pending → Pending / Pendiente
  - Completed → Completed / Completado

- **Feature Upgrade Messages**:
  - Limit reached prompts
  - Plan upgrade suggestions

### ⚠️ Partially Translated

- Form labels in some components
- Table column headers in some views
- Help text and tooltips

### ❌ Not Translated

- Landing page marketing content
- User-generated content (task names, project titles, etc.)
- Email addresses, URLs, and technical identifiers

---

## Visual Guide

### Spanish (ES) - Default
```
┌────────────────────────────────────────────────┐
│  Logo   [ES] EN                            👤  │
├────────────────────────────────────────────────┤
│  ├─ Dashboard                                  │
│  ├─ Usuarios                                   │
│  ├─ Clientes                                   │
│  ├─ Roles                                      │
│  └─ Configuración                              │
│                                                 │
│  User Menu:                                    │
│  • Mi Perfil                                   │
│  • Configuración                               │
│  • Cerrar sesión                               │
└────────────────────────────────────────────────┘
```

### English (EN)
```
┌────────────────────────────────────────────────┐
│  Logo   ES [EN]                            👤  │
├────────────────────────────────────────────────┤
│  ├─ Dashboard                                  │
│  ├─ Users                                      │
│  ├─ Clients                                    │
│  ├─ Roles                                      │
│  └─ Settings                                   │
│                                                 │
│  User Menu:                                    │
│  • My Profile                                  │
│  • Settings                                    │
│  • Log Out                                     │
└────────────────────────────────────────────────┘
```

---

## Frequently Asked Questions

### Q: Will my data change when I switch languages?
**A:** No. Only the interface labels change. Your data (tasks, projects, users, etc.) remains exactly the same.

### Q: Do I need to switch language every time I log in?
**A:** No. Your language preference is saved automatically and will be remembered the next time you visit.

### Q: Can I switch language in the middle of filling out a form?
**A:** Yes. You can switch language at any time. However, any text you've already typed in form fields will remain in the language you typed it in.

### Q: What happens if I clear my browser data?
**A:** Your language preference is stored in localStorage. If you clear browser data, the language will reset to Spanish (the default).

### Q: Why are some parts still in Spanish when I select English?
**A:** We prioritized translating the most important parts first (navigation, buttons, status labels). Some secondary content like help text and table headers will be translated in future updates.

### Q: Can I add more languages?
**A:** Currently only Spanish and English are available. Additional languages can be added by developers in future releases.

### Q: Is there a keyboard shortcut to switch languages?
**A:** Not yet. You must click the ES/EN buttons in the navigation bar.

---

## Technical Details

### Where is my preference stored?
Your language preference is stored in your browser's localStorage with the key `preferredLanguage`.

### Supported Languages
- **es** - Español (Spanish) - Default
- **en** - English

### Browser Compatibility
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ All modern browsers

---

## Troubleshooting

### Language doesn't change after clicking
1. **Refresh the page** - Sometimes a manual refresh helps
2. **Check browser console** for errors (F12 → Console tab)
3. **Clear localStorage** and try again:
   ```javascript
   // Open browser console (F12) and run:
   localStorage.removeItem('preferredLanguage');
   location.reload();
   ```

### Language resets to Spanish every time
1. **Check browser settings** - Ensure cookies/localStorage are enabled
2. **Check incognito/private mode** - Private browsing may not save preferences
3. **Try a different browser** to isolate the issue

### Some text doesn't translate
This is expected. We prioritized:
1. Navigation menus
2. Common actions (buttons)
3. Status labels
4. Important messages

Secondary content (help text, long descriptions) may still be in Spanish and will be translated in future updates.

---

## Support

If you encounter issues with the language switcher:
1. Check this guide first
2. Try the troubleshooting steps above
3. Contact support with:
   - Browser name and version
   - What you expected to happen
   - What actually happened
   - Screenshot if possible

---

## Demo Video (Conceptual)

**Step-by-step demonstration:**

1. **Login Screen** → Login with credentials
2. **Dashboard loads in Spanish** (default)
3. **Look top-right** → See ES/EN buttons
4. **Click EN** → Interface switches to English
5. **Navigate to Users** → Menu shows "Users" instead of "Usuarios"
6. **Click user menu** → Shows "My Profile", "Settings", "Log Out"
7. **Click ES** → Interface switches back to Spanish
8. **Reload page** → Language stays in Spanish (remembered)

---

## For Developers

To add translations for new components:

1. **Add translation keys** to appropriate JSON file:
   ```json
   // locales/es/mymodule.json
   { "newButton": "Nuevo Botón" }

   // locales/en/mymodule.json
   { "newButton": "New Button" }
   ```

2. **Use in component**:
   ```javascript
   import { useTranslation } from 'react-i18next';

   function MyComponent() {
     const { t } = useTranslation('mymodule');
     return <button>{t('newButton')}</button>;
   }
   ```

3. **Test both languages** before committing

See `LANGUAGE_SWITCHER_IMPLEMENTATION.md` for complete developer documentation.
