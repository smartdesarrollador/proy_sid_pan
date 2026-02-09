# ARIA Patterns Advanced - Referencia Completa

Patrones avanzados de ARIA para componentes complejos en Angular.

## Tabla de Contenidos

1. [Accordion](#accordion)
2. [Tabs](#tabs)
3. [Combobox/Autocomplete](#combobox-autocomplete)
4. [Tree View](#tree-view)
5. [Tooltip](#tooltip)
6. [Alert/Toast](#alert-toast)
7. [Breadcrumb](#breadcrumb)
8. [Menu Button](#menu-button)
9. [Dialog/Modal](#dialog-modal)
10. [Listbox](#listbox)

---

## Accordion

### ARIA Attributes
- Container: `role="region"` o sin role
- Header: `<button>` con `aria-expanded="true|false"` y `aria-controls="panel-id"`
- Panel: `id="panel-id"`, `role="region"`, `aria-labelledby="header-id"`

### Keyboard Support
- `Space/Enter`: Toggle panel
- `Tab`: Navegar entre headers
- `Home`: First header
- `End`: Last header

### Ejemplo Completo

```typescript
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface AccordionItem {
  id: string;
  title: string;
  content: string;
  expanded: boolean;
}

@Component({
  selector: 'app-accordion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="accordion">
      @for (item of items(); track item.id) {
        <div class="accordion-item">
          <!-- Header -->
          <h3>
            <button
              [id]="'accordion-header-' + item.id"
              type="button"
              [attr.aria-expanded]="item.expanded"
              [attr.aria-controls]="'accordion-panel-' + item.id"
              (click)="toggle(item.id)"
              class="accordion-header"
            >
              <span>{{ item.title }}</span>
              <span aria-hidden="true">{{ item.expanded ? '−' : '+' }}</span>
            </button>
          </h3>

          <!-- Panel -->
          @if (item.expanded) {
            <div
              [id]="'accordion-panel-' + item.id"
              role="region"
              [attr.aria-labelledby]="'accordion-header-' + item.id"
              class="accordion-panel"
            >
              {{ item.content }}
            </div>
          }
        </div>
      }
    </div>
  `
})
export class AccordionComponent {
  items = signal<AccordionItem[]>([
    { id: '1', title: 'Section 1', content: 'Content 1', expanded: false },
    { id: '2', title: 'Section 2', content: 'Content 2', expanded: false },
  ]);

  toggle(id: string): void {
    this.items.update(items =>
      items.map(item =>
        item.id === id ? { ...item, expanded: !item.expanded } : item
      )
    );
  }
}
```

---

## Tabs

### ARIA Attributes
- Container: `role="tablist"`, `aria-label="Tab group description"`
- Tab: `role="tab"`, `aria-selected="true|false"`, `aria-controls="panel-id"`, `tabindex="0|-1"`
- Panel: `role="tabpanel"`, `aria-labelledby="tab-id"`, `tabindex="0"`

### Keyboard Support
- `Arrow Left/Right`: Navigate tabs
- `Home`: First tab
- `End`: Last tab
- `Tab`: Move to panel or next focusable element

### Ejemplo Completo

```typescript
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeyCode } from '@/core/models/accessibility.models';

interface Tab {
  id: string;
  label: string;
  content: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tabs">
      <!-- Tab List -->
      <div
        role="tablist"
        aria-label="Content tabs"
        (keydown)="onKeydown($event)"
      >
        @for (tab of tabs(); track tab.id; let i = $index) {
          <button
            [id]="'tab-' + tab.id"
            role="tab"
            [attr.aria-selected]="selectedIndex() === i"
            [attr.aria-controls]="'panel-' + tab.id"
            [tabindex]="selectedIndex() === i ? 0 : -1"
            (click)="selectTab(i)"
            class="tab-button"
            [class.active]="selectedIndex() === i"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      <!-- Tab Panels -->
      @for (tab of tabs(); track tab.id; let i = $index) {
        @if (selectedIndex() === i) {
          <div
            [id]="'panel-' + tab.id"
            role="tabpanel"
            [attr.aria-labelledby]="'tab-' + tab.id"
            tabindex="0"
            class="tab-panel"
          >
            {{ tab.content }}
          </div>
        }
      }
    </div>
  `
})
export class TabsComponent {
  tabs = signal<Tab[]>([
    { id: '1', label: 'Tab 1', content: 'Content 1' },
    { id: '2', label: 'Tab 2', content: 'Content 2' },
    { id: '3', label: 'Tab 3', content: 'Content 3' },
  ]);

  selectedIndex = signal(0);

  selectTab(index: number): void {
    this.selectedIndex.set(index);
  }

  onKeydown(event: KeyboardEvent): void {
    const count = this.tabs().length;
    let newIndex = this.selectedIndex();

    switch (event.key) {
      case KeyCode.ARROW_RIGHT:
        event.preventDefault();
        newIndex = (newIndex + 1) % count;
        break;

      case KeyCode.ARROW_LEFT:
        event.preventDefault();
        newIndex = (newIndex - 1 + count) % count;
        break;

      case KeyCode.HOME:
        event.preventDefault();
        newIndex = 0;
        break;

      case KeyCode.END:
        event.preventDefault();
        newIndex = count - 1;
        break;

      default:
        return;
    }

    this.selectTab(newIndex);

    // Focus the new tab
    setTimeout(() => {
      const tabButton = document.getElementById(`tab-${this.tabs()[newIndex].id}`);
      tabButton?.focus();
    });
  }
}
```

---

## Combobox (Autocomplete)

### ARIA Attributes
- Input: `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded="true|false"`, `aria-controls="listbox-id"`, `aria-activedescendant="option-id"`
- Listbox: `role="listbox"`, `id="listbox-id"`
- Option: `role="option"`, `aria-selected="true|false"`

### Keyboard Support
- `Arrow Down`: Open listbox / next option
- `Arrow Up`: Previous option
- `Enter`: Select option
- `Escape`: Close listbox
- `Home/End`: First/last option

### Ejemplo Completo

```typescript
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Option {
  id: string;
  label: string;
  value: string;
}

@Component({
  selector: 'app-combobox',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="combobox-container">
      <label [for]="inputId" class="block mb-2">
        {{ label }}
      </label>

      <input
        [id]="inputId"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-controls]="listboxId"
        [attr.aria-activedescendant]="activeDescendant()"
        [(ngModel)]="searchTerm"
        (input)="onInput()"
        (keydown)="onKeydown($event)"
        (focus)="onFocus()"
        class="w-full px-3 py-2 border rounded"
      />

      @if (isOpen() && filteredOptions().length > 0) {
        <ul
          [id]="listboxId"
          role="listbox"
          class="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-auto"
        >
          @for (option of filteredOptions(); track option.id; let i = $index) {
            <li
              [id]="'option-' + option.id"
              role="option"
              [attr.aria-selected]="selectedValue() === option.value"
              [class.highlighted]="focusedIndex() === i"
              (click)="selectOption(option)"
              class="px-3 py-2 cursor-pointer hover:bg-gray-100"
            >
              {{ option.label }}
            </li>
          }
        </ul>
      }
    </div>
  `
})
export class ComboboxComponent {
  inputId = 'combobox-input';
  listboxId = 'combobox-listbox';

  searchTerm = '';
  isOpen = signal(false);
  focusedIndex = signal(0);
  selectedValue = signal<string | null>(null);
  activeDescendant = signal<string>('');

  options = signal<Option[]>([
    { id: '1', label: 'Apple', value: 'apple' },
    { id: '2', label: 'Banana', value: 'banana' },
    { id: '3', label: 'Cherry', value: 'cherry' },
  ]);

  filteredOptions = signal<Option[]>([]);

  label = 'Search fruits';

  onInput(): void {
    const term = this.searchTerm.toLowerCase();
    const filtered = this.options().filter(opt =>
      opt.label.toLowerCase().includes(term)
    );

    this.filteredOptions.set(filtered);
    this.isOpen.set(filtered.length > 0);
    this.focusedIndex.set(0);
    this.updateActiveDescendant();
  }

  onFocus(): void {
    this.onInput();
  }

  selectOption(option: Option): void {
    this.searchTerm = option.label;
    this.selectedValue.set(option.value);
    this.isOpen.set(false);
  }

  onKeydown(event: KeyboardEvent): void {
    const opts = this.filteredOptions();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.isOpen.set(true);
        } else {
          this.focusedIndex.update(i => (i + 1) % opts.length);
          this.updateActiveDescendant();
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.update(i => (i - 1 + opts.length) % opts.length);
        this.updateActiveDescendant();
        break;

      case 'Enter':
        event.preventDefault();
        if (this.isOpen() && opts.length > 0) {
          this.selectOption(opts[this.focusedIndex()]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.isOpen.set(false);
        break;
    }
  }

  private updateActiveDescendant(): void {
    const opts = this.filteredOptions();
    const focused = opts[this.focusedIndex()];
    this.activeDescendant.set(focused ? `option-${focused.id}` : '');
  }
}
```

---

## Tree View

### ARIA Attributes
- Tree: `role="tree"`, `aria-label="Tree description"`
- Tree item: `role="treeitem"`, `aria-expanded="true|false"` (if has children), `aria-level="1|2|3..."`, `aria-setsize="N"`, `aria-posinset="M"`
- Group: `role="group"`

### Keyboard Support
- `Arrow Down`: Next visible node
- `Arrow Up`: Previous visible node
- `Arrow Right`: Expand node / go to first child
- `Arrow Left`: Collapse node / go to parent
- `Home`: First node
- `End`: Last visible node
- `Enter/Space`: Activate node

### Ejemplo

```typescript
interface TreeNode {
  id: string;
  label: string;
  expanded?: boolean;
  children?: TreeNode[];
}

@Component({
  selector: 'app-tree-view',
  template: `
    <ul role="tree" aria-label="File explorer">
      <app-tree-node
        *ngFor="let node of nodes"
        [node]="node"
        [level]="1"
      />
    </ul>
  `
})
export class TreeViewComponent {
  nodes: TreeNode[] = [
    {
      id: '1',
      label: 'Folder 1',
      expanded: true,
      children: [
        { id: '1-1', label: 'File 1.1' },
        { id: '1-2', label: 'File 1.2' }
      ]
    }
  ];
}
```

---

## Tooltip

### ARIA Attributes
- Trigger: `aria-describedby="tooltip-id"`
- Tooltip: `role="tooltip"`, `id="tooltip-id"`

### Keyboard Support
- `Escape`: Dismiss tooltip
- Tooltip appears on focus/hover, disappears on blur/mouse leave

### Ejemplo

```typescript
@Component({
  selector: 'app-tooltip',
  template: `
    <button
      [attr.aria-describedby]="isVisible() ? tooltipId : null"
      (mouseenter)="show()"
      (mouseleave)="hide()"
      (focus)="show()"
      (blur)="hide()"
    >
      {{ label }}
    </button>

    @if (isVisible()) {
      <div
        [id]="tooltipId"
        role="tooltip"
        class="tooltip"
      >
        {{ text }}
      </div>
    }
  `
})
export class TooltipComponent {
  isVisible = signal(false);
  tooltipId = 'tooltip-' + Math.random().toString(36).substr(2, 9);
  label = 'Hover me';
  text = 'Tooltip content';

  show() { this.isVisible.set(true); }
  hide() { this.isVisible.set(false); }
}
```

---

## Alert / Toast

### ARIA Attributes
- Alert: `role="alert"` o `role="status"`, `aria-live="assertive|polite"`, `aria-atomic="true"`

### Tipos
- **Alert**: Errores críticos (`role="alert"`, `aria-live="assertive"`)
- **Status**: Información (`role="status"`, `aria-live="polite"`)

### Ejemplo

```typescript
@Component({
  selector: 'app-toast',
  template: `
    @if (visible()) {
      <div
        [attr.role]="type() === 'error' ? 'alert' : 'status'"
        [attr.aria-live]="type() === 'error' ? 'assertive' : 'polite'"
        aria-atomic="true"
        [class]="getClasses()"
      >
        <span>{{ message() }}</span>
        <button
          type="button"
          aria-label="Close notification"
          (click)="close()"
        >
          ✕
        </button>
      </div>
    }
  `
})
export class ToastComponent {
  visible = signal(false);
  message = signal('');
  type = signal<'info' | 'success' | 'error'>('info');

  show(msg: string, type: 'info' | 'success' | 'error' = 'info') {
    this.message.set(msg);
    this.type.set(type);
    this.visible.set(true);

    setTimeout(() => this.close(), 5000);
  }

  close() {
    this.visible.set(false);
  }

  getClasses(): string {
    const base = 'fixed top-4 right-4 p-4 rounded shadow-lg';
    const variants = {
      info: 'bg-blue-100 text-blue-900',
      success: 'bg-green-100 text-green-900',
      error: 'bg-red-100 text-red-900'
    };
    return `${base} ${variants[this.type()]}`;
  }
}
```

---

## Best Practices para ARIA

1. **Regla #1: No uses ARIA** si HTML nativo funciona
   - ✅ `<button>` en lugar de `<div role="button">`
   - ✅ `<nav>` en lugar de `<div role="navigation">`

2. **No cambies semántica nativa**
   - ❌ `<h1 role="button">` (incorrecto)
   - ✅ `<button>` (correcto)

3. **Elementos interactivos deben ser keyboard accessible**
   - Siempre agregar keyboard handlers si usas `role="button"` en div

4. **No uses `aria-label` en elementos no interactivos**
   - ❌ `<div aria-label="Content">` (ignorado)
   - ✅ `<section aria-labelledby="heading-id">` (correcto)

5. **`aria-hidden="true"` oculta COMPLETAMENTE del accessibility tree**
   - No uses en elementos focusables
   - Úsalo solo para iconos decorativos

6. **Testea con screen readers reales**
   - NVDA (Windows, gratis)
   - JAWS (Windows)
   - VoiceOver (Mac/iOS)
   - TalkBack (Android)

---

Para más patrones ARIA, consultar: https://www.w3.org/WAI/ARIA/apg/patterns/
