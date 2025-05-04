export interface LessonRequest {
  ModuleId: string;
  title: string;
  id?: string;
  description: string;
  type: string;
  content_url: string;
  position: number;
}

export interface Module {
  id?: string;
  title: string;
  description: string;
  lessons: LessonRequest[];
}
export interface ModuleRequest {
  CourseId: string;
  title: string;
  description: string;
  position: number;
  lessons: LessonRequest[];
}

export interface CourseRequest {
  title: string;
  description: string;
  details: string;
  price: number;
  duration: string;
  cover_url: File | null;
  category: string;
  is_published: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  imageFile?: File | null;
  deadline?: string;
  modules: Module[];
}

export interface CourseResponse {
  author_id: string;
  category: string;
  cover_url: string | null;
  created_at: string | null;
  description: string;
  details: string;
  price: string;
  duration: string;
  id: string;
  is_published: boolean;
  modules?: Module[];
  deadline?: string;
  title: string;
}

export interface ModuleResponse {
  course_id: string;
  created_at: string | null;
  description: string;
  id: string;
  lessons?: LessonResponse[];
  position: number;
  title: string;
}
export interface LessonResponse {
  content_url: string;
  created_at: string | null;
  description: string;
  id: string;
  module_id: string;
  position: number;
  title: string;
  type: string;
}

export interface CourseUpdateRequest {
  title?: string;
  description?: string;
  details?: string;
  price?: string;
  duration?: string;
  cover_url?: File | null;
  category?: string;
  is_published?: boolean;
}

export interface ModuleUpdateRequest {
  title?: string;
  description?: string;
  position?: number;
}
export interface LessonUpdateRequest {
  title?: string;
  description?: string;
  type?: string;
  content_url?: string;
  position?: number;
}
