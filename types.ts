export interface ManufacturingSpecs {
  procurement_intent: string;
  fabric_primary: string;
  fabric_print: string;
  estimated_gsm: number;
  sourcing_hub_suggestion: string;
}

export interface DesignConcept {
  product_name: string;
  design_rationale: string;
  image_generation_prompt: string;
}

export interface WinningAttributes {
  silhouette: string;
  fabric_print: string;
  color_palette: string;
}

export interface TrendReport {
  location_context: string;
  the_vibe: string;
  winning_attributes: WinningAttributes;
  best_seller_concept: DesignConcept;
  manufacturing_specs: ManufacturingSpecs;
}

export interface ShoppingItem {
  title: string;
  uri: string;
  source: string;
}

export interface AnalysisState {
  isAnalyzing: boolean;
  isGeneratingImage: boolean;
  isSearchingShopping: boolean;
  report: TrendReport | null;
  generatedImageUrl: string | null;
  shoppingResults: ShoppingItem[];
  shoppingSummary: string | null;
  error: string | null;
}

export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";
export type ImageSize = "1K" | "2K" | "4K";

export interface ImageConfig {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}