<!-- src/lib/components/admin/ProfileImageUpload.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { Upload, X, Camera, CropIcon, CheckIcon } from 'lucide-svelte';
  
  // Props
  export let currentImageUrl: string | null = null;
  export let userId: string;
  export let userType: 'cleaner' | 'applicant' = 'cleaner';
  export let disabled = false;
  export let maxSizeKb = 2048; // 2MB max size by default
  export let maxWidth = 500; // Target width for resizing
  export let maxHeight = 500; // Target height for resizing
  export let aspectRatio = 1; // Square by default

  // Local state
  let isUploading = false;
  let error: string | null = null;
  let imageFile: File | null = null;
  let previewUrl: string | null = currentImageUrl;
  let fileInput: HTMLInputElement;
  let cropMode = false;
  let cropCanvas: HTMLCanvasElement;
  let imageElement: HTMLImageElement;
  let cropStartX = 0;
  let cropStartY = 0;
  let cropSize = 0;
  let isDragging = false;
  let zoomLevel = 1;

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
    
    // Check file size
    if (file.size > maxSizeKb * 1024) {
      error = `Image must be smaller than ${maxSizeKb / 1024}MB`;
      return;
    }
    
    imageFile = file;
    error = null;
    
    // Create preview URL
    previewUrl = URL.createObjectURL(file);
    
    // Enable crop mode
    cropMode = true;
  }

  // Initialize the crop canvas when entering crop mode
  function initCrop() {
    if (!cropCanvas || !imageElement || !previewUrl) return;
    
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;
    
    // Wait for image to load
    imageElement.onload = () => {
      // Calculate crop area dimensions
      const imgWidth = imageElement.naturalWidth;
      const imgHeight = imageElement.naturalHeight;
      
      // Determine the crop size based on the smaller dimension and aspect ratio
      if (aspectRatio >= 1) {
        // Wider or square aspect ratio
        cropSize = Math.min(imgWidth, imgHeight);
        cropStartX = (imgWidth - cropSize) / 2;
        cropStartY = (imgHeight - cropSize) / 2;
      } else {
        // Taller aspect ratio
        cropSize = Math.min(imgWidth, imgHeight * aspectRatio);
        cropStartX = (imgWidth - cropSize) / 2;
        cropStartY = (imgHeight - (cropSize / aspectRatio)) / 2;
      }
      
      // Draw initial crop preview
      drawCropPreview();
    };
  }

  // Draw the crop preview
  function drawCropPreview() {
    if (!cropCanvas || !imageElement || !previewUrl) return;
    
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
    
    // Draw the image with crop
    const targetWidth = cropCanvas.width;
    const targetHeight = cropCanvas.height;
    
    // Calculate crop dimensions based on aspect ratio
    let drawWidth, drawHeight;
    
    if (aspectRatio >= 1) {
      // Wider or square aspect ratio
      drawWidth = cropSize;
      drawHeight = cropSize / aspectRatio;
    } else {
      // Taller aspect ratio
      drawWidth = cropSize;
      drawHeight = cropSize / aspectRatio;
    }
    
    // Draw the cropped portion
    ctx.drawImage(
      imageElement,
      cropStartX, cropStartY, drawWidth, drawHeight,
      0, 0, targetWidth, targetHeight
    );
  }

  // Handle mouse/touch interactions for crop adjustment
  function startDrag(event: MouseEvent | TouchEvent) {
    if (!cropMode) return;
    isDragging = true;
    
    // Get initial position
    const x = 'touches' in event 
      ? event.touches[0].clientX 
      : event.clientX;
    const y = 'touches' in event 
      ? event.touches[0].clientY 
      : event.clientY;
    
    // Store initial values for calculation during drag
    const dragData = {
      startX: x,
      startY: y,
      initialCropX: cropStartX,
      initialCropY: cropStartY
    };
    
    // Create move and end handlers
    const moveHandler = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      
      const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      // Calculate movement based on image scale
      const scale = imageElement.naturalWidth / imageElement.width;
      const deltaX = (currentX - dragData.startX) * scale;
      const deltaY = (currentY - dragData.startY) * scale;
      
      // Update crop position with boundaries
      cropStartX = Math.max(0, Math.min(
        imageElement.naturalWidth - cropSize,
        dragData.initialCropX + deltaX
      ));
      
      cropStartY = Math.max(0, Math.min(
        imageElement.naturalHeight - (cropSize / aspectRatio),
        dragData.initialCropY + deltaY
      ));
      
      // Redraw preview
      drawCropPreview();
    };
    
    const endHandler = () => {
      isDragging = false;
      document.removeEventListener('mousemove', moveHandler as any);
      document.removeEventListener('touchmove', moveHandler as any);
      document.removeEventListener('mouseup', endHandler);
      document.removeEventListener('touchend', endHandler);
    };
    
    // Add event listeners for movement and end
    document.addEventListener('mousemove', moveHandler as any);
    document.addEventListener('touchmove', moveHandler as any);
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchend', endHandler);
  }

  // Adjust zoom level
  function adjustZoom(amount: number) {
    // Adjust zoom level within reasonable bounds
    zoomLevel = Math.max(0.5, Math.min(3, zoomLevel + amount));
    
    // Redraw preview with new zoom
    drawCropPreview();
  }

  // Apply crop and prepare for upload
  async function applyCrop() {
    if (!cropCanvas || !previewUrl) return;
    
    // Get the cropped image data as a blob
    const croppedImageBlob = await new Promise<Blob | null>((resolve) => {
      cropCanvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.85); // Use JPEG with 85% quality for better file size
    });
    
    if (!croppedImageBlob) {
      error = 'Failed to process image';
      return;
    }
    
    // Create a new file from the blob
    const croppedFile = new File(
      [croppedImageBlob], 
      imageFile?.name || 'profile-image.jpg',
      { type: 'image/jpeg' }
    );
    
    // Replace the original file and update the preview
    imageFile = croppedFile;
    previewUrl = URL.createObjectURL(croppedFile);
    
    // Exit crop mode
    cropMode = false;
  }

  // Cancel cropping
  function cancelCrop() {
    cropMode = false;
    // If there was no previous image, clear everything
    if (!currentImageUrl) {
      previewUrl = null;
      imageFile = null;
    } else {
      // Return to original image
      previewUrl = currentImageUrl;
    }
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
  
  // Effect to initialize crop when entering crop mode
  $: if (cropMode && previewUrl) {
    // Use setTimeout to ensure DOM is updated
    setTimeout(initCrop, 0);
  }
</script>

<div class="profile-image-upload space-y-4">
  <!-- Current image or placeholder -->
  <div class="relative mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
    {#if previewUrl && !cropMode}
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
    {:else if !cropMode}
      <div class="flex flex-col items-center justify-center text-center">
        <Camera size={24} class="mb-2 text-gray-400" />
        <span class="text-xs text-gray-500">No image</span>
      </div>
    {/if}
    
    <!-- Crop interface -->
    {#if cropMode}
      <div class="absolute inset-0 bg-gray-900">
        <div 
          class="relative h-full w-full"
          on:mousedown={startDrag}
          on:touchstart={startDrag}
        >
          <!-- Hidden image for reference -->
          <img 
            bind:this={imageElement}
            src={previewUrl} 
            alt="Crop reference"
            class="invisible absolute h-0 w-0" 
          />
          
          <!-- Crop preview canvas -->
          <canvas 
            bind:this={cropCanvas}
            width={maxWidth / 2}
            height={maxHeight / 2}
            class="h-full w-full touch-none"
          ></canvas>
          
          <!-- Crop grid overlay -->
          <div class="absolute inset-0 pointer-events-none">
            <div class="h-1/3 border-b border-white border-opacity-50"></div>
            <div class="h-1/3 border-b border-white border-opacity-50"></div>
            <div class="grid h-full grid-cols-3">
              <div class="border-r border-white border-opacity-50"></div>
              <div class="border-r border-white border-opacity-50"></div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Crop controls -->
  {#if cropMode}
    <div class="flex justify-center space-x-2">
      <Button 
        variant="outline" 
        size="sm" 
        on:click={() => adjustZoom(-0.1)}
      >
        -
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        on:click={() => adjustZoom(0.1)}
      >
        +
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        on:click={cancelCrop}
      >
        <X size={16} class="mr-1" />
        Cancel
      </Button>
      <Button 
        variant="primary" 
        size="sm" 
        on:click={applyCrop}
      >
        <CheckIcon size={16} class="mr-1" />
        Apply
      </Button>
    </div>
  {:else}
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
            <div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-20 border-t-white"></div>
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
        Max file size: {maxSizeKb / 1024}MB
      </p>
      
      <!-- Error message -->
      {#if error}
        <p class="text-sm text-red-500 dark:text-red-400">{error}</p>
      {/if}
    </div>
  {/if}
</div>
