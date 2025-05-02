export interface CreateFormData {
  title: string;
  urls: { title: string; url: string }[];
  description: string;
  iconWidth: number | null;
  iconHeight: number | null;
  iconIpfsHash: string | null;
  imageIpfsHash: string | null;
  imageHeight: number | null;
  imageWidth: number | null;
}
