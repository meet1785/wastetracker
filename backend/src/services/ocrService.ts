/**
 * OCR Service — stub that simulates reading food labels from images.
 * Replace with a real OCR provider (Google Vision, AWS Textract, etc.) in production.
 */

export interface OcrResult {
  item_name: string;
  brand?: string;
  expiry_date?: string;
  barcode?: string;
  confidence: number;
}

const MOCK_ITEMS = [
  { item_name: 'Organic Whole Milk', brand: 'Green Valley', expiry_date: '2024-02-15' },
  { item_name: 'Greek Yogurt', brand: 'Chobani', expiry_date: '2024-02-10' },
  { item_name: 'Sliced Bread', brand: 'Wonder', expiry_date: '2024-02-08' },
  { item_name: 'Cheddar Cheese', brand: 'Tillamook', expiry_date: '2024-03-01' },
  { item_name: 'Orange Juice', brand: 'Tropicana', expiry_date: '2024-02-20' },
];

/**
 * Simulates OCR processing of a food label image.
 * @param imageBase64 - Base64-encoded image data
 */
export async function processImageOcr(imageBase64: string): Promise<OcrResult> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!imageBase64 || imageBase64.length < 10) {
    throw new Error('Invalid image data provided');
  }

  const mockItem = MOCK_ITEMS[Math.floor(Math.random() * MOCK_ITEMS.length)];

  // Add a few days offset to make the mock expiry relative to today
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 21) + 3);
  const expiryDate = futureDate.toISOString().split('T')[0];

  return {
    ...mockItem,
    expiry_date: expiryDate,
    confidence: 0.80 + Math.random() * 0.18,
  };
}

/**
 * Simulates barcode lookup to retrieve product information.
 * @param barcode - EAN/UPC barcode string
 */
export async function lookupBarcode(barcode: string): Promise<OcrResult | null> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const barcodeMap: Record<string, Omit<OcrResult, 'expiry_date' | 'confidence'>> = {
    '0123456789012': { item_name: 'Organic Almond Milk', brand: 'Silk', barcode },
    '9876543210987': { item_name: 'Sourdough Bread', brand: 'Dave\'s Killer Bread', barcode },
    '5555555555555': { item_name: 'Free-Range Eggs', brand: 'Happy Egg Co.', barcode },
  };

  const product = barcodeMap[barcode];
  if (!product) return null;

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14);

  return {
    ...product,
    expiry_date: futureDate.toISOString().split('T')[0],
    confidence: 0.95,
  };
}
