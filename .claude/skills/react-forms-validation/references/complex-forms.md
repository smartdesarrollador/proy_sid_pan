# Complex Forms - Formularios Avanzados

Guía completa de patrones avanzados para formularios complejos: arrays dinámicos, nested objects, conditional fields y multi-step forms.

## 1. Arrays Dinámicos - useFieldArray

### Agregar/Eliminar Items Dinámicamente

```tsx
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema con array validation
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  emails: z
    .array(
      z.object({
        email: z.string().email('Invalid email'),
        isPrimary: z.boolean(),
      })
    )
    .min(1, 'At least one email is required')
    .max(5, 'Maximum 5 emails allowed'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfileForm = () => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      emails: [{ email: '', isPrimary: true }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'emails',
  });

  const addEmail = () => {
    append({ email: '', isPrimary: false });
  };

  const removeEmail = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit: SubmitHandler<ProfileFormData> = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Name</label>
        <input {...register('name')} />
        {errors.name && <span>{errors.name.message}</span>}
      </div>

      <div>
        <h3>Emails</h3>
        {fields.map((field, index) => (
          <div key={field.id} className="array-item">
            <input
              {...register(`emails.${index}.email`)}
              placeholder="email@example.com"
            />
            {errors.emails?.[index]?.email && (
              <span>{errors.emails[index]?.email?.message}</span>
            )}

            <label>
              <input type="checkbox" {...register(`emails.${index}.isPrimary`)} />
              Primary
            </label>

            <button
              type="button"
              onClick={() => removeEmail(index)}
              disabled={fields.length === 1}
            >
              Remove
            </button>

            {/* Reorder buttons */}
            {index > 0 && (
              <button type="button" onClick={() => move(index, index - 1)}>
                ↑
              </button>
            )}
            {index < fields.length - 1 && (
              <button type="button" onClick={() => move(index, index + 1)}>
                ↓
              </button>
            )}
          </div>
        ))}

        <button type="button" onClick={addEmail} disabled={fields.length >= 5}>
          Add Email
        </button>

        {errors.emails?.root && (
          <span className="error">{errors.emails.root.message}</span>
        )}
      </div>

      <button type="submit">Save</button>
    </form>
  );
};
```

### Array de Objetos Complejos

```tsx
// Schema para formulario de educación
const educationSchema = z.object({
  education: z.array(
    z.object({
      institution: z.string().min(1, 'Institution is required'),
      degree: z.string().min(1, 'Degree is required'),
      field: z.string().min(1, 'Field of study is required'),
      startDate: z.string().min(1, 'Start date is required'),
      endDate: z.string().optional(),
      current: z.boolean(),
      gpa: z.number().min(0).max(4).optional(),
      achievements: z.array(z.string()).optional(),
    })
  ),
});

type EducationFormData = z.infer<typeof educationSchema>;

const EducationForm = () => {
  const { control, register, handleSubmit, watch } = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      education: [
        {
          institution: '',
          degree: '',
          field: '',
          startDate: '',
          endDate: '',
          current: false,
          achievements: [],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'education',
  });

  const addEducation = () => {
    append({
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      current: false,
    });
  };

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      {fields.map((field, index) => {
        const isCurrent = watch(`education.${index}.current`);

        return (
          <div key={field.id} className="education-item">
            <h4>Education #{index + 1}</h4>

            <input
              {...register(`education.${index}.institution`)}
              placeholder="Institution"
            />

            <input
              {...register(`education.${index}.degree`)}
              placeholder="Degree"
            />

            <input
              {...register(`education.${index}.field`)}
              placeholder="Field of Study"
            />

            <div className="date-range">
              <input
                type="date"
                {...register(`education.${index}.startDate`)}
                placeholder="Start Date"
              />

              {!isCurrent && (
                <input
                  type="date"
                  {...register(`education.${index}.endDate`)}
                  placeholder="End Date"
                />
              )}

              <label>
                <input type="checkbox" {...register(`education.${index}.current`)} />
                Currently studying here
              </label>
            </div>

            <input
              type="number"
              step="0.01"
              {...register(`education.${index}.gpa`, { valueAsNumber: true })}
              placeholder="GPA (optional)"
            />

            <button type="button" onClick={() => remove(index)}>
              Remove Education
            </button>
          </div>
        );
      })}

      <button type="button" onClick={addEducation}>
        Add Education
      </button>

      <button type="submit">Save</button>
    </form>
  );
};
```

## 2. Nested Objects - Objetos Anidados

### Objetos Anidados Profundos

```tsx
const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  country: z.string().min(1, 'Country is required'),
});

const userSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
  }),
  contactInfo: z.object({
    email: z.string().email('Invalid email'),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
    preferredContact: z.enum(['email', 'phone', 'both']),
  }),
  address: z.object({
    home: addressSchema,
    billing: addressSchema.optional(),
    sameAsBilling: z.boolean(),
  }),
});

type UserFormData = z.infer<typeof userSchema>;

const UserForm = () => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      personalInfo: {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
      },
      contactInfo: {
        email: '',
        phone: '',
        preferredContact: 'email',
      },
      address: {
        home: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        sameAsBilling: true,
      },
    },
  });

  const sameAsBilling = watch('address.sameAsBilling');

  // Copy home address to billing when checkbox is checked
  useEffect(() => {
    if (sameAsBilling) {
      const homeAddress = watch('address.home');
      setValue('address.billing', homeAddress);
    }
  }, [sameAsBilling, watch, setValue]);

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <section>
        <h3>Personal Information</h3>
        <input {...register('personalInfo.firstName')} placeholder="First Name" />
        {errors.personalInfo?.firstName && (
          <span>{errors.personalInfo.firstName.message}</span>
        )}

        <input {...register('personalInfo.lastName')} placeholder="Last Name" />
        {errors.personalInfo?.lastName && (
          <span>{errors.personalInfo.lastName.message}</span>
        )}

        <input type="date" {...register('personalInfo.dateOfBirth')} />
        {errors.personalInfo?.dateOfBirth && (
          <span>{errors.personalInfo.dateOfBirth.message}</span>
        )}
      </section>

      <section>
        <h3>Contact Information</h3>
        <input {...register('contactInfo.email')} placeholder="Email" />
        {errors.contactInfo?.email && (
          <span>{errors.contactInfo.email.message}</span>
        )}

        <input {...register('contactInfo.phone')} placeholder="Phone" />
        {errors.contactInfo?.phone && (
          <span>{errors.contactInfo.phone.message}</span>
        )}

        <select {...register('contactInfo.preferredContact')}>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="both">Both</option>
        </select>
      </section>

      <section>
        <h3>Home Address</h3>
        <input {...register('address.home.street')} placeholder="Street" />
        <input {...register('address.home.city')} placeholder="City" />
        <input {...register('address.home.state')} placeholder="State" />
        <input {...register('address.home.zipCode')} placeholder="ZIP Code" />
        <input {...register('address.home.country')} placeholder="Country" />
      </section>

      <section>
        <label>
          <input type="checkbox" {...register('address.sameAsBilling')} />
          Billing address same as home
        </label>

        {!sameAsBilling && (
          <div>
            <h3>Billing Address</h3>
            <input {...register('address.billing.street')} placeholder="Street" />
            <input {...register('address.billing.city')} placeholder="City" />
            <input {...register('address.billing.state')} placeholder="State" />
            <input {...register('address.billing.zipCode')} placeholder="ZIP" />
            <input {...register('address.billing.country')} placeholder="Country" />
          </div>
        )}
      </section>

      <button type="submit">Save</button>
    </form>
  );
};
```

## 3. Conditional Fields - Campos Condicionales

### Mostrar/Ocultar Campos según Valores

```tsx
const jobApplicationSchema = z
  .object({
    employmentStatus: z.enum(['employed', 'unemployed', 'student', 'self-employed']),
    currentCompany: z.string().optional(),
    currentPosition: z.string().optional(),
    yearsOfExperience: z.number().optional(),
    school: z.string().optional(),
    expectedGraduation: z.string().optional(),
    businessName: z.string().optional(),
    businessType: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Validación condicional según employmentStatus
    if (data.employmentStatus === 'employed') {
      if (!data.currentCompany) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Current company is required',
          path: ['currentCompany'],
        });
      }
      if (!data.currentPosition) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Current position is required',
          path: ['currentPosition'],
        });
      }
    }

    if (data.employmentStatus === 'student') {
      if (!data.school) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'School is required',
          path: ['school'],
        });
      }
    }

    if (data.employmentStatus === 'self-employed') {
      if (!data.businessName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Business name is required',
          path: ['businessName'],
        });
      }
    }
  });

type JobApplicationData = z.infer<typeof jobApplicationSchema>;

const JobApplicationForm = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<JobApplicationData>({
    resolver: zodResolver(jobApplicationSchema),
  });

  const employmentStatus = watch('employmentStatus');

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <div>
        <label>Employment Status</label>
        <select {...register('employmentStatus')}>
          <option value="">Select status</option>
          <option value="employed">Employed</option>
          <option value="unemployed">Unemployed</option>
          <option value="student">Student</option>
          <option value="self-employed">Self Employed</option>
        </select>
      </div>

      {employmentStatus === 'employed' && (
        <div className="conditional-fields">
          <h3>Employment Details</h3>
          <input
            {...register('currentCompany')}
            placeholder="Current Company"
          />
          {errors.currentCompany && <span>{errors.currentCompany.message}</span>}

          <input
            {...register('currentPosition')}
            placeholder="Current Position"
          />
          {errors.currentPosition && <span>{errors.currentPosition.message}</span>}

          <input
            type="number"
            {...register('yearsOfExperience', { valueAsNumber: true })}
            placeholder="Years of Experience"
          />
        </div>
      )}

      {employmentStatus === 'student' && (
        <div className="conditional-fields">
          <h3>Education Details</h3>
          <input {...register('school')} placeholder="School Name" />
          {errors.school && <span>{errors.school.message}</span>}

          <input
            type="date"
            {...register('expectedGraduation')}
            placeholder="Expected Graduation"
          />
        </div>
      )}

      {employmentStatus === 'self-employed' && (
        <div className="conditional-fields">
          <h3>Business Details</h3>
          <input {...register('businessName')} placeholder="Business Name" />
          {errors.businessName && <span>{errors.businessName.message}</span>}

          <input {...register('businessType')} placeholder="Business Type" />
        </div>
      )}

      <button type="submit">Submit Application</button>
    </form>
  );
};
```

## 4. Multi-Step Forms - Formularios Multi-Paso

### Wizard con Validación por Paso

```tsx
const step1Schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const step2Schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
});

const step3Schema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  zipCode: z.string().regex(/^\d{5}$/, 'Invalid ZIP code'),
});

const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);

type FullFormData = z.infer<typeof fullSchema>;

const MultiStepForm = () => {
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    getValues,
  } = useForm<FullFormData>({
    resolver: zodResolver(fullSchema),
    mode: 'onChange',
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof FullFormData)[] = [];

    if (step === 1) {
      fieldsToValidate = ['email', 'password', 'confirmPassword'];
    } else if (step === 2) {
      fieldsToValidate = ['firstName', 'lastName', 'dateOfBirth'];
    }

    const isValid = await trigger(fieldsToValidate);

    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const onSubmit = async (data: FullFormData) => {
    console.log('Final data:', data);
    await api.register(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Progress indicator */}
      <div className="progress-bar">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Account</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Profile</div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Address</div>
      </div>

      {/* Step 1: Account */}
      {step === 1 && (
        <div className="form-step">
          <h2>Step 1: Create Account</h2>

          <input type="email" {...register('email')} placeholder="Email" />
          {errors.email && <span>{errors.email.message}</span>}

          <input
            type="password"
            {...register('password')}
            placeholder="Password"
          />
          {errors.password && <span>{errors.password.message}</span>}

          <input
            type="password"
            {...register('confirmPassword')}
            placeholder="Confirm Password"
          />
          {errors.confirmPassword && (
            <span>{errors.confirmPassword.message}</span>
          )}
        </div>
      )}

      {/* Step 2: Profile */}
      {step === 2 && (
        <div className="form-step">
          <h2>Step 2: Profile Information</h2>

          <input {...register('firstName')} placeholder="First Name" />
          {errors.firstName && <span>{errors.firstName.message}</span>}

          <input {...register('lastName')} placeholder="Last Name" />
          {errors.lastName && <span>{errors.lastName.message}</span>}

          <input type="date" {...register('dateOfBirth')} />
          {errors.dateOfBirth && <span>{errors.dateOfBirth.message}</span>}
        </div>
      )}

      {/* Step 3: Address */}
      {step === 3 && (
        <div className="form-step">
          <h2>Step 3: Address</h2>

          <input {...register('address')} placeholder="Street Address" />
          {errors.address && <span>{errors.address.message}</span>}

          <input {...register('city')} placeholder="City" />
          {errors.city && <span>{errors.city.message}</span>}

          <input {...register('zipCode')} placeholder="ZIP Code" />
          {errors.zipCode && <span>{errors.zipCode.message}</span>}

          {/* Summary */}
          <div className="summary">
            <h3>Review Your Information</h3>
            <p>Email: {getValues('email')}</p>
            <p>Name: {getValues('firstName')} {getValues('lastName')}</p>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="form-actions">
        {step > 1 && (
          <button type="button" onClick={prevStep}>
            Previous
          </button>
        )}

        {step < 3 && (
          <button type="button" onClick={nextStep}>
            Next
          </button>
        )}

        {step === 3 && <button type="submit">Submit</button>}
      </div>
    </form>
  );
};
```

## 5. Form Context - Formularios Distribuidos

### Compartir Form State entre Componentes

```tsx
import { FormProvider, useFormContext } from 'react-hook-form';

// Parent component
const DistributedForm = () => {
  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => console.log(data))}>
        <PersonalInfoSection />
        <AddressSection />
        <PreferencesSection />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
};

// Child component
const PersonalInfoSection = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormData>();

  return (
    <section>
      <h3>Personal Information</h3>
      <input {...register('firstName')} placeholder="First Name" />
      {errors.firstName && <span>{errors.firstName.message}</span>}

      <input {...register('lastName')} placeholder="Last Name" />
      {errors.lastName && <span>{errors.lastName.message}</span>}
    </section>
  );
};
```

## Best Practices

1. **useFieldArray** para arrays dinámicos en lugar de state manual
2. **Validación condicional** con `superRefine` de Zod
3. **watch()** con moderación para evitar re-renders
4. **trigger()** para validar pasos específicos en multi-step forms
5. **FormProvider** para distribuir form state en componentes grandes
6. **defaultValues** siempre, incluso para arrays vacíos
7. **key={field.id}** en arrays dinámicos (NO usar index)
8. **Deshabilitar remove** cuando queda un solo item requerido
