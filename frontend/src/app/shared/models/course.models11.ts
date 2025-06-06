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


export interface TopicRequest {
  title: string;
  description: string;
  position: number;
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
  position: number;
}
export interface LessonRequest{
  topicId: string,
  title: string;
  type: string;
  content_url: string;
  description: string;
  position: number;
 // created_at: any;
}

export interface updatedTopicRequest{
  id: string;
  title: string;
  description: string;
  position: number;
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

export interface Module {
  id?: string;
  title: string;
  description: string;
  position: number;
  topics: Topic[];
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  position: number;
  created_at?: any;
  lessons: Lesson[];
}
export interface Lesson extends LessonRequest {
  id: string;
}

// Интерфейсы для деталей курса
export interface CourseDetails {
  id?: string;
  course_id: string;
  target_audience: string;
  learning_outcomes: string;
  study_details: any;
  study_period: string;
  goal: string;
}

export interface CreateCourseDetailsRequest {
  course_id: string;
  target_audience: string;
  learning_outcomes: string;
  study_details: any;
  study_period: string;
  goal: string;
}

export interface UpdateCourseDetailsRequest {
  target_audience: string;
  learning_outcomes: string;
  study_details: any;
  study_period: string;
  goal: string;
}
