# Core Components

BrightBroom is built with a collection of reusable UI components that ensure consistency and accelerate development. These components are organised into categories based on their functionality and usage.

## UI Components

### Button

A flexible button component with various styles and states.

```svelte
<!-- src/lib/components/ui/Button.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { Loader2 } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  export let variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let type: HTMLButtonAttributes['type'] = 'button';
  export let disabled = false;
  export let loading = false;
  export let fullWidth = false;
  export let title: string | undefined = undefined;

  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-600 focus-visible:ring-primary',
    secondary: 'bg-secondary text-white hover:bg-secondary-600 focus-visible:ring-secondary',
    outline: 'border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100',
    link: 'bg-transparent underline-offset-4 hover:underline text-primary hover:text-primary-600 p-0'
  };

  const sizeStyles = {
    sm: 'h-9 px-3 text-xs',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-6 text-lg'
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  $: classNames = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle}`;

  function handleClick(event: MouseEvent) {
    dispatch('click', event);
  }
</script>

<button
  {type}
  class={classNames}
  {disabled}
  {title}
  on:click={handleClick}
  {...$$restProps}
>
  {#if loading}
    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
  {/if}
  <slot />
</button>
```

### Input

A text input component with label, validation, and error states.

```svelte
<!-- src/lib/components/ui/Input.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';

  const dispatch = createEventDispatcher();

  export let id: string = '';
  export let name: string = '';
  export let label: string = '';
  export let type: HTMLInputAttributes['type'] = 'text';
  export let value: string = '';
  export let placeholder: string = '';
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let error: string = '';
  export let helpText: string = '';

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    value = target.value;
    dispatch('input', value);
  }

  function handleBlur(event: FocusEvent) {
    dispatch('blur', event);
  }

  $: hasError = error !== '';
</script>

<div class="w-full">
  {#if label}
    <label
      for={id}
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      {label}
      {#if required}<span class="text-red-500">*</span>{/if}
    </label>
  {/if}

  <input
    {id}
    {name}
    {type}
    value={value}
    {placeholder}
    {disabled}
    {required}
    class="w-full px-3 py-2 border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-800
      focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
      disabled:opacity-50 disabled:cursor-not-allowed
      {hasError
        ? 'border-red-500 focus:ring-red-500'
        : 'border-gray-300 dark:border-gray-600'}"
    on:input={handleInput}
    on:blur={handleBlur}
    {...$$restProps}
  />

  {#if hasError}
    <p class="mt-1 text-sm text-red-500">{error}</p>
  {:else if helpText}
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
  {/if}
</div>
```

### Card

A container component for content blocks.

```svelte
<!-- src/lib/components/ui/Card.svelte -->
<script lang="ts">
  export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  export let shadow: 'none' | 'sm' | 'md' = 'md';
  export let border = false;

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow'
  };

  $: borderClass = border ? 'border border-gray-200 dark:border-gray-700' : '';
  $: classes = `bg-white dark:bg-gray-800 rounded-lg ${paddingClasses[padding]} ${shadowClasses[shadow]} ${borderClass}`;
</script>

<div class={classes} {...$$restProps}>
  <slot />
</div>
```

### Modal

A dialog component for displaying content that requires attention or action.

```svelte
<!-- src/lib/components/ui/Modal.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { X } from 'lucide-svelte';
  import Button from './Button.svelte';

  const dispatch = createEventDispatcher();

  export let title: string = '';
  export let open: boolean = false;
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let closeOnEsc: boolean = true;
  export let closeOnOutsideClick: boolean = true;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  let modal: HTMLDivElement;

  function close() {
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && closeOnEsc) {
      close();
    }
  }

  function handleOutsideClick(event: MouseEvent) {
    if (closeOnOutsideClick && modal && !modal.contains(event.target as Node)) {
      close();
    }
  }

  // Prevent scrolling on the body when modal is open
  $: if (open) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }

  onMount(() => {
    return () => {
      document.body.style.overflow = '';
    };
  });
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    on:click={handleOutsideClick}
    transition:fade={{ duration: 150 }}
  >
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50" />

    <!-- Modal content -->
    <div
      bind:this={modal}
      class="relative w-full {sizeClasses[size]} bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10"
      transition:fly={{ y: 10, duration: 150 }}
    >
      <!-- Header -->
      {#if title || $$slots.header}
        <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          {#if $$slots.header}
            <slot name="header" />
          {:else}
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
          {/if}
          <Button
            variant="ghost"
            size="sm"
            on:click={close}
            aria-label="Close"
          >
            <X size={18} />
          </Button>
        </div>
      {/if}

      <!-- Body -->
      <div class="p-4">
        <slot />
      </div>

      <!-- Footer -->
      {#if $$slots.footer}
        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}
```

### Select

A dropdown select component.

```svelte
<!-- src/lib/components/ui/Select.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ChevronDown } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  export let id: string = '';
  export let name: string = '';
  export let label: string = '';
  export let value: string = '';
  export let options: Array<{ value: string; label: string }> = [];
  export let placeholder: string = 'Select an option';
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let error: string = '';
  export let helpText: string = '';

  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    value = target.value;
    dispatch('change', value);
  }

  $: hasError = error !== '';
</script>

<div class="w-full">
  {#if label}
    <label
      for={id}
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      {label}
      {#if required}<span class="text-red-500">*</span>{/if}
    </label>
  {/if}

  <div class="relative">
    <select
      {id}
      {name}
      {disabled}
      {required}
      class="appearance-none w-full px-3 py-2 border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-800
        focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed pr-10
        {hasError
          ? 'border-red-500 focus:ring-red-500'
          : 'border-gray-300 dark:border-gray-600'}"
      on:change={handleChange}
      {...$$restProps}
    >
      <option value="" disabled selected={!value}>{placeholder}</option>
      {#each options as option}
        <option value={option.value} selected={value === option.value}>
          {option.label}
        </option>
      {/each}
    </select>

    <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
      <ChevronDown size={16} class="text-gray-500" />
    </div>
  </div>

  {#if hasError}
    <p class="mt-1 text-sm text-red-500">{error}</p>
  {:else if helpText}
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
  {/if}
</div>
```

### DatePicker

A date selection component.

```svelte
<!-- src/lib/components/ui/DatePicker.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { format, isValid, parseISO } from 'date-fns';
  import { Calendar } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  export let id: string = '';
  export let name: string = '';
  export let label: string = '';
  export let value: string = '';
  export let placeholder: string = 'Select date';
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let min: string = '';
  export let max: string = '';
  export let error: string = '';
  export let helpText: string = '';

  // Create formatted value for display
  $: displayValue = value && isValid(parseISO(value))
    ? format(parseISO(value), 'PP')
    : '';

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    value = target.value;
    dispatch('change', value);
  }

  $: hasError = error !== '';
</script>

<div class="w-full">
  {#if label}
    <label
      for={id}
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      {label}
      {#if required}<span class="text-red-500">*</span>{/if}
    </label>
  {/if}

  <div class="relative">
    <input
      {id}
      {name}
      type="date"
      {value}
      {min}
      {max}
      {disabled}
      {required}
      class="w-full px-3 py-2 border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-800
        focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed
        {hasError
          ? 'border-red-500 focus:ring-red-500'
          : 'border-gray-300 dark:border-gray-600'}"
      on:change={handleChange}
      {...$$restProps}
    />

    <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
      <Calendar size={16} class="text-gray-500" />
    </div>
  </div>

  {#if hasError}
    <p class="mt-1 text-sm text-red-500">{error}</p>
  {:else if helpText}
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
  {/if}
</div>
```

### Textarea

A text area component for multi-line input.

```svelte
<!-- src/lib/components/ui/Textarea.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let id: string = '';
  export let name: string = '';
  export let label: string = '';
  export let value: string = '';
  export let placeholder: string = '';
  export let rows: number = 4;
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let error: string = '';
  export let helpText: string = '';
  export let maxLength: number | undefined = undefined;

  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    value = target.value;
    dispatch('input', value);
  }

  function handleBlur(event: FocusEvent) {
    dispatch('blur', event);
  }

  $: hasError = error !== '';
  $: charCount = value.length;
  $: showCharCount = maxLength !== undefined;
</script>

<div class="w-full">
  {#if label}
    <label
      for={id}
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      {label}
      {#if required}<span class="text-red-500">*</span>{/if}
    </label>
  {/if}

  <textarea
    {id}
    {name}
    {rows}
    {placeholder}
    {disabled}
    {required}
    {maxLength}
    class="w-full px-3 py-2 border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-800
      focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
      disabled:opacity-50 disabled:cursor-not-allowed
      {hasError
        ? 'border-red-500 focus:ring-red-500'
        : 'border-gray-300 dark:border-gray-600'}"
    on:input={handleInput}
    on:blur={handleBlur}
    {...$$restProps}
  >{value}</textarea>

  <div class="flex justify-between mt-1">
    {#if hasError}
      <p class="text-sm text-red-500">{error}</p>
    {:else if helpText}
      <p class="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
    {:else}
      <span></span>
    {/if}

    {#if showCharCount}
      <p class="text-xs text-gray-500 dark:text-gray-400">
        {charCount}{#if maxLength} / {maxLength}{/if}
      </p>
    {/if}
  </div>
</div>
```

### Toast

A notification component for displaying alerts and messages.

```svelte
<!-- src/lib/components/ui/Toast.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { CheckCircle, AlertCircle, Info, X } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  export let id: string;
  export let type: 'success' | 'error' | 'info' | 'warning' = 'info';
  export let title: string = '';
  export let message: string = '';
  export let duration: number = 5000;
  export let showClose: boolean = true;

  let timer: ReturnType<typeof setTimeout>;

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info
  };

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-200'
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  };

  function close() {
    clearTimeout(timer);
    dispatch('dismiss', id);
  }

  onMount(() => {
    if (duration > 0) {
      timer = setTimeout(close, duration);
    }

    return () => {
      clearTimeout(timer);
    };
  });
</script>

<div
  class="max-w-md w-full border-l-4 rounded-md shadow-md {colors[type]}"
  role="alert"
  in:fly={{ x: 20, duration: 200 }}
  out:fade={{ duration: 100 }}
>
  <div class="p-4 flex">
    <div class="flex-shrink-0 mr-3">
      <svelte:component this={icons[type]} class="{iconColors[type]}" size={20} />
    </div>

    <div class="flex-1">
      {#if title}
        <h3 class="font-medium">{title}</h3>
      {/if}
      {#if message}
        <p class="text-sm mt-1">{message}</p>
      {/if}
      <slot></slot>
    </div>

    {#if showClose}
      <button
        class="ml-4 flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        on:click={close}
        aria-label="Close"
      >
        <X size={16} />
      </button>
    {/if}
  </div>
</div>
```

## Form Components

### FormField

A wrapper component for form fields with validation.

```svelte
<!-- src/lib/components/form/FormField.svelte -->
<script lang="ts">
  export let name: string = '';
  export let label: string = '';
  export let required: boolean = false;
  export let error: string = '';
  export let helpText: string = '';

  // Optional ID generated from name if not provided
  export let id: string = '';
  $: actualId = id || name;
</script>

<div class="w-full mb-4">
  {#if label}
    <label
      for={actualId}
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      {label}
      {#if required}<span class="text-red-500">*</span>{/if}
    </label>
  {/if}

  <slot {actualId} {name} {error} />

  {#if error}
    <p class="mt-1 text-sm text-red-500">{error}</p>
  {:else if helpText}
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
  {/if}
</div>
```

### Form

A form component with validation handling.

```svelte
<!-- src/lib/components/form/Form.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { z } from 'zod';

  const dispatch = createEventDispatcher();

  export let schema = undefined;
  export let initialValues: Record<string, any> = {};
  export let errors: Record<string, string> = {};
  export let handleSubmit: ((values: Record<string, any>) => void) | undefined = undefined;

  let values = { ...initialValues };
  let formElement: HTMLFormElement;

  function validateField(name: string, value: any) {
    if (!schema) return true;

    try {
      // Create a partial schema for just this field
      const fieldSchema = z.object({ [name]: schema.shape[name] });
      fieldSchema.parse({ [name]: value });
      delete errors[name];
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(err => err.path[0] === name);
        if (fieldError) {
          errors[name] = fieldError.message;
        }
      }
      return false;
    }
  }

  function validateForm() {
    if (!schema) return true;

    try {
      schema.parse(values);
      errors = {};
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const field = String(err.path[0]);
          errors[field] = err.message;
        });
      }
      return false;
    }
  }

  function updateField(event: CustomEvent) {
    const { name, value } = event.detail;
    values[name] = value;
    validateField(name, value);
    dispatch('change', { values, errors });
  }

  function handleFormSubmit(event: Event) {
    event.preventDefault();

    if (validateForm()) {
      if (handleSubmit) {
        handleSubmit(values);
      }
      dispatch('submit', values);
    } else {
      dispatch('error', errors);
    }
  }

  // Expose a function to reset the form
  export function reset() {
    values = { ...initialValues };
    errors = {};
    if (formElement) {
      formElement.reset();
    }
    dispatch('reset');
  }
</script>

<form bind:this={formElement} on:submit={handleFormSubmit} {...$$restProps}>
  <slot {values} {errors} {validateField} />
</form>
```

## Layout Components

### Container

A responsive container component.

```svelte
<!-- src/lib/components/layout/Container.svelte -->
<script lang="ts">
  export let maxWidth: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'lg';
  export let padding: boolean = true;

  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    full: 'max-w-full'
  };

  $: classes = `mx-auto ${maxWidthClasses[maxWidth]} ${padding ? 'px-4 sm:px-6 lg:px-8' : ''}`;
</script>

<div class={classes} {...$$restProps}>
  <slot />
</div>
```

### Grid

A responsive grid component.

```svelte
<!-- src/lib/components/layout/Grid.svelte -->
<script lang="ts">
  export let cols: '1' | '2' | '3' | '4' | '5' | '6' = '3';
  export let gap: 'none' | 'sm' | 'md' | 'lg' = 'md';

  const colClasses = {
    '1': 'grid-cols-1',
    '2': 'grid-cols-1 sm:grid-cols-2',
    '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    '5': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    '6': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  };

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  $: classes = `grid ${colClasses[cols]} ${gapClasses[gap]}`;
</script>

<div class={classes} {...$$restProps}>
  <slot />
</div>
```

## Feature Components

### ServiceCard

A card for displaying cleaning service options.

```svelte
<!-- src/lib/components/booking/ServiceCard.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import { CheckCircle } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  export let id: string;
  export let name: string;
  export let description: string;
  export let price: number;
  export let duration: number;
  export let selected: boolean = false;
  export let features: string[] = [];

  function handleClick() {
    dispatch('select', id);
  }
</script>

<Card
  padding="lg"
  class="cursor-pointer hover:border-primary transition-colors
    {selected ? 'border-2 border-primary bg-primary-50 dark:bg-primary-900/20' : 'border'}"
  on:click={handleClick}
>
  <div class="flex justify-between items-start">
    <div>
      <h3 class="font-semibold text-lg text-gray-900 dark:text-white">{name}</h3>
      <p class="text-gray-500 dark:text-gray-400 mt-1">{description}</p>

      {#if features.length > 0}
        <ul class="mt-4 space-y-2">
          {#each features as feature}
            <li class="flex items-start">
              <CheckCircle class="h-5 w-5 text-primary flex-shrink-0 mr-2" />
              <span class="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <div class="text-right">
      <p class="text-xl font-bold text-primary">R{price}</p>
      <p class="text-sm text-gray-500 dark:text-gray-400">{duration} {duration === 1 ? 'hour' : 'hours'}</p>
    </div>
  </div>

  {#if selected}
    <div class="absolute top-2 right-2">
      <div class="bg-primary text-white p-1 rounded-full">
        <CheckCircle class="h-5 w-5" />
      </div>
    </div>
  {/if}
</Card>
```

### BookingSummary

A component for displaying booking details.

```svelte
<!-- src/lib/components/booking/BookingSummary.svelte -->
<script lang="ts">
  import { format } from 'date-fns';
  import Card from '$lib/components/ui/Card.svelte';
  import { Home, Calendar, Clock, MapPin } from 'lucide-svelte';

  export let booking = {
    service: { name: '', price: 0 },
    address: { street: '', city: '', state: '', zipCode: '' },
    scheduledDate: new Date(),
    duration: 0
  };
</script>

<Card padding="md" class="border">
  <h3 class="font-semibold text-lg text-gray-900 dark:text-white mb-4">Booking Summary</h3>

  <div class="space-y-3">
    <div class="flex items-start">
      <Home class="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
      <div>
        <p class="text-sm font-medium text-gray-900 dark:text-white">Service</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">{booking.service.name}</p>
      </div>
    </div>

    <div class="flex items-start">
      <MapPin class="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
      <div>
        <p class="text-sm font-medium text-gray-900 dark:text-white">Location</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {booking.address.street}, {booking.address.city}, {booking.address.state} {booking.address.zipCode}
        </p>
      </div>
    </div>

    <div class="flex items-start">
      <Calendar class="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
      <div>
        <p class="text-sm font-medium text-gray-900 dark:text-white">Date</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {format(booking.scheduledDate, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>
    </div>

    <div class="flex items-start">
      <Clock class="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
      <div>
        <p class="text-sm font-medium text-gray-900 dark:text-white">Time & Duration</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {format(booking.scheduledDate, 'h:mm a')} · {booking.duration} {booking.duration === 60 ? 'hour' : 'hours'}
        </p>
      </div>
    </div>
  </div>

  <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
    <div class="flex justify-between items-center">
      <p class="font-medium text-gray-900 dark:text-white">Total</p>
      <p class="font-bold text-lg text-primary">R{booking.service.price}</p>
    </div>
    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
      Prices include VAT.
    </p>
  </div>
</Card>
```

### AddressCard

A component for displaying and selecting addresses.

```svelte
<!-- src/lib/components/profile/AddressCard.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { MapPin, Check, Pencil, Trash } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  export let id: string;
  export let street: string;
  export let aptUnit: string | null = null;
  export let city: string;
  export let state: string;
  export let zipCode: string;
  export let isDefault: boolean = false;
  export let selected: boolean = false;
  export let selectable: boolean = false;
  export let editable: boolean = true;

  function handleSelect() {
    if (selectable) {
      dispatch('select', id);
    }
  }

  function handleSetDefault(event: MouseEvent) {
    event.stopPropagation();
    dispatch('setDefault', id);
  }

  function handleEdit(event: MouseEvent) {
    event.stopPropagation();
    dispatch('edit', id);
  }

  function handleDelete(event: MouseEvent) {
    event.stopPropagation();
    dispatch('delete', id);
  }
</script>

<Card
  padding="md"
  class="relative border
    {selectable ? 'cursor-pointer hover:border-primary' : ''}
    {selected ? 'border-2 border-primary bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'}"
  on:click={handleSelect}
>
  <div class="flex items-start">
    <MapPin class="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
    <div>
      <p class="font-medium text-gray-900 dark:text-white">
        {street}{#if aptUnit}, {aptUnit}{/if}
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {city}, {state} {zipCode}
      </p>

      {#if isDefault}
        <span class="text-xs text-primary bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full mt-2 inline-block">
          Default
        </span>
      {:else if editable}
        <button
          class="text-xs text-primary hover:underline mt-2"
          on:click={handleSetDefault}
        >
          Set as default
        </button>
      {/if}
    </div>
  </div>

  {#if editable}
    <div class="absolute top-2 right-2 flex space-x-1">
      <Button
        variant="ghost"
        size="sm"
        on:click={handleEdit}
        title="Edit address"
      >
        <Pencil size={16} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        on:click={handleDelete}
        title="Delete address"
      >
        <Trash size={16} />
      </Button>
    </div>
  {/if}

  {#if selected}
    <div class="absolute bottom-2 right-2">
      <div class="bg-primary text-white p-1 rounded-full">
        <Check size={16} />
      </div>
    </div>
  {/if}
</Card>
```

## Admin Components

### DataTable

A reusable data table component for the admin dashboard.

```svelte
<!-- src/lib/components/admin/DataTable.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  export let columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    format?: (value: any, row: any) => string;
  }> = [];

  export let data: Array<Record<string, any>> = [];
  export let totalItems: number = 0;
  export let page: number = 1;
  export let pageSize: number = 10;
  export let sortColumn: string = '';
  export let sortDirection: 'asc' | 'desc' = 'asc';

  $: totalPages = Math.ceil(totalItems / pageSize);
  $: startItem = (page - 1) * pageSize + 1;
  $: endItem = Math.min(startItem + pageSize - 1, totalItems);

  function handleSort(columnKey: string) {
    if (sortColumn === columnKey) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = columnKey;
      sortDirection = 'asc';
    }

    dispatch('sort', { column: sortColumn, direction: sortDirection });
  }

  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      page = newPage;
      dispatch('page', page);
    }
  }

  function formatCellValue(column, row) {
    const value = row[column.key];
    if (column.format) {
      return column.format(value, row);
    }
    return value;
  }

  function handleRowClick(row) {
    dispatch('rowClick', row);
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="bg-gray-50 dark:bg-gray-700">
        <tr>
          {#each columns as column}
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              {#if column.sortable}
                <button
                  class="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-white"
                  on:click={() => handleSort(column.key)}
                >
                  <span>{column.label}</span>
                  <ArrowUpDown size={14} class="text-gray-400" />
                </button>
              {:else}
                {column.label}
              {/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {#if data.length === 0}
          <tr>
            <td colspan={columns.length} class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
              No data available
            </td>
          </tr>
        {:else}
          {#each data as row}
            <tr
              class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              on:click={() => handleRowClick(row)}
            >
              {#each columns as column}
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatCellValue(column, row)}
                </td>
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  {#if totalPages > 1}
    <div class="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
      <div class="flex-1 flex justify-between sm:hidden">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          on:click={() => handlePageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page === totalPages}
          on:click={() => handlePageChange(page + 1)}
        >
          Next
        </Button>
      </div>

      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700 dark:text-gray-300">
            Showing <span class="font-medium">{startItem}</span> to <span class="font-medium">{endItem}</span> of <span class="font-medium">{totalItems}</span> results
          </p>
        </div>

        <div>
          <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <Button
              variant="outline"
              size="sm"
              class="rounded-l-md"
              disabled={page === 1}
              on:click={() => handlePageChange(page - 1)}
            >
              <ChevronLeft size={16} />
            </Button>

            {#each Array(totalPages) as _, i}
              {#if totalPages <= 7 || i + 1 === 1 || i + 1 === totalPages || (i + 1 >= page - 1 && i + 1 <= page + 1)}
                <Button
                  variant={page === i + 1 ? 'primary' : 'outline'}
                  size="sm"
                  class="rounded-none"
                  on:click={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </Button>
              {:else if i + 1 === 2 || i + 1 === totalPages - 1}
                <Button
                  variant="outline"
                  size="sm"
                  class="rounded-none"
                  disabled={true}
                >
                  ...
                </Button>
              {/if}
            {/each}

            <Button
              variant="outline"
              size="sm"
              class="rounded-r-md"
              disabled={page === totalPages}
              on:click={() => handlePageChange(page + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  {/if}
</div>
```

## Component Usage Guidelines

### Styling Principles

1. **Consistent Theming**: Use the BrightBroom brand colors (primary teal #20C3AF and secondary orange #C2511F)
2. **Dark Mode Support**: All components should work in both light and dark modes
3. **Responsive Design**: Components should adapt to different screen sizes
4. **Accessibility**: Ensure proper contrast, focus states, and ARIA attributes

### Component Composition

1. **Modular Design**: Build complex components from simpler ones
2. **Prop-Based Configuration**: Use props to customise component behavior and appearance
3. **Event Handling**: Use Svelte's event dispatch for component communication

### Performance Considerations

1. **Reactive Declarations**: Use Svelte's reactive variables for derived values
2. **Lazy Loading**: Consider code-splitting for large component trees
3. **Memoization**: Cache expensive calculations using reactive declarations
