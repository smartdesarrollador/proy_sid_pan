# Selectors y Page Object Model (POM)

Organiza tus tests de Playwright para que sean escalables y fáciles de mantener usando el patrón Page Object Model (POM).

## 1. Estrategias de Selectores (Locators)

Al igual que en React Testing Library, Playwright favorece selectores que reflejen la accesibilidad y el texto visual sobre IDs o Clases.

### Prioridad de Selección
1.  **`page.getByRole(...)`**: El más robusto. (`button`, `link`, `heading`)
2.  **`page.getByLabel(...)`**: Campos de formulario.
3.  **`page.getByPlaceholder(...)`**: (Si no hay label)
4.  **`page.getByText(...)`**: Texto visible no interactivo.
5.  **`page.getByTestId(...)`**: ÚLTIMO RECURSO (ej. `data-testid="chart-container"`).

### Ejemplos Resilientes

**❌ MAL (CSS frágil):**
```typescript
await page.locator('div > .btn-primary').click();
```

**✅ BIEN (Semántico):**
```typescript
await page.getByRole('button', { name: /guardar/i }).click();

// Filtrar locator (ej. lista de items)
await page.getByRole('listitem')
  .filter({ hasText: 'Producto A' })
  .getByRole('button', { name: /comprar/i })
  .click();
```

## 2. Page Object Model (POM)

POM te permite abstraer la lógica de interacción con una página en una clase, haciendo que tus tests sean legibles y reutilizables. Si cambia el selector de "Login", solo lo actualizas en un lugar.

### Estructura Recomendada

```
e2e/
  pages/
    LoginPage.ts
    DashboardPage.ts
  specs/
    login.spec.ts
```

### Implementación (`e2e/pages/LoginPage.ts`)

```typescript
import { type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: /sign in/i });
    this.errorMessage = page.locator('.error-message'); // CSS class example
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, pass: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    await this.loginButton.click();
  }

  async getErrorText() {
    return this.errorMessage.textContent();
  }
}
```

### Uso en Tests (`e2e/specs/login.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login Flow', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await loginPage.login('user@example.com', 'securepass');
    
    // Aserción sobre la URL o contenido de la nueva página
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
  });

  test('shows error with invalid credentials', async () => {
    await loginPage.login('bad@user.com', 'wrongpass');
    
    // Aserción usando método helper del POM
    await expect(loginPage.errorMessage).toContainText('Invalid credentials');
  });
});
```
