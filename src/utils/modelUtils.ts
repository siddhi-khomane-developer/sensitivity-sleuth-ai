
import * as tf from '@tensorflow/tfjs';
import { FileMetadata, ModelStats } from '../types';

// Convert string features to numerical representations
const featureMap = {
  // File extensions
  'pdf': 1, 'doc': 2, 'docx': 3, 'xls': 4, 'xlsx': 5,
  'txt': 6, 'csv': 7, 'zip': 8, 'rar': 9, 'jpg': 10,
  
  // File types
  'PDF Document': 1, 'Word Document': 2, 'Excel Spreadsheet': 3,
  'Text File': 4, 'CSV File': 5, 'Image': 6, 'Archive': 7,
  
  // Locations
  'Local Upload': 1, 'Cloud Storage': 2, 'Network Drive': 3,
  
  // Permissions
  'Read/Write': 1, 'Read Only': 2, 'Full Control': 3
};

// Sensitive keywords that might appear in filenames
const sensitiveKeywords = [
  'pan', 'aadhar', 'passport', 'bank', 'statement', 'financial', 
  'medical', 'health', 'insurance', 'tax', 'salary', 'personal',
  'confidential', 'private', 'secret', 'social', 'security',
  'credit', 'debit', 'card', 'ssn', 'dob', 'birth'
];

let model: tf.Sequential | null = null;
let isModelLoaded = false;
let modelStats: ModelStats = {
  accuracy: 0,
  precision: 0,
  recall: 0,
  f1Score: 0,
  trainingSamples: 0,
  testingSamples: 0,
  lastTrainedDate: new Date()
};

// Generate synthetic dataset for training and testing - Rebalanced to avoid underfitting sensitive documents
export const generateDataset = (sampleSize: number = 1000) => {
  const dataset: { features: number[]; label: number }[] = [];
  const fileTypes = ['PDF Document', 'Word Document', 'Excel Spreadsheet', 'Text File', 'CSV File', 'Image', 'Archive'];
  const extensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv', 'zip', 'rar', 'jpg'];
  const locations = ['Local Upload', 'Cloud Storage', 'Network Drive'];
  const permissions = ['Read/Write', 'Read Only', 'Full Control'];
  
  // Balance between sensitive and non-sensitive - increased from 35% to 45%
  const sensitiveRatio = 0.45; // 45% of documents should be sensitive
  
  for (let i = 0; i < sampleSize; i++) {
    // Generate random filename
    let fileName = '';
    let isSensitive = 0;
    
    // Decide whether this file should be sensitive based on our target ratio
    const shouldBeSensitive = Math.random() < sensitiveRatio;
    
    if (shouldBeSensitive) {
      // This will be a sensitive file - increased keyword probability from 80% to 90%
      const useSensitiveKeyword = Math.random() < 0.9;
      
      if (useSensitiveKeyword) {
        // Include a sensitive keyword
        const keyword = sensitiveKeywords[Math.floor(Math.random() * sensitiveKeywords.length)];
        fileName = `${keyword}_${Math.random().toString(36).substring(7)}`;
      } else {
        // Generic filename but still sensitive (like an Excel sheet with no sensitive keyword)
        fileName = `file_${Math.random().toString(36).substring(7)}`;
      }
      
      isSensitive = 1;
    } else {
      // This will be a non-sensitive file
      // Ensure we don't accidentally include sensitive keywords
      fileName = `doc_${Math.random().toString(36).substring(7)}`;
      isSensitive = 0;
    }
    
    // Pick random attributes that make sense for the sensitivity level
    let fileType, extension, permission;
    
    if (isSensitive === 1) {
      // Sensitive files are more likely to be certain types - increased probability from 70% to 75%
      const sensitiveFileTypes = ['Excel Spreadsheet', 'PDF Document', 'Word Document'];
      fileType = Math.random() < 0.75 
        ? sensitiveFileTypes[Math.floor(Math.random() * sensitiveFileTypes.length)]
        : fileTypes[Math.floor(Math.random() * fileTypes.length)];
        
      extension = (fileType === 'Excel Spreadsheet') 
        ? ['xls', 'xlsx'][Math.floor(Math.random() * 2)]
        : (fileType === 'PDF Document')
          ? 'pdf'
          : (fileType === 'Word Document')
            ? ['doc', 'docx'][Math.floor(Math.random() * 2)]
            : extensions[Math.floor(Math.random() * extensions.length)];
          
      // Sensitive files often have restricted permissions - increased from 60% to 70%
      permission = Math.random() < 0.7
        ? 'Read Only'
        : permissions[Math.floor(Math.random() * permissions.length)];
    } else {
      // Non-sensitive files can be any type, but less likely to be financial documents
      fileType = Math.random() < 0.8
        ? ['Text File', 'Image', 'Archive', 'Word Document'][Math.floor(Math.random() * 4)]
        : fileTypes[Math.floor(Math.random() * fileTypes.length)];
        
      extension = (fileType === 'Text File') 
        ? 'txt'
        : (fileType === 'Image')
          ? 'jpg'
          : (fileType === 'Word Document')
            ? ['doc', 'docx'][Math.floor(Math.random() * 2)]
            : extensions[Math.floor(Math.random() * extensions.length)];
      
      // Non-sensitive files usually have open permissions
      permission = Math.random() < 0.7
        ? 'Read/Write'
        : permissions[Math.floor(Math.random() * permissions.length)];
    }
    
    const location = locations[Math.floor(Math.random() * locations.length)];
    const fileSize = isSensitive
      ? Math.floor(Math.random() * 5000000) + 500000 // Sensitive files tend to be larger (0.5MB - 5.5MB)
      : Math.floor(Math.random() * 2000000) + 10000; // Non-sensitive files (10KB - 2MB)
    
    // Feature vector: [hasKeyword, fileTypeId, extensionId, locationId, permissionId, logFileSize]
    const hasKeyword = sensitiveKeywords.some(keyword => fileName.includes(keyword)) ? 1 : 0;
    const fileTypeId = featureMap[fileType] || 0;
    const extensionId = featureMap[extension] || 0;
    const locationId = featureMap[location] || 0;
    const permissionId = featureMap[permission] || 0;
    const logFileSize = Math.log(fileSize + 1) / 20; // Normalize size
    
    // Create feature vector
    const features = [hasKeyword, fileTypeId, extensionId, locationId, permissionId, logFileSize];
    
    dataset.push({ features, label: isSensitive });
  }
  
  return dataset;
};

// Convert dataset to tensors
const prepareData = (dataset: { features: number[]; label: number }[]) => {
  const features = dataset.map(item => item.features);
  const labels = dataset.map(item => item.label);
  
  const xs = tf.tensor2d(features);
  const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), 2); // One-hot encode (2 classes)
  
  return { xs, ys };
};

// Create and train the model
export const trainModel = async (): Promise<ModelStats> => {
  // Generate dataset - larger dataset for better training
  const fullDataset = generateDataset(3500); // Increased from 3000 to 3500
  
  // Split into training and testing (80/20)
  const splitIndex = Math.floor(fullDataset.length * 0.8);
  const trainingData = fullDataset.slice(0, splitIndex);
  const testingData = fullDataset.slice(splitIndex);
  
  // Prepare data
  const { xs: trainXs, ys: trainYs } = prepareData(trainingData);
  const { xs: testXs, ys: testYs } = prepareData(testingData);
  
  // Define model architecture - Using Sequential model instead of LayersModel
  model = tf.sequential();
  
  // Enhanced model architecture with balanced regularization
  // More neurons in first layer to capture complex patterns
  model.add(tf.layers.dense({ 
    units: 20, // Increased from 16 to 20
    activation: 'relu', 
    inputShape: [6],
    kernelRegularizer: tf.regularizers.l2({ l2: 0.0005 }) // Reduced from 0.001 to avoid underfitting
  }));
  model.add(tf.layers.dropout({ rate: 0.25 })); // Reduced from 0.3 to avoid underfitting
  
  model.add(tf.layers.dense({ 
    units: 12, // Increased from 8 to 12
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.0005 }) // Reduced from 0.001
  }));
  model.add(tf.layers.dropout({ rate: 0.15 })); // Reduced from 0.2
  
  // Added an additional layer for better feature extraction
  model.add(tf.layers.dense({ 
    units: 6, 
    activation: 'relu'
  }));
  
  model.add(tf.layers.dense({ units: 2, activation: 'softmax' })); // Output layer (2 classes)
  
  // Compile model with balanced learning rate
  model.compile({
    optimizer: tf.train.adam(0.001), // Increased from 0.0005 to learn faster
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  
  // Train model with more epochs for better convergence
  const epochs = 50;
  const batchSize = 32; // Reduced from 64 for better gradient updates
  
  try {
    await model.fit(trainXs, trainYs, {
      epochs,
      batchSize,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}/${epochs}: loss = ${logs?.loss?.toFixed(4)}, accuracy = ${logs?.acc?.toFixed(4)}`);
        }
      }
    });
    
    // Evaluate model
    const evaluation = await model.evaluate(testXs, testYs, { batchSize }) as tf.Scalar[];
    
    // Calculate precision, recall, and F1 score
    const predictions = model.predict(testXs) as tf.Tensor;
    const predLabels = predictions.argMax(1);
    const trueLabels = testYs.argMax(1);
    
    // Convert to arrays for calculation
    const predArray = await predLabels.array() as number[];
    const trueArray = await trueLabels.array() as number[];
    
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let trueNegatives = 0;
    
    for (let i = 0; i < predArray.length; i++) {
      if (predArray[i] === 1 && trueArray[i] === 1) truePositives++;
      if (predArray[i] === 1 && trueArray[i] === 0) falsePositives++;
      if (predArray[i] === 0 && trueArray[i] === 1) falseNegatives++;
      if (predArray[i] === 0 && trueArray[i] === 0) trueNegatives++;
    }
    
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    
    console.log(`Model evaluation results:
      True Positives: ${truePositives}
      False Positives: ${falsePositives}
      False Negatives: ${falseNegatives}
      True Negatives: ${trueNegatives}
      Precision: ${precision.toFixed(4)}
      Recall: ${recall.toFixed(4)}
      F1 Score: ${f1Score.toFixed(4)}
    `);
    
    // Update model stats
    modelStats = {
      accuracy: evaluation[1].dataSync()[0],
      precision,
      recall,
      f1Score,
      trainingSamples: trainingData.length,
      testingSamples: testingData.length,
      lastTrainedDate: new Date()
    };
    
    isModelLoaded = true;
    console.log('Model training complete', modelStats);
    
    // Clean up tensors
    trainXs.dispose();
    trainYs.dispose();
    testXs.dispose();
    testYs.dispose();
    predLabels.dispose();
    trueLabels.dispose();
    predictions.dispose();
    
    return modelStats;
  } catch (error) {
    console.error('Error training model:', error);
    throw error;
  }
};

// Prepare file metadata for prediction
export const prepareFileFeatures = (file: File): number[] => {
  const fileName = file.name.toLowerCase();
  
  // Check if filename contains sensitive keywords
  const hasKeyword = sensitiveKeywords.some(keyword => fileName.includes(keyword)) ? 1 : 0;
  
  // Extract extension
  const extension = fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2);
  const extensionId = featureMap[extension] || 0;
  
  // Determine file type
  let fileType = 'Unknown File Type';
  if (extension === 'pdf') fileType = 'PDF Document';
  else if (['doc', 'docx'].includes(extension)) fileType = 'Word Document';
  else if (['xls', 'xlsx'].includes(extension)) fileType = 'Excel Spreadsheet';
  else if (extension === 'txt') fileType = 'Text File';
  else if (extension === 'csv') fileType = 'CSV File';
  else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) fileType = 'Image';
  else if (['zip', 'rar'].includes(extension)) fileType = 'Archive';
  
  const fileTypeId = featureMap[fileType] || 0;
  
  // Location is always Local Upload for this demo
  const locationId = featureMap['Local Upload'] || 0;
  
  // Permission is always Read/Write for this demo
  const permissionId = featureMap['Read/Write'] || 0;
  
  // File size (normalized)
  const logFileSize = Math.log(file.size + 1) / 20;
  
  return [hasKeyword, fileTypeId, extensionId, locationId, permissionId, logFileSize];
};

// Predict sensitivity using the trained model with adjusted threshold
export const predictSensitivity = async (file: File): Promise<{
  isSensitive: boolean;
  confidenceScore: number;
}> => {
  if (!isModelLoaded || !model) {
    await trainModel();
  }
  
  const features = prepareFileFeatures(file);
  const input = tf.tensor2d([features]);
  
  try {
    const prediction = model!.predict(input) as tf.Tensor;
    const probabilities = await prediction.array() as number[][];
    
    // Class 1 probability (sensitive)
    const sensitivityScore = probabilities[0][1] * 100;
    
    // Adjust threshold to reduce false negatives (sensitive marked as non-sensitive)
    // Lowering threshold from 55% to 45% to catch more sensitive documents
    const threshold = 45;
    
    // Clean up
    input.dispose();
    prediction.dispose();
    
    return {
      isSensitive: sensitivityScore > threshold,
      confidenceScore: Math.round(sensitivityScore)
    };
  } catch (error) {
    console.error('Prediction error:', error);
    throw error;
  }
};

// Get model statistics
export const getModelStats = (): ModelStats => modelStats;

// Initialize the model
export const initializeModel = async (): Promise<void> => {
  if (!isModelLoaded) {
    await trainModel();
  }
};

