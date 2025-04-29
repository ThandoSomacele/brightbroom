<!-- src/lib/components/admin/DocumentUpload.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { FileUp, Trash2, File, FileText, FileImage, FilePlus } from 'lucide-svelte';
  
  // Props
  export let applicationId: string;
  export let documents: string[] = [];
  export let disabled = false;
  export let maxFiles = 5; // Maximum number of documents
  
  // Local state
  let isUploading = false;
  let error: string | null = null;
  let documentFile: File | null = null;
  let fileInput: HTMLInputElement;
  
  // Event dispatcher for parent components
  const dispatch = createEventDispatcher<{
    success: { documents: string[] };
    error: { message: string };
  }>();

  // Check if maximum files reached
  $: isMaxReached = documents.length >= maxFiles;

  // Handle file selection
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    
    // Check file type (allow PDF, images, and common document formats)
    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      error = 'Please select a valid document or image file';
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      error = 'Document must be smaller than 5MB';
      return;
    }
    
    documentFile = file;
    error = null;
  }

  // Handle document upload
  async function uploadDocument() {
    if (!documentFile) return;
    
    isUploading = true;
    error = null;
    
    try {
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('document', documentFile);
      
      // Send to server
      const response = await fetch(`/api/admin/applications/${applicationId}/documents`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload document');
      }
      
      const data = await response.json();
      
      // Update documents list
      documents = [...documents, data.documentUrl];
      
      // Notify parent component
      dispatch('success', { documents });
      
      // Reset file input and state
      if (fileInput) fileInput.value = '';
      documentFile = null;
    } catch (err) {
      console.error('Error uploading document:', err);
      error = err instanceof Error ? err.message : 'Failed to upload document';
      dispatch('error', { message: error });
    } finally {
      isUploading = false;
    }
  }

  // Delete a document
  async function deleteDocument(documentUrl: string) {
    isUploading = true;
    error = null;
    
    try {
      // Extract document ID or key from URL
      const documentKey = documentUrl.split('/').pop();
      
      if (!documentKey) {
        throw new Error('Invalid document URL');
      }
      
      // Send delete request to server
      const response = await fetch(`/api/admin/applications/${applicationId}/documents/${documentKey}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete document');
      }
      
      // Update documents list
      documents = documents.filter(d => d !== documentUrl);
      
      // Notify parent component
      dispatch('success', { documents });
    } catch (err) {
      console.error('Error deleting document:', err);
      error = err instanceof Error ? err.message : 'Failed to delete document';
      dispatch('error', { message: error });
    } finally {
      isUploading = false;
    }
  }
  
  // Get document icon based on file type
  function getDocumentIcon(url: string) {
    const ext = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) {
      return FileImage;
    } else if (['pdf'].includes(ext || '')) {
      return FileText;
    } else if (['doc', 'docx'].includes(ext || '')) {
      return File;
    } else {
      return FileText;
    }
  }
  
  // Get document name from URL
  function getDocumentName(url: string) {
    const parts = url.split('/');
    return parts[parts.length - 1];
  }
</script>

<div class="document-upload space-y-4">
  <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Documents ({documents.length}/{maxFiles})
  </h4>
  
  <!-- Document list -->
  {#if documents.length > 0}
    <div class="space-y-2 max-h-60 overflow-y-auto">
      {#each documents as document}
        <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div class="flex items-center truncate pr-2">
            <svelte:component this={getDocumentIcon(document)} size={16} class="mr-2 flex-shrink-0 text-gray-500 dark:text-gray-400" />
            <span class="text-sm truncate">{getDocumentName(document)}</span>
          </div>
          
          <div class="flex items-center space-x-2 flex-shrink-0">
            <a href={document} target="_blank" rel="noopener noreferrer" class="text-primary hover:text-primary-600">
              <Button variant="ghost" size="sm" title="View document">
                <FileText size={14} />
              </Button>
            </a>
            
            <Button 
              variant="ghost" 
              size="sm" 
              on:click={() => deleteDocument(document)}
              disabled={isUploading || disabled}
              title="Delete document"
              class="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-sm text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-700 rounded-md text-center">
      No documents uploaded
    </div>
  {/if}
  
  <!-- Upload controls -->
  <div class="flex flex-col space-y-3">
    {#if documentFile && !isUploading}
      <div class="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <div class="flex items-center">
          <FileText size={16} class="mr-2 text-blue-500" />
          <span class="text-sm text-blue-700 dark:text-blue-300 truncate">{documentFile.name}</span>
        </div>
        
        <Button
          variant="primary"
          size="sm"
          on:click={uploadDocument}
          disabled={isUploading || disabled}
        >
          <FileUp size={14} class="mr-1" />
          Upload
        </Button>
      </div>
    {/if}
    
    <div class="flex justify-between items-center">
      <Button
        variant="outline"
        size="sm"
        on:click={() => fileInput?.click()}
        disabled={isUploading || disabled || isMaxReached}
        class={isMaxReached ? "opacity-50 cursor-not-allowed" : ""}
      >
        <FilePlus size={16} class="mr-1" />
        {isMaxReached ? 'Max files reached' : 'Add Document'}
      </Button>
      
      <!-- Hidden file input -->
      <input
        bind:this={fileInput}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xls,.xlsx"
        class="hidden"
        on:change={handleFileSelect}
        disabled={isUploading || disabled || isMaxReached}
      />
      
      <span class="text-xs text-gray-500 dark:text-gray-400">
        Max file size: 5MB
      </span>
    </div>
    
    <!-- Error message -->
    {#if error}
      <p class="text-sm text-red-500 dark:text-red-400">{error}</p>
    {/if}
  </div>
</div>
