export interface Verification {
  method: string;
  data: string;
}

export interface Media {
  width: number;
  height: number;
  url: string;
  verification: Verification;
}

export interface LSP4Metadata {
  name: string;
  description: string;
  links: unknown[];         // adjust to a more specific type if you know the shape
  icon: Media[];
  images: Media[][];
  assets: unknown[];        // adjust to a more specific type if you know the shape
  attributes: unknown[];    // adjust to a more specific type if you know the shape
}

export interface LSP4Response {
  LSP4Metadata: LSP4Metadata;
}
