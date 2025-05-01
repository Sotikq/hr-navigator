export interface createCourseRequest {
  title: string;
  description: string;
  details: string;
  price: number;
  duration: string;
  cover_url: File | null;
  category: string;
  is_published: boolean;
}

export interface UpdatedCourseRequest {
  id: string;
  title: string;
  description: string;
  details: string;
  price: number;
  duration: string;
  cover_url: File | null;
  category: string;
  is_published: boolean;
}

export interface addModuletoCourseRequest {
  title: string;
  description: string;
  positon: number;
}

export interface lessonModel {
  id: string;
  title: string;
  type: string;
  content_url: string;
  description: string;
  position: number;
  created_at: any;
}
export interface updateLesson {
  id: string;
  title: string;
  type: string;
  content_url: string;
  description: string;
  position: number;
  created_at: any;
}
export interface updatedModuleRequest{
  id: string;
  title: string;
  description: string;
  // positon: number;
}
export interface LessonRequest{
  moduleId: string,
  title: string;
  type: string;
  content_url: string;
  description: string;
  position: number;
 // created_at: any;
}