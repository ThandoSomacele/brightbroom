#!/bin/bash
# netlify/scripts/pre-build.sh

echo "Netlify pre-build diagnostics"
echo "-----------------------------"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Environment: $NODE_ENV"
echo "Path: $PATH"
echo "Available node modules:"
ls -la node_modules/.bin/

# Check if vite is accessible
echo "Checking for vite command:"
command -v vite || echo "vite command not found"
command -v ./node_modules/.bin/vite || echo "vite not found in node_modules/.bin"

# Check svelte-kit
echo "Checking for svelte-kit command:"
command -v svelte-kit || echo "svelte-kit command not found" 
command -v ./node_modules/.bin/svelte-kit || echo "svelte-kit not found in node_modules/.bin"

echo "Setting up symlinks for binaries"
mkdir -p ~/.npm-global/bin
ln -s $(pwd)/node_modules/.bin/vite ~/.npm-global/bin/vite
ln -s $(pwd)/node_modules/.bin/svelte-kit ~/.npm-global/bin/svelte-kit
export PATH=~/.npm-global/bin:$PATH

echo "Updated PATH: $PATH"
echo "Pre-build diagnostics complete"