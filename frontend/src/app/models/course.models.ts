export interface LessonRequest {
  ModuleId: string;
  title: string;
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
    title : string;
    description : string;
    details : string;
    price : number;
    duration : string;
    cover_url : File | null;
    category : string;
    is_published : boolean
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
