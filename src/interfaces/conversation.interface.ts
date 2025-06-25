export interface IConversationAttachment {
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    key: string;
  }
  
  export interface IConversationRequest {
    message: string;
    sender: string;
    attachment?: {
      file?: Buffer;
      filePath?: string;
      originalName: string;
      mimeType: string;
      size: number;
    };
  }