import { PDFDocument, PDFPageProxy } from 'pdfjs-dist';
import * as openAiService from '@/services/openAiService';
import { FileProcessingResult } from './fileTypes';

/**
 * Extracts text from a PDF file using pdf.js library.
 */
export const extractTextFromPdf = async (file: File): Promise<FileProcessingResult> => {
  try {
    const fileReader = new FileReader();
    
    await new Promise((resolve, reject) => {
      fileReader.onload = resolve;
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
    });
    
    const arrayBuffer = fileReader.result as ArrayBuffer;
    
    if (!arrayBuffer) {
      throw new Error('Failed to read file as ArrayBuffer.');
    }
    
    // Load the PDF document
    const pdf = await PDFDocument.load(arrayBuffer);
    const totalPages = pdf.numPages;
    let extractedText = '';
    
    // Iterate over each page and extract text
    for (let i = 1; i <= totalPages; i++) {
      const page: PDFPageProxy = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      extractedText += pageText + '\n';
    }
    
    return {
      success: true,
      text: extractedText,
      metadata: {
        processingMethod: 'pdf.js',
        pages: totalPages
      }
    };
  } catch (error: any) {
    console.error('Error extracting text from PDF:', error);
    return {
      success: false,
      error: error.message || 'Failed to extract text from PDF.'
    };
  }
};

/**
 * Extracts text from various file types.
 */
export const extractTextFromFile = async (file: File, apiKey: string): Promise<FileProcessingResult> => {
  try {
    const fileReader = new FileReader();
    
    await new Promise((resolve, reject) => {
      fileReader.onload = resolve;
      fileReader.onerror = reject;
      fileReader.readAsText(file);
    });
    
    const text = fileReader.result as string;
    
    if (!text) {
      throw new Error('Failed to read file as text.');
    }
    
    return {
      success: true,
      text: text,
      metadata: {
        processingMethod: 'basic text extraction',
        note: 'Used basic text extraction for unsupported file type'
      }
    };
  } catch (error: any) {
    console.error('Error extracting text from file:', error);
    return {
      success: false,
      error: error.message || 'Failed to extract text from file.'
    };
  }
};

/**
 * Extracts structured information from text using OpenAI.
 */
export const extractInformationFromText = async (text: string, apiKey: string): Promise<FileProcessingResult> => {
  try {
    const response = await openAiService.callOpenAI(
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Extract and structure the key information from this document.'
          },
          {
            role: 'user',
            content: `Extract the main information from this text: ${text.substring(0, 4000)}`
          }
        ]
      },
      apiKey
    );
    
    const extractedInfo = response.choices[0].message.content;
    
    return {
      success: true,
      data: extractedInfo,
      text: text,
      metadata: {
        processingMethod: 'OpenAI'
      }
    };
  } catch (error: any) {
    console.error('Error extracting information from text using OpenAI:', error);
    return {
      success: false,
      error: error.message || 'Failed to extract information using OpenAI.'
    };
  }
};
