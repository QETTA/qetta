import { ObjectId } from 'mongodb';

export interface TemplateVersion {
  version: number;
  file_path: string; // stored file path
  file_type: string;
  created_at: Date;
}

export interface Template {
  _id: ObjectId;
  firm_id: string;
  name: string;
  description?: string;
  current_version: number;
  versions: TemplateVersion[];
  placeholders?: string[];
  created_at: Date;
  updated_at: Date;
}
