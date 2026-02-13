# React Forms & Validation Skill

Guía completa de formularios y validación en React con TypeScript, react-hook-form, Zod/Yup y patrones UX modernos para producción.

## 📋 Descripción

Este skill proporciona patrones completos para formularios en React con type safety, validación robusta y UX optimizada. Enfocado en react-hook-form como librería principal y Zod para validación de schemas.

**Ideal para:**
- Formularios con validación compleja (login, registro, perfil, checkout)
- Type safety estricto con TypeScript
- Performance optimizada (menos re-renders)
- Validación en tiempo real con feedback inmediato
- Formularios dinámicos (arrays, conditional fields, nested objects)
- Integración con APIs y manejo de errores
- UX patterns modernos (loading states, dirty fields, reset)

## 🚀 Uso

El skill se invoca automáticamente cuando trabajas con:
- react-hook-form (`useForm`, `register`, `handleSubmit`, `Controller`)
- Validación con Zod o Yup
- Campos de formulario tipados (Input, Select, Checkbox, File upload)
- Validación en tiempo real (onChange, onBlur)
- Formularios complejos (arrays dinámicos, nested objects)
- Submit handling y manejo de errores

También puedes invocarlo manualmente:
```
/react-forms-validation
```

## 📚 Contenido

### SKILL.md Principal
Patrones core organizados en 10 secciones:

1. **Controlled vs Uncontrolled Components**
   - Cuándo usar cada uno
   - Pros y contras de cada approach
   - React Hook Form como híbrido

2. **React Hook Form Setup**
   - useForm con TypeScript
   - register, handleSubmit, formState
   - Opciones avanzadas (watch, setValue, reset, trigger)

3. **Validación con Zod**
   - Schemas tipados con inferencia automática
   - Validaciones custom y async
   - Mensajes de error en español/inglés
   - zodResolver integration

4. **Validación con Yup**
   - Alternativa a Zod
   - Schemas y validaciones
   - yupResolver integration
   - Comparación Zod vs Yup

5. **Campos Comunes Tipados**
   - Input (text, email, password, url, tel)
   - Select y Select múltiple
   - Checkbox y Checkbox Group
   - Radio Group
   - Textarea con contador de caracteres
   - File Upload con preview

6. **Validación en Tiempo Real**
   - onChange, onBlur, onSubmit
   - Modos de validación óptimos
   - Balance entre UX y performance

7. **Manejo de Errores**
   - Mostrar errores por campo
   - Touched fields
   - Error messages dinámicos
   - Feedback visual

8. **Formularios Complejos**
   - Arrays dinámicos (useFieldArray)
   - Nested objects
   - Conditional fields
   - Multi-step forms

9. **Submit Handling**
   - Loading states
   - API integration
   - Error handling
   - Success feedback

10. **UX Patterns**
    - Disable button durante submit
    - Reset form después de submit
    - Valores iniciales
    - Dirty fields tracking

### Referencias Adicionales

#### `references/field-components.md`
- Componentes de campos avanzados
- Controller para UI libraries (MUI, Chakra)
- Custom inputs con masks
- Autocomplete y typeahead
- Date pickers
- Rich text editors

#### `references/form-examples.md`
- Formulario de Login completo
- Formulario de Registro con confirmación
- Formulario de Perfil con imagen
- Formulario de Checkout multi-step
- Formulario de Contacto con attachments
- Formulario de Búsqueda con filtros

#### `references/complex-forms.md`
- useFieldArray para arrays dinámicos
- Nested objects profundos
- Conditional fields con watch
- Multi-step wizards
- Form context para formularios distribuidos
- Performance optimization para forms grandes

#### `references/ux-patterns.md`
- Loading y disabled states
- Success y error feedback
- Field validation feedback
- Progress indicators
- Auto-save drafts
- Dirty tracking y unsaved changes warning
- Field hints y tooltips

## 💡 Cuándo Usar React Hook Form

### ✅ Usar React Hook Form cuando:
- Formularios medianos a grandes (5+ campos)
- Necesitas validación robusta
- Performance es importante
- Quieres type safety con TypeScript
- Necesitas integración con UI libraries
- Formularios complejos (arrays, nested)

### ⚠️ Considerar Alternativas cuando:
- Formularios muy simples (1-2 campos) → usar useState
- Necesitas sincronización entre campos en tiempo real → Formik
- Ya tienes Formik en el proyecto y funciona bien

## 🎯 Setup Rápido

### Instalación
```bash
npm install react-hook-form @hookform/resolvers zod
```

### Ejemplo Básico
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await api.login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}

      <button disabled={isSubmitting}>Login</button>
    </form>
  );
}
```

## 🔗 Recursos Externos

- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [React Hook Form TypeScript](https://react-hook-form.com/ts)
- [Form Validation with Zod and React Hook Form](https://www.contentful.com/blog/react-hook-form-validation-zod/)
- [Type-Safe Forms in React](https://oneuptime.com/blog/post/2026-01-15-type-safe-forms-react-hook-form-zod/view)
- [React Hook Form Best Practices](https://orizens.com/blog/best_practices_for_developing_complex_form-based_apps_with_react_hook_form_and_typescript_support/)

## 📊 Comparación con Alternativas

| Feature | React Hook Form | Formik | useState |
|---------|-----------------|--------|----------|
| Setup Complexity | ⭐⭐ | ⭐⭐⭐ | ⭐ |
| TypeScript Support | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Performance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Bundle Size | ~9kb | ~13kb | 0kb (built-in) |
| Learning Curve | ⭐⭐ | ⭐⭐⭐ | ⭐ |
| Validation | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Complex Forms | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| DevTools | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | - |

## 🏆 Best Practices

1. ✅ **Usar Zod** para schemas con inferencia automática de tipos
2. ✅ **mode: 'onBlur'** para balance entre UX y performance
3. ✅ **defaultValues** siempre para evitar undefined errors
4. ✅ **Componentes reutilizables** para campos comunes
5. ✅ **Deshabilitar submit** durante isSubmitting
6. ✅ **Reset form** después de submit exitoso
7. ✅ **Mensajes claros** en el idioma del usuario
8. ✅ **Accessibility** con labels y aria-attributes
9. ⚠️ **Minimizar watch()** para evitar re-renders
10. ⚠️ **No validar onChange** a menos que sea necesario

## 🎨 Patrones UX Recomendados

### Validación
- **onBlur**: Validar cuando el campo pierde focus (recomendado)
- **onChange**: Solo para validación en tiempo real crítica
- **onSubmit**: Siempre validar al enviar

### Feedback
- Mostrar errores después de que el usuario toque el campo
- Mostrar success cuando la validación pase
- Loading spinner en el botón durante submit
- Desplazar scroll al primer error

### Estados
- Deshabilitar submit si el form no es válido
- Mostrar indicador de "unsaved changes"
- Auto-save drafts en formularios largos
- Confirmar antes de abandonar con cambios sin guardar

## 📝 Notas

- Este skill complementa `react-hooks-patterns` y `react-typescript-foundations`
- Para formularios muy simples (1-2 campos), considera usar useState directamente
- Para formularios de una sola página estática, considera usar action forms de Next.js
- Siempre testear formularios con diferentes navegadores y dispositivos

## 🆕 Actualizado para 2026

Este skill incluye las últimas prácticas:
- Zod v4 con mejor inferencia de tipos
- React Hook Form v7+ con mejor performance
- TypeScript 5.0+ features
- Accessibility patterns actualizados
- Server Actions integration (Next.js 14+)
