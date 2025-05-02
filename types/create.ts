export interface CreateFormData {
  title: string;
  urls: { title: string; url: string }[];
  description: string;
  icon: File | null;
  iconWidth: number | null;
  iconHeight: number | null;
  iconIpfsHash: string | null;
  imageIpfsHash: string | null;
  image: File | null;
  imageHeight: number | null;
  imageWidth: number | null;
}
