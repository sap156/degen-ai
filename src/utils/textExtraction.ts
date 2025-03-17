
import { PDFDocumentProxy, getDocument } from 'pdfjs-dist';
import * as openAiService from '@/services/openAiService';
import { FileProcessingResult } from './fileTypes';

/**
 * Extracts text from a PDF file using pdf.js library.
 */
export const extractTextFromPdf = async (file: File): Promise<FileProcessingResult> => {
  try {
    const fileReader = new FileReader();
    
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
    });
    
    if (!arrayBuffer) {
      throw new Error('Failed to read file as ArrayBuffer.');
    }
    
    // Load the PDF document using PDF.js
    const loadingTask = getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdfDocument = await loadingTask.promise;
    const totalPages = pdfDocument.numPages;
    let extractedText = '';
    
    // Extract text from each page
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => 'str' in item ? item.str : '')
        .join(' ');
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
