#!/usr/bin/env node
// scripts/setup-dirs.js

const fs = require('fs');
const path = require('path');

// Define directories to create
const dirs = [
  'static/data',
  'static/data/csv',
  'static/data/json'
];

// Create directories
console.log('Setting up BrightBroom directory structure...');

dirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  } else {
    console.log(`Directory already exists: ${dirPath}`);
  }
});

// Copy initial JSON file if it doesn't exist yet
const sampleJsonFile = path.join(process.cwd(), 'static', 'data', 'json', 'regular-cleaning-with-laundry-&-ironing.json');

if (!fs.existsSync(sampleJsonFile)) {
  console.log('Creating sample service JSON file...');
  
  const data = {
    "name": "Regular Cleaning with Laundry & Ironing",
    "items": [
      {
        "area": "LIVING ROOM",
        "details": [
          "General clean of living room and other living areas includes:",
          "Dusting of furniture and surfaces",
          "Mopping and vacuuming of floors",
          "Dusting and wiping of skirtings",
          "Dusting and wiping of electronics, and other ornaments.",
          "Dusting and wiping of light switches and other fixtures"
        ]
      },
      {
        "area": "KITCHEN",
        "details": [
          "General clean of kitchen includes:",
          "Washing dishes.",
          "Wiping surfaces, sinks and appliances.",
          "Wiping outside of cupboards and fridge.",
          "Emptying bins and cleaning bin area.",
          "Wiping floors.",
          "Mopping floors."
        ]
      },
      {
        "area": "BEDROOMS",
        "details": [
          "General clean of bedrooms includes:",
          "(Max 5 Bedrooms)",
          "Making bed.",
          "Vacuuming and/or mopping floors.",
          "Dusting of furniture and surfaces.",
          "Dusting and wiping of skirtings.",
          "Folding or hanging of clothes in bedroom."
        ]
      },
      {
        "area": "BATHROOMS",
        "details": [
          "General clean of bathroom includes:",
          "(Max 3 Bathrooms)",
          "Cleaning of shower, bath and sinks.",
          "Wiping of counters and taps.",
          "Wiping outside of cupboards and cabinets.",
          "Wiping of walls and mirrors.",
          "Emptying bins and cleaning bin area.",
          "Folding or hanging of clean towels.",
          "Mopping floors."
        ]
      },
      {
        "area": "LAUNDRY & IRONING",
        "details": [
          "General washing & ironing of clothes includes:",
          "Use of household laundry machine.",
          "Use of household's preffered laundry cleaning products.",
          "Collection of clothes allowed to go into the laundry machine.",
          "Relevant washing option selected on the laundry machine.",
          "Ironing all washed and dryed clothes."
        ]
      }
    ]
  };
  
  fs.writeFileSync(sampleJsonFile, JSON.stringify(data, null, 2));
  console.log(`Created sample service file: ${sampleJsonFile}`);
}

console.log('Setup complete!');
console.log('Now you can run:');
console.log('1. npm run services:json-to-csv - to convert JSON to CSV files');
console.log('2. npm run db:update-services - to update the database with service details');
console.log('3. npm run db:seed-services:overwrite - to completely replace services in the database');
