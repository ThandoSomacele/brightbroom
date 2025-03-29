#!/bin/bash
# netlify/scripts/pre-build.sh

echo "Netlify pre-build diagnostics"
echo "-----------------------------"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Environment: $NODE_ENV"
echo "Path: $PATH"

# Make node_modules binaries directly available
NODE_BIN=$(pwd)/node_modules/.bin
echo "Adding $NODE_BIN to PATH"
export PATH="$NODE_BIN:$PATH"

# Double check presence of critical binaries
echo "Critical binaries:"
ls -la node_modules/.bin/vite node_modules/.bin/svelte-kit || echo "Binaries not found"

# Re-install critical dependencies
echo "Installing critical dependencies"
npm i @sveltejs/adapter-netlify @sveltejs/kit vite
npm i -g @sveltejs/kit vite

echo "PATH after updates: $PATH"
echo "Checking binary access after updates:"
which vite
which svelte-kit
echo "Checking for adapter-netlify:"
ls -la node_modules/@sveltejs/adapter-netlify || echo "adapter-netlify not found"

echo "Pre-build diagnostics complete"