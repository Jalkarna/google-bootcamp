export interface PostForm {
  idea: string;
  activity: string;
  organization: string;
  event: string;
  audience: string;
  tone: string;
  length: string;
  language: string;
  type: string;
  hashtags: string;
  mentions: string;
  cta: string;
  extra: string;
  includeHashtags: boolean;
  emojis: boolean;
  name: string;
  headline: string;
}
export interface ImageInput {
  name: string;
  url: string;
  mimeType: string;
  data: string;
}
export interface GeneratedPost {
  label: string;
  text: string;
}
export interface Draft {
  id: number;
  text: string;
  form: PostForm;
  date: string;
}
export interface PostTemplate {
  name: string;
  tag: string;
  text: string;
  idea: string;
  type: string;
}
