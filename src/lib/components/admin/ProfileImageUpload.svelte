<!-- src/lib/components/admin/ProfileImageUpload.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { Upload, X, Camera } from 'lucide-svelte';
  
  // Props
  export let currentImageUrl: string | null = null;
  export let userId: string;
  export let userType: 'cleaner' | 'applicant' = 'cleaner';
  export let disabled = false;
  
  // Local state
  let isUploading = false;
  let error: string | null = null;
  let imageFile: File | null = null;
  let previewUrl: string | null = currentImageUrl;
  let fileInput: HTMLInputElement;
  
  // Event dispatcher for parent components
  const dispatch = createEventDispatcher<{
    success: { url: string };
    error: { message: string };
  }>();

  // Handle file selection
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      error = 'Please select an image file';
      return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      error = 'Image must be smaller than 2MB';
      return;
    }
    
    imageFile = file;
    error = null;
    
    // Create preview URL
    previewUrl = URL.createObjectURL(file);
  }

  // Handle image upload
  async function uploadImage() {
    if (!imageFile) return;
    
    isUploading = true;
    error = null;
    
    try {
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('profileImage', imageFile);
      formData.append('userId', userId);
      formData.append('userType', userType);
      
      // Send to server
      const endpoint = userType === 'cleaner' 
        ? `/api/admin/cleaners/${userId}/profile-image`
        : `/api/admin/applications/${userId}/profile-image`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }
      
      const data = await response.json();
      
      // Update current image URL and preview
      currentImageUrl = data.imageUrl;
      previewUrl = data.imageUrl;
      
      // Notify parent component
      dispatch('success', { url: data.imageUrl });
      
      // Reset file input and state
      if (fileInput) fileInput.value = '';
      imageFile = null;
    } catch (err) {
      console.error('Error uploading image:', err);
      error = err instanceof Error ? err.message : 'Failed to upload image';
      dispatch('error', { message: error });
    } finally {
      isUploading = false;
    }
  }

  // Remove current image
  async function removeImage() {
    if (!currentImageUrl) return;
    
    isUploading = true;
    error = null;
    
    try {
      // Send delete request to server
      const endpoint = userType === 'cleaner' 
        ? `/api/admin/cleaners/${userId}/profile-image`
        : `/api/admin/applications/${userId}/profile-image`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove image');
      }
      
      // Clear image state
      currentImageUrl = null;
      previewUrl = null;
      
      // Notify parent component
      dispatch('success', { url: '' });
    } catch (err) {
      console.error('Error removing image:', err);
      error = err instanceof Error ? err.message : 'Failed to remove image';
      dispatch('error', { message: error });
    } finally {
      isUploading = false;
    }
  }

  // Clean up object URLs on unmount
  onMount(() => {
    return () => {
      if (previewUrl && previewUrl !== currentImageUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  });
</script>

<div class="profile-image-upload space-y-4">
  <!-- Current image or placeholder -->
  <div class="relative flex items-center justify-center h-32 w-32 rounded-full border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 overflow-hidden mx-auto">
    {#if previewUrl}
      <img 
        src={previewUrl} 
        alt="Profile" 
        class="h-full w-full object-cover" 
      />
      
      <!-- Image controls overlay -->
      <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 transition-opacity group-hover:opacity-100">
        <div class="flex space-x-2">
          <button 
            type="button"
            class="rounded-full bg-white p-2 text-gray-700 hover:bg-gray-100"
            on:click={() => fileInput?.click()}
            disabled={disabled || isUploading}
          >
            <Camera size={16} />
          </button>
          
          {#if currentImageUrl}
            <button 
              type="button"
              class="rounded-full bg-white p-2 text-red-500 hover:bg-gray-100"
              on:click={removeImage}
              disabled={disabled || isUploading}
            >
              <X size={16} />
            </button>
          {/if}
        </div>
      </div>
    {:else}
      <div class="flex flex-col items-center justify-center text-center">
        <Camera size={24} class="mb-2 text-gray-400" />
        <span class="text-xs text-gray-500">No image</span>
      </div>
    {/if}
  </div>
  
  <!-- Upload controls -->
  <div class="flex flex-col items-center justify-center space-y-3">
    {#if imageFile && !currentImageUrl}
      <Button
        variant="primary"
        size="sm"
        on:click={uploadImage}
        disabled={isUploading || disabled}
      >
        {#if isUploading}
          <div class="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-opacity-20 border-t-white"></div>
          Uploading...
        {:else}
          <Upload size={16} class="mr-1" />
          Upload Image
        {/if}
      </Button>
    {:else}
      <Button
        variant="outline"
        size="sm"
        on:click={() => fileInput?.click()}
        disabled={isUploading || disabled}
      >
        <Camera size={16} class="mr-1" />
        {currentImageUrl ? 'Change Image' : 'Add Image'}
      </Button>
    {/if}
    
    <!-- Hidden file input -->
    <input
      bind:this={fileInput}
      type="file"
      accept="image/*"
      class="hidden"
      on:change={handleFileSelect}
      disabled={isUploading || disabled}
    />
    
    <!-- Size instruction -->
    <p class="text-xs text-gray-500 dark:text-gray-400">
      Max file size: 2MB
    </p>
    
    <!-- Error message -->
    {#if error}
      <p class="text-sm text-red-500 dark:text-red-400">{error}</p>
    {/if}
  </div>
</div>
