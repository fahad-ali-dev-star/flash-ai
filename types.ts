
export interface ImageState {
  base64: string;
  mimeType: string;
  previewUrl: string;
}

export interface PromptSuggestion {
  title: string;
  prompt: string;
  category: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  SUGGESTING = 'SUGGESTING',
  EDITING = 'EDITING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
